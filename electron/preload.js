const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  // OSD
  onOsdUpdate: (callback) => {
    ipcRenderer.on('osd-update', (_event, data) => callback(data));
  },
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  // Shortcut Capture
  startCapture: (actionId) => ipcRenderer.invoke('start-capture', actionId),
  cancelCapture: () => ipcRenderer.invoke('cancel-capture'),
  onCaptureResult: (callback) => {
    ipcRenderer.on('capture-result', (_event, data) => callback(data));
  },
});
