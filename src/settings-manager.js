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
    theme: 'light',
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
        fontSize: parseInt(fontSizeInput.value, 10),
        opacity: parseInt(opacitySlider.value, 10)
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
    
    // Apply opacity
    if (settings.opacity !== undefined) {
      window.api.setWindowOpacity(settings.opacity / 100); // Convert percentage to decimal
    }
  }
  
  /**
   * Populates the settings form with current values
   */
  function populateSettingsForm() {
    themeSelect.value = currentSettings.theme || 'light';
    fontSelect.value = currentSettings.font || 'Inter';
    fontSizeInput.value = currentSettings.fontSize || 14;
    fontSizeValue.textContent = `${currentSettings.fontSize || 14}px`;
    
    if (opacitySlider && currentSettings.opacity !== undefined) {
      opacitySlider.value = currentSettings.opacity;
      opacityValue.textContent = `${currentSettings.opacity}%`;
    } else if (opacitySlider) {
      opacitySlider.value = 100;
      opacityValue.textContent = '100%';
    }
  }
  
  // Initialize event listeners
  function initEventListeners() {
    // Update font size value display when slider changes
    fontSizeInput.addEventListener('input', () => {
      fontSizeValue.textContent = `${fontSizeInput.value}px`;
    });
    
    // Update opacity value display when slider changes
    if (opacitySlider) {
      opacitySlider.addEventListener('input', () => {
        opacityValue.textContent = `${opacitySlider.value}%`;
      });
    }
    
    // Live preview theme changes
    themeSelect.addEventListener('change', () => {
      document.body.setAttribute('data-theme', themeSelect.value);
    });
    
    // Live preview font changes
    fontSelect.addEventListener('change', () => {
      document.body.style.fontFamily = fontSelect.value;
      editor.style.fontFamily = fontSelect.value;
    });
    
    // Live preview font size changes
    fontSizeInput.addEventListener('input', () => {
      editor.style.fontSize = `${fontSizeInput.value}px`;
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