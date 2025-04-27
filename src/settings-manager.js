/**
 * Settings Manager
 * Handles loading, saving, and applying application settings
 */
export function initSettingsManager() {
  // DOM elements
  const themeSelect = document.getElementById('theme-select');
  const fontSelect = document.getElementById('font-select');
  const fontSizeInput = document.getElementById('font-size');
  const fontSizeValue = document.getElementById('font-size-value');
  const editor = document.getElementById('editor');
  
  // Current settings
  let currentSettings = {
    theme: 'light',
    font: 'Inter',
    fontSize: 14
  };
  
  /**
   * Loads settings from storage and applies them
   */
  async function loadSettings() {
    try {
      const settings = await window.api.getSettings();
      if (settings) {
        currentSettings = settings;
        applySettings(settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }
  
  /**
   * Saves current settings to storage
   */
  async function saveSettings() {
    try {
      // Get values from form
      const newSettings = {
        theme: themeSelect.value,
        font: fontSelect.value,
        fontSize: parseInt(fontSizeInput.value, 10)
      };
      
      // Save settings
      await window.api.saveSettings(newSettings);
      
      // Update current settings and apply them
      currentSettings = newSettings;
      applySettings(newSettings);
      
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }
  
  /**
   * Applies the given settings to the UI
   */
  function applySettings(settings) {
    // Apply theme
    document.body.setAttribute('data-theme', settings.theme);
    
    // Apply font family
    document.body.style.fontFamily = settings.font;
    editor.style.fontFamily = settings.font;
    
    // Apply font size
    editor.style.fontSize = `${settings.fontSize}px`;
  }
  
  /**
   * Populates the settings form with current values
   */
  function populateSettingsForm() {
    themeSelect.value = currentSettings.theme;
    fontSelect.value = currentSettings.font;
    fontSizeInput.value = currentSettings.fontSize;
    fontSizeValue.textContent = `${currentSettings.fontSize}px`;
  }
  
  // Initialize event listeners
  function initEventListeners() {
    // Update font size value display when slider changes
    fontSizeInput.addEventListener('input', () => {
      fontSizeValue.textContent = `${fontSizeInput.value}px`;
    });
  }
  
  // Initialize
  initEventListeners();
  
  return {
    loadSettings,
    saveSettings,
    populateSettingsForm
  };
}