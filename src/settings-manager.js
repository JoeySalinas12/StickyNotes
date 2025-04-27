/**
 * Enhanced Settings Manager
 * Handles loading, saving, and applying application settings with additional customization options
 */
export function initSettingsManager() {
  // DOM elements
  const themeSelect = document.getElementById('theme-select');
  const fontSelect = document.getElementById('font-select');
  const fontSizeInput = document.getElementById('font-size');
  const fontSizeValue = document.getElementById('font-size-value');
  const opacitySlider = document.getElementById('opacity-slider');
  const opacityValue = document.getElementById('opacity-value');
  const ultraMinimalToggle = document.getElementById('ultra-minimal-toggle');
  const offlineModeToggle = document.getElementById('offline-mode-toggle');
  const calmRemindersToggle = document.getElementById('calm-reminders-toggle');
  const viewShortcutsBtn = document.getElementById('view-shortcuts-btn');
  const enableSyncBtn = document.getElementById('enable-sync-btn');
  const editor = document.getElementById('editor');
  
  // Current settings
  let currentSettings = {
    theme: 'morning-light',
    font: 'Inter',
    fontSize: 14,
    opacity: 100,
    ultraMinimal: false,
    offlineMode: false,
    calmReminders: true,
    syncEnabled: false,
    customShortcuts: {}
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
        opacity: parseInt(opacitySlider.value, 10),
        ultraMinimal: ultraMinimalToggle.checked,
        offlineMode: offlineModeToggle.checked,
        calmReminders: calmRemindersToggle.checked,
        syncEnabled: currentSettings.syncEnabled,
        customShortcuts: currentSettings.customShortcuts
      };
      
      // Save settings
      await window.api.saveSettings(newSettings);
      
      // Update current settings and apply them
      currentSettings = newSettings;
      applySettings(newSettings);
      
      // Notify other modules about settings changes
      window.dispatchEvent(new CustomEvent('settings-changed', { 
        detail: { settings: newSettings } 
      }));
      
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
    
    // Apply ultra-minimal mode
    if (settings.ultraMinimal) {
      document.body.classList.add('ultra-minimal');
    } else {
      document.body.classList.remove('ultra-minimal');
    }
    
    // Apply offline mode
    if (window.noteManager && typeof window.noteManager.setOfflineMode === 'function') {
      window.noteManager.setOfflineMode(settings.offlineMode);
    }
    
    // Apply calm reminders setting
    if (window.noteManager && typeof window.noteManager.scheduleCalmReminders === 'function') {
      window.noteManager.scheduleCalmReminders(settings.calmReminders);
    }
    
    // Update sync button state
    updateSyncButtonState(settings.syncEnabled);
  }
  
  /**
   * Populates the settings form with current values
   */
  function populateSettingsForm() {
    themeSelect.value = currentSettings.theme || 'morning-light';
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
    
    // Set toggle states
    ultraMinimalToggle.checked = currentSettings.ultraMinimal || false;
    offlineModeToggle.checked = currentSettings.offlineMode || false;
    calmRemindersToggle.checked = currentSettings.calmReminders !== false; // true by default
    
    // Update sync button state
    updateSyncButtonState(currentSettings.syncEnabled);
  }
  
  /**
   * Updates the sync button text and state based on current sync status
   */
  function updateSyncButtonState(syncEnabled) {
    if (syncEnabled) {
      enableSyncBtn.textContent = 'Sync Enabled';
      enableSyncBtn.classList.add('active');
    } else {
      enableSyncBtn.textContent = 'Enable Secure Sync';
      enableSyncBtn.classList.remove('active');
    }
  }
  
  /**
   * Toggles sync status
   */
  async function toggleSync() {
    try {
      const newSyncStatus = !currentSettings.syncEnabled;
      
      // If enabling sync, show confirmation dialog
      if (newSyncStatus) {
        // This would be implemented with a proper dialog
        const confirmed = confirm(
          'Enable secure cloud sync? Your notes will be encrypted and synced across devices. No account required.'
        );
        
        if (!confirmed) return false;
      }
      
      // Update sync status
      currentSettings.syncEnabled = newSyncStatus;
      
      // Save settings
      await window.api.saveSettings(currentSettings);
      
      // Update UI
      updateSyncButtonState(newSyncStatus);
      
      // Trigger initial sync if enabled
      if (newSyncStatus && window.noteManager) {
        window.noteManager.trySync();
      }
      
      return true;
    } catch (error) {
      console.error('Error toggling sync:', error);
      return false;
    }
  }
  
  /**
   * Shows the keyboard shortcuts modal
   */
  function showShortcutsModal() {
    const modal = document.getElementById('shortcuts-modal');
    const backdrop = document.getElementById('dialog-backdrop');
    
    if (modal && backdrop) {
      modal.classList.remove('hidden');
      backdrop.classList.remove('hidden');
      
      // Close on backdrop click
      backdrop.onclick = () => {
        modal.classList.add('hidden');
        backdrop.classList.add('hidden');
      };
      
      // Close on close button click
      document.getElementById('close-shortcuts').onclick = () => {
        modal.classList.add('hidden');
        backdrop.classList.add('hidden');
      };
    }
  }
  
  /**
   * Updates a keyboard shortcut
   */
  function updateShortcut(name, keys) {
    currentSettings.customShortcuts = {
      ...currentSettings.customShortcuts,
      [name]: keys
    };
    
    return saveSettings();
  }
  
  /**
   * Gets a keyboard shortcut
   */
  function getShortcut(name) {
    return currentSettings.customShortcuts[name] || null;
  }
  
  /**
   * Gets all keyboard shortcuts
   */
  function getAllShortcuts() {
    // Default shortcuts
    const defaultShortcuts = {
      newNote: { key: 'n', modifiers: ['meta'] },
      saveNote: { key: 's', modifiers: ['meta'] },
      bold: { key: 'b', modifiers: ['meta'] },
      italic: { key: 'i', modifiers: ['meta'] },
      underline: { key: 'u', modifiers: ['meta'] },
      focusMode: { key: 'f', modifiers: ['meta', 'shift'] },
      toggleSidebar: { key: '\\', modifiers: ['meta'] },
      search: { key: 'f', modifiers: ['meta'] }
    };
    
    // Override defaults with custom shortcuts
    return {
      ...defaultShortcuts,
      ...currentSettings.customShortcuts
    };
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
    
    // Live preview ultra-minimal mode
    ultraMinimalToggle.addEventListener('change', () => {
      if (ultraMinimalToggle.checked) {
        document.body.classList.add('ultra-minimal');
      } else {
        document.body.classList.remove('ultra-minimal');
      }
    });
    
    // Handle view shortcuts button
    viewShortcutsBtn.addEventListener('click', showShortcutsModal);
    
    // Handle sync button
    enableSyncBtn.addEventListener('click', toggleSync);
  }
  
  // Initialize
  initEventListeners();
  
  return {
    loadSettings,
    saveSettings,
    populateSettingsForm,
    applySettings,
    getShortcut,
    getAllShortcuts,
    updateShortcut,
    showShortcutsModal
  };
}