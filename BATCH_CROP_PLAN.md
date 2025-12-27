# Batch Crop Functionality Plan

## Overview
The Batch Crop feature will allow users to crop multiple images simultaneously using an onion skin effect, where images are stacked with transparency to visualize composition across the batch. Users can align crops using rule-of-thirds grids and apply the same crop to all images in the batch.

## Core Features

### 1. Onion Skin Effect
- **Stack Visualization**: Display all batch images (including target image) in a transparent stack
- **Target Image on Top**: The target image appears at the top of the stack with full opacity
- **Transparency Levels**: Each subsequent image has reduced opacity (e.g., 80%, 60%, 40%, etc.)
- **Visual Feedback**: Users can see how crops align across multiple images

### 2. Image Carousel
- **Move Top to Bottom**: Button to move the top image to the bottom of the stack
- **Cycle Through Images**: Allows users to bring any image to the top for reference
- **Visual Indicator**: Show which image is currently on top (highlighted or labeled)

### 3. Image Selection/Exclusion
- **Checkbox System**: Each image in the stack has a checkbox
- **Include/Exclude**: Unchecked images are excluded from the crop operation
- **Visual Feedback**: Excluded images are dimmed or hidden from the stack
- **Batch Count**: Display count of included images

### 4. Crop Selection Box
- **Reusable Component**: Adapt `CropPreviewModal.jsx` functionality for batch use
- **Interactive Crop Area**: Draggable and resizable crop box
- **Aspect Ratio Lock**: Maintain aspect ratio based on target image or user selection
- **Apply to All**: Same crop dimensions applied to all included images

### 5. Rule of Thirds Grid Overlay
- **3x3 Grid**: Standard rule of thirds grid (3 columns × 3 rows)
- **9x9 Grid**: Finer grid for more precise composition (9 columns × 9 rows)
- **Toggle Options**: Radio buttons or dropdown to switch between grid types
- **Grid Visibility**: Toggle grid on/off
- **Grid Alignment**: Grid overlays the crop box for composition guidance

### 6. Crop Box and Grid Color Options
- **Color Picker**: Arial button (or dropdown) to switch crop box and grid colors
- **Default Blue**: Bright blue (#4dd0e1) - matches existing crop modal
- **Black Option**: Black (#000000) for better visibility on light images
- **White Option**: White (#ffffff) for better visibility on dark images
- **Synchronized Colors**: Crop box border and grid lines use the same color

## User Interface

### Layout
```
┌─────────────────────────────────────────┐
│  Batch Crop Modal                      │
├─────────────────────────────────────────┤
│                                         │
│  [Image Stack with Onion Skin]         │
│  ┌─────────────────────────────┐      │
│  │  [Crop Box with Grid]        │      │
│  │                              │      │
│  │                              │      │
│  └─────────────────────────────┘      │
│                                         │
│  Controls:                              │
│  [◄ Move Top to Bottom]                │
│  Grid: [3×3] [9×9] [Off]               │
│  Color: [Blue] [Black] [White]         │
│                                         │
│  Image List:                            │
│  ☑ Target Image (top)                   │
│  ☑ Image 2                              │
│  ☐ Image 3 (excluded)                   │
│  ☑ Image 4                              │
│                                         │
│  [Cancel] [Apply Crop to 3 images]     │
└─────────────────────────────────────────┘
```

### Component Structure
- **BatchCropModal.jsx**: Main modal component
- **ImageStack.jsx**: Onion skin visualization component
- **CropBox.jsx**: Reusable crop selection box (adapted from CropPreviewModal)
- **GridOverlay.jsx**: Rule of thirds grid component
- **ImageList.jsx**: Checkbox list of images in batch

## Technical Implementation

### State Management
```javascript
{
  images: Array<{file: File, url: string, included: boolean}>,
  stackOrder: Array<number>, // Indices in display order
  cropBox: {x: number, y: number, width: number, height: number},
  gridType: '3x3' | '9x9' | 'off',
  cropColor: 'blue' | 'black' | 'white',
  aspectRatio: number | null
}
```

### Key Functions
- `moveTopToBottom()`: Reorder stack, move top image to bottom
- `toggleImageInclusion(index)`: Include/exclude image from crop
- `updateCropBox(x, y, width, height)`: Update crop selection
- `applyCropToBatch()`: Apply crop to all included images
- `renderImageStack()`: Render onion skin effect with transparency

### Crop Application
- Use `cropImage()` utility from `image-manipulation.js`
- Apply same crop coordinates to all included images
- Maintain aspect ratio across all crops
- Update batch images state after cropping

## Integration Points

### From PxlBatch.jsx
- Button click opens `BatchCropModal`
- Pass `files` array and `targetImageUrl` to modal
- Receive cropped files array back
- Update `files` state with cropped versions

### With Existing Components
- Reuse crop logic from `CropPreviewModal.jsx`
- Adapt `cropImage()` function for batch processing
- Use same styling patterns as existing modals

## Future Enhancements
- **Smart Alignment**: Auto-align crops based on image content
- **Preset Compositions**: Save and reuse crop presets
- **Batch Rotation**: Rotate all images before cropping
- **Export Settings**: Save crop settings for reuse

## Files to Create/Modify

### New Files
- `frontend/src/components/BatchPxl8/BatchCropModal.jsx`
- `frontend/src/components/BatchPxl8/BatchCropModal.css`
- `frontend/src/components/BatchPxl8/ImageStack.jsx`
- `frontend/src/components/BatchPxl8/ImageStack.css`
- `frontend/src/components/BatchPxl8/GridOverlay.jsx`
- `frontend/src/components/BatchPxl8/GridOverlay.css`

### Modified Files
- `frontend/src/pages/PxlBatch.jsx`: Add `handleBatchCrop` implementation
- `frontend/src/utils/image-manipulation.js`: May need batch crop helper function

## Notes
- This is a comprehensive feature that will require careful UI/UX design
- Onion skin effect may need performance optimization for large batches
- Consider limiting batch size for crop operations if performance is an issue
- Grid overlay should be optional to avoid UI clutter

