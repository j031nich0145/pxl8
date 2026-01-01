import { useState, useEffect } from 'react'
import './BatchCrunchModal.css'

function BatchCrunchModal({ files, targetImageFile, onCrunch, onCropFirst, onCancel }) {
  const [imageSizes, setImageSizes] = useState([])
  const [allSameSize, setAllSameSize] = useState(true)
  const [loading, setLoading] = useState(true)

  // Check if all images have the same dimensions
  useEffect(() => {
    const checkImageSizes = async () => {
      if (files.length === 0) {
        setLoading(false)
        return
      }

      try {
        const sizePromises = files.map(file => {
          return new Promise((resolve) => {
            const img = new Image()
            const url = URL.createObjectURL(file)
            
            img.onload = () => {
              URL.revokeObjectURL(url)
              resolve({ width: img.width, height: img.height })
            }
            img.onerror = () => {
              URL.revokeObjectURL(url)
              resolve({ width: 0, height: 0 })
            }
            img.src = url
          })
        })

        const sizes = await Promise.all(sizePromises)
        setImageSizes(sizes)

        // Check if all sizes are the same
        if (sizes.length > 0) {
          const firstWidth = sizes[0].width
          const firstHeight = sizes[0].height
          const same = sizes.every(size => 
            size.width === firstWidth && size.height === firstHeight
          )
          setAllSameSize(same)
        }
      } catch (error) {
        console.error('Failed to check image sizes:', error)
      } finally {
        setLoading(false)
      }
    }

    checkImageSizes()
  }, [files])

  const handleCrunchClick = (crunchCount) => {
    if (onCrunch) {
      onCrunch(crunchCount)
    }
  }

  const handleCropFirstClick = () => {
    if (onCropFirst) {
      onCropFirst()
    }
  }

  // Get unique dimensions summary
  const getDimensionsSummary = () => {
    if (imageSizes.length === 0) return 'No images'
    
    const uniqueSizes = []
    imageSizes.forEach(size => {
      const sizeStr = `${size.width}×${size.height}`
      if (!uniqueSizes.includes(sizeStr)) {
        uniqueSizes.push(sizeStr)
      }
    })
    
    return uniqueSizes.join(', ')
  }

  return (
    <div className="batch-crunch-modal-overlay">
      <div className="batch-crunch-modal" onClick={(e) => e.stopPropagation()}>
        <button 
          className="batch-crunch-close"
          onClick={onCancel}
          title="Close"
        >
          ×
        </button>

        <h2 className="batch-crunch-title">Batch Crunch Options</h2>

        <div className="batch-crunch-content">
          <p className="batch-crunch-description">
            Crunch all batch images to 72dpi for consistent pixelation.
          </p>

          {loading ? (
            <div className="batch-crunch-loading">
              Analyzing images...
            </div>
          ) : (
            <>
              {!allSameSize && (
                <div className="batch-crunch-warning">
                  <div className="batch-crunch-warning-icon">⚠️</div>
                  <div className="batch-crunch-warning-content">
                    <strong>Images have different sizes</strong>
                    <div className="batch-crunch-sizes">
                      Dimensions: {getDimensionsSummary()}
                    </div>
                    <div className="batch-crunch-suggestion">
                      Batch Crop first for normalization?
                    </div>
                  </div>
                </div>
              )}

              {allSameSize && (
                <div className="batch-crunch-info">
                  <div className="batch-crunch-info-icon">✓</div>
                  <div className="batch-crunch-info-content">
                    All images are the same size: {getDimensionsSummary()}
                  </div>
                </div>
              )}

              <div className="batch-crunch-options">
                <div className="batch-crunch-option-group">
                  <h3>Single Crunch (72dpi)</h3>
                  <p>Reduces image size by 25% (96dpi → 72dpi)</p>
                  <button
                    className="batch-crunch-button batch-crunch-button-primary"
                    onClick={() => handleCrunchClick(1)}
                  >
                    Crunch Now
                  </button>
                </div>

                <div className="batch-crunch-option-group">
                  <h3>Double Crunch (2× = 54dpi)</h3>
                  <p>Reduces image size by ~44% (two 25% reductions)</p>
                  <button
                    className="batch-crunch-button batch-crunch-button-primary"
                    onClick={() => handleCrunchClick(2)}
                  >
                    2× Crunch Now
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="batch-crunch-actions">
          <button 
            className="batch-crunch-cancel-button" 
            onClick={onCancel}
          >
            Cancel
          </button>
          {!allSameSize && !loading && (
            <button 
              className="batch-crunch-crop-button" 
              onClick={handleCropFirstClick}
            >
              Crop First
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default BatchCrunchModal

