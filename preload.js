const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    downloadFile: (url) => ipcRenderer.invoke('download-file', url),
    getFileVersion: () => ipcRenderer.invoke('get-file-version'),
    getLatestVersion: () => ipcRenderer.invoke('get-latest-version'),
    executeFile: () => ipcRenderer.invoke('execute-file'),
    closeApp: () => ipcRenderer.invoke('close-app'), // Expose closeApp function
});
