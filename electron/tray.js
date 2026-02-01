const { Tray, BrowserWindow, screen } = require('electron');
const path = require('path');
const { createTrayIcon } = require('./tray-icon');
const { getTheme } = require('./settings');

let tray = null;
let settingsWindow = null;
let menuWindow = null;
let themeWindow = null;

function createTray(app) {
  const icon = createTrayIcon('normal');
  tray = new Tray(icon);
  tray.setToolTip('Voly - Volume, the way it should be.');

  // Pre-create menu popup (hidden)
  menuWindow = new BrowserWindow({
    width: 180,
    height: 130,
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
  const menuW = 180;
  const menuH = 130;

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
    backgroundColor: getTheme() === 'light' ? '#FFFFFF' : '#09090B',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  settingsWindow.setMenuBarVisibility(false);
  settingsWindow.loadFile(path.join(__dirname, '..', 'renderer', 'settings.html'));

  settingsWindow.on('blur', () => {
    if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.close();
  });
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

function openThemePicker() {
  if (themeWindow && !themeWindow.isDestroyed()) {
    themeWindow.focus();
    return;
  }

  themeWindow = new BrowserWindow({
    width: 360,
    height: 400,
    resizable: false,
    frame: false,
    title: 'Voly Themes',
    backgroundColor: getTheme() === 'light' ? '#FFFFFF' : '#09090B',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  themeWindow.setMenuBarVisibility(false);
  themeWindow.loadFile(path.join(__dirname, '..', 'renderer', 'theme-picker.html'));

  themeWindow.on('blur', () => {
    if (themeWindow && !themeWindow.isDestroyed()) themeWindow.close();
  });
  themeWindow.on('closed', () => {
    themeWindow = null;
  });
}

function destroyTray() {
  if (menuWindow && !menuWindow.isDestroyed()) {
    menuWindow.destroy();
    menuWindow = null;
  }
  if (themeWindow && !themeWindow.isDestroyed()) {
    themeWindow.destroy();
    themeWindow = null;
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

module.exports = { createTray, destroyTray, setTrayState, openSettings, openThemePicker };
