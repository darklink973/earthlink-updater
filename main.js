const { app, BrowserWindow, ipcMain } = require('electron');
const { exec } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

let mainWindow;

// Define the default path for the EarthLink Launcher executable
const defaultExePath = path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'EarthLink Launcher', 'EarthLink Launcher.exe');

// Function to check if EarthLink Launcher is running
function isEarthLinkRunning() {
    return new Promise((resolve, reject) => {
        exec('tasklist', (error, stdout, stderr) => {
            if (error) {
                return reject(`Error: ${error.message}`);
            }
            // Check if the EarthLink Launcher process is in the list
            const isRunning = stdout.toLowerCase().includes('earthlink launcher.exe');
            resolve(isRunning);
        });
    });
}

// Function to close the EarthLink Launcher
function closeEarthLink() {
    return new Promise((resolve, reject) => {
        exec('taskkill /F /IM "EarthLink Launcher.exe"', (error, stdout, stderr) => {
            if (error) {
                return reject(`Error closing EarthLink Launcher: ${error.message}`);
            }
            resolve(stdout);
        });
    });
}

async function createWindow() {
    // Check if EarthLink Launcher is running and close it
    const running = await isEarthLinkRunning();
    if (running) {
        console.log("Closing EarthLink Launcher...");
        await closeEarthLink(); // Close EarthLink before proceeding
    }

    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false,
        }
    });

    mainWindow.loadFile('index.html');
}

// Handle downloading a file
ipcMain.handle('download-file', async (event, url) => {
    const tempPath = path.join(os.tmpdir(), path.basename(url));
    
    try {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
        });

        const writer = fs.createWriteStream(tempPath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(tempPath));
            writer.on('error', () => reject('Error writing file'));
        });
    } catch (error) {
        throw new Error(`Error downloading file: ${error.message}`);
    }
});

// Handle checking the version of the .exe file
ipcMain.handle('get-file-version', async () => {
    return new Promise((resolve, reject) => {
        exec(`powershell -command "(Get-Item '${defaultExePath}').VersionInfo.FileVersion"`, (error, stdout, stderr) => {
            if (error) {
                return reject(`Error: ${error.message}`);
            }
            if (stderr) {
                return reject(`Error: ${stderr}`);
            }
            resolve(stdout.trim()); // Return the version without extra spaces
        });
    });
});

// Handle fetching the latest version from GitHub releases
ipcMain.handle('get-latest-version', async () => {
    const repoUrl = 'https://api.github.com/repos/darklink973/EarthLinkLauncher/releases/latest';
    
    try {
        const response = await axios.get(repoUrl, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'MyElectronApp' // GitHub API requires a User-Agent header
            }
        });
        // Remove the "v" prefix from the version
        return response.data.tag_name.replace(/^v/, '');
    } catch (error) {
        throw new Error(`Error fetching latest version: ${error.message}`);
    }
});

// Handle executing the downloaded file
ipcMain.handle('execute-file', async () => {
    return new Promise((resolve, reject) => {
        exec(`"${defaultExePath}"`, (error, stdout, stderr) => {
            if (error) {
                return reject(`Error: ${error.message}`);
            }
            if (stderr) {
                return reject(`Error: ${stderr}`);
            }
            resolve(stdout); // Return the standard output
        });
    });
});

// Handle closing the main window after an update
ipcMain.handle('close-app', () => {
    if (mainWindow) {
        mainWindow.close();
    }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
