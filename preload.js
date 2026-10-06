const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', { checkUpdates: () => ipcRenderer.send('check-updates') });
