import './BatchProgress.css'

function BatchProgress({ results }) {
  return (
    <div className="batch-progress">
      <h2>Processing Images...</h2>
      <div className="progress-list">
        {results.map((result, index) => (
          <div key={index} className="progress-item">
            <div className="progress-header">
              <span className="file-name">{result.file.name}</span>
              <span className="progress-percent">{result.progress}%</span>
            </div>
            <div className="progress-bar-container">
              <div 
                className={`progress-bar ${result.status === 'error' ? 'error' : ''}`}
                style={{ width: `${result.progress}%` }}
              />
            </div>
            {result.status === 'error' && (
              <div className="error-message">{result.error}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default BatchProgress

