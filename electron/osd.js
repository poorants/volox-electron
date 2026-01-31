const { BrowserWindow, screen } = require('electron');
const path = require('path');

let osdWindow = null;
let hideTimer = null;

const OSD_WIDTH = 340;
const OSD_HEIGHT = 90;

function createOsdWindow() {
  osdWindow = new BrowserWindow({
    width: OSD_WIDTH,
    height: OSD_HEIGHT,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  osdWindow.setIgnoreMouseEvents(true);
  osdWindow.loadFile(path.join(__dirname, '..', 'renderer', 'osd.html'));

  osdWindow.on('closed', () => {
    osdWindow = null;
  });

  return osdWindow;
}

function positionOsd() {
  if (!osdWindow) return;
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;
  osdWindow.setPosition(
    Math.round((screenW - OSD_WIDTH) / 2),
    screenH - OSD_HEIGHT - 80
  );
}

function showOsd(type, value, duration = 1500, isMuted = false) {
  if (!osdWindow) createOsdWindow();
  positionOsd();

  osdWindow.webContents.send('osd-update', { type, value, isMuted, action: 'show' });
  osdWindow.showInactive();

  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    if (osdWindow) {
      osdWindow.webContents.send('osd-update', { type, value, isMuted, action: 'hide' });
      setTimeout(() => {
        if (osdWindow) osdWindow.hide();
      }, 250);
    }
  }, duration);
}

function destroyOsd() {
  if (hideTimer) clearTimeout(hideTimer);
  if (osdWindow) {
    osdWindow.destroy();
    osdWindow = null;
  }
}

module.exports = { createOsdWindow, showOsd, destroyOsd };
