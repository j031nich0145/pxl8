"""
Flask backend API for pixelation tool.
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
from PIL import Image
import io

from pixelation import pixelate_image
from background_removal import remove_background
from utils import validate_image, save_uploaded_file, cleanup_file, get_image_dimensions

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configuration
UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Create necessary directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROCESSED_FOLDER'] = PROCESSED_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB max file size


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'ok', 'message': 'Pixelation API is running'})


@app.route('/api/upload', methods=['POST'])
def upload_image():
    """Upload and validate an image file."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Validate file
    is_valid, error_msg = validate_image(file)
    if not is_valid:
        return jsonify({'error': error_msg}), 400
    
    try:
        # Save uploaded file
        filename = save_uploaded_file(file, UPLOAD_FOLDER)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        
        # Get image dimensions
        width, height = get_image_dimensions(filepath)
        
        return jsonify({
            'filename': filename,
            'width': width,
            'height': height,
            'message': 'File uploaded successfully'
        })
    except Exception as e:
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500


@app.route('/api/pixelate', methods=['POST'])
def pixelate():
    """Apply pixelation to an uploaded image."""
    data = request.json
    
    filename = data.get('filename')
    target_width = int(data.get('target_width', 100))
    target_height = int(data.get('target_height', 100))
    method = data.get('method', 'average')  # 'nearest' or 'average'
    
    if not filename:
        return jsonify({'error': 'Filename required'}), 400
    
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    
    try:
        # Load image
        image = Image.open(filepath)
        
        # Apply pixelation
        pixelated = pixelate_image(image, target_width, target_height, method)
        
        # Save processed image
        processed_filename = f"pixelated_{filename}"
        processed_path = os.path.join(PROCESSED_FOLDER, processed_filename)
        pixelated.save(processed_path)
        
        return jsonify({
            'processed_filename': processed_filename,
            'message': 'Pixelation applied successfully'
        })
    except Exception as e:
        return jsonify({'error': f'Pixelation failed: {str(e)}'}), 500


@app.route('/api/remove-background', methods=['POST'])
def remove_bg():
    """Remove background from an uploaded image."""
    data = request.json
    
    filename = data.get('filename')
    threshold = float(data.get('threshold', 50.0))
    
    if not filename:
        return jsonify({'error': 'Filename required'}), 400
    
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    
    try:
        # Load image
        image = Image.open(filepath)
        
        # Remove background
        result = remove_background(image, threshold)
        
        # Save processed image (always PNG for transparency)
        processed_filename = f"nobg_{filename.rsplit('.', 1)[0]}.png"
        processed_path = os.path.join(PROCESSED_FOLDER, processed_filename)
        result.save(processed_path, 'PNG')
        
        return jsonify({
            'processed_filename': processed_filename,
            'message': 'Background removal applied successfully'
        })
    except Exception as e:
        return jsonify({'error': f'Background removal failed: {str(e)}'}), 500


@app.route('/api/process', methods=['POST'])
def process_image():
    """
    Process image with pixelation and/or background removal.
    Supports both operations in user-specified order.
    """
    data = request.json
    
    filename = data.get('filename')
    pixelate_enabled = data.get('pixelate_enabled', False)
    remove_bg_enabled = data.get('remove_bg_enabled', False)
    target_width = int(data.get('target_width', 100))
    target_height = int(data.get('target_height', 100))
    pixelation_method = data.get('pixelation_method', 'average')
    bg_threshold = float(data.get('bg_threshold', 50.0))
    process_order = data.get('process_order', 'pixelate_first')  # 'pixelate_first' or 'bg_first'
    
    if not filename:
        return jsonify({'error': 'Filename required'}), 400
    
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    
    if not pixelate_enabled and not remove_bg_enabled:
        return jsonify({'error': 'At least one processing option must be enabled'}), 400
    
    try:
        # Load image
        image = Image.open(filepath)
        
        # Apply processing based on order
        if process_order == 'pixelate_first':
            if pixelate_enabled:
                image = pixelate_image(image, target_width, target_height, pixelation_method)
            if remove_bg_enabled:
                image = remove_background(image, bg_threshold)
        else:  # bg_first
            if remove_bg_enabled:
                image = remove_background(image, bg_threshold)
            if pixelate_enabled:
                image = pixelate_image(image, target_width, target_height, pixelation_method)
        
        # Determine output format
        output_ext = 'png' if remove_bg_enabled else filename.rsplit('.', 1)[1].lower()
        
        # Save processed image
        processed_filename = f"processed_{filename.rsplit('.', 1)[0]}.{output_ext}"
        processed_path = os.path.join(PROCESSED_FOLDER, processed_filename)
        image.save(processed_path, output_ext.upper())
        
        return jsonify({
            'processed_filename': processed_filename,
            'message': 'Image processed successfully'
        })
    except Exception as e:
        return jsonify({'error': f'Processing failed: {str(e)}'}), 500


@app.route('/api/download/<filename>', methods=['GET'])
def download_image(filename):
    """Download a processed image."""
    filepath = os.path.join(PROCESSED_FOLDER, secure_filename(filename))
    
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    
    return send_file(filepath, as_attachment=True)


@app.route('/api/image/<folder>/<filename>', methods=['GET'])
def get_image(folder, filename):
    """Get an image file (for preview)."""
    if folder not in ['uploads', 'processed']:
        return jsonify({'error': 'Invalid folder'}), 400
    
    filepath = os.path.join(folder, secure_filename(filename))
    
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    
    return send_file(filepath, mimetype='image/png' if filename.endswith('.png') else 'image/jpeg')


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

