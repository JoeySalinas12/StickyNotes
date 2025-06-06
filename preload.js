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
    
    // Pin window API
    toggleAlwaysOnTop: () => ipcRenderer.invoke('toggle-always-on-top'),
    getAlwaysOnTopState: () => ipcRenderer.invoke('get-always-on-top-state')
  }
);