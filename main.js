const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
let win;
function createWindow() {
  win = new BrowserWindow({ width: 1440, height: 900, backgroundColor: '#020617', autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true } });
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
}
function checkUpdates() { autoUpdater.checkForUpdatesAndNotify().catch(() => {}); }
app.whenReady().then(() => {
  createWindow(); checkUpdates();
  setInterval(checkUpdates, 15 * 60 * 1000);
  ipcMain.on('check-updates', checkUpdates);
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('update-downloaded', () => win && win.webContents.executeJavaScript("window.showToast && showToast('Nueva versión descargada. Se instalará al cerrar la app.','success')"));
});
app.on('window-all-closed', () => app.quit());
