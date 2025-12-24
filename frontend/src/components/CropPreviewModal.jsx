import React, { useState, useEffect, useRef } from 'react'
import './CropPreviewModal.css'

function CropPreviewModal({ originalFile, aspectRatio, onCrop, onCancel }) {
  const [originalUrl, setOriginalUrl] = useState(null)
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 })
  const [cropSize, setCropSize] = useState({ width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [currentAspectRatio, setCurrentAspectRatio] = useState(null)
  const imageRef = useRef(null)
  const containerRef = useRef(null)

  // Calculate aspect ratio value
  const getAspectRatio = () => {
    if (aspectRatio === '1:1') return 1
    if (aspectRatio === '3:2') return 3 / 2
    if (aspectRatio === '4:3') return 4 / 3
    return 1
  }

  // Load image and calculate initial crop
  useEffect(() => {
    if (originalFile) {
      const url = URL.createObjectURL(originalFile)
      setOriginalUrl(url)

      const img = new Image()
      img.onload = () => {
        const width = img.width
        const height = img.height
        setImageDimensions({ width, height })

        // Calculate initial crop size (80% of image, maintaining aspect ratio)
        const targetRatio = getAspectRatio()
        const imageRatio = width / height

        let overlayWidth, overlayHeight
        if (imageRatio > targetRatio) {
          // Image wider - constrain by height
          overlayHeight = height * 0.8
          overlayWidth = overlayHeight * targetRatio
        } else {
          // Image taller - constrain by width
          overlayWidth = width * 0.8
          overlayHeight = overlayWidth / targetRatio
        }

        // Center the crop
        const cropX = (width - overlayWidth) / 2
        const cropY = (height - overlayHeight) / 2

        setCropSize({ width: overlayWidth, height: overlayHeight })
        setCropPosition({ x: cropX, y: cropY })
        setCurrentAspectRatio(targetRatio)
      }
      img.src = url

      return () => {
        URL.revokeObjectURL(url)
      }
    }
  }, [originalFile, aspectRatio])

  // Apply crop function
  const handleApplyCrop = () => {
    if (onCrop && originalFile) {
      // cropPosition and cropSize are already in image pixel coordinates
      onCrop(
        cropPosition.x,
        cropPosition.y,
        cropSize.width,
        cropSize.height
      )
    }
  }

  // Handle 90-degree rotation
  const handleRotate = () => {
    if (!currentAspectRatio || currentAspectRatio === 1) {
      // 1:1 stays the same
      return
    }
    
    // Calculate new aspect ratio (inverse)
    const newAspectRatio = 1 / currentAspectRatio
    setCurrentAspectRatio(newAspectRatio)
    
    // Recalculate crop size maintaining area or fitting to image
    const currentArea = cropSize.width * cropSize.height
    const imageRatio = imageDimensions.width / imageDimensions.height
    
    let newWidth, newHeight
    
    if (imageRatio > newAspectRatio) {
      // Image wider - constrain by height
      newHeight = Math.min(imageDimensions.height * 0.8, Math.sqrt(currentArea / newAspectRatio))
      newWidth = newHeight * newAspectRatio
    } else {
      // Image taller - constrain by width
      newWidth = Math.min(imageDimensions.width * 0.8, Math.sqrt(currentArea * newAspectRatio))
      newHeight = newWidth / newAspectRatio
    }
    
    // Ensure minimum size
    if (newWidth < 50) {
      newWidth = 50
      newHeight = newWidth / newAspectRatio
    }
    if (newHeight < 50) {
      newHeight = 50
      newWidth = newHeight * newAspectRatio
    }
    
    // Constrain to image bounds
    newWidth = Math.min(newWidth, imageDimensions.width)
    newHeight = Math.min(newHeight, imageDimensions.height)
    
    // Center the crop
    const newX = Math.max(0, (imageDimensions.width - newWidth) / 2)
    const newY = Math.max(0, (imageDimensions.height - newHeight) / 2)
    
    setCropSize({ width: newWidth, height: newHeight })
    setCropPosition({ x: newX, y: newY })
  }

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleApplyCrop()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [cropPosition, cropSize, originalFile, onCrop, onCancel])

  // Handle drag start
  const handleMouseDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    const imgRect = imageRef.current?.getBoundingClientRect()
    if (imgRect) {
      const scale = getScale()
      // Calculate mouse position relative to image
      const mouseX = (e.clientX - imgRect.left) / scale
      const mouseY = (e.clientY - imgRect.top) / scale
      
      setDragStart({
        x: mouseX,
        y: mouseY
      })
      setDragOffset({
        x: mouseX - cropPosition.x,
        y: mouseY - cropPosition.y
      })
    }
  }

  // Handle resize start
  const handleResizeStart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    const imgRect = imageRef.current?.getBoundingClientRect()
    if (imgRect) {
      const scale = getScale()
      const mouseX = (e.clientX - imgRect.left) / scale
      const mouseY = (e.clientY - imgRect.top) / scale
      
      setResizeStart({
        x: mouseX,
        y: mouseY,
        width: cropSize.width,
        height: cropSize.height,
        cropX: cropPosition.x,
        cropY: cropPosition.y
      })
    }
  }

  // Handle drag
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e) => {
      if (!imageRef.current || !imageDimensions.width) return

      // Prevent event from bubbling to overlay
      e.stopPropagation()

      const imgRect = imageRef.current.getBoundingClientRect()
      const displayWidth = imageRef.current.offsetWidth
      const scale = displayWidth / imageDimensions.width
      
      // Calculate mouse position in image coordinates
      const mouseX = (e.clientX - imgRect.left) / scale
      const mouseY = (e.clientY - imgRect.top) / scale
      
      // Calculate new crop position
      const newX = mouseX - dragOffset.x
      const newY = mouseY - dragOffset.y

      // Constrain to image bounds
      const constrainedX = Math.max(0, Math.min(newX, imageDimensions.width - cropSize.width))
      const constrainedY = Math.max(0, Math.min(newY, imageDimensions.height - cropSize.height))

      setCropPosition({ x: constrainedX, y: constrainedY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset, imageDimensions, cropSize])

  // Handle resize
  useEffect(() => {
    if (!isResizing || !currentAspectRatio) return

    const handleMouseMove = (e) => {
      if (!imageRef.current || !imageDimensions.width) return

      // Prevent event from bubbling to overlay
      e.stopPropagation()

      const imgRect = imageRef.current.getBoundingClientRect()
      const displayWidth = imageRef.current.offsetWidth
      const scale = displayWidth / imageDimensions.width
      
      // Calculate mouse position in image coordinates
      const mouseX = (e.clientX - imgRect.left) / scale
      const mouseY = (e.clientY - imgRect.top) / scale
      
      // Calculate distance from anchor (top-left) to mouse
      const deltaX = mouseX - resizeStart.cropX
      const deltaY = mouseY - resizeStart.cropY
      
      // Calculate new size maintaining aspect ratio
      // Use the larger delta to determine size
      const newWidth = Math.max(50, Math.min(
        resizeStart.width + deltaX,
        imageDimensions.width - resizeStart.cropX
      ))
      const newHeight = newWidth / currentAspectRatio
      
      // Check if height fits
      let finalWidth = newWidth
      let finalHeight = newHeight
      
      if (resizeStart.cropY + newHeight > imageDimensions.height) {
        // Constrain by height instead
        finalHeight = imageDimensions.height - resizeStart.cropY
        finalWidth = finalHeight * currentAspectRatio
      }
      
      // Ensure we don't go below minimum size
      if (finalWidth < 50) {
        finalWidth = 50
        finalHeight = finalWidth / currentAspectRatio
      }
      if (finalHeight < 50) {
        finalHeight = 50
        finalWidth = finalHeight * currentAspectRatio
      }
      
      // Constrain to image bounds
      finalWidth = Math.min(finalWidth, imageDimensions.width - resizeStart.cropX)
      finalHeight = Math.min(finalHeight, imageDimensions.height - resizeStart.cropY)
      
      setCropSize({ width: finalWidth, height: finalHeight })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, resizeStart, imageDimensions, currentAspectRatio])

  // Calculate scale factor for display
  const getScale = () => {
    if (!imageRef.current || !imageDimensions.width) return 1
    const displayWidth = imageRef.current.offsetWidth
    return displayWidth / imageDimensions.width
  }


  if (!originalUrl) return null

  const scale = getScale()
  const displayX = cropPosition.x * scale
  const displayY = cropPosition.y * scale
  const displayWidth = cropSize.width * scale
  const displayHeight = cropSize.height * scale

  return (
    <div className="crop-modal-overlay">
      <div className="crop-modal" onClick={(e) => e.stopPropagation()}>
        <div className="crop-preview-container" ref={containerRef}>
          <img
            ref={imageRef}
            src={originalUrl}
            alt="Crop preview"
            className="crop-preview-image"
          />
          <div className="crop-mask">
            <div
              className="crop-overlay"
              style={{
                left: `${displayX}px`,
                top: `${displayY}px`,
                width: `${displayWidth}px`,
                height: `${displayHeight}px`,
              }}
              onMouseDown={handleMouseDown}
            >
              <div className="crop-handle crop-handle-center" />
              <div 
                className="crop-handle crop-handle-resize" 
                onMouseDown={handleResizeStart}
                title="Resize crop area"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 2L10 10M10 10L7 10M10 10L10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div className="crop-instructions">
          Drag into position, resize with corner handle, and press Enter
        </div>
        <div className="crop-actions">
          <button className="crop-rotate-button" onClick={handleRotate} title="Rotate 90 degrees">
            ↻ Rotate 90°
          </button>
          <button className="crop-cancel-button" onClick={onCancel}>
            Cancel
          </button>
          <button className="crop-apply-button" onClick={handleApplyCrop}>
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  )
}

export default CropPreviewModal

