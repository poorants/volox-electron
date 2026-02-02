const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { app, ipcMain, BrowserWindow } = require('electron');
const { createTray, destroyTray, setTrayState } = require('./tray');
const { createOsdWindow, showOsd, destroyOsd } = require('./osd');
const { openAuthWindow, closeAuthWindow, destroyAuthWindow } = require('./auth');
const inputHook = require('./input-hook');
const { adjustVolume, adjustVolumeSync, getCurrentVolume, toggleMute } = require('./volume');

// Acceleration: consecutive same-direction inputs within 500ms ramp up step (max 5%)
const accel = { direction: null, lastTime: 0, step: 0 };
const ACCEL_WINDOW = 500;
const ACCEL_MAX = 10;

function getAcceleratedStep(direction, baseStep) {
  const now = Date.now();
  if (direction === accel.direction && (now - accel.lastTime) < ACCEL_WINDOW) {
    accel.step = Math.min(accel.step + 1, ACCEL_MAX);
  } else {
    accel.step = baseStep;
    accel.direction = direction;
  }
  accel.lastTime = now;
  return accel.step;
}
const { getSettings, saveSettings, getTheme, setTheme, getUser, setUser } = require('./settings');

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
  getCurrentVolume(); // initialize volume cache

  // IPC: Settings
  ipcMain.handle('get-settings', () => getSettings());
  ipcMain.handle('save-settings', (_event, settings) => {
    saveSettings(settings);
    if (inputHook.bindShortcuts) {
      inputHook.bindShortcuts(getSettings().shortcuts);
    }
    if (settings.autoStart !== undefined) {
      app.setLoginItemSettings({ openAtLogin: settings.autoStart });
    }
    return true;
  });

  // IPC: Shortcut Capture
  ipcMain.handle('start-capture', (_event, actionId) => {
    inputHook.startCapture((result) => {
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
    inputHook.cancelCapture();
  });

  // IPC: Tray menu
  ipcMain.handle('get-volume-state', async () => {
    const vol = await getCurrentVolume();
    const loudness = require('loudness');
    const muted = await loudness.getMuted().catch(() => false);
    return { volume: vol, muted };
  });

  ipcMain.handle('set-volume', async (_event, vol) => {
    const loudness = require('loudness');
    await loudness.setVolume(vol);
    return true;
  });

  ipcMain.handle('toggle-mute-from-tray', async () => {
    const result = await toggleMute();
    setTrayState(result.muted ? 'muted' : 'normal');
    return result;
  });

  ipcMain.handle('open-settings', () => {
    const { openSettings } = require('./tray');
    openSettings();
  });

  ipcMain.handle('open-theme-picker', () => {
    const { openThemePicker } = require('./tray');
    openThemePicker();
  });

  ipcMain.handle('quit-app', () => {
    app.quit();
  });

  // IPC: Theme
  ipcMain.handle('get-theme', () => getTheme());
  ipcMain.handle('set-theme', (_event, theme) => {
    setTheme(theme);
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('theme-changed', theme);
    });
  });

  // IPC: Auth
  ipcMain.handle('get-firebase-config', () => ({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    appId: process.env.FIREBASE_APP_ID,
  }));

  ipcMain.handle('get-user', () => getUser());

  ipcMain.handle('auth-sign-in', (_event, user) => {
    setUser(user);
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('auth-state-changed', user);
    });
    return true;
  });

  ipcMain.handle('auth-sign-out', () => {
    setUser(null);
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('auth-state-changed', null);
    });
    return true;
  });

  ipcMain.handle('open-auth-window', () => openAuthWindow());
  ipcMain.handle('close-auth-window', () => closeAuthWindow());

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

  inputHook.startHook((event) => {
    const currentSettings = getSettings();
    const shortcuts = currentSettings.shortcuts;
    const osdDuration = currentSettings.osd.duration;

    // macOS: keyboard events have action already resolved
    if (event.type === 'keyboard') {
      if (event.action === 'volumeUp') {
        const step = getAcceleratedStep('up', currentSettings.volume.step);
        const result = adjustVolumeSync('up', step);
        if (result) showOsd('volume', result.volume, osdDuration, result.muted);
      } else if (event.action === 'volumeDown') {
        const step = getAcceleratedStep('down', currentSettings.volume.step);
        const result = adjustVolumeSync('down', step);
        if (result) showOsd('volume', result.volume, osdDuration, result.muted);
      } else if (event.action === 'mute') {
        toggleMute().then((result) => {
          showOsd('mute', result.volume, osdDuration, result.muted);
          setTrayState(result.muted ? 'muted' : 'normal');
        });
      }
      return;
    }

    // Windows: mouse wheel/click events
    if (event.type === 'wheel') {
      if (matchesShortcut(event, shortcuts.volumeUp)) {
        const step = getAcceleratedStep('up', currentSettings.volume.step);
        adjustVolume('up', step).then((result) => {
          showOsd('volume', result.volume, osdDuration, result.muted);
        });
        return;
      }

      if (matchesShortcut(event, shortcuts.volumeDown)) {
        const step = getAcceleratedStep('down', currentSettings.volume.step);
        adjustVolume('down', step).then((result) => {
          showOsd('volume', result.volume, osdDuration, result.muted);
        });
        return;
      }

      if (matchesShortcut(event, shortcuts.mute)) {
        toggleMute().then((result) => {
          showOsd('mute', result.volume, osdDuration, result.muted);
          setTrayState(result.muted ? 'muted' : 'normal');
        });
        return;
      }
    }

    if (event.type === 'middleClick') {
      if (matchesShortcut(event, shortcuts.mute)) {
        toggleMute().then((result) => {
          showOsd('mute', result.volume, osdDuration, result.muted);
          setTrayState(result.muted ? 'muted' : 'normal');
        });
        return;
      }

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

  // macOS: bind shortcuts after hook starts
  if (inputHook.bindShortcuts) {
    inputHook.bindShortcuts(getSettings().shortcuts);
  }
});

app.on('window-all-closed', (e) => {
  e.preventDefault();
});

app.on('before-quit', () => {
  inputHook.stopHook();
  destroyOsd();
  destroyAuthWindow();
  destroyTray();
});
