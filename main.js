const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Secure storage with encryption
const store = new Store({
  encryptionKey: 'your-secure-encryption-key', // Replace with a secure key in production
  clearInvalidConfig: true
});

let mainWindow;
let tray = null;
let isQuitting = false;

// Default window settings
const defaultSettings = {
  width: 320,
  height: 420,
  x: undefined,
  y: undefined,
  theme: 'morning-light',
  font: 'Inter',
  fontSize: 16,
  opacity: 95
};

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
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  isQuitting = true;
});

// Handle IPC messages from renderer
ipcMain.handle('get-settings', () => {
  return store.get('settings', defaultSettings);
});

ipcMain.handle('save-settings', (event, settings) => {
  store.set('settings', settings);
  
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