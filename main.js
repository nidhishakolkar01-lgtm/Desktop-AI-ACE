const { app, BrowserWindow, ipcMain, screen, shell, session, desktopCapturer } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');

let mainWindow;
let isWidgetMode = false;
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

ipcMain.handle('window:toggle-mode', () => {
  if (!mainWindow) return { mode: 'fullscreen' };
  isWidgetMode = !isWidgetMode;
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.bounds;

  if (isWidgetMode) {
    const w = 460;
    const h = 640;
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setBounds({
      x: width - w - 24,
      y: height - h - 48,
      width: w,
      height: h
    });
  } else {
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setBounds({
      x: 0,
      y: 0,
      width: width,
      height: height
    });
  }
  return { mode: isWidgetMode ? 'widget' : 'fullscreen' };
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

ipcMain.handle('system:volume-control', (event, action) => {
  return new Promise((resolve) => {
    let psCmd = '';
    if (action === 'up') {
      psCmd = '1..5 | ForEach-Object { (New-Object -ComObject Wscript.Shell).SendKeys([char]175) }';
    } else if (action === 'down') {
      psCmd = '1..5 | ForEach-Object { (New-Object -ComObject Wscript.Shell).SendKeys([char]174) }';
    } else if (action === 'mute') {
      psCmd = '(New-Object -ComObject Wscript.Shell).SendKeys([char]173)';
    }
    if (psCmd) {
      exec(`powershell -NoProfile -Command "${psCmd}"`, () => resolve({ success: true }));
    } else {
      resolve({ success: false });
    }
  });
});

ipcMain.handle('system:media-control', (event, action) => {
  return new Promise((resolve) => {
    let psCmd = '';
    if (action === 'playpause') {
      psCmd = '(New-Object -ComObject Wscript.Shell).SendKeys([char]179)';
    } else if (action === 'next') {
      psCmd = '(New-Object -ComObject Wscript.Shell).SendKeys([char]176)';
    } else if (action === 'prev') {
      psCmd = '(New-Object -ComObject Wscript.Shell).SendKeys([char]177)';
    }
    if (psCmd) {
      exec(`powershell -NoProfile -Command "${psCmd}"`, () => resolve({ success: true }));
    } else {
      resolve({ success: false });
    }
  });
});

ipcMain.handle('system:lock-pc', () => {
  exec('rundll32.exe user32.dll,LockWorkStation');
  return { success: true };
});

ipcMain.handle('system:capture-screen', async () => {
  try {
    if (!mainWindow) return { success: false };
    const image = await mainWindow.webContents.capturePage();
    const picturesDir = app.getPath('pictures') || app.getPath('documents');
    const filename = `ACE_AI_Screenshot_${Date.now()}.png`;
    const fullPath = path.join(picturesDir, filename);
    fs.writeFileSync(fullPath, image.toPNG());
    return { success: true, path: fullPath };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('system:fetch-weather', async (event, location) => {
  try {
    const loc = location ? encodeURIComponent(location.trim()) : '';
    const response = await fetch(`https://wttr.in/${loc}?format=j1`, { signal: AbortSignal.timeout(6000) });
    if (!response.ok) return { success: false };
    const data = await response.json();
    const current = data.current_condition?.[0];
    const nearest = data.nearest_area?.[0]?.areaName?.[0]?.value || location || 'Local Area';
    if (!current) return { success: false };
    return {
      success: true,
      area: nearest,
      tempC: current.temp_C,
      tempF: current.temp_F,
      desc: current.weatherDesc?.[0]?.value || 'Clear',
      humidity: current.humidity,
      windSpeedKmph: current.windspeedKmph
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('system:web-search', async (event, query) => {
  try {
    if (!query) return { success: false };
    const q = encodeURIComponent(query.trim());
    const response = await fetch(`https://api.duckduckgo.com/?q=${q}&format=json&no_html=1&skip_disambig=1`, { signal: AbortSignal.timeout(6000) });
    if (response.ok) {
      const data = await response.json();
      const abstract = data.AbstractText || data.Answer || data.Definition;
      if (abstract) {
        return { success: true, result: abstract, source: data.AbstractSource || 'DuckDuckGo' };
      }
    }
    // Fallback Wikipedia summary
    const wikiResp = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${q}`, { signal: AbortSignal.timeout(6000) });
    if (wikiResp.ok) {
      const wikiData = await wikiResp.json();
      if (wikiData.extract) {
        return { success: true, result: wikiData.extract, source: 'Wikipedia' };
      }
    }
    return { success: false };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('system:scan-screen', async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1280, height: 720 }
    });
    if (sources && sources.length > 0) {
      const base64 = sources[0].thumbnail.toJPEG(75).toString('base64');
      return { success: true, base64 };
    }
    return { success: false, error: 'No display sources detected.' };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('system:kill-process', (event, procName) => {
  if (!procName) return { success: false };
  const safeName = procName.replace(/[^a-zA-Z0-9_\-\.]/g, '');
  exec(`taskkill /F /IM "${safeName}.exe"`, () => {});
  return { success: true };
});
