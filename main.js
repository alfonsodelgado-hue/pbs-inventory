const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path'), http = require('http'), fs = require('fs');
const PORT = 47831;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
let win, served = false;

function startServer() {
  return new Promise(resolve => {
    const root = path.join(__dirname, 'app');
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
      const f = path.normalize(path.join(root, p));
      if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
      fs.readFile(f, (e, d) => {
        if (e) { res.writeHead(404); return res.end('Not found'); }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); res.end(d);
      });
    });
    srv.on('error', () => resolve(false));
    srv.listen(PORT, '127.0.0.1', () => resolve(true));
  });
}

function createWindow() {
  win = new BrowserWindow({ width: 1440, height: 900, backgroundColor: '#020617', autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true } });
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('before-input-event', (e, i) => { if (i.key === 'F12' && i.type === 'keyDown') win.webContents.toggleDevTools(); });
  if (served) win.loadURL('http://127.0.0.1:' + PORT + '/index.html');
  else win.loadFile(path.join(__dirname, 'app', 'index.html'));
}

function checkUpdates() { autoUpdater.checkForUpdatesAndNotify().catch(() => {}); }

app.whenReady().then(async () => {
  served = await startServer();
  createWindow(); checkUpdates();
  setInterval(checkUpdates, 15 * 60 * 1000);
  ipcMain.on('check-updates', checkUpdates);
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('update-downloaded', () => win && win.webContents.executeJavaScript("window.showToast && showToast('Nueva versión descargada. Se instalará al cerrar la app.','success')"));
});
app.on('window-all-closed', () => app.quit());
