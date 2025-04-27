/**
 * Note Manager
 * Handles loading, saving, and auto-saving note content
 */
export function initNoteManager(editorElement, saveCallback = null) {
  let autoSaveTimer = null;
  const AUTO_SAVE_DELAY = 800; // ms - slightly longer delay for better UX
  
  /**
   * Loads saved note content from storage
   */
  async function loadNote() {
    try {
      const noteContent = await window.api.getNote();
      if (noteContent) {
        editorElement.innerHTML = noteContent;
      }
    } catch (error) {
      console.error('Error loading note:', error);
    }
  }
  
  /**
   * Saves the current note content to storage
   */
  async function saveNote() {
    try {
      const noteContent = editorElement.innerHTML;
      await window.api.saveNote(noteContent);
      
      // Call save callback if provided
      if (saveCallback && typeof saveCallback === 'function') {
        saveCallback();
      }
    } catch (error) {
      console.error('Error saving note:', error);
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
    
    saveNote();
  }
  
  return {
    loadNote,
    saveNote,
    initAutoSave,
    forceSave
  };
}