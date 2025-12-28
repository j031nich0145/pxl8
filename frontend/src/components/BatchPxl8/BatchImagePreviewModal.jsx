import { useEffect } from 'react'
import './BatchImagePreviewModal.css'

function BatchImagePreviewModal({ imageUrl, imageName, imageDimensions, isOpen, onClose }) {
  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen || !imageUrl) return null

  const handleOverlayClick = (e) => {
    // Close if clicking on overlay, not on modal content
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="batch-image-preview-overlay" onClick={handleOverlayClick}>
      <div className="batch-image-preview-modal" onClick={(e) => e.stopPropagation()}>
        <button 
          className="batch-image-preview-close"
          onClick={onClose}
          title="Close (ESC)"
        >
          ×
        </button>
        <div className="batch-image-preview-container">
          <img 
            src={imageUrl} 
            alt={imageName || 'Preview'}
            className="batch-image-preview-image"
          />
        </div>
        {(imageName || imageDimensions) && (
          <div className="batch-image-preview-info">
            {imageName && (
              <div className="batch-image-preview-filename">{imageName}</div>
            )}
            {imageDimensions && imageDimensions.width && imageDimensions.height && (
              <div className="batch-image-preview-dimensions">
                {imageDimensions.width}×{imageDimensions.height} px
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default BatchImagePreviewModal

