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
  const opacitySlider = document.getElementById('opacity-slider');
  const opacityValue = document.getElementById('opacity-value');
  const editor = document.getElementById('editor');
  
  // Current settings
  let currentSettings = {
    theme: 'morning-light',
    font: 'Inter',
    fontSize: 14,
    opacity: 100
  };
  
  /**
   * Loads settings from storage and applies them
   */
  async function loadSettings() {
    try {
      const settings = await window.api.getSettings();
      if (settings) {
        currentSettings = {
          ...currentSettings,
          ...settings
        };
        applySettings(currentSettings);
      }
      return currentSettings;
    } catch (error) {
      console.error('Error loading settings:', error);
      applySettings(currentSettings); // Apply default settings on error
      return currentSettings;
    }
  }
  
  /**
   * Saves current settings to storage
   */
  async function saveSettings() {
    try {
      // Get values from form
      const newSettings = {
        theme: themeSelect ? themeSelect.value : currentSettings.theme,
        font: fontSelect ? fontSelect.value : currentSettings.font,
        fontSize: fontSizeInput ? parseInt(fontSizeInput.value, 10) : currentSettings.fontSize,
        opacity: opacitySlider ? parseInt(opacitySlider.value, 10) : currentSettings.opacity
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
    if (!settings) return;
    
    // Apply theme
    document.body.setAttribute('data-theme', settings.theme || 'morning-light');
    
    // Apply font family
    document.body.style.fontFamily = settings.font || 'Inter';
    if (editor) {
      editor.style.fontFamily = settings.font || 'Inter';
    }
    
    // Apply font size
    if (editor && settings.fontSize) {
      editor.style.fontSize = `${settings.fontSize}px`;
    }
    
    // Apply opacity
    if (settings.opacity !== undefined) {
      window.api.setWindowOpacity(settings.opacity / 100); // Convert percentage to decimal
    }
  }
  
  /**
   * Populates the settings form with current values
   */
  function populateSettingsForm() {
    // Check if elements exist before setting values
    if (themeSelect) themeSelect.value = currentSettings.theme || 'morning-light';
    if (fontSelect) fontSelect.value = currentSettings.font || 'Inter';
    
    if (fontSizeInput) {
      fontSizeInput.value = currentSettings.fontSize || 14;
      if (fontSizeValue) fontSizeValue.textContent = `${currentSettings.fontSize || 14}px`;
    }
    
    if (opacitySlider && currentSettings.opacity !== undefined) {
      opacitySlider.value = currentSettings.opacity;
      if (opacityValue) opacityValue.textContent = `${currentSettings.opacity}%`;
    } else if (opacitySlider) {
      opacitySlider.value = 100;
      if (opacityValue) opacityValue.textContent = '100%';
    }
  }
  
  /**
   * Gets all keyboard shortcuts
   */
  function getAllShortcuts() {
    // Default shortcuts
    return {
      bold: { key: 'b', modifiers: ['meta'] },
      italic: { key: 'i', modifiers: ['meta'] },
      underline: { key: 'u', modifiers: ['meta'] }
    };
  }
  
  // Initialize event listeners
  function initEventListeners() {
    // Update font size value display when slider changes
    if (fontSizeInput && fontSizeValue) {
      fontSizeInput.addEventListener('input', () => {
        fontSizeValue.textContent = `${fontSizeInput.value}px`;
      });
    }
    
    // Update opacity value display when slider changes
    if (opacitySlider && opacityValue) {
      opacitySlider.addEventListener('input', () => {
        opacityValue.textContent = `${opacitySlider.value}%`;
      });
    }
    
    // Live preview theme changes
    if (themeSelect) {
      themeSelect.addEventListener('change', () => {
        document.body.setAttribute('data-theme', themeSelect.value);
      });
    }
    
    // Live preview font changes
    if (fontSelect) {
      fontSelect.addEventListener('change', () => {
        document.body.style.fontFamily = fontSelect.value;
        if (editor) editor.style.fontFamily = fontSelect.value;
      });
    }
    
    // Live preview font size changes
    if (fontSizeInput && editor) {
      fontSizeInput.addEventListener('input', () => {
        editor.style.fontSize = `${fontSizeInput.value}px`;
      });
    }
  }
  
  // Initialize
  initEventListeners();
  
  return {
    loadSettings,
    saveSettings,
    populateSettingsForm,
    applySettings,
    getAllShortcuts
  };
}