import React from 'react'
import './BackgroundRemovalControls.css'

function BackgroundRemovalControls({
  enabled,
  onToggle,
  threshold,
  onThresholdChange,
}) {
  return (
    <div className="background-removal-controls">
      <label className="toggle-label">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <span>Enable Background Removal</span>
      </label>

      {enabled && (
        <div className="controls-content">
          <div className="input-group">
            <label>
              Sensitivity Threshold: {threshold}
              <input
                type="range"
                min="0"
                max="100"
                value={threshold}
                onChange={(e) => onThresholdChange(parseInt(e.target.value))}
                className="slider"
              />
              <div className="slider-labels">
                <span>Low</span>
                <span>High</span>
              </div>
            </label>
          </div>

          <div className="info-text">
            <small>
              Higher values remove more background. Adjust to fine-tune edge detection.
            </small>
          </div>
        </div>
      )}
    </div>
  )
}

export default BackgroundRemovalControls

