/**
 * Note Manager
 * Handles loading, saving, and auto-saving note content
 */
export function initNoteManager(editorElement) {
  let autoSaveTimer = null;
  let currentNoteId = 'default';
  const AUTO_SAVE_DELAY = 800; // ms
  
  /**
   * Loads saved note content from storage
   */
  async function loadNote(noteId = 'default') {
    try {
      currentNoteId = noteId || 'default';
      const noteContent = await window.api.getNote(currentNoteId);
      
      if (noteContent) {
        editorElement.innerHTML = noteContent.content || '';
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
      
      const noteData = {
        id: currentNoteId,
        content: noteContent,
        updatedAt: new Date().toISOString(),
        createdAt: Date.now() // This would be preserved on update in a real implementation
      };
      
      await window.api.saveNote(currentNoteId, noteData);
      
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
   * Gets the current note ID
   */
  function getCurrentNoteId() {
    return currentNoteId;
  }
  
  // Return the public API
  return {
    loadNote,
    saveNote,
    initAutoSave,
    forceSave,
    getCurrentNoteId
  };
}