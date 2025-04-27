/**
 * Note Manager
 * Handles loading, saving, and auto-saving note content
 */
export function initNoteManager(editorElement) {
  let autoSaveTimer = null;
  const AUTO_SAVE_DELAY = 500; // ms
  
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
    } catch (error) {
      console.error('Error saving note:', error);
    }
  }
  
  /**
   * Sets up auto-save functionality
   */
  function initAutoSave() {
    // Function to handle content changes
    const handleChange = () => {
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
      saveNote();
    });
  }
  
  return {
    loadNote,
    saveNote,
    initAutoSave
  };
}