# Batch PXL8 Implementation Plan

## Overview

This document outlines the comprehensive plan for implementing batch processing functionality in the pxl8 app. The implementation will add routing support and create a new batch processing page (`PxlBatch.jsx`) that allows users to pixelate up to 10 images at once using predefined settings from the main pxl8 app (`Pxl8.jsx`).

## Architecture Decision

**Routing Approach**: Option 1 - New Route/Page
- Clean separation of concerns
- Better maintainability and scalability
- Proper URL routing with React Router
- Bookmarkable URLs

## File Naming Convention

- `Pxl8.jsx` - Refactored from current `App.jsx` (single image mode)
- `PxlBatch.jsx` - New batch processing component
- `App.jsx` - Router wrapper (new structure)

## Current State Analysis

### Existing Structure
- **App.jsx**: Contains all single-image pixelation logic (~464 lines)
- **No routing**: Single page application
- **Client-side processing**: Uses Canvas API via `pixelation-client.js`
- **Settings**: Stored in component state (pixelationLevel, pixelationMethod)
- **Footer**: Has placeholder link for "batch pxl8"

### Key State Variables in App.jsx
- `uploadedFile` - Current image file
- `pixelationLevel` - Pixelation level (1-10, default 5.5)
- `pixelationMethod` - Method ('average', 'spatial', 'nearest')
- `liveUpdate` - Auto-update toggle
- `darkMode` - Theme preference
- `processedImageUrl` - Result image URL

### Key Functions in App.jsx
- `handleFileUpload` - Handle single file upload
- `handleProcess` - Process single image
- `handleCrop` - Crop image
- `handleCrunch` - Normalize to 72dpi
- `handle2xCrunch` - 2x pixelation
- `handleDownload` - Download processed image
- `handleUndo` - Undo last operation

## Implementation Strategy

### Phase 1: Setup Routing Infrastructure

#### 1.1 Install Dependencies
```bash
npm install react-router-dom
```

#### 1.2 Create Directory Structure
```
frontend/src/
├── pages/
│   ├── Pxl8.jsx          # Refactored from App.jsx
│   └── PxlBatch.jsx      # New batch component
├── components/
│   ├── Layout.jsx        # Shared layout wrapper
│   └── BatchPxl8/        # Batch-specific components
│       ├── BatchUpload.jsx
│       ├── BatchSettings.jsx
│       ├── BatchProgress.jsx
│       └── BatchResults.jsx
├── utils/
│   ├── settings-manager.js  # Settings sync utility
│   └── ... (existing utils)
└── App.jsx               # Router wrapper
```

### Phase 2: Refactor Current App.jsx

#### 2.1 Create Pxl8.jsx
**File**: `frontend/src/pages/Pxl8.jsx`

**Changes Required:**
1. Copy entire content from `App.jsx` to `Pxl8.jsx`
2. Rename component from `App` to `Pxl8`
3. Add settings saving logic using `settings-manager.js`
4. Update imports (if any paths change)
5. Keep all existing functionality intact

**Settings Saving Logic:**
```javascript
import { saveSettings } from '../utils/settings-manager'

// Add useEffect to save settings when they change
useEffect(() => {
  saveSettings({
    pixelationLevel,
    pixelationMethod,
    liveUpdate,
    timestamp: Date.now()
  })
}, [pixelationLevel, pixelationMethod, liveUpdate])
```

#### 2.2 Create New App.jsx (Router)
**File**: `frontend/src/App.jsx`

**Content:**
```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Pxl8 from './pages/Pxl8'
import PxlBatch from './pages/PxlBatch'
import Layout from './components/Layout'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Pxl8 />} />
          <Route path="/batch" element={<PxlBatch />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
```

### Phase 3: Create Layout Component

#### 3.1 Create Layout.jsx
**File**: `frontend/src/components/Layout.jsx`

**Purpose**: Shared wrapper for both pages (footer, navigation)

**Structure:**
```javascript
import { Link, useLocation } from 'react-router-dom'
import './Layout.css'

function Layout({ children }) {
  const location = useLocation()
  
  return (
    <div className="app-wrapper">
      {/* Optional Navigation */}
      <nav className="main-nav">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          Single
        </Link>
        <Link to="/batch" className={location.pathname === '/batch' ? 'active' : ''}>
          Batch
        </Link>
      </nav>
      
      {/* Page Content */}
      <div className="page-content">
        {children}
      </div>
      
      {/* Shared Footer */}
      <footer className="app-footer">
        <Link to="/" className="footer-link">Single Mode</Link>
        <span className="footer-separator">•</span>
        <Link to="/batch" className="footer-link">Batch Mode</Link>
        <span className="footer-separator">•</span>
        <a href="https://github.com/j031nich0145/j031nich0145/blob/main/LICENSING.md" 
           target="_blank" 
           rel="noopener noreferrer" 
           className="footer-link">
          Commercial Use License
        </a>
        <span className="footer-separator">•</span>
        <a href="https://github.com/j031nich0145/j031nich0145/" 
           target="_blank" 
           rel="noopener noreferrer" 
           className="footer-link">
          Buy Us Coffee
        </a>
      </footer>
    </div>
  )
}

export default Layout
```

**Note**: Move footer from `Pxl8.jsx` to `Layout.jsx` so it's shared

### Phase 4: Create Settings Manager Utility

#### 4.1 Create settings-manager.js
**File**: `frontend/src/utils/settings-manager.js`

**Purpose**: Sync settings between Pxl8 and PxlBatch

**Content:**
```javascript
/**
 * Settings Manager - Sync settings between Single and Batch modes
 */

const SETTINGS_KEY = 'pxl8_settings'

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      pixelationLevel: settings.pixelationLevel,
      pixelationMethod: settings.pixelationMethod,
      liveUpdate: settings.liveUpdate,
      timestamp: Date.now()
    }))
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}

export function loadSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
  return null
}

export function getDefaultSettings() {
  return {
    pixelationLevel: 5.5,
    pixelationMethod: 'average',
    liveUpdate: true
  }
}

export function getSettings() {
  const saved = loadSettings()
  return saved || getDefaultSettings()
}
```

### Phase 5: Create Batch Processing Components

#### 5.1 Create PxlBatch.jsx
**File**: `frontend/src/pages/PxlBatch.jsx`

**Purpose**: Main batch processing page

**State Management:**
```javascript
const [files, setFiles] = useState([]) // Array of File objects (max 10)
const [settings, setSettings] = useState(null) // Loaded from localStorage
const [processing, setProcessing] = useState(false)
const [results, setResults] = useState([]) // Array of {file, processedBlob, progress, error}
const [darkMode, setDarkMode] = useState(() => {
  const saved = localStorage.getItem('pxl8_dark_mode')
  return saved === 'true'
})
```

**Processing Flow:**
1. Load settings from localStorage on mount
2. User uploads up to 10 images
3. Display settings (read-only, link to main app to change)
4. Process images sequentially
5. Show progress for each image
6. Display results grid
7. Download options (individual or ZIP)

**Structure:**
```javascript
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import BatchUpload from '../components/BatchPxl8/BatchUpload'
import BatchSettings from '../components/BatchPxl8/BatchSettings'
import BatchProgress from '../components/BatchPxl8/BatchProgress'
import BatchResults from '../components/BatchPxl8/BatchResults'
import { getSettings } from '../utils/settings-manager'
import { pixelateImage } from '../utils/pixelation-client'
import './PxlBatch.css'

function PxlBatch() {
  const [files, setFiles] = useState([])
  const [settings, setSettings] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState([])
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('pxl8_dark_mode')
    return saved === 'true'
  })

  // Load settings on mount
  useEffect(() => {
    const loadedSettings = getSettings()
    setSettings(loadedSettings)
  }, [])

  // Process all images
  const handleProcessAll = async () => {
    if (files.length === 0) return
    
    setProcessing(true)
    setResults([])
    
    // Initialize results array
    const initialResults = files.map(file => ({
      file,
      progress: 0,
      status: 'pending',
      processedBlob: null,
      error: null
    }))
    setResults(initialResults)
    
    // Process sequentially
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      try {
        // Calculate target dimensions
        const img = new Image()
        const imgUrl = URL.createObjectURL(file)
        
        await new Promise((resolve) => {
          img.onload = () => {
            const pixelSize = calculatePixelSize(settings.pixelationLevel)
            const targetWidth = Math.max(1, Math.floor(img.width / pixelSize))
            const targetHeight = Math.max(1, Math.floor(img.height / pixelSize))
            
            // Process image
            pixelateImage(
              file,
              targetWidth,
              targetHeight,
              settings.pixelationMethod,
              1.0,
              (progress) => {
                setResults(prev => {
                  const updated = [...prev]
                  updated[i] = { ...updated[i], progress }
                  return updated
                })
              }
            ).then(blob => {
              setResults(prev => {
                const updated = [...prev]
                updated[i] = {
                  ...updated[i],
                  processedBlob: blob,
                  status: 'completed',
                  progress: 100
                }
                return updated
              })
              URL.revokeObjectURL(imgUrl)
              resolve()
            }).catch(error => {
              setResults(prev => {
                const updated = [...prev]
                updated[i] = {
                  ...updated[i],
                  status: 'error',
                  error: error.message
                }
                return updated
              })
              URL.revokeObjectURL(imgUrl)
              resolve()
            })
          }
          img.src = imgUrl
        })
      } catch (error) {
        setResults(prev => {
          const updated = [...prev]
          updated[i] = {
            ...updated[i],
            status: 'error',
            error: error.message
          }
          return updated
        })
      }
    }
    
    setProcessing(false)
  }

  // Calculate pixel size from pixelation level (same as Pxl8.jsx)
  const calculatePixelSize = (level) => {
    const clampedLevel = Math.max(1.0, Math.min(10.1, level))
    const normalizedLevel = (clampedLevel - 1) / 9
    const pixelSize = Math.round(1 + Math.pow(normalizedLevel, 2) * 99)
    return Math.max(1, Math.min(100, pixelSize))
  }

  return (
    <div className={`pxl-batch ${darkMode ? 'dark-mode' : ''}`}>
      <div className="batch-content">
        <h1>Batch PXL8</h1>
        
        <BatchSettings settings={settings} />
        
        <BatchUpload 
          files={files} 
          onFilesChange={setFiles} 
          maxFiles={10}
          disabled={processing}
        />
        
        {files.length > 0 && !processing && (
          <button 
            className="process-all-button"
            onClick={handleProcessAll}
          >
            Process All ({files.length} images)
          </button>
        )}
        
        {processing && (
          <BatchProgress results={results} />
        )}
        
        {results.length > 0 && !processing && (
          <BatchResults results={results} />
        )}
      </div>
    </div>
  )
}

export default PxlBatch
```

#### 5.2 Create BatchUpload.jsx
**File**: `frontend/src/components/BatchPxl8/BatchUpload.jsx`

**Purpose**: Multi-file upload component (up to 10 images)

**Features:**
- Drag & drop support
- File picker with multiple selection
- Display uploaded files with thumbnails
- Remove individual files
- Max 10 files validation
- File type validation (jpg, png)

**Structure:**
```javascript
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
```

#### 5.3 Create BatchSettings.jsx
**File**: `frontend/src/components/BatchPxl8/BatchSettings.jsx`

**Purpose**: Display settings (read-only) with link to main app

**Structure:**
```javascript
import { Link } from 'react-router-dom'
import './BatchSettings.css'

function BatchSettings({ settings }) {
  if (!settings) {
    return (
      <div className="batch-settings">
        <p>No settings found. <Link to="/">Configure settings in Single Mode</Link></p>
      </div>
    )
  }

  const methodNames = {
    average: 'Pixel Averaging',
    spatial: 'Spatial Approximation',
    nearest: 'Nearest Neighbors'
  }

  const pixelSize = calculatePixelSize(settings.pixelationLevel)

  return (
    <div className="batch-settings">
      <h2>Processing Settings</h2>
      <div className="settings-display">
        <div className="setting-item">
          <span className="setting-label">Pixelation Level:</span>
          <span className="setting-value">{settings.pixelationLevel.toFixed(1)}</span>
        </div>
        <div className="setting-item">
          <span className="setting-label">Pixel Size:</span>
          <span className="setting-value">{pixelSize}×{pixelSize} px</span>
        </div>
        <div className="setting-item">
          <span className="setting-label">Method:</span>
          <span className="setting-value">{methodNames[settings.pixelationMethod]}</span>
        </div>
      </div>
      <div className="settings-note">
        <Link to="/">Change settings in Single Mode</Link>
      </div>
    </div>
  )
}

function calculatePixelSize(level) {
  const clampedLevel = Math.max(1.0, Math.min(10.1, level))
  const normalizedLevel = (clampedLevel - 1) / 9
  const pixelSize = Math.round(1 + Math.pow(normalizedLevel, 2) * 99)
  return Math.max(1, Math.min(100, pixelSize))
}

export default BatchSettings
```

#### 5.4 Create BatchProgress.jsx
**File**: `frontend/src/components/BatchPxl8/BatchProgress.jsx`

**Purpose**: Show progress for each image being processed

**Structure:**
```javascript
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
                className="progress-bar"
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
```

#### 5.5 Create BatchResults.jsx
**File**: `frontend/src/components/BatchPxl8/BatchResults.jsx`

**Purpose**: Display processed images grid with download options

**Features:**
- Grid layout of processed images
- Individual download buttons
- Download all as ZIP (optional, requires JSZip)
- Show original filename
- Show processing status

**Structure:**
```javascript
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
    // Optional: Implement ZIP download using JSZip
    // For now, download individually
    results.forEach(result => {
      if (result.processedBlob) {
        downloadImage(result.processedBlob, result.file.name)
      }
    })
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
            Download All ({completedResults.length} images)
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
```

### Phase 6: Styling

#### 6.1 Create Layout.css
**File**: `frontend/src/components/Layout.css`

**Purpose**: Styles for shared layout (navigation, footer)

#### 6.2 Create PxlBatch.css
**File**: `frontend/src/pages/PxlBatch.css`

**Purpose**: Main batch page styles

#### 6.3 Create Component CSS Files
- `BatchUpload.css`
- `BatchSettings.css`
- `BatchProgress.css`
- `BatchResults.css`

**Note**: Reuse existing `App.css` styles where applicable, especially dark mode support

### Phase 7: Update Existing Files

#### 7.1 Remove Footer from Pxl8.jsx
- Remove footer JSX from `Pxl8.jsx` return statement
- Footer is now in `Layout.jsx`

#### 7.2 Update main.jsx
**No changes needed** - `main.jsx` already imports `App.jsx`

## Files Summary

### Files to Create:
1. `frontend/src/pages/Pxl8.jsx` (refactored from App.jsx)
2. `frontend/src/pages/PxlBatch.jsx` (new)
3. `frontend/src/components/Layout.jsx` (new)
4. `frontend/src/components/BatchPxl8/BatchUpload.jsx` (new)
5. `frontend/src/components/BatchPxl8/BatchSettings.jsx` (new)
6. `frontend/src/components/BatchPxl8/BatchProgress.jsx` (new)
7. `frontend/src/components/BatchPxl8/BatchResults.jsx` (new)
8. `frontend/src/utils/settings-manager.js` (new)
9. `frontend/src/components/Layout.css` (new)
10. `frontend/src/pages/PxlBatch.css` (new)
11. `frontend/src/components/BatchPxl8/BatchUpload.css` (new)
12. `frontend/src/components/BatchPxl8/BatchSettings.css` (new)
13. `frontend/src/components/BatchPxl8/BatchProgress.css` (new)
14. `frontend/src/components/BatchPxl8/BatchResults.css` (new)

### Files to Modify:
1. `frontend/src/App.jsx` → Router wrapper (complete rewrite)
2. `frontend/package.json` → Add `react-router-dom` dependency
3. `frontend/src/pages/Pxl8.jsx` → Add settings saving logic, remove footer

### Files to Keep As-Is:
- `frontend/src/main.jsx` (no changes)
- All existing components (ImageUpload, PixelationControls, etc.)
- All existing utilities (pixelation-client.js, etc.)

## Implementation Order

1. **Install React Router**: `npm install react-router-dom`
2. **Create settings-manager.js**: Utility for settings sync
3. **Create Layout.jsx**: Shared layout wrapper
4. **Refactor App.jsx → Pxl8.jsx**: Move content, add settings saving
5. **Create new App.jsx**: Router setup
6. **Create PxlBatch.jsx**: Main batch component skeleton
7. **Create BatchUpload.jsx**: Multi-file upload
8. **Create BatchSettings.jsx**: Settings display
9. **Create BatchProgress.jsx**: Progress tracking
10. **Create BatchResults.jsx**: Results display
11. **Add styling**: Create all CSS files
12. **Test routing**: Verify navigation works
13. **Test batch processing**: Verify image processing works
14. **Test settings sync**: Verify settings are shared correctly

## Testing Checklist

### Routing Tests
- [ ] Navigate to `/` shows Pxl8 component
- [ ] Navigate to `/batch` shows PxlBatch component
- [ ] Footer links navigate correctly
- [ ] Browser back/forward buttons work
- [ ] Direct URL access works (bookmarking)

### Settings Sync Tests
- [ ] Settings saved when changed in Pxl8
- [ ] Settings loaded correctly in PxlBatch
- [ ] Default settings used if none saved
- [ ] Settings persist across page refreshes

### Batch Processing Tests
- [ ] Upload up to 10 images works
- [ ] File validation works (JPG/PNG only)
- [ ] Max file limit enforced
- [ ] Remove individual files works
- [ ] Processing runs sequentially
- [ ] Progress updates correctly
- [ ] Results display correctly
- [ ] Individual downloads work
- [ ] Error handling works

### UI/UX Tests
- [ ] Dark mode works in batch mode
- [ ] Responsive layout (mobile compatibility)
- [ ] Loading states display correctly
- [ ] Error messages display correctly
- [ ] Navigation is intuitive

## Future Enhancements

1. **ZIP Download**: Add JSZip library for downloading all images as ZIP
2. **Parallel Processing**: Process 2-3 images in parallel (with concurrency limit)
3. **Settings Editing**: Allow editing settings in batch mode
4. **Batch Presets**: Save/load batch processing presets
5. **Progress Persistence**: Save progress and resume if page refreshed
6. **Image Preview**: Show before/after comparison in results
7. **Export Options**: Choose output format/quality

## Notes

- **Sequential Processing**: Chosen for simplicity and predictable memory usage
- **Settings Read-Only**: Users must change settings in Single Mode (keeps UX simple)
- **No Backend Required**: All processing remains client-side
- **Memory Management**: Process and release images one at a time
- **Dark Mode**: Inherits from localStorage, shared across both modes

