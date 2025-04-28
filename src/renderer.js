import { initNoteManager } from './note-manager.js';
import { initSettingsManager } from './settings-manager.js';

// DOM Elements
const editor = document.getElementById('editor');
const tagsDisplay = document.getElementById('tags-display');
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
const tagBtn = document.getElementById('tag-btn');
const clearFormattingBtn = document.getElementById('clear-formatting-btn');
const pinBtn = document.getElementById('pin-btn');
const notesSidebarBtn = document.getElementById('notes-btn');
const notesSidebar = document.getElementById('notes-sidebar');
const searchNotesInput = document.getElementById('search-notes');
const notesList = document.getElementById('notes-list');
const shareBtn = document.getElementById('share-btn');
const shareDialog = document.getElementById('share-dialog');
const shareLinkInput = document.getElementById('share-link');
const copyLinkBtn = document.getElementById('copy-link-btn');
const allowEditToggle = document.getElementById('allow-edit-toggle');
const cancelShareBtn = document.getElementById('cancel-share');
const confirmShareBtn = document.getElementById('confirm-share');
const newNoteBtn = document.getElementById('new-note-btn');
const focusModeBtn = document.getElementById('focus-mode-btn');
const dialogBackdrop = document.getElementById('dialog-backdrop');
const calmReminder = document.getElementById('calm-reminder');

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
    
    // Default implementation for createNewNote
    createNewNote: function() {
      editor.innerHTML = '';
      this.saveNote('');
    },
    
    // Default implementation for filtering by tag
    filterByTag: function(tag) {
      // This would be implemented properly to filter notes by tag
      return [];
    },
    
    // Default implementation for searching notes
    searchNotes: function(query) {
      // This would be implemented properly to search notes
      return [];
    },
    
    // Default implementation for getAllNotes
    getAllNotes: async function() {
      try {
        const notes = await window.api.getAllNotes();
        return notes || [];
      } catch (error) {
        console.error('Error getting all notes:', error);
        return [];
      }
    },
    
    // Default implementation for enhanceTagsInEditor
    enhanceTagsInEditor: function() {
      // This would be implemented to visually enhance hashtags in the editor
      console.log('Enhancing tags in editor');
    },
    
    // Default implementation for getting all tags
    getAllTags: function() {
      // This would collect tags from all notes
      return [];
    },
    
    // Default implementation for getting current note ID
    getCurrentNoteId: function() {
      // Return default note ID
      return 'default';
    },
    
    // Default implementation for sorting notes
    sortNotes: function(notes, key, ascending) {
      return notes;
    },
    
    // Schedule calm reminders functionality
    scheduleCalmReminders: function(enabled = true) {
      // Always hide the reminder initially
      if (calmReminder) {
        calmReminder.classList.add('hidden');
      }
      
      // If reminders are disabled, just return
      if (!enabled) return;
      
      // This would normally set up a schedule for reminders
      // For now, we'll just make sure it's hidden
      console.log('Calm reminders ' + (enabled ? 'enabled' : 'disabled'));
    },
    
    // Create share link functionality
    createShareLink: async function(allowEdit) {
      // This would normally create a share link for a note
      return 'https://example.com/shared-note/123456';
    },
    
    // Set offline mode
    setOfflineMode: function(offline) {
      console.log('Offline mode ' + (offline ? 'enabled' : 'disabled'));
    },
    
    // Try to sync notes
    trySync: function() {
      console.log('Attempting to sync notes...');
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
          opacity: 100,
          ultraMinimal: false,
          offlineMode: false,
          calmReminders: true
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
        newNote: { key: 'n', modifiers: ['meta'] },
        saveNote: { key: 's', modifiers: ['meta'] },
        bold: { key: 'b', modifiers: ['meta'] },
        italic: { key: 'i', modifiers: ['meta'] },
        underline: { key: 'u', modifiers: ['meta'] },
        focusMode: { key: 'f', modifiers: ['meta', 'shift'] },
        toggleSidebar: { key: '\\', modifiers: ['meta'] },
        search: { key: 'f', modifiers: ['meta'] }
      };
    },
    
    // Default implementation for showing shortcuts modal
    showShortcutsModal: function() {
      const modal = document.getElementById('shortcuts-modal');
      const backdrop = document.getElementById('dialog-backdrop');
      
      if (modal && backdrop) {
        modal.classList.remove('hidden');
        backdrop.classList.remove('hidden');
      }
    }
  };
}

// Initialize modules using the imported functions if available
try {
  if (typeof initNoteManager === 'function') {
    const noteManagerInstance = initNoteManager(editor, tagsDisplay);
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
  
  // Ensure calm reminder is hidden
  if (calmReminder) {
    calmReminder.classList.add('hidden');
  }
  
  // Load settings and apply them
  await window.settingsManager.loadSettings();
  
  // Initialize the notes list
  await initializeNotesList();
  
  // Load note content
  await window.noteManager.loadNote();
  
  // Initialize auto-save
  window.noteManager.initAutoSave();
  
  // Set up the editor to handle paste events (strip formatting)
  initPasteHandler();
  
  // Setup keyboard shortcuts
  setupKeyboardShortcuts();

  // Initialize the pin button state
  initPinButton();

  // Setup tag handling in editor
  setupTagHandling();

  // Initialize format state checking
  initFormatStateChecker();
  
  // Show placeholder for empty editor
  if (editor && editor.innerHTML.trim() === '') {
    editor.innerHTML = '';
  }
  
  // Initialize ripple effect
  initRippleEffect();
  
  // Initialize context menu
  initContextMenu();
  
  // Setup event listeners for UI interactions
  setupEventListeners();
  
  // Listen for settings changes
  window.addEventListener('settings-changed', handleSettingsChanged);
  
  // Initialize API event listeners
  setupApiEventListeners();
  
  // Setup the click outside handler for the sidebar
  setupOutsideClickHandler();
});

// Initialize notes list sidebar
async function initializeNotesList() {
  try {
    const notes = await window.noteManager.getAllNotes();
    renderNotesList(notes);
  } catch (error) {
    console.error('Error initializing notes list:', error);
  }
}

// Render the notes list in the sidebar
function renderNotesList(notes) {
  // Ensure notesList exists
  if (!notesList) return;
  
  // Clear existing list
  notesList.innerHTML = '';
  
  if (!notes || notes.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-notes-message';
    emptyMessage.textContent = 'No notes found';
    notesList.appendChild(emptyMessage);
    return;
  }
  
  // Sort notes by updated date (most recent first)
  const sortedNotes = window.noteManager.sortNotes(notes, 'updated', false);
  
  // Create a list item for each note
  sortedNotes.forEach(note => {
    const noteItem = document.createElement('div');
    noteItem.className = 'note-item';
    noteItem.dataset.id = note.id;
    
    // Highlight current note
    if (note.id === window.noteManager.getCurrentNoteId()) {
      noteItem.classList.add('active');
    }
    
    // Create title element
    const titleEl = document.createElement('div');
    titleEl.className = 'title';
    titleEl.textContent = note.title || 'Untitled Note';
    
    // Create snippet element
    const snippetEl = document.createElement('div');
    snippetEl.className = 'snippet';
    snippetEl.textContent = note.snippet || 'Empty note';
    
    // Create meta element
    const metaEl = document.createElement('div');
    metaEl.className = 'meta';
    metaEl.textContent = note.updatedAt ? new Date(note.updatedAt).toLocaleString() : 'Just now';
    
    // Assemble note item
    noteItem.appendChild(titleEl);
    noteItem.appendChild(snippetEl);
    noteItem.appendChild(metaEl);
    
    // Add click handler to load the note
    noteItem.addEventListener('click', () => {
      window.noteManager.loadNote(note.id);
      
      // Update active state
      document.querySelectorAll('.note-item').forEach(item => {
        item.classList.remove('active');
      });
      noteItem.classList.add('active');
      
      // Close sidebar on mobile
      if (window.innerWidth < 768) {
        notesSidebar.classList.remove('visible');
      }
    });
    
    notesList.appendChild(noteItem);
  });
}

// Handle clicks outside the sidebar to close it
function setupOutsideClickHandler() {
  document.addEventListener('click', (event) => {
    // Check if sidebar is visible
    if (notesSidebar && notesSidebar.classList.contains('visible')) {
      // Check if the click was outside the sidebar and not on the sidebar toggle button
      if (!notesSidebar.contains(event.target) && 
          !(notesSidebarBtn && notesSidebarBtn.contains(event.target))) {
        notesSidebar.classList.remove('visible');
      }
    }
  });
}

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

// Share dialog functionality
function openShareDialog() {
  if (!shareDialog || !dialogBackdrop || !allowEditToggle) return;
  
  // Reset the dialog
  allowEditToggle.checked = false;
  if (shareLinkInput) shareLinkInput.value = '';
  
  // Show the dialog
  shareDialog.classList.remove('hidden');
  dialogBackdrop.classList.remove('hidden');
}

function closeShareDialog() {
  if (!shareDialog || !dialogBackdrop) return;
  
  shareDialog.classList.add('hidden');
  dialogBackdrop.classList.add('hidden');
}

async function generateShareLink() {
  if (!shareLinkInput || !allowEditToggle) return;
  
  const allowEdit = allowEditToggle.checked;
  const shareLink = await window.noteManager.createShareLink(allowEdit);
  
  if (shareLink) {
    shareLinkInput.value = shareLink;
    
    // Auto select the link
    shareLinkInput.select();
  } else {
    shareLinkInput.value = 'Error creating share link';
  }
}

function copyShareLink() {
  if (!shareLinkInput || !copyLinkBtn) return;
  
  shareLinkInput.select();
  document.execCommand('copy');
  
  // Visual feedback
  copyLinkBtn.textContent = 'Copied!';
  setTimeout(() => {
    copyLinkBtn.textContent = 'Copy';
  }, 1500);
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

// Setup tag handling in the editor
function setupTagHandling() {
  if (!editor || !tagBtn) return;
  
  // Process tags in the editor after changes
  const processTagsDebounced = debounce(() => {
    window.noteManager.enhanceTagsInEditor();
  }, 800);
  
  editor.addEventListener('input', processTagsDebounced);
  editor.addEventListener('keyup', processTagsDebounced);
  
  // Add button for manually adding a tag
  tagBtn.addEventListener('click', () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString().trim();
      
      // Simple tag insertion logic
      if (selectedText) {
        // Remove # if it exists
        const tagName = selectedText.startsWith('#') ? 
          selectedText.substring(1) : selectedText;
        
        document.execCommand('insertText', false, `#${tagName} `);
      } else {
        document.execCommand('insertText', false, '#');
      }
    }
  });
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
      // Close any open dialog
      if (shareDialog && !shareDialog.classList.contains('hidden')) {
        closeShareDialog();
      } 
      // Close sidebar on mobile
      else if (notesSidebar && window.innerWidth < 768 && notesSidebar.classList.contains('visible')) {
        notesSidebar.classList.remove('visible');
      }
      // Close settings panel
      else if (settingsPanel && !settingsPanel.classList.contains('hidden')) {
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
  
  // Check if unordered list is active
  if (listUlBtn) listUlBtn.classList.toggle('active', document.queryCommandState('insertUnorderedList'));
  
  // Check if ordered list is active
  if (listOlBtn) listOlBtn.classList.toggle('active', document.queryCommandState('insertOrderedList'));
}

// Toggle focus mode
function toggleFocusMode() {
  document.body.classList.toggle('focus-mode');
  if (focusModeBtn) focusModeBtn.classList.toggle('active');
  if (editor) editor.focus();
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

// Initialize context menu
function initContextMenu() {
  console.log('Context menu initialized');
}

// Handle settings changed event
function handleSettingsChanged(event) {
  const { settings } = event.detail || {};
  
  if (settings) {
    // Update offline mode in note manager
    if (window.noteManager) {
      window.noteManager.setOfflineMode(settings.offlineMode);
    }
    
    // Update calm reminders in note manager
    if (window.noteManager) {
      window.noteManager.scheduleCalmReminders(settings.calmReminders);
    }
  }
}

// Setup API event listeners
function setupApiEventListeners() {
  // Event listener for toggle settings
  if (window.api && window.api.onToggleSettings) {
    window.api.onToggleSettings(() => {
      toggleSettingsPanel();
    });
  }
  
  // Event listener for create new note
  if (window.api && window.api.onCreateNewNote) {
    window.api.onCreateNewNote(() => {
      window.noteManager.createNewNote();
    });
  }
  
  // Event listener for toggle focus mode
  if (window.api && window.api.onToggleFocusMode) {
    window.api.onToggleFocusMode(() => {
      toggleFocusMode();
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
  
  if (listUlBtn) {
    listUlBtn.addEventListener('click', () => formatText('insertUnorderedList'));
  }
  
  if (listOlBtn) {
    listOlBtn.addEventListener('click', () => formatText('insertOrderedList'));
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
  
  // Notes sidebar event listeners
  if (notesSidebarBtn) {
    notesSidebarBtn.addEventListener('click', (event) => {
      // Stop event propagation to prevent the outside click handler from firing
      event.stopPropagation();

      if (notesSidebar) {
        notesSidebar.classList.toggle('visible');
      }
    });
  }
  
  // Share button event listeners
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      openShareDialog();
      generateShareLink();
    });
  }
  
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', copyShareLink);
  }
  
  if (cancelShareBtn) {
    cancelShareBtn.addEventListener('click', closeShareDialog);
  }
  
  if (confirmShareBtn) {
    confirmShareBtn.addEventListener('click', closeShareDialog);
  }
  
  // New note button event listener
  if (newNoteBtn) {
    newNoteBtn.addEventListener('click', () => {
      window.noteManager.createNewNote();
    });
  }
  
  // Focus mode button event listener
  if (focusModeBtn) {
    focusModeBtn.addEventListener('click', toggleFocusMode);
  }
  
  // Calm reminder buttons
  if (calmReminder) {
    const closeBtn = calmReminder.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        calmReminder.classList.add('hidden');
      });
    }
    
    const actionBtn = calmReminder.querySelector('.action-btn');
    if (actionBtn) {
      actionBtn.addEventListener('click', () => {
        calmReminder.classList.add('hidden');
        // Would normally show previous notes
        console.log('Showing previous notes');
      });
    }
  }
  
  // Search notes event listener
  if (searchNotesInput) {
    searchNotesInput.addEventListener('input', debounce(() => {
      const query = searchNotesInput.value.trim();
      
      if (query) {
        // Check if it's a tag search
        if (query.startsWith('#')) {
          const tag = query.substring(1);
          window.noteManager.filterByTag(tag).then(filteredNotes => {
            renderNotesList(filteredNotes);
          });
        } else {
          window.noteManager.searchNotes(query).then(searchResults => {
            renderNotesList(searchResults);
          });
        }
      } else {
        // Show all notes
        window.noteManager.getAllNotes().then(notes => {
          renderNotesList(notes);
        });
      }
    }, 300));
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