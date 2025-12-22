import React, { useState, useEffect } from 'react'
import './ImagePreview.css'

function ImagePreview({ originalFile, processedFilename, onDownload }) {
  const [originalUrl, setOriginalUrl] = useState(null)
  const [processedUrl, setProcessedUrl] = useState(null)

  useEffect(() => {
    if (originalFile) {
      const url = URL.createObjectURL(originalFile)
      setOriginalUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [originalFile])

  useEffect(() => {
    if (processedFilename) {
      const url = `/api/image/processed/${processedFilename}`
      setProcessedUrl(url)
    } else {
      setProcessedUrl(null)
    }
  }, [processedFilename])

  return (
    <div className="image-preview">
      <div className="preview-grid">
        <div className="preview-item">
          <h3>Original Image</h3>
          {originalUrl && (
            <div className="image-container">
              <img src={originalUrl} alt="Original" />
            </div>
          )}
        </div>

        <div className="preview-item">
          <h3>Processed Image</h3>
          {processedUrl ? (
            <div className="image-container">
              <img src={processedUrl} alt="Processed" />
              <button className="download-button" onClick={onDownload}>
                Download
              </button>
            </div>
          ) : (
            <div className="placeholder">
              <p>Process an image to see the result here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImagePreview

