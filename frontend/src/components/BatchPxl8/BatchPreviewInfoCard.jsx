import { useState } from 'react'
import './BatchPreviewInfoCard.css'

function BatchPreviewInfoCard({ results, pixelatedImageInfo, onClear, onDownloadZip }) {
  const [downloading, setDownloading] = useState(false)

  // Method label mapping
  const methodNames = {
    average: 'Pixel Averaging',
    spatial: 'Spatial Approximation',
    nearest: 'Nearest Neighbors',
    'nearest-neighbor': 'Nearest Neighbor',
    bilinear: 'Bilinear'
  }

  const completedResults = results.filter(r => r.status === 'completed')
  const methodLabel = pixelatedImageInfo?.pixelationMethod 
    ? (methodNames[pixelatedImageInfo.pixelationMethod] || pixelatedImageInfo.pixelationMethod)
    : 'unknown'

  const downloadAll = async () => {
    if (onDownloadZip) {
      setDownloading(true)
      try {
        await onDownloadZip()
      } finally {
        setDownloading(false)
      }
    }
  }

  if (completedResults.length === 0) return null

  return (
    <div className="batch-preview-info-card">
      <small>
        <strong>Process Complete: ✓ {completedResults.length} successful</strong>
        {' • '}
        Method: {methodLabel}
        <br />
        Image Size: {pixelatedImageInfo?.originalDimensions?.width || 0}×{pixelatedImageInfo?.originalDimensions?.height || 0} px • Pixel Size: {pixelatedImageInfo?.pixelSize || 0}×{pixelatedImageInfo?.pixelSize || 0} px
      </small>
      <div className="preview-info-buttons">
        <button 
          className="download-all-button"
          onClick={downloadAll}
          disabled={downloading}
        >
          {downloading ? 'Downloading...' : `Download All (${completedResults.length} images)`}
        </button>
        {onClear && (
          <button 
            className="clear-results-button"
            onClick={onClear}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

export default BatchPreviewInfoCard

