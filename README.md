# PXL8 - Image Pixelation Tool

A free, open-source image pixelation tool that runs locally. Built with Python Flask backend and React frontend.

## Features

- **Pixelation**: Scale images down using three distinct methods:
  - **Pixel Averaging**: Averages all colors within each block for smooth, blended results - the smoothest option
  - **Spatial Approximation**: Samples the closest pixel by spatial position, creating blocky, retro-style pixelation
  - **Nearest Neighbors**: Uses the majority (most frequent) color per block, preserving dominant colors while reducing noise
- **Image Cropping**: Crop images with preset aspect ratios (1:1 Square, 3:2 Photo, 4:3 Traditional) with interactive preview
- **Crunch Tool**: Normalize images to 72dpi or apply 2x pixelation for enhanced effects
- **Undo Functionality**: Undo up to 3 previous operations using Ctrl+Z or the undo button
- **Live Update**: Real-time preview of pixelation changes as you adjust settings
- **Dark Mode**: Toggle between light and dark themes with persistent preference
- **Modern Web Interface**: Clean, responsive React-based UI with intuitive controls
- **Local Processing**: All processing happens client-side in your browser - no data sent to external servers

## Project Structure

```
pxl8/
├── backend/          # Flask API server
│   ├── app.py       # Main Flask application
│   ├── pixelation.py
│   ├── background_removal.py
│   ├── utils.py
│   └── requirements.txt
├── frontend/         # React application
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Installation

### Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the Flask server:
```bash
python app.py
```

The backend will start on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:3000` and automatically proxy API requests to the backend.

## Usage

1. Start the backend server (see Backend Setup above) - *Note: The app runs entirely client-side, backend is optional*
2. Start the frontend development server (see Frontend Setup above)
3. Open your browser to `http://localhost:3000`
4. Upload a JPG or PNG image (drag & drop or click to browse)
5. Configure pixelation settings:
   - Adjust the pixelation slider (px²) to control pixel size
   - Choose pixelation method from the dropdown:
     - **Pixel Averaging**: For smooth, blended results
     - **Spatial Approximation**: For blocky, retro-style pixelation
     - **Nearest Neighbors**: For preserving dominant colors
   - Toggle "Live Update" for real-time preview
6. Use additional tools:
   - **Crop**: Select aspect ratio and interactively crop your image
   - **Crunch**: Normalize to 72dpi or apply 2x pixelation
   - **Undo**: Press Ctrl+Z or use the undo button to revert changes (up to 3 steps)
7. Toggle dark/light mode using the theme button in the bottom-right corner
8. Download your processed image using the download button

## API Endpoints

### `POST /api/upload`
Upload an image file.

**Request**: Form data with `file` field
**Response**: 
```json
{
  "filename": "uuid.jpg",
  "width": 1920,
  "height": 1080
}
```

### `POST /api/process`
Process an image with pixelation and/or background removal.

**Request Body**:
```json
{
  "filename": "uuid.jpg",
  "pixelate_enabled": true,
  "remove_bg_enabled": false,
  "target_width": 100,
  "target_height": 100,
  "pixelation_method": "average",
  "bg_threshold": 50.0,
  "process_order": "pixelate_first"
}
```

**Note**: `pixelation_method` can be `"average"`, `"spatial"`, or `"nearest"`.

**Response**:
```json
{
  "processed_filename": "processed_uuid.png",
  "message": "Image processed successfully"
}
```

### `GET /api/download/<filename>`
Download a processed image file.

### `GET /api/image/<folder>/<filename>`
Get an image for preview (uploads or processed folder).

## Building for Production

### Frontend

Build the React app for production:
```bash
cd frontend
npm run build
```

This creates a `dist` folder with static files that can be served by any web server or deployed to GitHub Pages.

### Backend

For production deployment, use a WSGI server like Gunicorn:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## GitHub Pages Deployment

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Copy the `dist` folder contents to your GitHub Pages branch or repository root

3. Update API endpoints in the frontend code to point to your backend server URL (or use environment variables)

4. Push to GitHub and enable GitHub Pages in repository settings

## Development

### Backend Development

The backend uses Flask with CORS enabled for development. Hot reload is enabled in debug mode.


### Frontend Development

The frontend uses Vite for fast development with hot module replacement. The Vite dev server proxies API requests to the Flask backend.

## License

This project is open source and available for free use and modification.

## Commercial License

A 5% royalty applies to use this software in any part for profit.
See https://github.com/j031nich0145/j031nich0145/blob/main/LICENSING.md

## Buy us Coffee

https://github.com/j031nich0145/

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Troubleshooting

### Backend won't start
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Check that port 5000 is not in use
- Verify Python version is 3.8+

### Frontend won't start
- Ensure Node.js 16+ is installed
- Run `npm install` in the frontend directory
- Check that port 3000 is not in use

### Image processing fails
- Ensure uploaded file is JPG or PNG
- Check file size is under 10MB
- Verify backend server is running and accessible

