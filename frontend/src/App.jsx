import React, { useState, useEffect } from 'react'
import ImageUpload from './components/ImageUpload'
import PixelationControls from './components/PixelationControls'
import BackgroundRemovalControls from './components/BackgroundRemovalControls'
import ImagePreview from './components/ImagePreview'
import './App.css'

function App() {
  const [uploadedFile, setUploadedFile] = useState(null)
  const [processedImage, setProcessedImage] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
  const [darkMode, setDarkMode] = useState(false)

  // Pixelation settings - slider from 0 (max pixelation) to 100 (no pixelation)
  const [pixelateEnabled, setPixelateEnabled] = useState(true)
  const [pixelationLevel, setPixelationLevel] = useState(50) // Default center (50%)
  const [pixelationMethod, setPixelationMethod] = useState('average')

  // Background removal settings
  const [removeBgEnabled, setRemoveBgEnabled] = useState(false)
  const [bgThreshold, setBgThreshold] = useState(50)

  // Processing order
  const [processOrder, setProcessOrder] = useState('pixelate_first')

  const handleFileUpload = async (file) => {
    setUploadedFile(file)
    setProcessedImage(null)
    setError(null)
    
    // Get image dimensions for pixelation calculation
    const img = new Image()
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height })
    }
    img.src = URL.createObjectURL(file)
  }

  // Calculate target dimensions based on pixelation level
  // 0 = max pixelation (10x10), 100 = no pixelation (original size)
  const calculateTargetDimensions = () => {
    if (!imageDimensions.width || !imageDimensions.height) {
      return { width: 100, height: 100 }
    }
    
    // At 0%: 10x10 (max pixelation)
    // At 100%: original dimensions (no pixelation)
    // At 50%: moderate pixelation
    const minSize = 10
    const maxWidth = imageDimensions.width
    const maxHeight = imageDimensions.height
    
    // Interpolate between min and max based on slider value
    // Reverse the scale: 0 = max pixelation, 100 = no pixelation
    const ratio = pixelationLevel / 100
    const targetWidth = Math.round(minSize + (maxWidth - minSize) * ratio)
    const targetHeight = Math.round(minSize + (maxHeight - minSize) * ratio)
    
    return { width: targetWidth, height: targetHeight }
  }

  const handleProcess = async () => {
    if (!uploadedFile) {
      setError('Please upload an image first')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      // First, upload the file
      const formData = new FormData()
      formData.append('file', uploadedFile)

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const uploadData = await uploadResponse.json()
      
      // Update image dimensions from server response
      if (uploadData.width && uploadData.height) {
        setImageDimensions({ width: uploadData.width, height: uploadData.height })
      }

      // Calculate target dimensions based on pixelation level
      const { width: targetWidth, height: targetHeight } = calculateTargetDimensions()

      // Then process the image
      const processResponse = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: uploadData.filename,
          pixelate_enabled: pixelateEnabled,
          remove_bg_enabled: removeBgEnabled,
          target_width: targetWidth,
          target_height: targetHeight,
          pixelation_method: pixelationMethod,
          bg_threshold: bgThreshold,
          process_order: processOrder,
        }),
      })

      if (!processResponse.ok) {
        const errorData = await processResponse.json()
        throw new Error(errorData.error || 'Processing failed')
      }

      const processData = await processResponse.json()
      setProcessedImage(processData.processed_filename)
    } catch (err) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (processedImage) {
      window.open(`/api/download/${processedImage}`, '_blank')
    }
  }

  // Apply dark mode to body for global styles
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }, [darkMode])

  return (
    <div className={`app ${darkMode ? 'dark-mode' : ''}`}>
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1>PXL8</h1>
            <p>Image Pixelation & Background Removal Tool</p>
          </div>
          <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <div className="app-content">
        <div className="upload-section">
          <ImageUpload onFileUpload={handleFileUpload} />
          {error && <div className="error-message">{error}</div>}
        </div>

        {uploadedFile && (
          <>
            <div className="controls-section">
              <div className="controls-grid">
                <PixelationControls
                  enabled={pixelateEnabled}
                  onToggle={setPixelateEnabled}
                  pixelationLevel={pixelationLevel}
                  onPixelationLevelChange={setPixelationLevel}
                  method={pixelationMethod}
                  onMethodChange={setPixelationMethod}
                  imageDimensions={imageDimensions}
                />

                <BackgroundRemovalControls
                  enabled={removeBgEnabled}
                  onToggle={setRemoveBgEnabled}
                  threshold={bgThreshold}
                  onThresholdChange={setBgThreshold}
                />

                <div className="control-group">
                  <h3>Processing Order</h3>
                  <div className="radio-group">
                    <label>
                      <input
                        type="radio"
                        value="pixelate_first"
                        checked={processOrder === 'pixelate_first'}
                        onChange={(e) => setProcessOrder(e.target.value)}
                      />
                      Pixelate → Remove Background
                    </label>
                    <label>
                      <input
                        type="radio"
                        value="bg_first"
                        checked={processOrder === 'bg_first'}
                        onChange={(e) => setProcessOrder(e.target.value)}
                      />
                      Remove Background → Pixelate
                    </label>
                  </div>
                </div>
              </div>

              <button
                className="process-button"
                onClick={handleProcess}
                disabled={processing || (!pixelateEnabled && !removeBgEnabled)}
              >
                {processing ? 'Processing...' : 'Process Image'}
              </button>
            </div>

            <div className="preview-section">
              <ImagePreview
                originalFile={uploadedFile}
                processedFilename={processedImage}
                onDownload={handleDownload}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default App

