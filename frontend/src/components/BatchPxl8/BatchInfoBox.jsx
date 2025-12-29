import { Link, useLocation } from 'react-router-dom'
import './BatchInfoBox.css'

function BatchInfoBox({ 
  mainImage, 
  mainImageDimensions,
  targetDimensions,
  pixelSize,
  batchCount, 
  onUpload, 
  onDownload,
  onProcessAll,
  onBatchCrop,
  onBatchCrunch,
  onClear,
  showProcessButtons,
  canDownload,
  darkMode,
  onDarkModeChange 
}) {
  const location = useLocation()

  return (
    <div className="batch-info-box">
      <small>
        {mainImage && targetDimensions && pixelSize ? (
          <>
            Target Image: {mainImageDimensions?.width || 0}×{mainImageDimensions?.height || 0} px
            <br />
            Target size: {targetDimensions.width || 0}×{targetDimensions.height || 0} pixels (Pixel size: {pixelSize}×{pixelSize})
          </>
        ) : (
          <>No target image loaded. Upload an image in Single Mode first.</>
        )}
      </small>
      <div className="batch-info-controls">
        <div className="batch-info-left">
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
        {showProcessButtons && (
          <>
              <button 
                className="batch-crunch-button-info"
                onClick={onBatchCrunch}
                title="Batch Crunch - Normalize all images to 72dpi"
              >
                Batch Crunch
              </button>
            <button 
              className="batch-crop-button-info"
              onClick={onBatchCrop}
                title="Batch Crop - Crop all images with same dimensions"
            >
              Batch Crop
            </button>
            </>
          )}
        </div>
        <div className="batch-info-right">
          {showProcessButtons && (
            <>
            <button 
              className="process-all-button-info"
              onClick={onProcessAll}
              title={`Pxl8 All (${batchCount} ${batchCount === 1 ? 'image' : 'images'})`}
            >
              Pxl8 All
            </button>
            <button 
              className="clear-button-info"
              onClick={onClear}
              title="Remove Batch Images"
            >
              Clear Batch
            </button>
          </>
        )}
        <button 
          className="upload-button-info" 
          onClick={onUpload} 
          title="Upload Batch (max 48)"
        >
          ⬆️
        </button>
        <button 
          className={`download-button-info ${!canDownload ? 'disabled' : ''}`}
          onClick={canDownload ? onDownload : undefined}
          disabled={!canDownload}
          title={canDownload ? `Download Batch of ${batchCount}` : 'Download Batch (process images first)'}
        >
          ⬇️
        </button>
        {onDarkModeChange && (
          <button 
            className="theme-toggle-info" 
            onClick={() => onDarkModeChange(!darkMode)} 
            title="Light/Dark Mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        )}
        </div>
      </div>
    </div>
  )
}

export default BatchInfoBox
