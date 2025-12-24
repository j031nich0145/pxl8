# PXL8 UI Layout and Functionality Documentation

## Overview
PXL8 is a client-side image pixelation tool that allows users to upload images and apply pixelation effects with real-time preview.

## UI Structure

### 1. Header Section
- **Title**: "PXL8" (left side)
- **Theme Toggle**: Moon/Sun icon button (right side) to toggle dark/light mode
- **Styling**: Gradient background, responsive to dark mode

### 2. Main Content Area

#### Before Image Upload (Initial State)
- **Upload Section**: Centered upload area with:
  - Upload icon (SVG)
  - Text: "Drop an image here or click to browse"
  - Subtext: "Supports JPG and PNG files (max 10MB)"
  - **Browse Files** button
  - Drag and drop functionality
  - Click anywhere on upload area to browse (as text suggests)

#### After Image Upload
Two-column layout:

**Left Column - Image Preview:**
- **Original Image**: 
  - Shows uploaded image
  - Hover overlay with "×" button to change/remove image
  - Title: "Original"
  
- **Pixelated Image**:
  - Shows processed result (updates in real-time when Live Update is on)
  - Placeholder text "Adjust slider to see result" when no processing yet
  - Title: "Pixelated"

**Right Column - Controls Section:**
- Pixelation controls panel (see details below)

### 3. Footer Section
- Links: "Background Removal Tool", "batch pxl8", "Commercial Use License", "Buy Us Coffee"
- Separated by bullet points (•)

## Pixelation Controls Panel

### Header Row (Top of Controls)
1. **Mode Toggle Buttons**:
   - **px²** button: Direct pixel size mode (1-100)
   - **px%** button: Level-based percentage mode (1-100% of resolution)
   - Active mode is highlighted

2. **Live Update Toggle**:
   - Checkbox with label "Live Update"
   - When ON: Automatically processes image as user adjusts controls (300ms debounce)
   - When OFF: Shows "Process Image" button instead

3. **Action Buttons** (right side):
   - **Process Image** button: Only visible when Live Update is OFF
   - **Download** button: Only visible when processed image exists

### Controls Content

#### 1. Pixel Size/Level Input and Slider
- **Number Input Field**:
  - Type: `number`
  - Range: 1-100 (both modes)
  - **Behavior**:
    - Accepts free typing (can type multi-digit numbers like "12", "50", etc.)
    - Stores raw string value while typing to allow partial input
    - On focus: Automatically disables Live Update
    - On blur: Commits the value and updates pixelation level
    - On Enter key: Commits value, blurs input, and if Live Update is OFF, triggers Process button
    - Spinner arrow clicks (detected by ±1 change): Automatically enables Live Update and processes immediately
  
- **Slider**:
  - Range: 0-100
  - **Direct Mode (px²)**: 
    - Left (0) = 1px, Right (100) = 100px
    - Linear mapping
  - **Level Mode (px%)**:
    - Left (0) = 100% (least pixelated), Right (100) = 1% (most pixelated)
    - Reversed direction
  - Moving slider automatically enables Live Update if it's off
  
- **Precision Buttons**:
  - Left arrow (`<`): Decrements by 1
  - Right arrow (`>`): Increments by 1
  - Automatically enables Live Update if it's off
  - Labels: "Min" and "Max" on either side of slider

#### 2. Method Selection
- Dropdown select with two options:
  - "Pixel Averaging - Averages colors within each block (Smoother)"
  - "Nearest Neighbor - Samples one point per block (Blocky)"

#### 3. Image Information Display
- Shows when image is uploaded:
  - Image dimensions: "Image: WIDTH×HEIGHT px"
  - Pixel size: "Pixel size: N×N (each pixel represents N×N original pixels)"
  - Target size: "Target size: WIDTH×HEIGHT pixels"
  - Special notes: "(no pixelation)" when pixelSize = 1, "(maximum pixelation)" when pixelSize >= 50

## Key Functionality Details

### File Upload
- **Accepted formats**: JPG/JPEG and PNG only
- **Max size**: 10MB (mentioned in UI, validation may be needed)
- **Methods**:
  1. Drag and drop onto upload area
  2. Click "Browse Files" button
  3. Click anywhere on upload area (as text suggests)
- **After upload**: 
  - Image dimensions are extracted
  - Original image displayed immediately
  - Controls become available
  - Live Update is ON by default

### Pixelation Modes

#### Direct Mode (px²)
- **Input range**: 1-100
- **Meaning**: Direct pixel block size
  - Value 1 = 1×1 pixel blocks (no pixelation)
  - Value 50 = 50×50 pixel blocks
  - Value 100 = 100×100 pixel blocks (maximum pixelation)
- **Calculation**: `targetWidth = originalWidth / pixelSize`, `targetHeight = originalHeight / pixelSize`

#### Level Mode (px%)
- **Input range**: 1-100
- **Meaning**: Percentage of original resolution
  - Value 1 = 1% of original (most pixelated)
  - Value 50 = 50% of original
  - Value 100 = 100% of original (least pixelated)
- **Calculation**: `targetWidth = originalWidth * (level / 100)`, `targetHeight = originalHeight * (level / 100)`
- **Slider direction**: Reversed (left = less pixelated, right = more pixelated)

### Live Update Behavior
- **Default state**: ON
- **When ON**:
  - Automatically processes image 300ms after any control change
  - No "Process Image" button shown
  - Real-time preview updates
  
- **When OFF**:
  - "Process Image" button appears
  - User must manually click to process
  - Input field focus automatically turns Live Update OFF
  - Slider movement, arrow clicks, and spinner clicks automatically turn Live Update ON

### Input Field Behavior
- **Free typing**: User can type any number, including multi-digit (e.g., type "1" then "2" to make "12")
- **State management**: 
  - Stores raw string value while typing
  - Only commits on blur or Enter key
  - Syncs with slider/controls when not focused
- **Focus behavior**:
  - On focus: Disables Live Update
  - While focused: Input value can be freely edited, doesn't trigger processing
- **Commit behavior**:
  - On blur: Commits value, clamps to 1-100 range, updates pixelation level
  - On Enter: Commits value, blurs input, and if Live Update is OFF, triggers Process button
- **Spinner detection**: 
  - Detects when value changes by exactly ±1 (likely from spinner arrows)
  - Automatically enables Live Update and processes immediately

### Download Functionality
- **Trigger**: Click "Download" button (only visible when processed image exists)
- **Behavior**:
  - Prompts user for filename (without extension)
  - Default: `pxl8_N.png` where N is download count
  - User can enter custom filename
  - Filename is sanitized (removes invalid characters: / \ : * ? " < > |)
  - Automatically adds .png extension if not provided
  - Downloads processed image
  - Increments download count in localStorage

### Image Change/Removal
- **Method**: Click "×" button on original image (appears on hover)
- **Behavior**:
  - Cleans up object URLs
  - Resets all state
  - Returns to upload screen
  - Clears error messages

### Error Handling
- **File type validation**: Shows alert for non-JPG/PNG files
- **Processing errors**: Displayed in error message div
- **Missing image**: Shows error if trying to process without uploaded image

### Dark Mode
- **Toggle**: Moon/Sun icon in header
- **Scope**: Applies to entire app
- **Features**:
  - Dark background colors
  - Adjusted text colors for contrast
  - Theme-aware button and control styling
  - Smooth transitions between modes

## State Management

### App-Level State (App.jsx)
- `uploadedFile`: Current uploaded file object
- `processedImageUrl`: Object URL for processed image blob
- `processing`: Boolean for processing state
- `processingProgress`: Progress percentage (0-100)
- `error`: Error message string
- `imageDimensions`: { width, height } object
- `darkMode`: Boolean for theme
- `downloadCount`: Number, persisted in localStorage
- `liveUpdate`: Boolean, default true
- `pixelationLevel`: Number (1-100), default 5.5
- `pixelationMethod`: String ('average' or 'nearest'), default 'average'
- `pixelationMode`: String ('direct' or 'level'), default 'direct'

### PixelationControls State
- `pixelSizeInput`: String, local state for input field
- `isInputFocused`: Boolean, tracks if input is focused

## Processing Logic

### Image Processing
- **Method**: Client-side using Canvas API
- **Function**: `pixelateImage()` from `utils/pixelation-client.js`
- **Parameters**:
  - Original file
  - Target width/height (calculated from pixelation level)
  - Method ('average' or 'nearest')
  - Multiplier (currently always 1.0)
  - Progress callback
- **Output**: Blob converted to object URL for display

### Debouncing
- **Live Update debounce**: 300ms delay before processing
- **Purpose**: Prevents excessive processing during rapid slider/control changes

## CSS Classes and Styling

### Key Classes
- `.app`: Main app container
- `.app-header`: Header section
- `.app-content`: Main content area
- `.upload-area`: File upload drop zone
- `.upload-content`: Content inside upload area
- `.browse-button`: Browse files button
- `.image-preview`: Image preview container
- `.preview-grid`: Two-column grid for original/processed
- `.pixelation-controls`: Controls panel
- `.controls-header`: Top row of controls
- `.mode-toggle-button`: px²/px% buttons
- `.toggle-label`: Live Update checkbox
- `.px2-input`: Number input field
- `.pixelation-slider`: Range slider
- `.precision-button`: Arrow buttons
- `.process-button-image`: Process button
- `.download-button`: Download button

### Dark Mode
- Applied via `.dark-mode` class on body and app container
- All components have dark mode variants using `:global(.dark-mode)` or `body.dark-mode` selectors

## Important Implementation Notes

### File Input Handling
- Hidden file input (`display: none`)
- Triggered programmatically via ref
- Accepts only `image/jpeg,image/png`

### Object URL Management
- Created for both original and processed images
- Properly revoked on cleanup to prevent memory leaks
- Original URL created in ImagePreview component
- Processed URL created in App component

### Input Field Synchronization
- Input field syncs with pixelation level when not focused
- Stores raw string while typing to allow partial input
- Commits on blur or Enter key
- Detects spinner clicks for immediate processing

### Event Handling
- Drag and drop: `preventDefault()` and `stopPropagation()` on all drag events
- Button clicks: Should stop propagation to prevent parent handlers
- Input focus: Disables Live Update
- Slider/arrow changes: Auto-enables Live Update if off

## Browser Compatibility
- Uses modern browser APIs:
  - Canvas API for image processing
  - File API for uploads
  - URL.createObjectURL for blob URLs
  - localStorage for download count persistence

## Performance Considerations
- Client-side processing (no server needed)
- Debounced live updates (300ms)
- Object URL cleanup on unmount
- Progress callbacks for long operations

