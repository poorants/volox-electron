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
  // Tray menu
  getTrayMenuState: () => ipcRenderer.invoke('get-volume-state'),
  setVolume: (vol) => ipcRenderer.invoke('set-volume', vol),
  trayToggleMute: () => ipcRenderer.invoke('toggle-mute-from-tray'),
  openSettings: () => ipcRenderer.invoke('open-settings'),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  onTrayMenuUpdate: (callback) => {
    ipcRenderer.on('tray-menu-action', (_event, data) => callback(data));
  },
  // Theme
  getTheme: () => ipcRenderer.invoke('get-theme'),
  setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),
  onThemeChanged: (callback) => {
    ipcRenderer.on('theme-changed', (_event, theme) => callback(theme));
  },
  openThemePicker: () => ipcRenderer.invoke('open-theme-picker'),
});
