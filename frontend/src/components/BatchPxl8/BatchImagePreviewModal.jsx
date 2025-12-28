import { useEffect, useState } from 'react'
import './BatchImagePreviewModal.css'

function BatchImagePreviewModal({ imageUrl, imageName, imageDimensions, originalImageUrl, originalImageDimensions, isTargetImage, isOpen, onClose }) {
  const [viewMode, setViewMode] = useState('pixelated')
  // Reset view mode when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setViewMode('pixelated') // Always start with pixelated view
    }
  }, [isOpen])

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

  // Determine which image and dimensions to show
  const showToggle = isTargetImage && originalImageUrl
  const currentImageUrl = viewMode === 'pixelated' ? imageUrl : originalImageUrl
  const currentDimensions = viewMode === 'pixelated' 
    ? imageDimensions 
    : originalImageDimensions

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
        
        {/* Toggle buttons for target image */}
        {showToggle && (
          <div className="batch-image-preview-toggle">
            <button
              className={`batch-image-preview-toggle-button ${viewMode === 'pixelated' ? 'active' : ''}`}
              onClick={() => setViewMode('pixelated')}
            >
              Pixelated
            </button>
            <button
              className={`batch-image-preview-toggle-button ${viewMode === 'original' ? 'active' : ''}`}
              onClick={() => setViewMode('original')}
            >
              Original
            </button>
          </div>
        )}

        <div className="batch-image-preview-container">
          <img 
            src={currentImageUrl} 
            alt={imageName || 'Preview'}
            className="batch-image-preview-image"
          />
        </div>
        {(imageName || currentDimensions) && (
          <div className="batch-image-preview-info">
            {imageName && (
              <div className="batch-image-preview-filename">{imageName}</div>
            )}
            {currentDimensions && currentDimensions.width && currentDimensions.height && (
              <div className="batch-image-preview-dimensions">
                {currentDimensions.width}×{currentDimensions.height} px
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default BatchImagePreviewModal

