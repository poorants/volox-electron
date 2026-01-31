const { app, ipcMain, BrowserWindow } = require('electron');
const { createTray, destroyTray, setTrayState } = require('./tray');
const { createOsdWindow, showOsd, destroyOsd } = require('./osd');
const { startHook, stopHook, startCapture, cancelCapture } = require('./input-hook');
const { adjustVolume, toggleMute } = require('./volume');
const { getSettings, saveSettings } = require('./settings');

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    app.dock.hide();
  }

  createTray(app);
  createOsdWindow();

  // IPC: Settings
  ipcMain.handle('get-settings', () => getSettings());
  ipcMain.handle('save-settings', (_event, settings) => {
    saveSettings(settings);
    return true;
  });

  // IPC: Shortcut Capture
  ipcMain.handle('start-capture', (_event, actionId) => {
    startCapture((result) => {
      // Send capture result to all settings windows
      BrowserWindow.getAllWindows().forEach((win) => {
        win.webContents.send('capture-result', {
          actionId,
          modifier: result.modifier,
          trigger: result.trigger,
        });
      });
    });
  });

  ipcMain.handle('cancel-capture', () => {
    cancelCapture();
  });

  // Wheel speed multiplier
  let lastWheelTime = 0;
  function getSpeedMultiplier() {
    const now = Date.now();
    const interval = now - lastWheelTime;
    lastWheelTime = now;
    if (interval < 50) return 4;
    if (interval < 100) return 3;
    if (interval < 150) return 2;
    return 1;
  }

  // Match event against shortcut config
  function matchesShortcut(event, shortcut) {
    if (!shortcut || !event.modifiers[shortcut.modifier]) return false;

    if (event.type === 'wheel') {
      if (shortcut.trigger === 'wheelUp' && event.direction === 'up') return true;
      if (shortcut.trigger === 'wheelDown' && event.direction === 'down') return true;
    } else if (event.type === 'middleClick') {
      if (shortcut.trigger === 'middleClick') return true;
    }
    return false;
  }

  startHook((event) => {
    const currentSettings = getSettings();
    const shortcuts = currentSettings.shortcuts;
    const osdDuration = currentSettings.osd.duration;

    if (event.type === 'wheel') {
      // Check volume up
      if (matchesShortcut(event, shortcuts.volumeUp)) {
        const step = currentSettings.volume.step * getSpeedMultiplier();
        adjustVolume('up', step).then((result) => {
          showOsd('volume', result.volume, osdDuration, result.muted);
        });
        return;
      }

      // Check volume down
      if (matchesShortcut(event, shortcuts.volumeDown)) {
        const step = currentSettings.volume.step * getSpeedMultiplier();
        adjustVolume('down', step).then((result) => {
          showOsd('volume', result.volume, osdDuration, result.muted);
        });
        return;
      }

      // Check mute (wheel-based)
      if (matchesShortcut(event, shortcuts.mute)) {
        toggleMute().then((result) => {
          showOsd('mute', result.volume, osdDuration, result.muted);
          setTrayState(result.muted ? 'muted' : 'normal');
        });
        return;
      }
    }

    if (event.type === 'middleClick') {
      // Check mute (middle click)
      if (matchesShortcut(event, shortcuts.mute)) {
        toggleMute().then((result) => {
          showOsd('mute', result.volume, osdDuration, result.muted);
          setTrayState(result.muted ? 'muted' : 'normal');
        });
        return;
      }

      // Check volume shortcuts mapped to middle click
      if (matchesShortcut(event, shortcuts.volumeUp)) {
        adjustVolume('up', currentSettings.volume.step).then((result) => {
          showOsd('volume', result.volume, osdDuration, result.muted);
        });
        return;
      }
      if (matchesShortcut(event, shortcuts.volumeDown)) {
        adjustVolume('down', currentSettings.volume.step).then((result) => {
          showOsd('volume', result.volume, osdDuration, result.muted);
        });
        return;
      }
    }
  });
});

app.on('window-all-closed', (e) => {
  e.preventDefault();
});

app.on('before-quit', () => {
  stopHook();
  destroyOsd();
  destroyTray();
});
