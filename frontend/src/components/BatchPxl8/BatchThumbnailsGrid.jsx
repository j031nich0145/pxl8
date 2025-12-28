import { useEffect, useState } from 'react'
import './BatchThumbnailsGrid.css'

function BatchThumbnailsGrid({ targetImageUrl, originalTargetImageUrl, files, onRemove, onUploadClick, onTargetImageChange, disabled, results, processedImageUrls, previewInfoCard, onThumbnailClick }) {
  const [urls, setUrls] = useState({})
  const [isHoveringTarget, setIsHoveringTarget] = useState(false)

  useEffect(() => {
    const newUrls = {}
    files.forEach((file, index) => {
      newUrls[index] = URL.createObjectURL(file)
    })
    setUrls(newUrls)

    return () => {
      // Cleanup all object URLs
      Object.values(newUrls).forEach(url => {
        URL.revokeObjectURL(url)
      })
    }
  }, [files])

  return (
    <div className="batch-thumbnails-grid">
      <div className="thumbnails-grid">
        {/* Target Image or Upload Placeholder (first grid item) */}
        {targetImageUrl ? (
          <div className="thumbnail-item target-thumbnail" title="Target Image">
            <img 
              src={isHoveringTarget && originalTargetImageUrl ? originalTargetImageUrl : targetImageUrl}
              alt="Target image"
              className="thumbnail-image"
              onMouseEnter={() => setIsHoveringTarget(true)}
              onMouseLeave={() => setIsHoveringTarget(false)}
              onClick={() => {
                if (onThumbnailClick) {
                  // Don't detect dimensions - let PxlBatch use pixelatedImageInfo
                  onThumbnailClick(targetImageUrl, 'Target Image', null, 0)
                }
              }}
              style={{ cursor: onThumbnailClick ? 'pointer' : 'default' }}
            />
            {onTargetImageChange && (
              <div className="thumbnail-overlay">
                <button
                  className="remove-thumbnail-button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onTargetImageChange()
                  }}
                  disabled={disabled}
                  title="Adjust Target Image"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        ) : (
          <button 
            className="upload-placeholder-button"
            onClick={onUploadClick}
            disabled={disabled}
            title="Upload Target Image"
          >
            <div className="upload-placeholder-icon">⬆️</div>
            <div className="upload-placeholder-text">Upload Target</div>
          </button>
        )}

        {/* Batch Thumbnails */}
        {files && files.map((file, index) => {
          // Use processed image URL if available, otherwise use original
          const imageUrl = processedImageUrls && processedImageUrls[index] 
            ? processedImageUrls[index] 
            : urls[index]
          const isProcessed = processedImageUrls && processedImageUrls[index]
          
          return (
          <div key={index} className={`thumbnail-item ${isProcessed ? 'thumbnail-processed' : ''}`} title={file.name}>
            {imageUrl && (
              <img 
                src={imageUrl} 
                alt={file.name}
                className="thumbnail-image"
                onClick={() => {
                  if (onThumbnailClick) {
                    const imageIndex = targetImageUrl ? index + 1 : index // Offset by 1 if target image exists
                    // Don't detect dimensions here - let PxlBatch use results array
                    onThumbnailClick(imageUrl, file.name, null, imageIndex)
                  }
                }}
                style={{ cursor: onThumbnailClick ? 'pointer' : 'default' }}
              />
            )}
            <div className="thumbnail-overlay">
              <button
                className="remove-thumbnail-button"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(index)
                }}
                disabled={disabled}
                title="Remove"
              >
                ×
              </button>
            </div>
            {/* Progress bar overlay */}
            {results && results[index] && results[index].status === 'processing' && (
              <div className="thumbnail-progress-overlay">
                <div 
                  className="thumbnail-progress-bar"
                  style={{ width: `${results[index].progress || 0}%` }}
                />
              </div>
            )}
          </div>
          )
        })}
        
        {/* Floating Preview Info Card - appears inline with thumbnails */}
        {previewInfoCard}
      </div>
    </div>
  )
}

export default BatchThumbnailsGrid
