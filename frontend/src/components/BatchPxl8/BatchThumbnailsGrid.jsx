import { useEffect, useState } from 'react'
import './BatchThumbnailsGrid.css'

function BatchThumbnailsGrid({ targetImageUrl, files, onRemove, onSetAsTarget, onUploadClick, onTargetImageChange, disabled }) {
  const [urls, setUrls] = useState({})

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
              src={targetImageUrl} 
              alt="Target image"
              className="thumbnail-image"
            />
            {onTargetImageChange && (
              <div className="thumbnail-overlay">
                <button
                  className="remove-thumbnail-button"
                  onClick={onTargetImageChange}
                  disabled={disabled}
                  title="Change Target Image"
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
        {files && files.map((file, index) => (
          <div key={index} className="thumbnail-item" title={file.name}>
            {urls[index] && (
              <img 
                src={urls[index]} 
                alt={file.name}
                className="thumbnail-image"
              />
            )}
            <div className="thumbnail-overlay">
              {onSetAsTarget && (
                <button
                  className="set-target-button"
                  onClick={() => onSetAsTarget(file, index)}
                  disabled={disabled}
                  title="Set as Target Image"
                >
                  ✓
                </button>
              )}
              <button
                className="remove-thumbnail-button"
                onClick={() => onRemove(index)}
                disabled={disabled}
                title="Remove"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BatchThumbnailsGrid
