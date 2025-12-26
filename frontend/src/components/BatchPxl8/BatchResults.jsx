import { useState } from 'react'
import './BatchResults.css'

function BatchResults({ results }) {
  const [downloading, setDownloading] = useState(false)

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
    setDownloading(true)
    const completedResults = results.filter(r => r.status === 'completed' && r.processedBlob)
    
    // Download with small delay between each to avoid browser blocking
    for (let i = 0; i < completedResults.length; i++) {
      const result = completedResults[i]
      downloadImage(result.processedBlob, result.file.name)
      if (i < completedResults.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
    
    setDownloading(false)
  }

  const completedResults = results.filter(r => r.status === 'completed')
  const errorResults = results.filter(r => r.status === 'error')

  return (
    <div className="batch-results">
      <div className="results-header">
        <h2>Processing Complete</h2>
        <div className="results-stats">
          <span>✓ {completedResults.length} successful</span>
          {errorResults.length > 0 && (
            <span>✗ {errorResults.length} failed</span>
          )}
        </div>
      </div>

      {completedResults.length > 0 && (
        <div className="download-all-section">
          <button 
            className="download-all-button"
            onClick={downloadAll}
            disabled={downloading}
          >
            {downloading ? 'Downloading...' : `Download All (${completedResults.length} images)`}
          </button>
        </div>
      )}

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

