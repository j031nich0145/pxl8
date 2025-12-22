import React from 'react'
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
}) {
  // Calculate target dimensions for display
  const calculateTargetDimensions = () => {
    if (!imageDimensions.width || !imageDimensions.height) {
      return { width: 100, height: 100 }
    }
    const minSize = 1
    const maxWidth = imageDimensions.width
    const maxHeight = imageDimensions.height
    const ratio = pixelationLevel / 100
    const targetWidth = Math.round(minSize + (maxWidth - minSize) * ratio)
    const targetHeight = Math.round(minSize + (maxHeight - minSize) * ratio)
    return { width: targetWidth, height: targetHeight }
  }

  const { width: targetWidth, height: targetHeight } = calculateTargetDimensions()

  return (
    <div className="pixelation-controls">
      <div className="controls-header">
        <div className="header-row">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={liveUpdate}
              onChange={(e) => onLiveUpdateChange(e.target.checked)}
              className="toggle-switch"
            />
            <span>Live Update</span>
          </label>
          <div className="header-buttons">
            {!liveUpdate && (
              <button 
                className="process-button-image" 
                onClick={onProcess}
              >
                Process Image
              </button>
            )}
            {processedImageUrl && (
              <button className="download-button" onClick={onDownload}>
                Download
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="controls-content">
        <div className="input-group">
          <label>
            Pixelation Level: {pixelationLevel}%
            <div className="slider-container">
              <span className="slider-label">Max</span>
              <input
                type="range"
                min="0"
                max="100"
                value={pixelationLevel}
                onChange={(e) => onPixelationLevelChange(parseInt(e.target.value))}
                className="pixelation-slider"
              />
              <span className="slider-label">None</span>
            </div>
            <div className="slider-labels-bottom">
              <span>1×1</span>
              <span>Original</span>
            </div>
          </label>
        </div>

        <div className="input-group">
          <label>
            Method
            <select value={method} onChange={(e) => onMethodChange(e.target.value)}>
              <option value="average">Pixel Averaging (Smoother)</option>
              <option value="nearest">Nearest Neighbor (Blocky)</option>
            </select>
          </label>
        </div>

        {imageDimensions.width > 0 && (
          <div className="info-text">
            <small>
              Target size: {targetWidth}×{targetHeight} pixels
              {pixelationLevel === 100 && ' (no pixelation)'}
              {pixelationLevel === 0 && ' (maximum pixelation - largest pixels)'}
            </small>
          </div>
        )}
      </div>
    </div>
  )
}

export default PixelationControls

