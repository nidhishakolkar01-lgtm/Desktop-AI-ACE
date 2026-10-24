const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getCursorPos: () => ipcRenderer.invoke('get-cursor-pos'),
  windowControl: (action) => ipcRenderer.invoke('window-control', action),
  openApp: (appName) => ipcRenderer.invoke('system:open-app', appName),
  launchApps: (targets) => ipcRenderer.invoke('system:launch-apps', targets),
  getRealTelemetry: () => ipcRenderer.invoke('system:get-real-telemetry'),
  listenMic: () => ipcRenderer.invoke('system:listen-mic')
});
