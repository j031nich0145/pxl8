import { useEffect, useState } from 'react'
import './BatchImagePreviewModal.css'

function BatchImagePreviewModal({ imageUrl, imageName, imageDimensions, targetDimensions, originalImageUrl, originalImageDimensions, isTargetImage, hasPixelated, isOpen, onClose, currentIndex, totalImages, onNavigate }) {
  const [viewMode, setViewMode] = useState('pixelated')
  const [displayedDimensions, setDisplayedDimensions] = useState(null)
  
  // Reset view mode when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setViewMode('pixelated') // Always start with pixelated view
    }
  }, [isOpen])

  // Detect dimensions from image if not provided
  useEffect(() => {
    const currentImageUrl = viewMode === 'pixelated' ? imageUrl : originalImageUrl
    
    // Use target dimensions for pixelated view, original dimensions for original view
    const currentDimensions = viewMode === 'pixelated' 
      ? targetDimensions  // Use target dims for pixelated
      : originalImageDimensions
    
    console.log('Dimension useEffect triggered:', {
      viewMode,
      imageName,
      targetDimensions,
      imageDimensions,
      originalImageDimensions,
      currentDimensions,
      hasPixelated
    })
    
    if (currentDimensions && currentDimensions.width) {
      // Use provided dimensions
      setDisplayedDimensions(currentDimensions)
    } else if (currentImageUrl) {
      // Fallback: detect from image
      setDisplayedDimensions(null)
      
      const img = new Image()
      img.onload = () => {
        setDisplayedDimensions({ width: img.width, height: img.height })
      }
      img.onerror = () => {
        console.error('Failed to load image for dimension detection')
        setDisplayedDimensions(null)
      }
      img.src = currentImageUrl
      
      return () => {
        img.onload = null
        img.onerror = null
      }
    } else {
      setDisplayedDimensions(null)
    }
  }, [imageUrl, originalImageUrl, targetDimensions, imageDimensions, originalImageDimensions, viewMode])

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
  const showToggle = originalImageUrl && hasPixelated // Only show toggle if image has been pixelated
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

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = currentImageUrl
    
    // Add pxl8_ prefix if downloading pixelated version
    let filename = imageName || 'image.png'
    if (viewMode === 'pixelated') {
      const lastDot = filename.lastIndexOf('.')
      if (lastDot > 0) {
        const name = filename.substring(0, lastDot)
        const ext = filename.substring(lastDot)
        filename = `pxl8_${name}${ext}`
      } else {
        filename = `pxl8_${filename}`
      }
    }
    
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
        
        {/* Controls: Toggle and Download */}
        <div className="batch-image-preview-controls">
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
          {/* Show download only if image is pixelated AND viewing pixelated version */}
          {hasPixelated && viewMode === 'pixelated' && (
            <button
              className="batch-image-preview-download"
              onClick={handleDownload}
              title="Download image"
            >
              ⬇
            </button>
          )}
        </div>

        <div className="batch-image-preview-container">
          <img 
            src={currentImageUrl} 
            alt={imageName || 'Preview'}
            className="batch-image-preview-image"
          />
        </div>
        {(imageName || displayedDimensions) && (
          <div className="batch-image-preview-info">
            {imageName && (
              <div className="batch-image-preview-filename">{imageName}</div>
            )}
            {displayedDimensions && displayedDimensions.width && displayedDimensions.height && (
              <div className="batch-image-preview-dimensions">
                {displayedDimensions.width}×{displayedDimensions.height} px
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default BatchImagePreviewModal

