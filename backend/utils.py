"""
Utility functions for image processing and file management.
"""

from PIL import Image
import os
from typing import Tuple, Optional
import uuid


ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def validate_image(file) -> Tuple[bool, Optional[str]]:
    """
    Validate uploaded image file.
    
    Returns:
        (is_valid, error_message)
    """
    if not file:
        return False, "No file provided"
    
    if not allowed_file(file.filename):
        return False, "File type not allowed. Please upload JPG or PNG files."
    
    # Check file size
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)  # Reset file pointer
    
    if file_size > MAX_FILE_SIZE:
        return False, f"File too large. Maximum size is {MAX_FILE_SIZE / (1024*1024):.0f}MB"
    
    # Try to open as image to validate
    try:
        img = Image.open(file)
        img.verify()  # Verify it's a valid image
        file.seek(0)  # Reset after verify
    except Exception as e:
        return False, f"Invalid image file: {str(e)}"
    
    return True, None


def save_uploaded_file(file, upload_folder: str) -> str:
    """
    Save uploaded file and return filename.
    
    Args:
        file: File object from Flask request
        upload_folder: Directory to save file
    
    Returns:
        Saved filename
    """
    # Create upload folder if it doesn't exist
    os.makedirs(upload_folder, exist_ok=True)
    
    # Generate unique filename
    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(upload_folder, filename)
    
    # Save file
    file.save(filepath)
    
    return filename


def get_image_dimensions(image_path: str) -> Tuple[int, int]:
    """Get image width and height."""
    with Image.open(image_path) as img:
        return img.size


def cleanup_file(filepath: str) -> None:
    """Delete a file if it exists."""
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
    except Exception:
        pass  # Ignore cleanup errors

