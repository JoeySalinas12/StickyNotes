/**
 * Note Manager
 * Handles loading, saving, and auto-saving note content
 */
export function initNoteManager(editorElement, tagsDisplayElement = null) {
  let autoSaveTimer = null;
  let currentNoteId = 'default';
  const AUTO_SAVE_DELAY = 800; // ms - slightly longer delay for better UX
  let calmRemindersEnabled = true;
  let calmReminderTimer = null;
  
  /**
   * Loads saved note content from storage
   */
  async function loadNote(noteId = 'default') {
    try {
      currentNoteId = noteId || 'default';
      const noteContent = await window.api.getNote(currentNoteId);
      
      if (noteContent) {
        editorElement.innerHTML = noteContent.content || '';
        
        // Update tags display if available
        if (tagsDisplayElement) {
          updateTagsDisplay(extractTags(noteContent.content || ''));
        }
        
        return true;
      } else {
        editorElement.innerHTML = '';
        return false;
      }
    } catch (error) {
      console.error('Error loading note:', error);
      return false;
    }
  }
  
  /**
   * Saves the current note content to storage
   */
  async function saveNote() {
    try {
      const noteContent = editorElement.innerHTML;
      const tags = extractTags(noteContent);
      
      const noteData = {
        id: currentNoteId,
        content: noteContent,
        title: extractTitle(noteContent) || 'Untitled Note',
        tags: tags,
        updatedAt: new Date().toISOString(),
        createdAt: Date.now() // This would be preserved on update in a real implementation
      };
      
      await window.api.saveNote(currentNoteId, noteData);
      
      // Update tags display if available
      if (tagsDisplayElement) {
        updateTagsDisplay(tags);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving note:', error);
      return false;
    }
  }
  
  /**
   * Sets up auto-save functionality
   */
  function initAutoSave() {
    let lastContent = editorElement.innerHTML;
    
    // Function to handle content changes
    const handleChange = () => {
      // Only save if content actually changed
      const currentContent = editorElement.innerHTML;
      if (currentContent === lastContent) {
        return;
      }
      
      lastContent = currentContent;
      
      // Clear any existing timer
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
      
      // Set a new timer to save after delay
      autoSaveTimer = setTimeout(() => {
        saveNote();
      }, AUTO_SAVE_DELAY);
    };
    
    // Add event listeners for content changes
    editorElement.addEventListener('input', handleChange);
    editorElement.addEventListener('keyup', handleChange);
    editorElement.addEventListener('paste', handleChange);
    editorElement.addEventListener('cut', handleChange);
    
    // Save when editor loses focus
    editorElement.addEventListener('blur', () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
      }
      
      // Only save if content changed
      const currentContent = editorElement.innerHTML;
      if (currentContent !== lastContent) {
        lastContent = currentContent;
        saveNote();
      }
    });
  }
  
  /**
   * Explicitly saves the current note content
   */
  function forceSave() {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = null;
    }
    
    return saveNote();
  }
  
  /**
   * Creates a new empty note
   */
  function createNewNote() {
    currentNoteId = 'note-' + Date.now();
    editorElement.innerHTML = '';
    saveNote();
    
    return currentNoteId;
  }
  
  /**
   * Gets the current note ID
   */
  function getCurrentNoteId() {
    return currentNoteId;
  }
  
  /**
   * Extracts title from note content
   */
  function extractTitle(content) {
    if (!content) return '';
    
    // Create a temporary element to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    // Look for headings first
    const heading = tempDiv.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      return heading.textContent.trim();
    }
    
    // If no heading, try to get the first line
    const firstParagraph = tempDiv.querySelector('p');
    if (firstParagraph) {
      const text = firstParagraph.textContent.trim();
      return text.split('\n')[0].substring(0, 30) + (text.length > 30 ? '...' : '');
    }
    
    // Fallback to raw text
    const text = tempDiv.textContent.trim();
    if (text) {
      return text.split('\n')[0].substring(0, 30) + (text.length > 30 ? '...' : '');
    }
    
    return '';
  }
  
  /**
   * Extracts tags from note content
   */
  function extractTags(content) {
    if (!content) return [];
    
    // Look for hashtags in the content
    const regex = /#([a-zA-Z0-9_]+)/g;
    const matches = content.match(regex);
    
    if (!matches) return [];
    
    // Remove # and deduplicate
    return [...new Set(matches.map(match => match.substring(1)))];
  }
  
  /**
   * Updates the tags display
   */
  function updateTagsDisplay(tags) {
    if (!tagsDisplayElement) return;
    
    tagsDisplayElement.innerHTML = '';
    
    tags.forEach(tag => {
      const tagElement = document.createElement('span');
      tagElement.className = 'tag';
      tagElement.textContent = '#' + tag;
      
      // Add click handler for filtering by tag
      tagElement.addEventListener('click', () => {
        // Dispatch custom event for filtering by tag
        window.dispatchEvent(new CustomEvent('filter-notes-by-tag', {
          detail: tag
        }));
      });
      
      tagsDisplayElement.appendChild(tagElement);
    });
  }
  
  /**
   * Enhances tags in the editor
   */
  function enhanceTagsInEditor() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const savedRange = range.cloneRange();
    
    // Process the editor content
    const content = editorElement.innerHTML;
    
    // Look for hashtags
    const regex = /#([a-zA-Z0-9_]+)/g;
    let match;
    
    // Create a temporary div for manipulation
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    // Process text nodes
    const walker = document.createTreeWalker(
      tempDiv,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }
    
    // Process in reverse to avoid offset issues when replacing
    textNodes.reverse().forEach(node => {
      const text = node.textContent;
      
      // Reset regex
      regex.lastIndex = 0;
      
      // Get all matches for this text node
      const matches = [];
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          start: match.index,
          end: regex.lastIndex,
          tag: match[0],
          name: match[1]
        });
      }
      
      // Process matches in reverse
      matches.reverse().forEach(match => {
        // Only process if not already in a tag span
        if (!isInTagSpan(node)) {
          // Split the text node
          const beforeText = text.substring(0, match.start);
          const afterText = text.substring(match.end);
          
          // Create a new tag element
          const tagEl = document.createElement('span');
          tagEl.className = 'tag';
          tagEl.contentEditable = 'false';
          tagEl.textContent = match.tag;
          
          // Replace the text node
          const beforeNode = document.createTextNode(beforeText);
          const afterNode = document.createTextNode(afterText);
          
          node.parentNode.insertBefore(beforeNode, node);
          node.parentNode.insertBefore(tagEl, node);
          node.parentNode.insertBefore(afterNode, node);
          node.parentNode.removeChild(node);
        }
      });
    });
    
    // Only update if changes were made
    if (textNodes.length > 0 && tempDiv.innerHTML !== content) {
      // Preserve selection if possible
      const selectionStart = savedRange.startOffset;
      const selectionEnd = savedRange.endOffset;
      
      editorElement.innerHTML = tempDiv.innerHTML;
      
      try {
        // Attempt to restore selection
        selection.removeAllRanges();
        selection.addRange(savedRange);
      } catch (e) {
        console.warn('Could not restore selection after tag enhancement');
      }
      
      // Save the note after enhancement
      forceSave();
    }
  }
  
  /**
   * Checks if a node is inside a tag span
   */
  function isInTagSpan(node) {
    let current = node.parentNode;
    while (current && current !== editorElement) {
      if (current.classList && current.classList.contains('tag')) {
        return true;
      }
      current = current.parentNode;
    }
    return false;
  }
  
  /**
   * Gets all unique tags from all notes
   */
  async function getAllTags() {
    try {
      const notes = await window.api.getAllNotes();
      
      if (!notes || notes.length === 0) {
        return [];
      }
      
      // Extract tags from all notes and deduplicate
      const allTags = notes.reduce((tags, note) => {
        if (note.tags && Array.isArray(note.tags)) {
          return [...tags, ...note.tags];
        }
        return tags;
      }, []);
      
      return [...new Set(allTags)];
    } catch (error) {
      console.error('Error getting all tags:', error);
      return [];
    }
  }
  
  /**
   * Filters notes by tag
   */
  async function filterByTag(tag) {
    try {
      const notes = await window.api.getAllNotes();
      
      if (!notes || notes.length === 0) {
        return [];
      }
      
      // Filter notes that contain the tag
      return notes.filter(note => {
        return note.tags && Array.isArray(note.tags) && note.tags.includes(tag);
      });
    } catch (error) {
      console.error('Error filtering by tag:', error);
      return [];
    }
  }
  
  /**
   * Searches notes by query
   */
  async function searchNotes(query) {
    try {
      const notes = await window.api.getAllNotes();
      
      if (!notes || notes.length === 0 || !query) {
        return [];
      }
      
      // Normalize query to lowercase for case-insensitive search
      const normalizedQuery = query.toLowerCase();
      
      // Check if it's a tag search
      if (normalizedQuery.startsWith('#')) {
        const tag = normalizedQuery.substring(1);
        return filterByTag(tag);
      }
      
      // Search in title, content, and tags
      return notes.filter(note => {
        const titleMatch = note.title && note.title.toLowerCase().includes(normalizedQuery);
        const contentMatch = note.content && note.content.toLowerCase().includes(normalizedQuery);
        const tagMatch = note.tags && Array.isArray(note.tags) && 
                        note.tags.some(tag => tag.toLowerCase().includes(normalizedQuery));
        
        return titleMatch || contentMatch || tagMatch;
      });
    } catch (error) {
      console.error('Error searching notes:', error);
      return [];
    }
  }
  
  /**
   * Gets all notes
   */
  async function getAllNotes() {
    try {
      return await window.api.getAllNotes() || [];
    } catch (error) {
      console.error('Error getting all notes:', error);
      return [];
    }
  }
  
  /**
   * Sorts notes by key
   */
  function sortNotes(notes, key = 'updatedAt', ascending = false) {
    if (!notes || notes.length === 0) {
      return [];
    }
    
    const sortedNotes = [...notes];
    
    sortedNotes.sort((a, b) => {
      let aValue, bValue;
      
      // Handle different keys
      switch (key) {
        case 'title':
          aValue = (a.title || '').toLowerCase();
          bValue = (b.title || '').toLowerCase();
          break;
        case 'created':
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        case 'updated':
        default:
          aValue = new Date(a.updatedAt || 0).getTime();
          bValue = new Date(b.updatedAt || 0).getTime();
          break;
      }
      
      // Sort ascending or descending
      if (ascending) {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return sortedNotes;
  }
  
  /**
   * Set offline mode
   */
  function setOfflineMode(offline) {
    console.log('Offline mode ' + (offline ? 'enabled' : 'disabled'));
    
    // This would normally update offline status with the main process
    try {
      // Simulate API call
      console.log('Setting offline mode:', offline);
    } catch (error) {
      console.error('Error setting offline mode:', error);
    }
  }
  
  /**
   * Attempt to sync notes with cloud
   */
  async function trySync() {
    try {
      // This would normally trigger a sync with the main process
      console.log('Attempting to sync notes...');
      
      // Simulate a sync call
      return true;
    } catch (error) {
      console.error('Error syncing notes:', error);
      return false;
    }
  }
  
  /**
   * Creates a share link for the current note
   */
  async function createShareLink(allowEdit) {
    try {
      // This would normally call the main process to create a share link
      console.log('Creating share link, allow edit:', allowEdit);
      
      // Return a mock share link
      return 'https://example.com/shared-note/' + currentNoteId + (allowEdit ? '?edit=true' : '');
    } catch (error) {
      console.error('Error creating share link:', error);
      return null;
    }
  }
  
  /**
   * Schedule calm reminders
   */
  function scheduleCalmReminders(enabled = true) {
    calmRemindersEnabled = enabled;
    
    // Clear any existing timer
    if (calmReminderTimer) {
      clearTimeout(calmReminderTimer);
      calmReminderTimer = null;
    }
    
    // Find the calm reminder element
    const calmReminder = document.getElementById('calm-reminder');
    if (!calmReminder) return;
    
    // Always hide the reminder initially
    calmReminder.classList.add('hidden');
    
    // If reminders are disabled, just return
    if (!enabled) return;
    
    // For demonstration, show a reminder after a delay
    // In a real app, this would be more sophisticated
    const REMINDER_DELAY = 180000; // 3 minutes
    
    calmReminderTimer = setTimeout(() => {
      // Show the reminder
      calmReminder.classList.remove('hidden');
      
      // Set up a timer to hide it after a while if not interacted with
      setTimeout(() => {
        calmReminder.classList.add('hidden');
      }, 30000); // Hide after 30 seconds
    }, REMINDER_DELAY);
  }
  
  // Return the public API
  return {
    loadNote,
    saveNote,
    initAutoSave,
    forceSave,
    createNewNote,
    getCurrentNoteId,
    getAllTags,
    filterByTag,
    searchNotes,
    getAllNotes,
    enhanceTagsInEditor,
    sortNotes,
    setOfflineMode,
    trySync,
    createShareLink,
    scheduleCalmReminders
  };
}