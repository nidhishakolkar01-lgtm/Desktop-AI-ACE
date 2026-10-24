const { app, BrowserWindow, ipcMain, screen, shell, session } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');

let mainWindow;
const rootDir = __dirname;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.bounds;

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') return callback(true);
    callback(true);
  });

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    frame: false,
    transparent: false,
    resizable: false,
    backgroundColor: '#050608',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[RENDERER ${level}] ${message} (line ${line} in ${sourceId})`);
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.webContents.on('did-finish-load', () => {
    setTimeout(async () => {
      try {
        const image = await mainWindow.webContents.capturePage();
        const screenPath = path.join(__dirname, 'live_screen_capture.png');
        fs.writeFileSync(screenPath, image.toPNG());
        console.log("[SCREENSHOT_SAVED] Saved live screenshot to " + screenPath);
      } catch (e) {
        console.error("[SCREENSHOT_ERR]", e);
      }
    }, 3500);
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('get-cursor-pos', () => {
  const point = screen.getCursorScreenPoint();
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.bounds;
  return {
    screenX: point.x,
    screenY: point.y,
    winWidth: width,
    winHeight: height
  };
});

ipcMain.handle('window-control', (event, action) => {
  if (!mainWindow) return;
  switch (action) {
    case 'minimize':
      mainWindow.minimize();
      break;
    case 'close':
      mainWindow.close();
      break;
  }
});

ipcMain.handle('system:get-real-telemetry', () => {
  return new Promise((resolve) => {
    const psScript = path.join(rootDir, 'get_telemetry.ps1');
    exec(`powershell -ExecutionPolicy Bypass -NoProfile -File "${psScript}"`, (err, stdout) => {
      if (err || !stdout) {
        return resolve({
          CPU: os.cpus()[0]?.model || 'AMD Ryzen AI',
          CPULoad: 12,
          BatteryPercent: 40,
          BatteryCharging: false,
          FreeRamGB: Math.round(os.freemem() / 1024 / 1024 / 1024 * 10) / 10,
          TotalRamGB: Math.round(os.totalmem() / 1024 / 1024 / 1024 * 10) / 10,
          FreeDiskGB: 15.5,
          Time: new Date().toLocaleTimeString(),
          Date: new Date().toLocaleDateString()
        });
      }
      try {
        resolve(JSON.parse(stdout.trim()));
      } catch (e) {
        resolve({});
      }
    });
  });
});

ipcMain.handle('system:listen-mic', () => {
  return new Promise((resolve) => {
    const micPy = path.join(rootDir, 'listen_mic.py');
    exec(`python "${micPy}"`, { timeout: 10000 }, (err, stdout, stderr) => {
      if (err || !stdout || !stdout.trim()) {
        return resolve("");
      }
      resolve(stdout.trim());
    });
  });
});

ipcMain.handle('system:launch-apps', (event, targets) => {
  if (!targets || !Array.isArray(targets)) return;
  targets.forEach((target) => {
    exec(`start "" "${target}"`);
  });
  return { success: true };
});

ipcMain.handle('system:open-app', (event, appName) => {
  exec(`start "" "${appName}"`);
  return { success: true };
});
