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
  tray.setToolTip('Volox - Volume, the way it should be.');

  // Pre-create menu popup (hidden)
  menuWindow = new BrowserWindow({
    width: 200,
    height: 200,
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

    const cursorPoint = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(cursorPoint);
    const scale = display.scaleFactor;
    const menuW = 200;
    const menuH = 200;

    const x = cursorPoint.x - menuW;
    const y = cursorPoint.y - Math.round(menuH / scale);

    menuWindow.setBounds({ x, y, width: menuW, height: menuH });
    menuWindow.show();
  };

  tray.on('click', showMenu);
  if (process.platform !== 'darwin') {
    tray.on('right-click', showMenu);
  }

  return tray;
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
    title: 'Volox',
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
    title: 'Volox Themes',
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
