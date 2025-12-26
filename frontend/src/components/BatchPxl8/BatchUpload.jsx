import { useState, useCallback } from 'react'
import './BatchUpload.css'

function BatchUpload({ files, onFilesChange, maxFiles = 10, disabled }) {
  const [dragActive, setDragActive] = useState(false)

  const validateFile = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!validTypes.includes(file.type)) {
      return { valid: false, error: 'Only JPG and PNG files are allowed' }
    }
    return { valid: true }
  }

  const handleFiles = useCallback((newFiles) => {
    const fileArray = Array.from(newFiles)
    const validFiles = []
    const errors = []

    fileArray.forEach(file => {
      const validation = validateFile(file)
      if (validation.valid) {
        if (files.length + validFiles.length < maxFiles) {
          validFiles.push(file)
        } else {
          errors.push(`${file.name}: Maximum ${maxFiles} files allowed`)
        }
      } else {
        errors.push(`${file.name}: ${validation.error}`)
      }
    })

    if (errors.length > 0) {
      // Show errors (could use toast notification)
      console.warn('Upload errors:', errors)
      alert(`Some files were rejected:\n${errors.join('\n')}`)
    }

    if (validFiles.length > 0) {
      onFilesChange([...files, ...validFiles])
    }
  }, [files, onFilesChange, maxFiles])

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (disabled) return
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index)
    onFilesChange(newFiles)
  }

  return (
    <div className="batch-upload">
      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''} ${disabled ? 'disabled' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="batch-file-upload"
          multiple
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleChange}
          disabled={disabled}
          style={{ display: 'none' }}
        />
        <label htmlFor="batch-file-upload" className="upload-label">
          <div className="upload-icon">📁</div>
          <div className="upload-text">
            {files.length === 0 
              ? `Drag & drop up to ${maxFiles} images here, or click to browse`
              : `${files.length}/${maxFiles} images selected`}
          </div>
        </label>
      </div>

      {files.length > 0 && (
        <div className="file-list">
          {files.map((file, index) => (
            <div key={index} className="file-item">
              <img 
                src={URL.createObjectURL(file)} 
                alt={file.name}
                className="file-thumbnail"
              />
              <div className="file-info">
                <div className="file-name">{file.name}</div>
                <div className="file-size">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
              <button
                className="remove-file-button"
                onClick={() => removeFile(index)}
                disabled={disabled}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default BatchUpload

