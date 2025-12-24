# PXL8 Bug List and Missing Features

## Critical Bugs

### 1. Input Field - Cannot Type Multi-Digit Numbers
**File**: `pxl8/frontend/src/components/PixelationControls.jsx`  
**Line**: 97  
**Issue**: The input field immediately parses the value to an integer, preventing free typing of multi-digit numbers.

**Current Code:**
```javascript
setPixelSizeInput(value === '' ? '' : parseInt(value))
```

**Problem**: When user types "1" then "2" to make "12", the first "1" gets parsed to integer 1, and typing "2" might not work correctly.

**Expected**: Store raw string value while typing, only parse on commit (blur/Enter).

**Fix Required:**
```javascript
setPixelSizeInput(value === '' ? '' : value)  // Store raw string
```

---

### 2. Input Field State Initialization - Type Mismatch
**File**: `pxl8/frontend/src/components/PixelationControls.jsx`  
**Line**: 82  
**Issue**: State is initialized with number instead of string.

**Current Code:**
```javascript
const [pixelSizeInput, setPixelSizeInput] = useState(pixelSize)
```

**Problem**: Input field expects string value, but state is initialized with number. This can cause React warnings and inconsistent behavior.

**Expected**: Initialize with string.

**Fix Required:**
```javascript
const [pixelSizeInput, setPixelSizeInput] = useState(String(pixelSize))
```

---

### 3. Input Field Sync Effect - Missing String Conversion
**File**: `pxl8/frontend/src/components/PixelationControls.jsx`  
**Line**: 88  
**Issue**: Sync effect doesn't convert to string.

**Current Code:**
```javascript
setPixelSizeInput(pixelSize)
```

**Problem**: Sets number value directly, but input field needs string.

**Expected**: Convert to string for display.

**Fix Required:**
```javascript
setPixelSizeInput(String(pixelSize))
```

---

### 4. Missing Spinner Click Detection
**File**: `pxl8/frontend/src/components/PixelationControls.jsx`  
**Line**: 93-99  
**Issue**: No detection of spinner arrow clicks (±1 changes) to auto-enable Live Update.

**Current Code:**
```javascript
const handlePixelSizeInputChange = (e) => {
  const value = e.target.value
  if (value === '' || /^\d+$/.test(value)) {
    setPixelSizeInput(value === '' ? '' : parseInt(value))
  }
}
```

**Problem**: Doesn't detect when user clicks spinner arrows (which change value by ±1) to automatically enable Live Update and process immediately.

**Expected**: Detect ±1 changes, enable Live Update if off, and process immediately.

**Fix Required:**
```javascript
const handlePixelSizeInputChange = (e) => {
  const value = e.target.value
  
  if (value === '' || /^\d+$/.test(value)) {
    // Store raw string value to allow free typing
    setPixelSizeInput(value === '' ? '' : value)
    
    // Detect spinner clicks by comparing parsed values
    const oldInputValue = pixelSizeInput === '' ? 0 : parseInt(pixelSizeInput) || 0
    const newInputValue = value === '' ? 0 : parseInt(value) || 0
    
    const isSpinnerClick = value !== '' && 
                          /^\d+$/.test(value) && 
                          oldInputValue !== 0 &&
                          Math.abs(newInputValue - oldInputValue) === 1
    
    // If spinner arrow was clicked, enable live-update and process immediately
    if (isSpinnerClick) {
      if (!liveUpdate) {
        onLiveUpdateChange(true)
      }
      const clampedValue = Math.max(1, Math.min(100, newInputValue))
      onPixelationLevelChange(clampedValue)
    }
  }
}
```

---

### 5. Enter Key Handler - Missing Level Parameter
**File**: `pxl8/frontend/src/components/PixelationControls.jsx`  
**Line**: 152-154  
**Issue**: Calls `onProcess()` without passing the new level.

**Current Code:**
```javascript
if (!liveUpdate) {
  queueMicrotask(() => {
    onProcess()
  })
}
```

**Problem**: Should pass the new level to ensure correct processing with the updated value.

**Expected**: Pass the new level to `onProcess(newLevel)`.

**Fix Required:**
```javascript
if (!liveUpdate) {
  onProcess(newLevel)  // Pass the new level directly
}
```

---

## Missing Features

### 6. Missing Pixelation Mode Toggle (px² / px%)
**File**: `pxl8/frontend/src/components/PixelationControls.jsx`  
**Issue**: No mode toggle buttons in the UI.

**Expected**: 
- Two toggle buttons: "px²" (Direct mode) and "px%" (Level mode)
- Should be in the controls header
- Active mode should be highlighted
- App.jsx should have `pixelationMode` state and `onPixelationModeChange` handler

**Current State**: The code uses a single mode (direct px² mode) with exponential mapping. The documentation indicates there should be two modes:
- **Direct Mode (px²)**: Direct pixel block size (1-100)
- **Level Mode (px%)**: Percentage-based scaling (1-100% of resolution)

**Files to Modify**:
1. `pxl8/frontend/src/App.jsx` - Add `pixelationMode` state and mode handling
2. `pxl8/frontend/src/components/PixelationControls.jsx` - Add mode toggle buttons and mode-specific logic

---

### 7. Upload Area Not Clickable
**File**: `pxl8/frontend/src/components/ImageUpload.jsx`  
**Issue**: Upload area text says "click to browse" but the area itself is not clickable.

**Current Code**: No `onClick` handler on upload area div.

**Expected**: Clicking anywhere on the upload area should open the file dialog.

**Fix Required:**
```javascript
const onUploadAreaClick = (e) => {
  // Only trigger if clicking directly on the upload area, not on buttons
  if (e.target === e.currentTarget || 
      (e.target.tagName !== 'BUTTON' && !e.target.closest('button'))) {
    fileInputRef.current?.click()
  }
}

// Add to div:
onClick={onUploadAreaClick}
```

---

### 8. Browse Button - Missing Event Propagation Control
**File**: `pxl8/frontend/src/components/ImageUpload.jsx`  
**Line**: 42-44  
**Issue**: Button click handler doesn't stop propagation (though this may not be causing issues if it works).

**Current Code:**
```javascript
const onButtonClick = () => {
  fileInputRef.current?.click()
}
```

**Expected**: Should stop event propagation to prevent any parent handlers from interfering.

**Fix Required:**
```javascript
const onButtonClick = (e) => {
  e?.stopPropagation?.()
  if (fileInputRef.current) {
    fileInputRef.current.click()
  }
}
```

---

## Minor Issues / Improvements

### 9. Missing Image Dimensions Display
**File**: `pxl8/frontend/src/components/PixelationControls.jsx`  
**Line**: 299-309  
**Issue**: Info text doesn't show original image dimensions.

**Current Code**: Only shows pixel size and target size.

**Expected**: Should show "Image: WIDTH×HEIGHT px" as first line.

**Fix Required:**
```javascript
Image: {imageDimensions.width}×{imageDimensions.height} px
<br />
Pixel size: ...
```

---

### 10. Method Select Options - Incomplete Text
**File**: `pxl8/frontend/src/components/PixelationControls.jsx`  
**Line**: 293-294  
**Issue**: Method options have shortened text.

**Current Code:**
```javascript
<option value="average">Pixel Averaging (Smoother)</option>
<option value="nearest">Nearest Neighbor (Blocky)</option>
```

**Expected** (from documentation):
```javascript
<option value="average">Pixel Averaging - Averages colors within each block (Smoother)</option>
<option value="nearest">Nearest Neighbor - Samples one point per block (Blocky)</option>
```

---

## Summary

### Critical Bugs (Must Fix):
1. ✅ Input field cannot type multi-digit numbers (stores parsed int instead of string)
2. ✅ Input field state type mismatch (number vs string)
3. ✅ Input field sync effect missing string conversion
4. ✅ Missing spinner click detection
5. ✅ Enter key handler missing level parameter

### Missing Features (Should Add):
6. ⚠️ Missing pixelation mode toggle (px² / px%)
7. ⚠️ Upload area not clickable
8. ⚠️ Browse button missing event propagation control

### Minor Issues (Nice to Have):
9. Missing image dimensions in info display
10. Method select options have incomplete text

---

## Priority Order for Fixes

1. **High Priority** (Breaks core functionality):
   - Bug #1: Input field typing
   - Bug #2: State initialization
   - Bug #3: Sync effect

2. **Medium Priority** (Affects user experience):
   - Bug #4: Spinner detection
   - Bug #5: Enter key handler
   - Feature #7: Upload area clickable

3. **Low Priority** (Enhancements):
   - Feature #6: Mode toggle (major feature, may require significant changes)
   - Feature #8: Event propagation (may not be needed if it works)
   - Issue #9: Image dimensions display
   - Issue #10: Method option text

