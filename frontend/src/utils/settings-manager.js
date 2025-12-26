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

