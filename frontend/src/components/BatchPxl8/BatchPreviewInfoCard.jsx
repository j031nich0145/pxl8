import { useState, useEffect, useRef } from 'react'
import './BatchPreviewInfoCard.css'

function BatchPreviewInfoCard({ results, pixelatedImageInfo, onClear, onDownloadZip }) {
  const [downloading, setDownloading] = useState(false)
  const cardRef = useRef(null)

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

  // Scroll card into view when processing completes
  useEffect(() => {
    if (completedResults.length > 0 && cardRef.current) {
      setTimeout(() => {
        const card = cardRef.current
        if (!card) return
        
        // Find the scrollable parent container (.batch-content)
        let scrollContainer = card.parentElement
        while (scrollContainer && !scrollContainer.classList.contains('batch-content')) {
          scrollContainer = scrollContainer.parentElement
        }
        
        if (scrollContainer) {
          const cardRect = card.getBoundingClientRect()
          const containerRect = scrollContainer.getBoundingClientRect()
          const infoBoxHeight = 80 // Height of fixed info box (including padding)
          const viewportHeight = window.innerHeight
          const cardBottom = cardRect.bottom
          const infoBoxTop = viewportHeight - infoBoxHeight
          
          // If card is below or overlapping with info box area, scroll it up
          if (cardBottom > infoBoxTop - 20) {
            const scrollAmount = cardBottom - infoBoxTop + 20 // 20px padding above info box
            scrollContainer.scrollBy({
              top: scrollAmount,
              behavior: 'smooth'
            })
          }
        } else {
          // Fallback to scrollIntoView if container not found
          card.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'end',
            inline: 'nearest'
          })
        }
      }, 300)
    }
  }, [completedResults.length])

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
    <div className="batch-preview-info-card" ref={cardRef}>
      <small>
        <strong>Process Complete: ✓ {completedResults.length} successful</strong>
        <br />
        Method: {methodLabel}
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
            title="Clear Batch Pxl8"
          >
            Clear Pxl8
          </button>
        )}
      </div>
    </div>
  )
}

export default BatchPreviewInfoCard

