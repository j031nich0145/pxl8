# Changes to Restore After Revert

## Critical Functionality to Restore

### 1. Input Field Behavior (PixelationControls.jsx)

#### Key Features:
- **Free typing**: Input field must accept raw string values while typing (allows typing "1" then "2" to make "12")
- **Focus behavior**: When input is focused, Live Update automatically turns OFF
- **Enter key**: When Live Update is OFF, Enter key triggers Process button
- **Spinner detection**: Detects ±1 changes (from arrow buttons) and auto-enables Live Update + processes immediately

#### Implementation Details:

**State Management:**
```javascript
const [pixelSizeInput, setPixelSizeInput] = useState(String(pixelSize))
const [isInputFocused, setIsInputFocused] = useState(false)
```

**Input Change Handler:**
- Stores raw string value: `setPixelSizeInput(value === '' ? '' : value)`
- Allows empty string and numeric strings while typing
- Detects spinner clicks by comparing parsed values (±1 difference)
- Only updates pixelation level for spinner clicks, not manual typing

**Focus Handler:**
- Sets `isInputFocused` to true
- Disables Live Update if it's currently on

**Blur Handler:**
- Commits the value
- Clamps to 1-100 range
- Updates pixelation level
- Sets `isInputFocused` to false

**Enter Key Handler:**
- Commits value
- Blurs input
- If Live Update is OFF, triggers Process button with new level

**Sync Effect:**
- Updates input field when pixelation level changes
- Only syncs when input is NOT focused
- Converts to string for display

### 2. Browse Button Functionality (ImageUpload.jsx)

#### Expected Behavior:
- **Browse Files button**: Should open file dialog immediately (no delay)
- **Upload area click**: Clicking anywhere on upload area should also open file dialog (as text suggests "click to browse")
- **No 5-second delay**: File dialog should appear instantly

#### Implementation Notes:
- Button click handler should stop event propagation
- Upload area should have onClick handler
- File input ref should be checked before calling click()
- Drag and drop should still work correctly

### 3. Live Update Toggle Behavior

#### Key Behaviors:
- **Default**: ON
- **Auto-enable triggers**:
  - Moving slider
  - Clicking arrow buttons
  - Spinner arrow clicks on input field
- **Auto-disable triggers**:
  - Focusing input field
- **When OFF**: Shows "Process Image" button
- **When ON**: Hides "Process Image" button, auto-processes with 300ms debounce

### 4. Pixelation Modes

#### Direct Mode (px²):
- Input range: 1-100
- Direct pixel block size
- Slider: Linear (0 = 1px, 100 = 100px)

#### Level Mode (px%):
- Input range: 1-100
- Percentage of original resolution
- Slider: Reversed (0 = 100%, 100 = 1%)

### 5. Download Functionality

- Prompts for filename
- Default: `pxl8_N.png` (N from localStorage)
- Sanitizes filename (removes invalid chars)
- Auto-adds .png extension
- Increments counter in localStorage

## Testing Checklist After Restore

- [ ] Browse button opens file dialog immediately (no delay)
- [ ] Clicking upload area opens file dialog
- [ ] Drag and drop still works
- [ ] Input field accepts free typing (can type "12", "50", etc.)
- [ ] Input field focus disables Live Update
- [ ] Enter key triggers Process when Live Update is OFF
- [ ] Spinner arrows enable Live Update and process immediately
- [ ] Slider movement enables Live Update if off
- [ ] Mode toggle works (px² / px%)
- [ ] Download works with filename prompt
- [ ] Dark mode toggle works
- [ ] Image change button (×) works
- [ ] Error messages display correctly

## Files Modified

1. `pxl8/frontend/src/components/PixelationControls.jsx`
   - Input field handlers (change, focus, blur, keyDown)
   - State management for input field
   - Spinner detection logic
   - Live Update toggle integration

2. `pxl8/frontend/src/components/ImageUpload.jsx`
   - Button click handler (with stopPropagation)
   - Upload area onClick handler
   - File input ref handling

3. `pxl8/frontend/src/App.jsx`
   - Live Update state management
   - Debounced processing
   - Download functionality
   - Image dimension extraction

## Critical Code Patterns

### Input Field Pattern:
```javascript
// Store raw string while typing
setPixelSizeInput(value === '' ? '' : value)

// Only commit on blur/Enter
// Sync when not focused
useEffect(() => {
  if (!isInputFocused) {
    setPixelSizeInput(String(valueToShow))
  }
}, [value, isInputFocused])
```

### Button Click Pattern:
```javascript
const onButtonClick = (e) => {
  e?.stopPropagation?.()
  if (fileInputRef.current) {
    fileInputRef.current.click()
  }
}
```

### Live Update Toggle Pattern:
```javascript
// Auto-disable on input focus
const handlePixelSizeInputFocus = () => {
  setIsInputFocused(true)
  if (liveUpdate) {
    onLiveUpdateChange(false)
  }
}

// Auto-enable on slider/arrow
const handleSliderChange = (e) => {
  if (!liveUpdate) {
    onLiveUpdateChange(true)
  }
  // ... rest of handler
}
```

