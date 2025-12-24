# Interface Updates Task List

## Overview
This document lists all the interface updates needed to improve the PXL8 application's user interface and user experience.

## Tasks

### 1. Remove Top PXL8 Banner
- **Location**: `frontend/src/App.jsx` - Header section (lines 295-302)
- **Action**: Remove the `<header className="app-header">` element containing the PXL8 h1 title
- **Reason**: Takes up unnecessary space

### 2. Move Light/Dark Mode Toggle Button
- **Current Location**: `frontend/src/App.jsx` - Header section (line 298-300)
- **New Location**: Bottom right corner within the blue info box (`info-text` section in `PixelationControls.jsx`)
- **Action**: 
  - Remove theme toggle from header
  - Add theme toggle button to the bottom right of the info-text section
  - Style it to be inconspicuous

### 3. Remove Process Button
- **Location**: `frontend/src/components/PixelationControls.jsx` (lines 306-314)
- **Action**: Remove the "Process Image" button that appears when live-update is off
- **Note**: Must preserve Enter key functionality when entering values into px² input (already implemented in `handlePixelSizeInputKeyDown`)

### 4. Change Download Button to Emoji
- **Location**: `frontend/src/components/PixelationControls.jsx` (line 316-318)
- **Action**: Change button text from "Download" to "⬇️" emoji
- **Position**: Keep right-aligned in header

### 5. Move Live-Update Toggle to Header
- **Current Location**: `frontend/src/components/PixelationControls.jsx` - Header row (lines 296-304)
- **New Position**: Right-aligned within header, but to the left of Download button
- **Action**: Reorder header elements so Live-Update appears between other controls and Download button

### 6. Move Method Dropdown and px² Input to Header
- **Current Location**: `frontend/src/components/PixelationControls.jsx` - Controls content section (lines 324-380)
- **New Location**: Header row in `PixelationControls.jsx`
- **Requirements**:
  - Position: To the right of Crunch button, left-aligned within the header box
  - px² input: Width should be exactly 100px
  - Method dropdown: Width should be only as wide as needed for the option text inside (auto-width)
  - Update px² tooltip to: "Press Enter or Live Update"

### 7. Add X Button on Original Image Hover
- **Location**: `frontend/src/components/ImagePreview.jsx` (lines 35-42)
- **Status**: Already implemented! The X button exists and appears on hover
- **Action**: Verify it's working correctly and ensure it navigates back to image browser screen

## Files to Modify

1. `frontend/src/App.jsx` - Remove header banner, move theme toggle
2. `frontend/src/App.css` - Update styles for removed header
3. `frontend/src/components/PixelationControls.jsx` - Major restructuring of header layout
4. `frontend/src/components/PixelationControls.css` - Update styles for new header layout
5. `frontend/src/components/ImagePreview.jsx` - Verify X button functionality (may already be correct)

## Notes

- The Enter key functionality for px² input is already implemented in `handlePixelSizeInputKeyDown` (lines 159-187 in PixelationControls.jsx)
- The X button on original image hover already exists in ImagePreview.jsx - may just need verification
- The blue info box refers to the `info-text` section which has a blue background (`#e0f7fa` in light mode, `#1e3a5f` in dark mode)

