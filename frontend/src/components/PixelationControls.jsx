import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import CropPreviewModal from './CropPreviewModal'
import './PixelationControls.css'

function PixelationControls({
  liveUpdate,
  onLiveUpdateChange,
  pixelationLevel,
  onPixelationLevelChange,
  method,
  onMethodChange,
  imageDimensions,
  onDownload,
  onProcess,
  processedImageUrl,
  onCrop,
  onRotateImage,
  onCrunch,
  on2xCrunch,
  onUndo,
  canUndo,
  hasUploadedFile,
  originalFile,
  darkMode,
  onDarkModeChange,
}) {
  const [showCropModal, setShowCropModal] = useState(false)
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(null)
  const [isCropMenuHovered, setIsCropMenuHovered] = useState(false)
  const [isCrunchMenuHovered, setIsCrunchMenuHovered] = useState(false)
  const location = useLocation()
  
  // Calculate pixel size from pixelation level
  // Maps to pixel block size (1x1 to 100x100) using exponential function
  // Note: level can be slightly above 10 to support direct pixel size inputs above ~50
  const calculatePixelSize = (level) => {
    // Use exponential mapping: pixelSize = 1 + ((level - 1) / 9)^2 * 99
    // This gives better granularity at lower levels
    // Clamp level to reasonable range (allow slightly above 10 for precision)
    const clampedLevel = Math.max(1.0, Math.min(10.1, level))
    const normalizedLevel = (clampedLevel - 1) / 9
    const pixelSize = Math.round(1 + Math.pow(normalizedLevel, 2) * 99)
    return Math.max(1, Math.min(100, pixelSize)) // Clamp between 1 and 100
  }

  // Calculate pixel size from pixelation level
  const pixelSize = calculatePixelSize(pixelationLevel)

  // Calculate target dimensions from pixel size
  const calculateTargetDimensions = () => {
    if (!imageDimensions.width || !imageDimensions.height) {
      return { width: 100, height: 100 }
    }
    const targetWidth = Math.max(1, Math.floor(imageDimensions.width / pixelSize))
    const targetHeight = Math.max(1, Math.floor(imageDimensions.height / pixelSize))
    return { width: targetWidth, height: targetHeight }
  }

  const { width: targetWidth, height: targetHeight } = calculateTargetDimensions()

  // Convert pixel size back to pixelation level (for input box synchronization)
  // This needs to account for the rounding in calculatePixelSize to ensure accurate round-trip conversion
  const pixelSizeToLevel = (size) => {
    // Clamp size to valid range
    const clampedSize = Math.max(1, Math.min(100, size))
    
    // Find the level that produces this pixel size when rounded
    // We need to account for Math.round() in calculatePixelSize
    // Try the exact inverse first
    const normalizedSize = (clampedSize - 1) / 99
    let level = 1 + Math.sqrt(normalizedSize) * 9
    
    // Verify that calculatePixelSize(level) produces the desired size
    // If not, adjust slightly to account for rounding
    let calculatedSize = Math.round(1 + Math.pow((level - 1) / 9, 2) * 99)
    if (calculatedSize !== clampedSize) {
      // Adjust level slightly to compensate for rounding
      // Use a small iterative adjustment
      const step = 0.001
      const maxIterations = 100
      let iterations = 0
      while (calculatedSize !== clampedSize && iterations < maxIterations) {
        if (calculatedSize < clampedSize) {
          level += step
        } else {
          level -= step
        }
        calculatedSize = Math.round(1 + Math.pow((level - 1) / 9, 2) * 99)
        iterations++
      }
    }
    
    // Allow level to go slightly above 10 if needed for precision
    // The calculatePixelSize function will handle clamping
    return level
  }

  // State for pixel size input
  const [pixelSizeInput, setPixelSizeInput] = useState(String(pixelSize))
  const [isInputFocused, setIsInputFocused] = useState(false)

  // Update pixel size input when pixelation level changes (only if input is not focused)
  useEffect(() => {
    if (!isInputFocused) {
      setPixelSizeInput(String(pixelSize))
    }
  }, [pixelSize, isInputFocused])

  // Handle pixel size input change (only update local state for display)
  const handlePixelSizeInputChange = (e) => {
    const value = e.target.value
    
    // Allow empty string and numbers while typing
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
        // Convert pixel size to pixelation level
        const newLevel = pixelSizeToLevel(clampedValue)
        onPixelationLevelChange(newLevel)
      }
      // Otherwise, just update input state - blur/Enter will handle commit
    }
  }

  // Handle pixel size input blur or enter key - actually update pixelation level
  const handlePixelSizeInputCommit = (e) => {
    let value = e.target.value
    // If empty, use current pixel size
    if (value === '' || isNaN(parseInt(value))) {
      value = pixelSize
    } else {
      value = parseInt(value)
    }
    const clampedValue = Math.max(1, Math.min(100, value))
    setPixelSizeInput(String(clampedValue))
    // Convert pixel size to pixelation level
    const newLevel = pixelSizeToLevel(clampedValue)
    onPixelationLevelChange(newLevel)
    setIsInputFocused(false)
  }

  // Handle input focus - disable live-update
  const handlePixelSizeInputFocus = () => {
    setIsInputFocused(true)
    if (liveUpdate) {
      onLiveUpdateChange(false)
    }
  }

  // Handle key down for Enter key
  const handlePixelSizeInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault() // Prevent form submission
      
      // Manually execute commit logic synchronously
      let value = e.target.value
      // If empty, use current pixel size
      if (value === '' || isNaN(parseInt(value))) {
        value = pixelSize
      } else {
        value = parseInt(value)
      }
      const clampedValue = Math.max(1, Math.min(100, value))
      setPixelSizeInput(String(clampedValue))
      // Convert pixel size to pixelation level
      const newLevel = pixelSizeToLevel(clampedValue)
      onPixelationLevelChange(newLevel)
      setIsInputFocused(false)
      
      // Blur the input
      e.target.blur()
      
      // Enable live-update if it's off (since Process button is removed)
      if (!liveUpdate) {
        onLiveUpdateChange(true)
      }
    }
  }

  // Convert pixel size (1-100) to slider value (0-100)
  const pixelSizeToSlider = (size) => {
    return ((size - 1) / 99) * 100
  }
  
  // Convert slider value (0-100) to pixel size (1-100)
  const sliderToPixelSize = (sliderValue) => {
    return Math.round(1 + (sliderValue / 100) * 99)
  }

  // Handle precision increment/decrement (increment/decrement pixel size by 1)
  const handleDecrement = () => {
    // If live update is off, toggle it back on when arrow is clicked
    if (!liveUpdate) {
      onLiveUpdateChange(true)
    }
    const newPixelSize = Math.max(1, pixelSize - 1)
    const newLevel = pixelSizeToLevel(newPixelSize)
    onPixelationLevelChange(newLevel)
  }

  const handleIncrement = () => {
    // If live update is off, toggle it back on when arrow is clicked
    if (!liveUpdate) {
      onLiveUpdateChange(true)
    }
    const newPixelSize = Math.min(100, pixelSize + 1)
    const newLevel = pixelSizeToLevel(newPixelSize)
    onPixelationLevelChange(newLevel)
  }

  // Handle slider change - map directly to pixel size
  const handleSliderChange = (e) => {
    // Auto-enable live-update if it's currently off
    if (!liveUpdate) {
      onLiveUpdateChange(true)
    }
    const sliderValue = parseInt(e.target.value)
    const newPixelSize = sliderToPixelSize(sliderValue)
    const newLevel = pixelSizeToLevel(newPixelSize)
    onPixelationLevelChange(newLevel)
  }

  // Convert pixel size to slider value for display
  const sliderValue = pixelSizeToSlider(pixelSize)

  const handleCropOptionClick = (aspectRatio) => {
    setSelectedAspectRatio(aspectRatio)
    setShowCropModal(true)
  }

  const handleCropApply = (cropX, cropY, cropWidth, cropHeight) => {
    if (onCrop && selectedAspectRatio) {
      onCrop(selectedAspectRatio, cropX, cropY, cropWidth, cropHeight)
    }
    setShowCropModal(false)
    setSelectedAspectRatio(null)
  }

  const handleCropCancel = () => {
    setShowCropModal(false)
    setSelectedAspectRatio(null)
  }

  return (
    <div className="pixelation-controls">
      <div className="controls-header">
        <div className="header-row">
          <div className="header-left">
            {hasUploadedFile && (
              <>
                {/* Crunch dropdown - first */}
                <div 
                  className="crunch-button-container"
                  onMouseEnter={() => setIsCrunchMenuHovered(true)}
                  onMouseLeave={() => setIsCrunchMenuHovered(false)}
                >
                  <button
                    className="crunch-button"
                    disabled={!hasUploadedFile}
                  >
                    Crunch
                  </button>
                  {isCrunchMenuHovered && (
                    <div className="crunch-menu">
                      <button onClick={onCrunch}>Crunch =&gt; 72dpi</button>
                      <button onClick={on2xCrunch}>2x Crunch</button>
                      <div className="menu-separator"></div>
                      <button 
                        onClick={onUndo}
                        disabled={!canUndo}
                        title="Undo Last (Ctrl+Z)"
                      >
                        Undo Last
                      </button>
                    </div>
                  )}
                </div>

                {/* Method dropdown - second */}
                <div className="header-method-select">
                  <select value={method} onChange={(e) => onMethodChange(e.target.value)} className="method-select-header">
                    <option value="average">Pixel Averaging - averages colors/block (smoothest)</option>
                    <option value="spatial">Spatial Approx - closest pixel/position (blocky)</option>
                    <option value="nearest">Nearest Neighbors - majority color/block (preserve colors)</option>
                  </select>
                </div>
              </>
            )}
            {showCropModal && originalFile && (
              <CropPreviewModal
                originalFile={originalFile}
                aspectRatio={selectedAspectRatio}
                onCrop={handleCropApply}
                onCancel={handleCropCancel}
                onRotateImage={onRotateImage}
              />
            )}
          </div>
          <div className="header-right">
            {hasUploadedFile && (
              <>
                {/* Crop dropdown - first in right column */}
                <div 
                  className="crop-button-container"
                  onMouseEnter={() => setIsCropMenuHovered(true)}
                  onMouseLeave={() => setIsCropMenuHovered(false)}
                >
                  <button
                    className="crop-button"
                    disabled={!hasUploadedFile}
                  >
                    Crop
                  </button>
                  {isCropMenuHovered && (
                    <div className="crop-menu">
                      <button onClick={() => handleCropOptionClick('1:1')}>1:1 (Square)</button>
                      <button onClick={() => handleCropOptionClick('3:2')}>3:2 (Photo)</button>
                      <button onClick={() => handleCropOptionClick('4:3')}>4:3 (Traditional)</button>
                      <div className="menu-separator"></div>
                      <button 
                        onClick={onUndo}
                        disabled={!canUndo}
                        title="Undo Last (Ctrl+Z)"
                      >
                        Undo Last
                      </button>
                    </div>
                  )}
                </div>

                {/* px² input - second in right column */}
                <div className="header-px2-input">
                  <div className="px2-input-container-header">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={pixelSizeInput}
                      onChange={handlePixelSizeInputChange}
                      onBlur={handlePixelSizeInputCommit}
                      onFocus={handlePixelSizeInputFocus}
                      onKeyDown={handlePixelSizeInputKeyDown}
                      className="px2-input-header"
                      aria-label="Pixel size squared"
                      title="Press Enter or Live Update"
                    />
                    <span className="px2-label-header">px²</span>
                  </div>
                </div>

                {/* Live Update toggle - third in right column */}
                <label className="toggle-label">
                  <span>Live Update</span>
                  <input
                    type="checkbox"
                    checked={liveUpdate}
                    onChange={(e) => onLiveUpdateChange(e.target.checked)}
                    className="toggle-switch"
                  />
                </label>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="controls-content">
        <div className="input-group">
          <label>
            <div className="slider-container">
              <button 
                className="precision-button precision-button-left" 
                onClick={handleDecrement}
                aria-label="Decrease pixel size by 1"
              >
                &lt;
              </button>
              <span className="slider-label">Min</span>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderValue}
                onChange={handleSliderChange}
                className="pixelation-slider"
              />
              <span className="slider-label">Max</span>
              <button 
                className="precision-button precision-button-right" 
                onClick={handleIncrement}
                aria-label="Increase pixel size by 1"
              >
                &gt;
              </button>
            </div>
          </label>
        </div>

        {imageDimensions.width > 0 && (
          <div className="info-text">
            <small>
              Original Image: {imageDimensions.width}×{imageDimensions.height} px
              <br />
              Target size: {targetWidth}×{targetHeight} pixels (Pixel size: {pixelSize}×{pixelSize})
            </small>
            <div className="info-text-nav-buttons">
              <Link 
                to="/" 
                className={`nav-mode-button ${location.pathname === '/' ? 'active' : ''}`}
                title="Single Mode"
              >
                Single
              </Link>
              <Link 
                to="/batch" 
                className={`nav-mode-button ${location.pathname === '/batch' ? 'active' : ''}`}
                title="Batch Mode"
              >
                Batch
              </Link>
            </div>
            <div className="info-text-buttons">
              {processedImageUrl && (
                <button className="download-button-info" onClick={onDownload} title="Download">
                  ⬇️
                </button>
              )}
              {onDarkModeChange && (
                <button className="theme-toggle-info" onClick={() => onDarkModeChange(!darkMode)} title="Light/Dark Mode">
                  {darkMode ? '☀️' : '🌙'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PixelationControls

