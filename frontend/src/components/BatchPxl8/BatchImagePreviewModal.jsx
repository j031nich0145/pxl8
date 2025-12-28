import { useEffect, useState } from 'react'
import './BatchImagePreviewModal.css'

function BatchImagePreviewModal({ imageUrl, imageName, imageDimensions, originalImageUrl, originalImageDimensions, isTargetImage, isOpen, onClose, currentIndex, totalImages, onNavigate }) {
  const [viewMode, setViewMode] = useState('pixelated')
  // Reset view mode when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setViewMode('pixelated') // Always start with pixelated view
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' && onNavigate && currentIndex > 0) {
        onNavigate('prev')
      } else if (e.key === 'ArrowRight' && onNavigate && currentIndex < totalImages - 1) {
        onNavigate('next')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, onNavigate, currentIndex, totalImages])

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

        {/* Navigation arrows */}
        {totalImages > 1 && onNavigate && (
          <>
            <button 
              className="batch-image-preview-nav batch-image-preview-nav-prev"
              onClick={() => onNavigate('prev')}
              disabled={currentIndex === 0}
              title="Previous image (←)"
            >
              ‹
            </button>
            <button 
              className="batch-image-preview-nav batch-image-preview-nav-next"
              onClick={() => onNavigate('next')}
              disabled={currentIndex === totalImages - 1}
              title="Next image (→)"
            >
              ›
            </button>
          </>
        )}
        
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

