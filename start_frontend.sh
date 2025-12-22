#!/bin/bash
# Quick start script for PXL8 frontend

cd "$(dirname "$0")/frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start Vite dev server
echo "Starting React frontend on http://localhost:3000"
npm run dev

