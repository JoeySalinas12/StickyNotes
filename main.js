const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Persistent storage for app settings
const store = new Store();

let mainWindow;
let tray = null;

// Default window settings
const defaultSettings = {
  width: 300,
  height: 350,
  x: undefined,
  y: undefined,
  theme: 'light',
  font: 'Inter',
  fontSize: 14,
  opacity: 100
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
    minWidth: 240,
    minHeight: 200,
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

  // Open DevTools in development
  // mainWindow.webContents.openDevTools();

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Hide window instead of closing when user clicks 'X'
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
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
      label: 'Pin to Top',
      type: 'checkbox',
      checked: mainWindow ? mainWindow.isAlwaysOnTop() : false,
      click: () => {
        if (mainWindow) {
          const newState = !mainWindow.isAlwaysOnTop();
          mainWindow.setAlwaysOnTop(newState);
        }
      }
    },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => {
        app.isQuitting = true;
        app.quit();
      } 
    }
  ]);
  
  tray.setToolTip('Sticky Notes');
  tray.setContextMenu(contextMenu);
  
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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
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

// Handle IPC messages from renderer
ipcMain.handle('get-settings', () => {
  return store.get('settings', {
    theme: defaultSettings.theme,
    font: defaultSettings.font,
    fontSize: defaultSettings.fontSize,
    opacity: defaultSettings.opacity
  });
});

ipcMain.handle('save-settings', (event, settings) => {
  store.set('settings', settings);
  return true;
});

ipcMain.handle('save-note', (event, noteContent) => {
  store.set('noteContent', noteContent);
  return true;
});

ipcMain.handle('get-note', () => {
  return store.get('noteContent', '');
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

ipcMain.handle('minimize-to-tray', () => {
  if (mainWindow) {
    mainWindow.hide();
    return true;
  }
  return false;
});

// Function to update the tray menu (for toggle states like "Pin to Top")
function updateTrayMenu() {
  if (tray && mainWindow) {
    const contextMenu = Menu.buildFromTemplate([
      { 
        label: 'Show Note', 
        click: () => {
          mainWindow.show();
          mainWindow.focus();
        }
      },
      { 
        label: 'Settings',
        click: () => {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('toggle-settings');
        }
      },
      { type: 'separator' },
      {
        label: 'Pin to Top',
        type: 'checkbox',
        checked: mainWindow.isAlwaysOnTop(),
        click: () => {
          const newState = !mainWindow.isAlwaysOnTop();
          mainWindow.setAlwaysOnTop(newState);
          updateTrayMenu(); // Update menu again
        }
      },
      { type: 'separator' },
      { 
        label: 'Quit', 
        click: () => {
          app.isQuitting = true;
          app.quit();
        } 
      }
    ]);
    
    tray.setContextMenu(contextMenu);
  }
}