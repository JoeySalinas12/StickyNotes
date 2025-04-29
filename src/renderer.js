import { initNoteManager } from './note-manager.js';
import { initSettingsManager } from './settings-manager.js';
import { initMarkdownHandler } from './markdown-handler.js';

// DOM Elements
const editor = document.getElementById('editor');
const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');
const editorContainer = document.getElementById('editor-container');
const cancelSettingsBtn = document.getElementById('cancel-settings');
const saveSettingsBtn = document.getElementById('save-settings');
const boldBtn = document.getElementById('bold-btn');
const italicBtn = document.getElementById('italic-btn');
const underlineBtn = document.getElementById('underline-btn');
const clearFormattingBtn = document.getElementById('clear-formatting-btn');
const pinBtn = document.getElementById('pin-btn');
const dialogBackdrop = document.getElementById('dialog-backdrop');

// Initialize module stubs if they don't exist
if (!window.noteManager) {
  window.noteManager = {
    // Default implementation for loadNote
    loadNote: async function(noteId) {
      try {
        const noteContent = await window.api.getNote(noteId);
        if (noteContent) {
          editor.innerHTML = noteContent.content || '';
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error loading note:', error);
        return false;
      }
    },
    
    // Default implementation for saveNote
    saveNote: async function(noteContent) {
      try {
        await window.api.saveNote('default', {
          content: noteContent,
          updatedAt: new Date().toISOString()
        });
        return true;
      } catch (error) {
        console.error('Error saving note:', error);
        return false;
      }
    },
    
    // Default implementation for initAutoSave
    initAutoSave: function() {
      let autoSaveTimer = null;
      const AUTO_SAVE_DELAY = 800;
      
      const handleChange = () => {
        if (autoSaveTimer) {
          clearTimeout(autoSaveTimer);
        }
        
        autoSaveTimer = setTimeout(() => {
          this.saveNote(editor.innerHTML);
        }, AUTO_SAVE_DELAY);
      };
      
      editor.addEventListener('input', handleChange);
      editor.addEventListener('keyup', handleChange);
      editor.addEventListener('paste', handleChange);
      editor.addEventListener('cut', handleChange);
    },
    
    // Default implementation for forceSave
    forceSave: function() {
      return this.saveNote(editor.innerHTML);
    },
    
    // Default implementation for getting current note ID
    getCurrentNoteId: function() {
      // Return default note ID
      return 'default';
    }
  };
}

// Initialize settings manager if it doesn't exist
if (!window.settingsManager) {
  window.settingsManager = {
    // Default implementation for loading settings
    loadSettings: async function() {
      try {
        const settings = await window.api.getSettings();
        if (settings) {
          this.applySettings(settings);
          return settings;
        }
        return null;
      } catch (error) {
        console.error('Error loading settings:', error);
        return null;
      }
    },
    
    // Default implementation for applying settings
    applySettings: function(settings) {
      if (!settings) return;
      
      // Apply theme
      document.body.setAttribute('data-theme', settings.theme || 'morning-light');
      
      // Apply other settings...
      console.log('Applied settings');
    },
    
    // Default implementation for populating the settings form
    populateSettingsForm: function() {
      // This would populate the settings form with current values
      console.log('Populating settings form');
    },
    
    // Default implementation for saving settings
    saveSettings: async function() {
      try {
        // Get values from form (would be implemented properly)
        const settings = {
          theme: 'morning-light',
          font: 'Inter',
          fontSize: 14,
          opacity: 100
        };
        
        // Save settings (would call API in real implementation)
        console.log('Saving settings:', settings);
        return true;
      } catch (error) {
        console.error('Error saving settings:', error);
        return false;
      }
    },
    
    // Default implementation for getting keyboard shortcuts
    getAllShortcuts: function() {
      // Default shortcuts
      return {
        bold: { key: 'b', modifiers: ['meta'] },
        italic: { key: 'i', modifiers: ['meta'] },
        underline: { key: 'u', modifiers: ['meta'] }
      };
    }
  };
}

// Initialize modules using the imported functions if available
try {
  if (typeof initNoteManager === 'function') {
    const noteManagerInstance = initNoteManager(editor);
    if (noteManagerInstance) {
      // Merge with any existing methods to preserve backwards compatibility
      window.noteManager = {
        ...window.noteManager,
        ...noteManagerInstance
      };
    }
  }
  
  if (typeof initSettingsManager === 'function') {
    const settingsManagerInstance = initSettingsManager();
    if (settingsManagerInstance) {
      // Merge with any existing methods to preserve backwards compatibility
      window.settingsManager = {
        ...window.settingsManager,
        ...settingsManagerInstance
      };
    }
  }
} catch (error) {
  console.error('Error initializing modules:', error);
}

// Setup event listeners for all UI elements
document.addEventListener('DOMContentLoaded', async () => {
  // Ensure settings panel is hidden
  if (settingsPanel) settingsPanel.classList.add('hidden');
  if (editorContainer) editorContainer.classList.remove('hidden');
  
  // Load settings and apply them
  await window.settingsManager.loadSettings();
  
  // Load note content
  await window.noteManager.loadNote();
  
  // Initialize auto-save
  window.noteManager.initAutoSave();
  
  // Initialize Markdown handler
  window.markdownHandler = initMarkdownHandler(editor);
  
  // Set up the editor to handle paste events (strip formatting)
  initPasteHandler();
  
  // Setup keyboard shortcuts
  setupKeyboardShortcuts();

  // Initialize the pin button state
  initPinButton();
  
  // Initialize format state checking
  initFormatStateChecker();
  
  // Show placeholder for empty editor
  if (editor && editor.innerHTML.trim() === '') {
    editor.innerHTML = '';
  }
  
  // Initialize ripple effect
  initRippleEffect();
  
  // Setup event listeners for UI interactions
  setupEventListeners();
  
  // Setup API event listeners
  setupApiEventListeners();
});

// Toggle settings panel
function toggleSettingsPanel() {
  if (!settingsPanel || !editorContainer) return;
  
  settingsPanel.classList.toggle('hidden');
  editorContainer.classList.toggle('hidden');
  
  if (!settingsPanel.classList.contains('hidden')) {
    // Populate settings with current values
    window.settingsManager.populateSettingsForm();
  }
}

// Force app to stay pinned at the forefront of the desktop
async function initPinButton() {
  if (!pinBtn) return;
  
  try {
    const isAlwaysOnTop = await window.api.getAlwaysOnTopState();
    pinBtn.classList.toggle('active', isAlwaysOnTop);
  } catch (error) {
    console.error('Error initializing pin button:', error);
  }
}

// Handle paste events to strip formatting
function initPasteHandler() {
  if (!editor) return;
  
  editor.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  });
}

// Text formatting function
function formatText(command, value = null) {
  document.execCommand(command, false, value);
  updateFormatButtons();
  editor.focus();
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
  // Get shortcuts from settings
  const shortcuts = window.settingsManager.getAllShortcuts();
  
  document.addEventListener('keydown', (e) => {
    // Ignore shortcuts when settings panel is open
    if (settingsPanel && !settingsPanel.classList.contains('hidden')) return;
    
    // Command/Ctrl + B: Bold
    if (matchesShortcut(e, shortcuts.bold)) {
      e.preventDefault();
      formatText('bold');
    }
    
    // Command/Ctrl + I: Italic
    if (matchesShortcut(e, shortcuts.italic)) {
      e.preventDefault();
      formatText('italic');
    }
    
    // Command/Ctrl + U: Underline
    if (matchesShortcut(e, shortcuts.underline)) {
      e.preventDefault();
      formatText('underline');
    }
    
    // Esc key to close settings
    if (e.key === 'Escape') {
      // Close settings panel
      if (settingsPanel && !settingsPanel.classList.contains('hidden')) {
        toggleSettingsPanel();
      }
    }
  });
}

// Check if a key event matches a keyboard shortcut
function matchesShortcut(event, shortcut) {
  if (!shortcut) return false;
  
  // Check if key matches
  if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) return false;
  
  // Check modifiers
  const hasCtrlOrMeta = event.ctrlKey || event.metaKey;
  const hasShift = event.shiftKey;
  
  // Shortcut needs meta/ctrl but event doesn't have it
  if (shortcut.modifiers.includes('meta') && !hasCtrlOrMeta) return false;
  
  // Shortcut needs shift but event doesn't have it
  if (shortcut.modifiers.includes('shift') && !hasShift) return false;
  
  return true;
}

// Initialize format state checker to update formatting buttons based on selection
function initFormatStateChecker() {
  // Update format buttons when selection changes
  document.addEventListener('selectionchange', () => {
    if (document.activeElement === editor) {
      updateFormatButtons();
    }
  });
  
  // Also update when clicking into the editor
  if (editor) {
    editor.addEventListener('click', updateFormatButtons);
  }
  
  // Initial update
  updateFormatButtons();
}

// Update format buttons state based on current text selection formatting
function updateFormatButtons() {
  // Check if bold is active
  if (boldBtn) boldBtn.classList.toggle('active', document.queryCommandState('bold'));
  
  // Check if italic is active
  if (italicBtn) italicBtn.classList.toggle('active', document.queryCommandState('italic'));
  
  // Check if underline is active
  if (underlineBtn) underlineBtn.classList.toggle('active', document.queryCommandState('underline'));
}

// Initialize ripple effect for buttons
function initRippleEffect() {
  const buttons = document.querySelectorAll('button');
  
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      button.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });
}

// Setup API event listeners
function setupApiEventListeners() {
  // Event listener for toggle settings
  if (window.api && window.api.onToggleSettings) {
    window.api.onToggleSettings(() => {
      toggleSettingsPanel();
    });
  }
}

// Setup all UI event listeners
function setupEventListeners() {
  // Settings panel event listeners
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      toggleSettingsPanel();
    });
  }
  
  if (cancelSettingsBtn) {
    cancelSettingsBtn.addEventListener('click', () => {
      toggleSettingsPanel();
    });
  }
  
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', async () => {
      await window.settingsManager.saveSettings();
      toggleSettingsPanel();
    });
  }
  
  // Format button event listeners
  if (boldBtn) {
    boldBtn.addEventListener('click', () => formatText('bold'));
  }
  
  if (italicBtn) {
    italicBtn.addEventListener('click', () => formatText('italic'));
  }
  
  if (underlineBtn) {
    underlineBtn.addEventListener('click', () => formatText('underline'));
  }
  
  if (clearFormattingBtn) {
    clearFormattingBtn.addEventListener('click', () => formatText('removeFormat'));
  }
  
  // Pin button event listener
  if (pinBtn) {
    pinBtn.addEventListener('click', async () => {
      try {
        const newState = await window.api.toggleAlwaysOnTop();
        pinBtn.classList.toggle('active', newState);
      } catch (error) {
        console.error('Error toggling always on top:', error);
      }
    });
  }
}

// Utility function: Debounce
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}