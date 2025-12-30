# PXL8 App Usage Guide

## Introduction

PXL8 is a free, open-source image pixelation tool that runs entirely in your browser. All image processing happens locally on your device - no data is sent to external servers. The app offers two main modes: **Single Mode** for processing individual images and **Batch Mode** for processing multiple images at once.

---

## Single Mode

Single Mode allows you to upload and process one image at a time with full control over pixelation settings and image manipulation tools.

### Uploading Images

1. **Drag & Drop**: Simply drag an image file from your computer and drop it onto the upload area
2. **Click to Browse**: Click anywhere on the upload area to open your file browser
3. **Supported Formats**: JPG, JPEG, and PNG files

Once uploaded, your image will appear in the preview area and you can begin processing it.

### Pixelation Controls

#### Pixel Size Slider

- **Location**: Main control panel, labeled "px²"
- **Range**: 1×1 to 100×100 pixels
- **Usage**: 
  - Drag the slider left for more pixelation (larger pixel blocks)
  - Drag the slider right for less pixelation (smaller pixel blocks)
  - You can also click directly on the slider track to jump to a specific value
  - The slider includes visual markers at key positions (1%, 2.5%, 5%, 7.5%, 10%)

#### Pixel Size Input Box

- **Location**: Next to the slider
- **Usage**: 
  - Type a specific pixel size value (1-100)
  - Use the up/down arrows to increment/decrement by 1
  - Press Enter or click outside the box to apply changes
  - If Live Update is enabled, spinner clicks will update immediately

#### Pixelation Methods

Choose from three different pixelation algorithms:

1. **Pixel Averaging** (Default)
   - Averages all colors within each pixel block
   - Produces smooth, blended results
   - Best for: Natural-looking pixelation, preserving color gradients

2. **Spatial Approximation**
   - Samples the closest pixel by spatial position
   - Creates blocky, retro-style pixelation
   - Best for: Retro/vintage effects, sharp edges

3. **Nearest Neighbors**
   - Uses the majority (most frequent) color per block
   - Preserves dominant colors while reducing noise
   - Best for: Maintaining color accuracy, reducing image noise

#### Live Update Toggle

- **Location**: Control panel, toggle switch
- **Function**: When enabled, the preview updates in real-time as you adjust the pixelation slider
- **Tip**: Disable Live Update for faster processing when making large adjustments, then enable it for fine-tuning

### Crop Tool

The crop tool allows you to crop your image to specific aspect ratios with an interactive preview.

#### Opening the Crop Tool

1. Click the **"Crop"** button in the control panel
2. Select an aspect ratio from the dropdown menu:
   - **1:1 Square**: Perfect square crop
   - **3:2 Photo**: Standard photo aspect ratio
   - **4:3 Traditional**: Classic photo aspect ratio

#### Using the Crop Preview

- **Drag**: Click and drag the crop box to reposition it
- **Resize**: Drag the corners or edges of the crop box to resize
- **Arrow Keys**: Use arrow keys to move the crop box in small increments (10px)
- **Scale**: Use `+`/`-` keys or `=`/`-` keys to scale the crop box up or down
- **Grid Overlay**: Toggle between 3×3 grid, 9×9 grid, or no grid to help with composition
- **Grid Color**: Change grid line color (Blue, Black, or White) for better visibility
- **Apply**: Click "Apply Crop" or press `Enter` to confirm
- **Cancel**: Click "Cancel" or press `Escape` to close without cropping

### Crunch Tool

The crunch tool normalizes images to 72 DPI, which can enhance pixelation effects.

#### Using Crunch

1. Click the **"Crunch"** button
2. Select from the dropdown:
   - **1× Crunch**: Normalize image to 72 DPI once
   - **2× Crunch**: Apply crunch twice for enhanced effect

**Note**: Crunch operations are cumulative - each crunch further normalizes the image.

### Rotate Tool

- **Location**: Available in the crop modal
- **Function**: Rotate the image 90 degrees clockwise
- **Usage**: Click the rotate button in the crop preview modal

### Undo Functionality

- **Keyboard Shortcut**: Press `Ctrl+Z` (or `Cmd+Z` on Mac)
- **Button**: Click the undo button in the control panel
- **Limitations**: 
  - Undo supports up to 3 previous operations
  - Undo history is cleared when you upload a new image

### Download

- **Location**: Download button in the control panel
- **Function**: Downloads the currently processed image
- **Format**: Images are downloaded as PNG files
- **Filename**: Files are named with a timestamp (e.g., `pixelated_1234567890.png`)

---

## Batch Mode

Batch Mode allows you to process multiple images using a single "Target Image" as the reference for pixelation settings.

### Understanding the Target Image

The **Target Image** is the first image you process in Single Mode. When you switch to Batch Mode, this image becomes your reference:

- The Target Image's pixelation settings (pixel size, method) are used for all batch images
- The Target Image appears as the first thumbnail in the batch grid
- You can click the Target Image's X button to remove it and return to Single Mode

### Adding Batch Images

1. **Upload Multiple Files**: 
   - Click the upload area or drag multiple images
   - Select multiple files from the file browser (hold Ctrl/Cmd to select multiple)
   - Images will be added to the batch queue

2. **Remove Images**: 
   - Click the X button on any thumbnail to remove it from the batch
   - Removing the Target Image (first thumbnail) will clear it and return you to Single Mode

### Batch Operations

#### Batch Crop

1. Click **"Batch Crop"** button
2. The crop modal opens showing all batch images stacked
3. Select which images to include in the crop (checkboxes)
4. Choose aspect ratio (1:1, 3:2, or 4:3)
5. Adjust crop box - it applies to all included images uniformly
6. Use grid overlay (3×3 or 9×9) for alignment
7. Click "Apply Crop" to crop all selected images

**Note**: All images are cropped to the same dimensions based on the smallest image's width.

#### Batch Crunch

1. Click **"Batch Crunch"** button
2. Select crunch level:
   - **1× Crunch**: Normalize all images to 72 DPI once
   - **2× Crunch**: Apply crunch twice
3. Click "Apply Crunch" to process all batch images

**Tip**: You can choose to "Crop First" from the crunch modal, which will open the batch crop tool.

#### Batch Pxl8 (Process All)

1. Ensure you have a Target Image with pixelation settings configured
2. Add batch images to process
3. Click **"Batch Pxl8"** or **"Process All"** button
4. All images will be processed sequentially using the Target Image's settings
5. Progress is shown for each image
6. Processed images replace the thumbnails when complete

### Preview Modal

Click any thumbnail to open the preview modal:

- **Navigation**: Use left/right arrow buttons or arrow keys to navigate between images
- **View Modes**: Toggle between "Pixelated" and "Original" views
- **Image Info**: 
  - Filename
  - Original image dimensions
  - Pixelated dimensions (when available)
  - Target dimensions (pixellation size)
- **Download**: Download button (⬇️) appears when viewing pixelated images
- **Close**: Click X button or press Escape to close

### Batch Download

- **Location**: Download button in the batch info box
- **Function**: Downloads all processed images as a ZIP file
- **Contents**: Includes all images that have been processed with Batch Pxl8
- **Filename**: `pixelated_images_[timestamp].zip`

### Clear Batch

- **Location**: "Clear Batch" button
- **Function**: Removes all batch images from the queue
- **Note**: The Target Image is preserved - only batch images are cleared

---

## Settings & Preferences

### Dark Mode

- **Location**: Theme toggle button (bottom-right corner)
- **Function**: Switches between light and dark color schemes
- **Persistence**: Your preference is saved and restored on next visit

### Settings Persistence

The app automatically saves:
- Pixelation level and method
- Live Update preference
- Dark mode preference
- Current image state (when switching between Single and Batch modes)

All settings are stored locally in your browser and persist between sessions.

---

## Keyboard Shortcuts

### Single Mode

- `Ctrl+Z` / `Cmd+Z`: Undo last operation (up to 3 steps)

### Crop Modal

- `Enter`: Apply crop
- `Escape`: Cancel crop and close modal
- `Arrow Keys`: Move crop box (10px increments)
- `+` / `=` / `-`: Scale crop box up/down

### Preview Modal (Batch Mode)

- `Arrow Left`: Previous image
- `Arrow Right`: Next image
- `Escape`: Close modal

---

## Tips & Best Practices

### General Tips

1. **Start with Live Update Enabled**: This helps you see changes in real-time as you adjust settings
2. **Use Undo Wisely**: Remember you can only undo 3 steps - save important versions by downloading
3. **Experiment with Methods**: Try all three pixelation methods to see which works best for your image
4. **Pixel Size Matters**: Lower pixel sizes (1-10) create dramatic pixelation, higher sizes (50-100) create subtle effects

### Batch Processing Tips

1. **Set Target Image First**: Process your Target Image in Single Mode with desired settings before adding batch images
2. **Consistent Results**: All batch images will use the same pixelation settings as your Target Image
3. **Preview Before Processing**: Use the preview modal to check individual images before batch processing
4. **Crop Before Pixelation**: Consider cropping images first if you want consistent compositions

### Performance Tips

1. **Disable Live Update**: For large images or when making big slider movements, disable Live Update for faster performance
2. **Process in Batches**: For very large batch sets, consider processing in smaller groups
3. **Browser Memory**: Very large images or many batch images may slow down your browser - close other tabs if needed

### Workflow Suggestions

1. **Single Image Workflow**:
   - Upload image → Adjust pixelation → Crop if needed → Crunch if desired → Download

2. **Batch Workflow**:
   - Process Target Image in Single Mode → Switch to Batch Mode → Add images → Batch Crop (optional) → Batch Crunch (optional) → Batch Pxl8 → Download ZIP

---

## Troubleshooting

### Image Won't Upload

- **Check Format**: Ensure file is JPG, JPEG, or PNG
- **Check Size**: Very large images may take time to process
- **Browser**: Try refreshing the page or using a different browser

### Processing is Slow

- **Disable Live Update**: Turn off Live Update when making large adjustments
- **Reduce Image Size**: Smaller images process faster
- **Close Other Tabs**: Free up browser memory

### Undo Not Working

- **Check History**: You can only undo the last 3 operations
- **New Upload**: Uploading a new image clears undo history

### Batch Images Not Processing

- **Check Target Image**: Ensure you have a Target Image with pixelation settings
- **Check Settings**: Verify pixelation settings are configured
- **Refresh**: Try refreshing the page and re-uploading images

---

## Technical Notes

- **Client-Side Processing**: All image processing happens in your browser using HTML5 Canvas API
- **No Server Upload**: Images never leave your device
- **Browser Storage**: Settings and image state are stored in browser localStorage
- **Supported Browsers**: Modern browsers with Canvas API support (Chrome, Firefox, Safari, Edge)

---

## Need Help?

If you encounter issues or have questions:
- Check this guide first
- Review the README.md file in the project repository
- Check browser console for error messages (F12 → Console tab)

---

*Last Updated: 2024*

