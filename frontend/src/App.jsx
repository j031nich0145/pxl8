import React, { useState, useEffect, useRef, useCallback } from 'react'
import ImageUpload from './components/ImageUpload'
import PixelationControls from './components/PixelationControls'
import ImagePreview from './components/ImagePreview'
import { pixelateImage } from './utils/pixelation-client'
import './App.css'

function App() {
  const [uploadedFile, setUploadedFile] = useState(null)
  const [processedImage, setProcessedImage] = useState(null)
  const [processedImageUrl, setProcessedImageUrl] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [error, setError] = useState(null)
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
  const [darkMode, setDarkMode] = useState(false)

  // Pixelation settings - slider from 0 (max pixelation) to 100 (no pixelation)
  const [liveUpdate, setLiveUpdate] = useState(true)
  const [pixelationLevel, setPixelationLevel] = useState(50) // Default center (50%)
  const [pixelationMethod, setPixelationMethod] = useState('average')

  const handleLiveUpdateChange = (value) => {
    setLiveUpdate(value)
  }

  const handleFileUpload = async (file) => {
    setUploadedFile(file)
    setProcessedImage(null)
    setProcessedImageUrl(null)
    setError(null)
    
    // Get image dimensions for pixelation calculation
    const img = new Image()
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height })
    }
    img.src = URL.createObjectURL(file)
  }

  // Calculate target dimensions based on pixelation level
  // 0 = max pixelation (1x1), 100 = no pixelation (original size)
  const calculateTargetDimensions = () => {
    if (!imageDimensions.width || !imageDimensions.height) {
      return { width: 100, height: 100 }
    }
    
    // At 0%: 1x1 (maximum pixelation - largest possible pixels)
    // At 100%: original dimensions (no pixelation)
    // At 50%: moderate pixelation
    const minSize = 1
    const maxWidth = imageDimensions.width
    const maxHeight = imageDimensions.height
    
    // Interpolate between min and max based on slider value
    // Reverse the scale: 0 = max pixelation, 100 = no pixelation
    const ratio = pixelationLevel / 100
    const targetWidth = Math.round(minSize + (maxWidth - minSize) * ratio)
    const targetHeight = Math.round(minSize + (maxHeight - minSize) * ratio)
    
    return { width: targetWidth, height: targetHeight }
  }

  const handleProcess = useCallback(async () => {
    if (!uploadedFile) {
      setError('Please upload an image first')
      return
    }

    setProcessing(true)
    setProcessingProgress(0)
    setError(null)

    try {
      // Calculate target dimensions based on pixelation level
      const { width: targetWidth, height: targetHeight } = calculateTargetDimensions()

      // Process image client-side using Canvas API
      const blob = await pixelateImage(
        uploadedFile,
        targetWidth,
        targetHeight,
        pixelationMethod,
        (progress) => {
          setProcessingProgress(progress)
        }
      )

      // Create object URL from blob
      const url = URL.createObjectURL(blob)
      
      // Clean up previous URL if exists
      if (processedImageUrl) {
        URL.revokeObjectURL(processedImageUrl)
      }
      
      setProcessedImageUrl(url)
      setProcessedImage('processed') // Just a flag, we use the URL
    } catch (err) {
      setError(err.message || 'Processing failed')
    } finally {
      setProcessing(false)
      setProcessingProgress(0)
    }
  }, [uploadedFile, pixelationLevel, pixelationMethod, imageDimensions, processedImageUrl])

  // Debounced auto-process for live update
  const debounceTimerRef = useRef(null)
  
  useEffect(() => {
    if (liveUpdate && uploadedFile && !processing) {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      
      // Set new timer
      debounceTimerRef.current = setTimeout(() => {
        handleProcess()
      }, 300) // 300ms debounce
      
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }
      }
    }
  }, [liveUpdate, pixelationLevel, pixelationMethod, uploadedFile, handleProcess, processing])

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (processedImageUrl) {
        URL.revokeObjectURL(processedImageUrl)
      }
    }
  }, [processedImageUrl])

  const handleDownload = () => {
    if (processedImageUrl) {
      const link = document.createElement('a')
      link.href = processedImageUrl
      link.download = `pixelated-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
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
          <h1>PXL8</h1>
          <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <div className="app-content">
        {!uploadedFile ? (
          <div className="upload-section">
            <ImageUpload onFileUpload={handleFileUpload} />
            {error && <div className="error-message">{error}</div>}
          </div>
        ) : (
          <>
            <div className="image-display-section">
              <ImagePreview
                originalFile={uploadedFile}
                processedImageUrl={processedImageUrl}
              />
              {error && <div className="error-message">{error}</div>}
            </div>

            <div className="controls-section">
              <PixelationControls
                liveUpdate={liveUpdate}
                onLiveUpdateChange={handleLiveUpdateChange}
                pixelationLevel={pixelationLevel}
                onPixelationLevelChange={setPixelationLevel}
                method={pixelationMethod}
                onMethodChange={setPixelationMethod}
                imageDimensions={imageDimensions}
                onDownload={handleDownload}
                onProcess={handleProcess}
                processedImageUrl={processedImageUrl}
              />
            </div>
          </>
        )}
      </div>

      <footer className="app-footer">
        <a href="#" className="footer-link">Background Removal Tool</a>
        <span className="footer-separator">•</span>
        <a href="#" className="footer-link">Commercial Use License</a>
        <span className="footer-separator">•</span>
        <a href="https://github.com/j031nich0145/j031nich0145/" target="_blank" rel="noopener noreferrer" className="footer-link">Buy Us Coffee</a>
      </footer>
    </div>
  )
}

export default App

