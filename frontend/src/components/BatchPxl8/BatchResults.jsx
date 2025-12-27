import { useState, useEffect, useRef } from 'react'
import JSZip from 'jszip'
import './BatchResults.css'

function BatchResults({ results, pixelatedImageInfo, onClear, onDownloadZip }) {
  const [downloading, setDownloading] = useState(false)
  const resultsRef = useRef(null)

  // Method label mapping
  const methodNames = {
    average: 'Pixel Averaging',
    spatial: 'Spatial Approximation',
    nearest: 'Nearest Neighbors',
    'nearest-neighbor': 'Nearest Neighbor',
    bilinear: 'Bilinear'
  }

  // Scroll results into view when component mounts
  useEffect(() => {
    if (resultsRef.current) {
      setTimeout(() => {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [])

  const downloadImage = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pixelated_${filename}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadAll = async () => {
    if (onDownloadZip) {
      // Use external zip download function if provided
      setDownloading(true)
      try {
        await onDownloadZip()
      } finally {
        setDownloading(false)
      }
    } else {
      // Fallback to internal implementation
      setDownloading(true)
      const completedResults = results.filter(r => r.status === 'completed' && r.processedBlob)
      
      try {
        const zip = new JSZip()
        
        // Add each processed image to zip
        completedResults.forEach((result) => {
          zip.file(`pixelated_${result.file.name}`, result.processedBlob)
        })
        
        // Generate zip file
        const zipBlob = await zip.generateAsync({ type: 'blob' })
        
        // Download zip file
        const url = URL.createObjectURL(zipBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = `pixelated_images_${Date.now()}.zip`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Failed to create zip file:', error)
        alert('Failed to create zip file. Please try again.')
      }
      
      setDownloading(false)
    }
  }

  const completedResults = results.filter(r => r.status === 'completed')
  const errorResults = results.filter(r => r.status === 'error')
  
  const methodLabel = pixelatedImageInfo?.pixelationMethod 
    ? (methodNames[pixelatedImageInfo.pixelationMethod] || pixelatedImageInfo.pixelationMethod)
    : 'unknown'

  return (
    <div className="batch-results" ref={resultsRef}>
      <div className="results-header">
        <div className="process-info">
          <small>
            <strong>Process Complete: ✓ {completedResults.length} successful</strong>
            <br />
            Method: {methodLabel}
            <br />
            Image Size: {pixelatedImageInfo?.originalDimensions?.width || 0}×{pixelatedImageInfo?.originalDimensions?.height || 0} px • Pixel Size: {pixelatedImageInfo?.pixelSize || 0}×{pixelatedImageInfo?.pixelSize || 0} px
          </small>
        </div>
        {completedResults.length > 0 && (
          <div className="results-header-buttons">
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
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      <div className="results-grid">
        {results.map((result, index) => (
          <div key={index} className="result-item">
            {result.status === 'completed' && result.processedBlob ? (
              <>
                <img 
                  src={URL.createObjectURL(result.processedBlob)}
                  alt={result.file.name}
                  className="result-image"
                />
                <div className="result-info">
                  <div className="result-filename">{result.file.name}</div>
                  <button
                    className="download-button"
                    onClick={() => downloadImage(result.processedBlob, result.file.name)}
                  >
                    Download
                  </button>
                </div>
              </>
            ) : (
              <div className="result-error">
                <div className="error-icon">✗</div>
                <div className="error-text">{result.file.name}</div>
                <div className="error-message">{result.error || 'Processing failed'}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default BatchResults

