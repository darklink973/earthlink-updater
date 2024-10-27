const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    getLatestRelease: () => ipcRenderer.invoke('get-latest-release'),
    downloadAndExecute: (options) => ipcRenderer.send('download-and-execute', options),
    onProgress: (callback) => ipcRenderer.on('download-progress', (event, message) => callback(message))
});