import { initNoteManager } from './note-manager.js';
import { initSettingsManager } from './settings-manager.js';

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
const listUlBtn = document.getElementById('list-ul-btn');
const listOlBtn = document.getElementById('list-ol-btn');
const clearFormattingBtn = document.getElementById('clear-formatting-btn');
const pinBtn = document.getElementById('pin-btn');
const minimizeBtn = document.getElementById('minimize-btn');
const saveIndicator = document.getElementById('save-indicator');

// Initialize modules
const noteManager = initNoteManager(editor, showSaveIndicator);
const settingsManager = initSettingsManager();

// Load saved note content and settings
document.addEventListener('DOMContentLoaded', async () => {
  // Load settings and apply them
  await settingsManager.loadSettings();
  
  // Load note content
  await noteManager.loadNote();
  
  // Initialize auto-save
  noteManager.initAutoSave();
  
  // Set up the editor to handle paste events (strip formatting)
  initPasteHandler();
  
  // Setup keyboard shortcuts
  setupKeyboardShortcuts();

  // Initialize the pin button state
  initPinButton();

  // Event listener for removing the toggle-settings event
  const removeToggleSettingsListener = window.api.onToggleSettings(() => {
    toggleSettingsPanel();
  });
  
  // Initialize format state checking
  initFormatStateChecker();
  
  // Clean up when window is closed
  window.addEventListener('beforeunload', () => {
    removeToggleSettingsListener();
  });
  
  // Show placeholder for empty editor
  if (editor.innerHTML.trim() === '') {
    editor.innerHTML = '';
  }
  
  // Initialize tooltip positioning
  initTooltips();
});

// Function to show save indicator
function showSaveIndicator() {
  saveIndicator.classList.remove('hidden');
  
  // Remove after animation completes
  setTimeout(() => {
    saveIndicator.classList.add('hidden');
  }, 2000);
}

// Toggle settings panel
function toggleSettingsPanel() {
  settingsPanel.classList.toggle('hidden');
  editorContainer.classList.toggle('hidden');
  
  if (!settingsPanel.classList.contains('hidden')) {
    // Populate settings with current values
    settingsManager.populateSettingsForm();
  }
}

// Force app to stay pinned at the forefront of the desktop
async function initPinButton() {
  const isAlwaysOnTop = await window.api.getAlwaysOnTopState();
  pinBtn.classList.toggle('active', isAlwaysOnTop);
}

// Initialize tooltips
function initTooltips() {
  const tooltipElements = document.querySelectorAll('.tooltip');
  
  tooltipElements.forEach(element => {
    const tooltipText = element.getAttribute('data-tooltip');
    if (tooltipText) {
      // Create tooltip element
      element.addEventListener('mouseenter', () => {
        const rect = element.getBoundingClientRect();
        const tooltipTop = rect.top - 30; // Position above the element
        const tooltipLeft = rect.left + (rect.width / 2);
      });
    }
  });
}

// Setup event listeners
settingsBtn.addEventListener('click', toggleSettingsPanel);
cancelSettingsBtn.addEventListener('click', toggleSettingsPanel);
saveSettingsBtn.addEventListener('click', async () => {
  await settingsManager.saveSettings();
  toggleSettingsPanel();
  showSaveIndicator();
});

// Format button event listeners
boldBtn.addEventListener('click', () => formatText('bold'));
italicBtn.addEventListener('click', () => formatText('italic'));
underlineBtn.addEventListener('click', () => formatText('underline'));
listUlBtn.addEventListener('click', () => formatText('insertUnorderedList'));
listOlBtn.addEventListener('click', () => formatText('insertOrderedList'));
clearFormattingBtn.addEventListener('click', () => formatText('removeFormat'));

// Pin button event listener
pinBtn.addEventListener('click', async () => {
  const newState = await window.api.toggleAlwaysOnTop();
  pinBtn.classList.toggle('active', newState);
});

// Minimize button event listener
minimizeBtn.addEventListener('click', async () => {
  await window.api.minimizeToTray();
});

// Handle pasting to strip formatting
function initPasteHandler() {
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
  
  // Add animation to the button
  const buttonMap = {
    'bold': boldBtn,
    'italic': italicBtn,
    'underline': underlineBtn,
    'insertUnorderedList': listUlBtn,
    'insertOrderedList': listOlBtn,
    'removeFormat': clearFormattingBtn
  };
  
  const button = buttonMap[command];
  if (button) {
    button.classList.add('format-animation');
    setTimeout(() => {
      button.classList.remove('format-animation');
    }, 300);
  }
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
  editor.addEventListener('keydown', (e) => {
    // Ignore shortcuts when settings panel is open
    if (!settingsPanel.classList.contains('hidden')) return;
    
    // Command/Ctrl + B: Bold
    if (e.key === 'b' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      formatText('bold');
    }
    
    // Command/Ctrl + I: Italic
    if (e.key === 'i' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      formatText('italic');
    }
    
    // Command/Ctrl + U: Underline
    if (e.key === 'u' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      formatText('underline');
    }
    
    // Tab key in lists: indent
    if (e.key === 'Tab' && isInList()) {
      e.preventDefault();
      
      if (e.shiftKey) {
        formatText('outdent');
      } else {
        formatText('indent');
      }
    }
    
    // Esc key to close settings
    if (e.key === 'Escape' && !settingsPanel.classList.contains('hidden')) {
      e.preventDefault();
      toggleSettingsPanel();
    }
  });
}

// Check if cursor is in a list
function isInList() {
  const selection = window.getSelection();
  if (!selection.rangeCount) return false;
  
  let node = selection.getRangeAt(0).startContainer;
  while (node && node !== editor) {
    if (node.nodeName === 'UL' || node.nodeName === 'OL' || 
        node.nodeName === 'LI') {
      return true;
    }
    node = node.parentNode;
  }
  
  return false;
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
  editor.addEventListener('click', updateFormatButtons);
  
  // Initial update
  updateFormatButtons();
}

// Update format buttons state based on current text selection formatting
function updateFormatButtons() {
  // Check if bold is active
  boldBtn.classList.toggle('active', document.queryCommandState('bold'));
  
  // Check if italic is active
  italicBtn.classList.toggle('active', document.queryCommandState('italic'));
  
  // Check if underline is active
  underlineBtn.classList.toggle('active', document.queryCommandState('underline'));
  
  // Check if unordered list is active
  listUlBtn.classList.toggle('active', document.queryCommandState('insertUnorderedList'));
  
  // Check if ordered list is active
  listOlBtn.classList.toggle('active', document.queryCommandState('insertOrderedList'));
}