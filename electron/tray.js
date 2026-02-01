const { Tray, BrowserWindow, screen } = require('electron');
const path = require('path');
const { createTrayIcon } = require('./tray-icon');

let tray = null;
let settingsWindow = null;
let menuWindow = null;

function createTray(app) {
  const icon = createTrayIcon('normal');
  tray = new Tray(icon);
  tray.setToolTip('Voly - Volume, the way it should be.');

  // Pre-create menu popup (hidden)
  menuWindow = new BrowserWindow({
    width: 280,
    height: 220,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });
  menuWindow.setMenuBarVisibility(false);
  menuWindow.loadFile(path.join(__dirname, '..', 'renderer', 'tray-menu.html'));

  menuWindow.on('blur', () => {
    menuWindow.hide();
  });

  // Show custom menu on right-click (Windows) or click (macOS)
  const showMenu = () => {
    if (menuWindow.isVisible()) {
      menuWindow.hide();
      return;
    }

    const bounds = tray.getBounds();
    const pos = getMenuPosition(bounds);
    menuWindow.setPosition(pos.x, pos.y, false);
    menuWindow.show();

    // Send current volume state
    const loudness = require('loudness');
    Promise.all([loudness.getVolume(), loudness.getMuted()]).then(([volume, muted]) => {
      menuWindow.webContents.send('tray-menu-action', {
        action: 'show',
        volume,
        muted,
      });
    }).catch(() => {});
  };

  if (process.platform === 'darwin') {
    tray.on('click', showMenu);
  } else {
    tray.on('right-click', showMenu);
  }

  return tray;
}

function getMenuPosition(trayBounds) {
  const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y });
  const { x: wx, y: wy, width: sw, height: sh } = display.workArea;
  const menuW = 280;
  const menuH = 220;

  let x = Math.round(trayBounds.x - menuW / 2 + trayBounds.width / 2);
  let y;

  if (process.platform === 'darwin') {
    y = trayBounds.y + trayBounds.height + 4;
  } else {
    y = trayBounds.y - menuH - 4;
  }

  // Clamp to workArea
  x = Math.max(wx, Math.min(x, wx + sw - menuW));
  y = Math.max(wy, Math.min(y, wy + sh - menuH));

  return { x, y };
}

function openSettings() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 420,
    height: 540,
    resizable: false,
    frame: false,
    title: 'Voly',
    backgroundColor: '#09090B',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  settingsWindow.setMenuBarVisibility(false);
  settingsWindow.loadFile(path.join(__dirname, '..', 'renderer', 'settings.html'));

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

function destroyTray() {
  if (menuWindow && !menuWindow.isDestroyed()) {
    menuWindow.destroy();
    menuWindow = null;
  }
  if (tray) {
    tray.destroy();
    tray = null;
  }
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.destroy();
    settingsWindow = null;
  }
}

function setTrayState(state) {
  if (tray) {
    tray.setImage(createTrayIcon(state));
  }
}

module.exports = { createTray, destroyTray, setTrayState, openSettings };
