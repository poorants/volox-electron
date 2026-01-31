const { Tray, Menu, BrowserWindow } = require('electron');
const path = require('path');
const { createTrayIcon } = require('./tray-icon');

let tray = null;
let settingsWindow = null;

function createTray(app) {
  const icon = createTrayIcon('normal');
  tray = new Tray(icon);
  tray.setToolTip('Voly - Volume, the way it should be.');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Settings',
      click: () => openSettings(),
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit(),
    },
  ]);

  tray.setContextMenu(contextMenu);
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

module.exports = { createTray, destroyTray, setTrayState };
