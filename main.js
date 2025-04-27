const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, clipboard, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');
const fs = require('fs');
const crypto = require('crypto');

// Secure storage with encryption
const store = new Store({
  encryptionKey: 'your-secure-encryption-key', // Replace with a secure key in production
  clearInvalidConfig: true
});

let mainWindow;
let tray = null;
let isQuitting = false;
let syncTimer = null;

// Default window settings
const defaultSettings = {
  width: 320,
  height: 420,
  x: undefined,
  y: undefined,
  theme: 'morning-light',
  font: 'Inter',
  fontSize: 16,
  opacity: 95,
  ultraMinimal: false,
  offlineMode: false,
  calmReminders: true,
  syncEnabled: false,
  customShortcuts: {}
};

// Create a user identifier for sync
let userId = store.get('userId');
if (!userId) {
  userId = crypto.randomUUID();
  store.set('userId', userId);
}

function createWindow() {
  // Load window position from store
  const windowSettings = store.get('windowSettings', defaultSettings);
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: windowSettings.width,
    height: windowSettings.height,
    x: windowSettings.x,
    y: windowSettings.y,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#f5f5f5',
    minWidth: 260,
    minHeight: 220,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    transparent: true,
    vibrancy: 'under-window',
    visualEffectState: 'active',
    frame: false,
    show: false, // Start hidden and show when ready
    opacity: (windowSettings.opacity || 100) / 100,
    icon: path.join(__dirname, 'assets', 'icons', 'app-icon.png')
  });

  // Load the index.html file
  mainWindow.loadFile('index.html');

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Save window position when moved or resized
  ['resize', 'move'].forEach(event => {
    mainWindow.on(event, () => {
      if (!mainWindow.isMaximized()) {
        const { width, height } = mainWindow.getBounds();
        const [x, y] = mainWindow.getPosition();
        
        store.set('windowSettings', {
          ...windowSettings,
          width,
          height,
          x,
          y
        });
      }
    });
  });

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Hide window instead of closing when user clicks 'X'
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
    return true;
  });
}

// Create tray icon
function createTray() {
  const trayIconPath = path.join(__dirname, 'assets', 'icons', 'tray-icon.png');
  const icon = nativeImage.createFromPath(trayIconPath);
  tray = new Tray(icon);
  
  updateTrayMenu();
  
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    } else {
      createWindow();
    }
  });
}

// Update tray menu
function updateTrayMenu() {
  if (!tray) return;
  
  const settings = store.get('settings', defaultSettings);
  const isAlwaysOnTop = mainWindow ? mainWindow.isAlwaysOnTop() : false;
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Show Note', 
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      }
    },
    { 
      label: 'New Note',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('create-new-note');
        } else {
          createWindow();
          setTimeout(() => {
            mainWindow.webContents.send('create-new-note');
          }, 500);
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Focus Mode',
      type: 'checkbox',
      checked: false, // This will be updated by the renderer process
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('toggle-focus-mode');
        }
      }
    },
    {
      label: 'Pin to Top',
      type: 'checkbox',
      checked: isAlwaysOnTop,
      click: () => {
        if (mainWindow) {
          const newState = !mainWindow.isAlwaysOnTop();
          mainWindow.setAlwaysOnTop(newState);
          updateTrayMenu();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Working Offline',
      type: 'checkbox',
      checked: settings.offlineMode,
      click: () => {
        if (mainWindow) {
          settings.offlineMode = !settings.offlineMode;
          store.set('settings', settings);
          mainWindow.webContents.send('settings-changed', { settings });
          updateTrayMenu();
        }
      }
    },
    { type: 'separator' },
    { 
      label: 'Settings', 
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('toggle-settings');
        } else {
          createWindow();
          setTimeout(() => {
            mainWindow.webContents.send('toggle-settings');
          }, 500);
        }
      }
    },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => {
        isQuitting = true;
        app.quit();
      } 
    }
  ]);
  
  tray.setToolTip('Sticky Notes');
  tray.setContextMenu(contextMenu);
}

// Load and initialize the application
app.whenReady().then(() => {
  createWindow();
  createTray();
  
  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
  
  // Set up auto-sync if enabled
  setupAutoSync();
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  isQuitting = true;
});

// Setup cloud sync if enabled
function setupAutoSync() {
  const settings = store.get('settings', defaultSettings);
  
  if (settings.syncEnabled && !settings.offlineMode) {
    // Start sync interval (every 5 minutes)
    syncTimer = setInterval(syncNotes, 5 * 60 * 1000);
    
    // Do an initial sync
    syncNotes();
  } else if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
}

// Sync notes with the cloud
async function syncNotes() {
  const settings = store.get('settings', defaultSettings);
  
  // Skip if sync is disabled or in offline mode
  if (!settings.syncEnabled || settings.offlineMode) return;
  
  try {
    // In a real app, this would connect to a server
    // Here we'll just simulate successful sync
    console.log('Syncing notes with cloud...');
    
    // Notify the renderer process
    if (mainWindow) {
      mainWindow.webContents.send('sync-status', { status: 'syncing' });
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Notify about success
    if (mainWindow) {
      mainWindow.webContents.send('sync-status', { status: 'success' });
    }
    
    console.log('Sync complete');
    return true;
  } catch (error) {
    console.error('Sync error:', error);
    
    // Notify about failure
    if (mainWindow) {
      mainWindow.webContents.send('sync-status', { status: 'error', message: error.message });
    }
    
    return false;
  }
}

// Create share link
function createShareLink(noteId, allowEdit) {
  // Generate a unique share ID
  const shareId = crypto.randomBytes(16).toString('hex');
  
  // Create share info
  const shareInfo = {
    noteId,
    allowEdit,
    createdAt: new Date().toISOString(),
    createdBy: userId,
    expiresAt: null // null means never expires
  };
  
  // Save share info
  const shares = store.get('shares', {});
  shares[shareId] = shareInfo;
  store.set('shares', shares);
  
  return shareId;
}

// Get note data by ID
function getNoteData(noteId) {
  const notes = store.get('notes', {});
  return notes[noteId] || null;
}

// Export notes to file
function exportNotes(format = 'json') {
  const notes = store.get('notes', {});
  
  if (Object.keys(notes).length === 0) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Export Notes',
      message: 'No notes to export.'
    });
    return;
  }
  
  const options = {
    title: 'Export Notes',
    defaultPath: app.getPath('documents') + '/sticky-notes-export',
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'Plain Text', extensions: ['txt'] },
      { name: 'HTML', extensions: ['html'] }
    ]
  };
  
  dialog.showSaveDialog(mainWindow, options).then(result => {
    if (result.canceled) return;
    
    let content;
    const filePath = result.filePath;
    
    if (filePath.endsWith('.json')) {
      content = JSON.stringify(notes, null, 2);
    } else if (filePath.endsWith('.txt')) {
      content = Object.values(notes).map(note => {
        // Strip HTML and get plain text
        const tempEl = document.createElement('div');
        tempEl.innerHTML = note.content;
        const textContent = tempEl.textContent || tempEl.innerText || '';
        
        return `${note.title || 'Untitled Note'}\n` +
               `Created: ${new Date(note.createdAt).toLocaleString()}\n` +
               `Updated: ${new Date(note.updatedAt).toLocaleString()}\n` +
               `Tags: ${(note.tags || []).join(', ')}\n\n` +
               `${textContent}\n\n${'='.repeat(40)}\n\n`;
      }).join('');
    } else if (filePath.endsWith('.html')) {
      content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Sticky Notes Export</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    .note { margin-bottom: 40px; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .note-title { margin-top: 0; color: #333; }
    .note-meta { font-size: 0.8em; color: #777; margin-bottom: 15px; }
    .note-content { line-height: 1.7; }
    .note-tags { margin-top: 15px; }
    .tag { display: inline-block; background: #f0f0f0; padding: 3px 8px; border-radius: 4px; font-size: 0.8em; margin-right: 5px; color: #555; }
  </style>
</head>
<body>
  <h1>Sticky Notes Export</h1>
  <p>Exported on ${new Date().toLocaleString()}</p>
  ${Object.values(notes).map(note => `
    <div class="note">
      <h2 class="note-title">${note.title || 'Untitled Note'}</h2>
      <div class="note-meta">
        Created: ${new Date(note.createdAt).toLocaleString()}<br>
        Updated: ${new Date(note.updatedAt).toLocaleString()}
      </div>
      <div class="note-content">${note.content}</div>
      ${note.tags && note.tags.length > 0 ? `
        <div class="note-tags">
          ${note.tags.map(tag => `<span class="tag">#${tag}</span>`).join(' ')}
        </div>
      ` : ''}
    </div>
  `).join('')}
</body>
</html>`;
    }
    
    fs.writeFile(filePath, content, err => {
      if (err) {
        dialog.showMessageBox(mainWindow, {
          type: 'error',
          title: 'Export Error',
          message: 'Failed to export notes: ' + err.message
        });
      } else {
        dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: 'Export Complete',
          message: 'Notes exported successfully!'
        });
      }
    });
  });
}

// Import notes from file
function importNotes() {
  const options = {
    title: 'Import Notes',
    filters: [
      { name: 'JSON Files', extensions: ['json'] }
    ],
    properties: ['openFile']
  };
  
  dialog.showOpenDialog(mainWindow, options).then(result => {
    if (result.canceled) return;
    
    const filePath = result.filePaths[0];
    
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        dialog.showMessageBox(mainWindow, {
          type: 'error',
          title: 'Import Error',
          message: 'Failed to read file: ' + err.message
        });
        return;
      }
      
      try {
        const importedNotes = JSON.parse(data);
        const currentNotes = store.get('notes', {});
        
        // Merge imported notes with current notes
        const mergedNotes = { ...currentNotes, ...importedNotes };
        store.set('notes', mergedNotes);
        
        dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: 'Import Complete',
          message: `Successfully imported ${Object.keys(importedNotes).length} notes!`
        });
        
        // Refresh notes in renderer
        if (mainWindow) {
          mainWindow.webContents.send('notes-imported');
        }
      } catch (error) {
        dialog.showMessageBox(mainWindow, {
          type: 'error',
          title: 'Import Error',
          message: 'Failed to parse file: ' + error.message
        });
      }
    });
  });
}

// Handle IPC messages from renderer
ipcMain.handle('get-settings', () => {
  return store.get('settings', defaultSettings);
});

ipcMain.handle('save-settings', (event, settings) => {
  store.set('settings', settings);
  
  // Update sync timer if sync settings changed
  setupAutoSync();
  
  // Update tray menu to reflect new settings
  updateTrayMenu();
  
  return true;
});

ipcMain.handle('get-note', (event, noteId = 'default') => {
  const notes = store.get('notes', {});
  return notes[noteId] || null;
});

ipcMain.handle('save-note', (event, noteId, noteData) => {
  const notes = store.get('notes', {});
  notes[noteId] = noteData;
  store.set('notes', notes);
  return true;
});

ipcMain.handle('delete-note', (event, noteId) => {
  const notes = store.get('notes', {});
  
  if (notes[noteId]) {
    delete notes[noteId];
    store.set('notes', notes);
    return true;
  }
  
  return false;
});

ipcMain.handle('get-all-notes', () => {
  return Object.values(store.get('notes', {}));
});

ipcMain.handle('toggle-always-on-top', () => {
  const isAlwaysOnTop = mainWindow.isAlwaysOnTop();
  mainWindow.setAlwaysOnTop(!isAlwaysOnTop);
  
  // Update tray menu to reflect the new state
  updateTrayMenu();
  
  return !isAlwaysOnTop;
});

ipcMain.handle('get-always-on-top-state', () => {
  return mainWindow.isAlwaysOnTop();
});

ipcMain.handle('set-window-opacity', (event, opacity) => {
  if (mainWindow) {
    mainWindow.setOpacity(opacity);
    
    // Save the opacity setting to the window settings
    const windowSettings = store.get('windowSettings', defaultSettings);
    store.set('windowSettings', {
      ...windowSettings,
      opacity: opacity * 100
    });
    
    return true;
  }
  return false;
});

ipcMain.handle('create-share-link', (event, noteId, allowEdit) => {
  return createShareLink(noteId, allowEdit);
});

ipcMain.handle('get-share-link', (event, shareId) => {
  const shares = store.get('shares', {});
  return shares[shareId] || null;
});

ipcMain.handle('save-share-link', (event, shareId, shareInfo) => {
  const shares = store.get('shares', {});
  shares[shareId] = shareInfo;
  store.set('shares', shares);
  return true;
});

ipcMain.handle('get-sync-status', () => {
  const settings = store.get('settings', defaultSettings);
  return settings.syncEnabled && !settings.offlineMode;
});

ipcMain.handle('sync-notes', syncNotes);

ipcMain.handle('export-notes', (event, format) => {
  exportNotes(format);
  return true;
});

ipcMain.handle('import-notes', () => {
  importNotes();
  return true;
});

// The application is initialized and running