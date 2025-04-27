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
const closeSidebarBtn = document.getElementById('close-sidebar');
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

// Initialize modules and make them globally available
window.noteManager = initNoteManager(editor, tagsDisplay);
window.settingsManager = initSettingsManager();

// Load saved note content and settings
document.addEventListener('DOMContentLoaded', async () => {
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

  // Event listener for removing the toggle-settings event
  const removeToggleSettingsListener = window.api.onToggleSettings(() => {
    toggleSettingsPanel();
  });
  
  // Initialize format state checking
  initFormatStateChecker();
  
  // Schedule calm reminders if enabled
  window.noteManager.scheduleCalmReminders();
  
  // Clean up when window is closed
  window.addEventListener('beforeunload', () => {
    removeToggleSettingsListener();
  });
  
  // Show placeholder for empty editor
  if (editor.innerHTML.trim() === '') {
    editor.innerHTML = '';
  }
  
  // Initialize ripple effect
  initRippleEffect();
  
  // Initialize context menu
  initContextMenu();
  
  // Listen for settings changes
  window.addEventListener('settings-changed', handleSettingsChanged);
});

// Initialize notes list sidebar
async function initializeNotesList() {
  const notes = await window.noteManager.getAllNotes();
  renderNotesList(notes);
}

// Render the notes list in the sidebar
function renderNotesList(notes) {
  // Clear existing list
  notesList.innerHTML = '';
  
  // Sort notes by updated date (most recent first)
  const sortedNotes = window.noteManager.sortNotes(notes, 'updated', false);
  
  if (sortedNotes.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-notes-message';
    emptyMessage.textContent = 'No notes found';
    notesList.appendChild(emptyMessage);
    return;
  }
  
  // Create a list item for each note
  sortedNotes.forEach(note => {
    const noteItem = document.createElement('div');
    noteItem.className = 'note-item';
    noteItem.dataset.id = note.id;
    
    // Highlight current note
    if (note.id === window.noteManager.getCurrentNoteId()) {
      noteItem.classList.add('active');
    }
    
    // Calculate time ago string
    const timeAgo = getTimeAgoString(new Date(note.updatedAt));
    
    // Create title, snippet, and meta elements
    const titleEl = document.createElement('div');
    titleEl.className = 'title';
    titleEl.textContent = note.title || 'Untitled Note';
    
    const snippetEl = document.createElement('div');
    snippetEl.className = 'snippet';
    // Strip HTML tags for snippet
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = note.content;
    const textContent = tempDiv.textContent.trim();
    snippetEl.textContent = textContent.length > 60 
      ? textContent.substring(0, 60) + '...' 
      : textContent;
    
    const metaEl = document.createElement('div');
    metaEl.className = 'meta';
    metaEl.textContent = timeAgo;
    
    // Add tags if available
    if (note.tags && note.tags.length > 0) {
      const tagsEl = document.createElement('div');
      tagsEl.className = 'tags';
      
      note.tags.slice(0, 3).forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'tag';
        tagEl.textContent = '#' + tag;
        tagsEl.appendChild(tagEl);
      });
      
      // Add ... if there are more tags
      if (note.tags.length > 3) {
        const moreEl = document.createElement('span');
        moreEl.className = 'more-tags';
        moreEl.textContent = '+' + (note.tags.length - 3);
        tagsEl.appendChild(moreEl);
      }
      
      noteItem.appendChild(titleEl);
      noteItem.appendChild(snippetEl);
      noteItem.appendChild(tagsEl);
      noteItem.appendChild(metaEl);
    } else {
      noteItem.appendChild(titleEl);
      noteItem.appendChild(snippetEl);
      noteItem.appendChild(metaEl);
    }
    
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

// Get a human-readable time ago string from a date
function getTimeAgoString(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 30) {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  }
  
  if (diffDays > 0) {
    return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
  }
  
  if (diffHours > 0) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  if (diffMins > 0) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  return 'Just now';
}

// Toggle settings panel
function toggleSettingsPanel() {
  settingsPanel.classList.toggle('hidden');
  editorContainer.classList.toggle('hidden');
  
  if (!settingsPanel.classList.contains('hidden')) {
    // Populate settings with current values
    window.settingsManager.populateSettingsForm();
  }
}

// Share dialog functionality
function openShareDialog() {
  // Reset the dialog
  allowEditToggle.checked = false;
  shareLinkInput.value = '';
  
  // Show the dialog
  shareDialog.classList.remove('hidden');
  dialogBackdrop.classList.remove('hidden');
}

function closeShareDialog() {
  shareDialog.classList.add('hidden');
  dialogBackdrop.classList.add('hidden');
}

async function generateShareLink() {
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
  const isAlwaysOnTop = await window.api.getAlwaysOnTopState();
  pinBtn.classList.toggle('active', isAlwaysOnTop);
}

// Setup tag handling in the editor
function setupTagHandling() {
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
      
      // If text is selected, convert it to a tag
      if (selectedText) {
        // Remove # if it exists
        const tagName = selectedText.startsWith('#') ? 
          selectedText.substring(1) : selectedText;
          
        // Only allow alphanumeric and underscore
        const safeTagName = tagName.replace(/[^a-zA-Z0-9_]/g, '');
        
        if (safeTagName) {
          // Create tag element
          const tagElement = document.createElement('span');
          tagElement.className = 'tag';
          tagElement.contentEditable = 'false';
          tagElement.textContent = '#' + safeTagName;
          
          // Replace selection with tag
          range.deleteContents();
          range.insertNode(tagElement);
          
          // Add a space after the tag
          const space = document.createTextNode(' ');
          range.setStartAfter(tagElement);
          range.setEndAfter(tagElement);
          range.insertNode(space);
          
          // Move cursor after space
          range.setStartAfter(space);
          range.setEndAfter(space);
          selection.removeAllRanges();
          selection.addRange(range);
          
          // Force save to update tags
          window.noteManager.forceSave();
        }
      } else {
        // If no text is selected, show tag picker
        showTagPicker();
      }
    } else {
      // If no selection, show tag picker
      showTagPicker();
    }
  });
  
  // Listen for filter-notes-by-tag event
  window.addEventListener('filter-notes-by-tag', (event) => {
    const tag = event.detail;
    const filteredNotes = window.noteManager.filterByTag(tag);
    
    // Show sidebar if it's not already visible
    notesSidebar.classList.add('visible');
    
    // Update notes list with filtered notes
    renderNotesList(filteredNotes);
    
    // Update search box to show the filter
    searchNotesInput.value = `#${tag}`;
  });
}

// Show tag picker with existing tags
function showTagPicker() {
  const allTags = window.noteManager.getAllTags();
  
  if (allTags.length === 0) {
    // No existing tags, just insert # character
    document.execCommand('insertText', false, '#');
    return;
  }
  
  // Create tag picker
  const tagPicker = document.createElement('div');
  tagPicker.className = 'tag-autocomplete';
  
  // Get cursor position for positioning the picker
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  // Position picker near cursor
  tagPicker.style.top = `${rect.bottom + 10}px`;
  tagPicker.style.left = `${rect.left}px`;
  
  // Add tags to picker
  allTags.forEach(tag => {
    const tagItem = document.createElement('div');
    tagItem.className = 'tag-suggestion';
    tagItem.textContent = `#${tag}`;
    
    tagItem.addEventListener('click', () => {
      // Insert the tag
      const tagElement = document.createElement('span');
      tagElement.className = 'tag';
      tagElement.contentEditable = 'false';
      tagElement.textContent = `#${tag}`;
      
      range.deleteContents();
      range.insertNode(tagElement);
      
      // Add space after tag
      const space = document.createTextNode(' ');
      range.setStartAfter(tagElement);
      range.insertNode(space);
      
      // Remove picker
      document.body.removeChild(tagPicker);
      
      // Move cursor after space
      range.setStartAfter(space);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Force save to update tags
      window.noteManager.forceSave();
    });
    
    tagPicker.appendChild(tagItem);
  });
  
  // Add to body
  document.body.appendChild(tagPicker);
  
  // Close on click outside
  const clickOutside = (e) => {
    if (!tagPicker.contains(e.target)) {
      document.body.removeChild(tagPicker);
      document.removeEventListener('click', clickOutside);
    }
  };
  
  // Small delay to prevent immediate closing
  setTimeout(() => {
    document.addEventListener('click', clickOutside);
  }, 100);
}

// Handle paste events to strip formatting
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
  // Get custom shortcuts from settings
  const shortcuts = window.settingsManager.getAllShortcuts();
  
  document.addEventListener('keydown', (e) => {
    // Ignore shortcuts when settings panel is open
    if (!settingsPanel.classList.contains('hidden')) return;
    
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
    
    // Command/Ctrl + N: New note
    if (matchesShortcut(e, shortcuts.newNote)) {
      e.preventDefault();
      window.noteManager.createNewNote();
    }
    
    // Command/Ctrl + S: Save note
    if (matchesShortcut(e, shortcuts.saveNote)) {
      e.preventDefault();
      window.noteManager.forceSave();
    }
    
    // Command/Ctrl + Shift + F: Focus mode
    if (matchesShortcut(e, shortcuts.focusMode)) {
      e.preventDefault();
      toggleFocusMode();
    }
    
    // Command/Ctrl + \: Toggle sidebar
    if (matchesShortcut(e, shortcuts.toggleSidebar)) {
      e.preventDefault();
      notesSidebar.classList.toggle('visible');
    }
    
    // Command/Ctrl + F: Search
    if (matchesShortcut(e, shortcuts.search)) {
      e.preventDefault();
      notesSidebar.classList.add('visible');
      searchNotesInput.focus();
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
    if (e.key === 'Escape') {
      // Close any open dialog
      if (!shareDialog.classList.contains('hidden')) {
        closeShareDialog();
      } 
      // Close sidebar on mobile
      else if (window.innerWidth < 768 && notesSidebar.classList.contains('visible')) {
        notesSidebar.classList.remove('visible');
      }
      // Close settings panel
      else if (!settingsPanel.classList.contains('hidden')) {
        toggleSettingsPanel();
      }
    }
    
    // # key for heading support
    if (e.key === '#') {
      // Look at the current line to see if we should convert to heading
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const startNode = range.startContainer;
        
        // If we're at the start of a block element
        if (range.startOffset === 0 && isStartOfBlock(startNode)) {
          // Allow the # to be inserted and check on next space
          // Will be handled by the space key event
        }
      }
    }
    
    // Space key for completing markdown-style formatting
    if (e.key === ' ') {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const startNode = range.startContainer;
        
        // Only process if we're in a text node
        if (startNode.nodeType === Node.TEXT_NODE) {
          const textBeforeCursor = startNode.textContent.substring(0, range.startOffset);
          
          // Check for heading syntax: #, ##, ###
          const headingMatch = textBeforeCursor.match(/^(#{1,6})$/);
          if (headingMatch) {
            e.preventDefault();
            
            // Count # symbols to determine heading level
            const level = headingMatch[1].length;
            
            // Delete the # symbols
            range.setStart(startNode, 0);
            range.deleteContents();
            
            // Insert appropriate heading
            document.execCommand('formatBlock', false, `h${level}`);
            return;
          }
        }
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
  const hasAlt = event.altKey;
  
  // Shortcut needs meta/ctrl but event doesn't have it
  if (shortcut.modifiers.includes('meta') && !hasCtrlOrMeta) return false;
  
  // Shortcut needs shift but event doesn't have it
  if (shortcut.modifiers.includes('shift') && !hasShift) return false;
  
  // Shortcut needs alt but event doesn't have it
  if (shortcut.modifiers.includes('alt') && !hasAlt) return false;
  
  // Shortcut doesn't need meta/ctrl but event has it
  if (!shortcut.modifiers.includes('meta') && hasCtrlOrMeta) return false;
  
  // Shortcut doesn't need shift but event has it
  if (!shortcut.modifiers.includes('shift') && hasShift) return false;
  
  // Shortcut doesn't need alt but event has it
  if (!shortcut.modifiers.includes('alt') && hasAlt) return false;
  
  return true;
}

// Check if cursor is at the start of a block element
function isStartOfBlock(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    // Check if this text node is the first child of a block element
    const parent = node.parentNode;
    return parent.firstChild === node && isBlockElement(parent);
  }
  
  return isBlockElement(node);
}

// Check if node is a block element
function isBlockElement(node) {
  const blockElements = [
    'P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'BLOCKQUOTE', 'PRE', 'LI'
  ];
  
  return node.nodeType === Node.ELEMENT_NODE && 
         blockElements.includes(node.nodeName);
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

// Toggle focus mode
function toggleFocusMode() {
  document.body.classList.toggle('focus-mode');
  focusModeBtn.classList.toggle('active');
  editor.focus();
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
  const contextMenu = document.createElement('div');
  contextMenu.className = 'context-menu hidden';
  document.body.appendChild(contextMenu);
  
  // Context menu for editor
  editor.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    
    // Get selection info
    const selection = window.getSelection();
    const hasSelection = selection.toString().trim().length > 0;
    
    // Build context menu
    contextMenu.innerHTML = '';
    
    if (hasSelection) {
      // Add formatting options
      addContextMenuItem(contextMenu, 'Bold', 'bold');
      addContextMenuItem(contextMenu, 'Italic', 'italic');
      addContextMenuItem(contextMenu, 'Underline', 'underline');
      
      // Add separator
      const separator = document.createElement('div');
      separator.className = 'context-menu-separator';
      contextMenu.appendChild(separator);
      
      // Add convert to tag option
      addContextMenuItem(contextMenu, 'Convert to Tag', 'tag');
    }
    
    // Add common options
    addContextMenuItem(contextMenu, 'Copy', 'copy');
    if (hasSelection) {
      addContextMenuItem(contextMenu, 'Cut', 'cut');
    }
    
    // Add paste option if clipboard has text
    navigator.clipboard.readText().then(text => {
      if (text) {
        addContextMenuItem(contextMenu, 'Paste', 'paste');
      }
    }).catch(() => {
      // If clipboard API fails, just add paste option anyway
      addContextMenuItem(contextMenu, 'Paste', 'paste');
    });
    
    // Position menu
    contextMenu.style.top = `${e.clientY}px`;
    contextMenu.style.left = `${e.clientX}px`;
    
    // Show menu
    contextMenu.classList.remove('hidden');
    
    // Adjust position if menu goes off-screen
    const menuRect = contextMenu.getBoundingClientRect();
    if (menuRect.right > window.innerWidth) {
      contextMenu.style.left = `${window.innerWidth - menuRect.width - 10}px`;
    }
    if (menuRect.bottom > window.innerHeight) {
      contextMenu.style.top = `${window.innerHeight - menuRect.height - 10}px`;
    }
    
    // Hide menu on outside click
    const hideMenu = () => {
      contextMenu.classList.add('hidden');
      document.removeEventListener('click', hideMenu);
    };
    
    setTimeout(() => {
      document.addEventListener('click', hideMenu);
    }, 0);
  });
}

// Add item to context menu
function addContextMenuItem(menu, label, action) {
  const item = document.createElement('div');
  item.className = 'context-menu-item';
  item.textContent = label;
  
  item.addEventListener('click', () => {
    handleContextMenuAction(action);
  });
  
  menu.appendChild(item);
  return item;
}

// Handle context menu actions
function handleContextMenuAction(action) {
  switch (action) {
    case 'bold':
      formatText('bold');
      break;
    case 'italic':
      formatText('italic');
      break;
    case 'underline':
      formatText('underline');
      break;
    case 'tag':
      const selection = window.getSelection();
      if (selection.toString().trim()) {
        // Use the tag button's click handler to convert selection to tag
        tagBtn.click();
      }
      break;
    case 'copy':
      document.execCommand('copy');
      break;
    case 'cut':
      document.execCommand('cut');
      break;
    case 'paste':
      navigator.clipboard.readText().then(text => {
        document.execCommand('insertText', false, text);
      }).catch(() => {
        // Fallback
        document.execCommand('paste');
      });
      break;
  }
}

// Handle settings changed event
function handleSettingsChanged(event) {
  const { settings } = event.detail;
  
  // Update offline mode in note manager
  if (window.noteManager) {
    window.noteManager.setOfflineMode(settings.offlineMode);
  }
  
  // Update calm reminders in note manager
  if (window.noteManager) {
    window.noteManager.scheduleCalmReminders(settings.calmReminders);
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

// Event listeners for UI
settingsBtn.addEventListener('click', toggleSettingsPanel);
cancelSettingsBtn.addEventListener('click', toggleSettingsPanel);
saveSettingsBtn.addEventListener('click', async () => {
  await window.settingsManager.saveSettings();
  toggleSettingsPanel();
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

// Notes sidebar event listeners
notesSidebarBtn.addEventListener('click', () => {
  notesSidebar.classList.toggle('visible');
});

closeSidebarBtn.addEventListener('click', () => {
  notesSidebar.classList.remove('visible');
});

// Search notes event listener
searchNotesInput.addEventListener('input', debounce(() => {
  const query = searchNotesInput.value.trim();
  
  if (query) {
    // Check if it's a tag search
    if (query.startsWith('#')) {
      const tag = query.substring(1);
      const filteredNotes = window.noteManager.filterByTag(tag);
      renderNotesList(filteredNotes);
    } else {
      const searchResults = window.noteManager.searchNotes(query);
      renderNotesList(searchResults);
    }
  } else {
    // Show all notes
    window.noteManager.getAllNotes().then(notes => {
      renderNotesList(notes);
    });
  }
}, 300));

// Share button event listeners
shareBtn.addEventListener('click', () => {
  openShareDialog();
  generateShareLink();
});

copyLinkBtn.addEventListener('click', copyShareLink);
cancelShareBtn.addEventListener('click', closeShareDialog);
confirmShareBtn.addEventListener('click', closeShareDialog);

// New note button event listener
newNoteBtn.addEventListener('click', () => {
  window.noteManager.createNewNote();
});

// Focus mode button event listener
focusModeBtn.addEventListener('click', toggleFocusMode);