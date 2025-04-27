const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // Settings API
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
    
    // Note Content API
    saveNote: (noteId, noteData) => ipcRenderer.invoke('save-note', noteId, noteData),
    getNote: (noteId) => ipcRenderer.invoke('get-note', noteId),
    getAllNotes: () => ipcRenderer.invoke('get-all-notes'),
    deleteNote: (noteId) => ipcRenderer.invoke('delete-note', noteId),
    
    // Window Control API
    setWindowOpacity: (opacity) => ipcRenderer.invoke('set-window-opacity', opacity),
    
    // Event listeners
    onToggleSettings: (callback) => {
      ipcRenderer.on('toggle-settings', () => callback());
      
      // Return a function to remove the event listener
      return () => {
        ipcRenderer.removeListener('toggle-settings', callback);
      };
    },
    
    onCreateNewNote: (callback) => {
      ipcRenderer.on('create-new-note', () => callback());
      return () => {
        ipcRenderer.removeListener('create-new-note', callback);
      };
    },
    
    onToggleFocusMode: (callback) => {
      ipcRenderer.on('toggle-focus-mode', () => callback());
      return () => {
        ipcRenderer.removeListener('toggle-focus-mode', callback);
      };
    },
    
    onSyncStatus: (callback) => {
      ipcRenderer.on('sync-status', (event, status) => callback(status));
      return () => {
        ipcRenderer.removeListener('sync-status', callback);
      };
    },
    
    onSettingsChanged: (callback) => {
      ipcRenderer.on('settings-changed', (event, data) => callback(data));
      return () => {
        ipcRenderer.removeListener('settings-changed', callback);
      };
    },
    
    onNotesImported: (callback) => {
      ipcRenderer.on('notes-imported', () => callback());
      return () => {
        ipcRenderer.removeListener('notes-imported', callback);
      };
    },
    
    // Pin window API
    toggleAlwaysOnTop: () => ipcRenderer.invoke('toggle-always-on-top'),
    getAlwaysOnTopState: () => ipcRenderer.invoke('get-always-on-top-state'),
    
    // Sharing API
    createShareLink: (noteId, allowEdit) => ipcRenderer.invoke('create-share-link', noteId, allowEdit),
    getShareLink: (shareId) => ipcRenderer.invoke('get-share-link', shareId),
    saveShareLink: (shareId, shareInfo) => ipcRenderer.invoke('save-share-link', shareId, shareInfo),
    
    // Sync API
    getSyncStatus: () => ipcRenderer.invoke('get-sync-status'),
    syncNotes: () => ipcRenderer.invoke('sync-notes'),
    
    // Export/Import API
    exportNotes: (format) => ipcRenderer.invoke('export-notes', format),
    importNotes: () => ipcRenderer.invoke('import-notes')
  }
);