# PXL8 - Image Pixelation Tool

A free, open-source image pixelation and background removal tool that runs locally. Built with Python Flask backend and React frontend.

## Features

- **Pixelation**: Scale images down to as small as 25x25 pixels using two methods:
  - **Nearest Neighbor**: Fast, blocky pixelation
  - **Pixel Averaging**: Smoother, averaged pixelation
- **Background Removal**: Optional edge detection and flood fill to remove backgrounds with adjustable sensitivity
- **Processing Order**: Choose whether to pixelate first or remove background first
- **Modern Web Interface**: Clean, responsive React-based UI
- **Local Processing**: All processing happens on your machine - no data sent to external servers

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

1. Start the backend server (see Backend Setup above)
2. Start the frontend development server (see Frontend Setup above)
3. Open your browser to `http://localhost:3000`
4. Upload a JPG or PNG image (drag & drop or click to browse)
5. Configure pixelation settings:
   - Enable/disable pixelation
   - Set target width and height (minimum 25x25)
   - Choose pixelation method
6. Optionally enable background removal:
   - Toggle background removal
   - Adjust sensitivity threshold
7. Choose processing order (pixelate first or background removal first)
8. Click "Process Image"
9. Download your processed image

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

