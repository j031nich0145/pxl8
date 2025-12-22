import React from 'react'
import './PixelationControls.css'

function PixelationControls({
  enabled,
  onToggle,
  pixelationLevel,
  onPixelationLevelChange,
  method,
  onMethodChange,
  imageDimensions,
}) {
  // Calculate target dimensions for display
  const calculateTargetDimensions = () => {
    if (!imageDimensions.width || !imageDimensions.height) {
      return { width: 100, height: 100 }
    }
    const minSize = 10
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
      <label className="toggle-label">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <span>Enable Pixelation</span>
      </label>

      {enabled && (
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
                <span>10×10</span>
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
                {pixelationLevel === 0 && ' (maximum pixelation)'}
              </small>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PixelationControls

