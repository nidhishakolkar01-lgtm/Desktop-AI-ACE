const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getCursorPos: () => ipcRenderer.invoke('get-cursor-pos'),
  windowControl: (action) => ipcRenderer.invoke('window-control', action),
  openApp: (appName) => ipcRenderer.invoke('system:open-app', appName),
  launchApps: (targets) => ipcRenderer.invoke('system:launch-apps', targets),
  getRealTelemetry: () => ipcRenderer.invoke('system:get-real-telemetry'),
  listenMic: () => ipcRenderer.invoke('system:listen-mic'),
  volumeControl: (action) => ipcRenderer.invoke('system:volume-control', action),
  mediaControl: (action) => ipcRenderer.invoke('system:media-control', action),
  lockPC: () => ipcRenderer.invoke('system:lock-pc'),
  captureScreen: () => ipcRenderer.invoke('system:capture-screen'),
  fetchWeather: (location) => ipcRenderer.invoke('system:fetch-weather', location),
  webSearch: (query) => ipcRenderer.invoke('system:web-search', query),
  toggleMode: () => ipcRenderer.invoke('window:toggle-mode'),
  scanScreen: () => ipcRenderer.invoke('system:scan-screen'),
  killProcess: (name) => ipcRenderer.invoke('system:kill-process', name)
});
