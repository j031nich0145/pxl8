import { Link } from 'react-router-dom'
import './BatchSettings.css'

function BatchSettings({ settings }) {
  if (!settings) {
    return (
      <div className="batch-settings">
        <p>No settings found. <Link to="/">Configure settings in Single Mode</Link></p>
      </div>
    )
  }

  const methodNames = {
    average: 'Pixel Averaging',
    spatial: 'Spatial Approximation',
    nearest: 'Nearest Neighbors'
  }

  const pixelSize = calculatePixelSize(settings.pixelationLevel)

  return (
    <div className="batch-settings">
      <h2>Processing Settings</h2>
      <div className="settings-display">
        <div className="setting-item">
          <span className="setting-label">Pixelation Level:</span>
          <span className="setting-value">{settings.pixelationLevel.toFixed(1)}</span>
        </div>
        <div className="setting-item">
          <span className="setting-label">Pixel Size:</span>
          <span className="setting-value">{pixelSize}×{pixelSize} px</span>
        </div>
        <div className="setting-item">
          <span className="setting-label">Method:</span>
          <span className="setting-value">{methodNames[settings.pixelationMethod] || settings.pixelationMethod}</span>
        </div>
      </div>
      <div className="settings-note">
        <Link to="/">Change settings in Single Mode</Link>
      </div>
    </div>
  )
}

function calculatePixelSize(level) {
  const clampedLevel = Math.max(1.0, Math.min(10.1, level))
  const normalizedLevel = (clampedLevel - 1) / 9
  const pixelSize = Math.round(1 + Math.pow(normalizedLevel, 2) * 99)
  return Math.max(1, Math.min(100, pixelSize))
}

export default BatchSettings

