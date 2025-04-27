const { app, BrowserWindow, ipcMain, Menu, Tray } = require('electron');
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
  fontSize: 14
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
    minWidth: 200,
    minHeight: 200,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the index.html file
  mainWindow.loadFile('index.html');

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
  tray = new Tray(path.join(__dirname, 'assets', 'icons', 'tray-icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Show Note', 
      click: () => mainWindow.show() 
    },
    { 
      label: 'Settings',
      click: () => {
        mainWindow.show();
        mainWindow.webContents.send('toggle-settings');
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
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
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
    fontSize: defaultSettings.fontSize
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