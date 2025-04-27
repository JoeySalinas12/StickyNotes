const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // Settings API
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
    
    // Note Content API
    saveNote: (noteContent) => ipcRenderer.invoke('save-note', noteContent),
    getNote: () => ipcRenderer.invoke('get-note'),
    
    // Window Control API
    setWindowOpacity: (opacity) => ipcRenderer.invoke('set-window-opacity', opacity),
    minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),
    
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