const { BrowserWindow, nativeImage } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { getTheme } = require('./settings');

const appIcon = nativeImage.createFromPath(path.join(__dirname, '..', 'assets', 'volox-tray-icon.png'));

let authWindow = null;
let authServer = null;

function startAuthServer() {
  if (authServer) return authServer.address().port;

  return new Promise((resolve) => {
    const rendererDir = path.join(__dirname, '..', 'renderer');

    authServer = http.createServer((req, res) => {
      // Serve files from renderer directory
      const urlPath = req.url === '/' ? '/auth.html' : req.url;
      const filePath = path.join(rendererDir, urlPath);

      // Security: only serve from renderer dir
      if (!filePath.startsWith(rendererDir)) {
        res.writeHead(403);
        res.end();
        return;
      }

      const ext = path.extname(filePath);
      const contentTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
      };

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end();
          return;
        }
        res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
        res.end(data);
      });
    });

    authServer.listen(0, 'localhost', () => {
      resolve(authServer.address().port);
    });
  });
}

async function openAuthWindow() {
  if (authWindow && !authWindow.isDestroyed()) {
    authWindow.focus();
    return;
  }

  const port = await startAuthServer();

  authWindow = new BrowserWindow({
    width: 360,
    height: 400,
    resizable: false,
    frame: false,
    icon: appIcon,
    title: 'Volox - Sign In',
    backgroundColor: getTheme() === 'light' ? '#FFFFFF' : '#09090B',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  authWindow.setMenuBarVisibility(false);
  authWindow.loadURL(`http://localhost:${port}/auth.html`);

  authWindow.on('closed', () => {
    authWindow = null;
  });

  // Note: blur event not used because Google auth popup would close this window
}

function closeAuthWindow() {
  if (authWindow && !authWindow.isDestroyed()) {
    authWindow.close();
    authWindow = null;
  }
}

function destroyAuthWindow() {
  if (authWindow && !authWindow.isDestroyed()) {
    authWindow.destroy();
    authWindow = null;
  }
  if (authServer) {
    authServer.close();
    authServer = null;
  }
}

module.exports = { openAuthWindow, closeAuthWindow, destroyAuthWindow };
