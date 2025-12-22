import React, { useState, useEffect } from 'react'
import './ImagePreview.css'

function ImagePreview({ 
  originalFile, 
  processedImageUrl
}) {
  const [originalUrl, setOriginalUrl] = useState(null)

  useEffect(() => {
    if (originalFile) {
      const url = URL.createObjectURL(originalFile)
      setOriginalUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [originalFile])

  return (
    <div className="image-preview">
      <div className="preview-grid">
        <div className="preview-item">
          <h3>Original</h3>
          {originalUrl && (
            <div className="image-container">
              <img src={originalUrl} alt="Original" />
            </div>
          )}
        </div>

        <div className="preview-item">
          <h3>Pixelated</h3>
          {processedImageUrl ? (
            <div className="image-container">
              <img src={processedImageUrl} alt="Processed" />
            </div>
          ) : (
            <div className="placeholder">
              <p>Adjust slider to see result</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImagePreview

