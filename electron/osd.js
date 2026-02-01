const { BrowserWindow, screen } = require('electron');
const path = require('path');
const { getTheme } = require('./settings');

let osdWindow = null;
let hideTimer = null;

const OSD_SIZES = {
  default:      { w: 340, h: 90 },
  'cyber-pulse': { w: 520, h: 50 },
};

function getOsdSize() {
  const theme = getTheme();
  return OSD_SIZES[theme] || OSD_SIZES.default;
}

function createOsdWindow() {
  const size = getOsdSize();
  osdWindow = new BrowserWindow({
    width: size.w,
    height: size.h,
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
  const size = getOsdSize();
  osdWindow.setSize(size.w, size.h);
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;
  osdWindow.setPosition(
    Math.round((screenW - size.w) / 2),
    screenH - size.h - 80
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
