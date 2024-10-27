const { app, BrowserWindow, win, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { exec } = require('child_process');
const os = require('os');
Menu.setApplicationMenu(false);

function getPlatformIcon(filename){
    let ext
    switch(process.platform) {
        case 'win32':
            ext = 'ico'
            break
        case 'darwin':
            ext = 'icns'
            break
        case 'linux':
        default:
            ext = 'png'
            break
    }

    return path.join(__dirname, 'icon', `${filename}.${ext}`)
}

function createWindow () {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false,
            titleBarStyle: 'hidden',
            frame: false,
        }
    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();

    ipcMain.handle('get-latest-release', async (event, includePreReleases) => {
        try {
            const releasesUrl = 'https://api.github.com/repos/darklink973/EarthLinkLauncher/releases';
            const releasesResponse = await axios.get(releasesUrl, {
                headers: { 'Accept': 'application/vnd.github.v3+json' }
            });

            let release = releasesResponse.data[0];
            if (includePreReleases) {
                release = releasesResponse.data.find(r => r.prerelease) || release;
            } else {
                release = releasesResponse.data.find(r => !r.prerelease) || release;
            }

            return {
                version: release.tag_name,
                notes: release.body || 'Aucune note disponible',
                url: release.assets.find(a => a.name.endsWith('.exe'))?.browser_download_url || ''
            };
        } catch (error) {
            console.error(`Erreur lors de la récupération des releases: ${error.message}`);
            return { version: 'Erreur', notes: 'Erreur lors de la récupération des notes.', url: '' };
        }
    });

    ipcMain.on('download-and-execute', async (event, { includePreReleases = false }) => {
        const tempDir = os.tmpdir();
        const filePath = path.join(tempDir, 'file.exe');

        try {
            const releasesUrl = 'https://api.github.com/repos/darklink973/EarthLinkLauncher/releases';
            const releasesResponse = await axios.get(releasesUrl, {
                headers: { 'Accept': 'application/vnd.github.v3+json' }
            });

            let release = releasesResponse.data[0];
            if (includePreReleases) {
                release = releasesResponse.data.find(r => r.prerelease) || release;
            } else {
                release = releasesResponse.data.find(r => !r.prerelease) || release;
            }

            const asset = release.assets.find(a => a.name.endsWith('.exe'));
            if (!asset) {
                event.reply('download-progress', 'Aucun fichier .exe trouvé.');
                return;
            }
            const fileUrl = asset.browser_download_url;

            console.log(`Téléchargement depuis l'URL: ${fileUrl}`);
            const response = await axios({
                method: 'get',
                url: fileUrl,
                responseType: 'stream',
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            const totalLength = parseInt(response.headers['content-length'], 10);
            if (!totalLength) {
                event.reply('download-progress', 'Impossible de déterminer la taille du fichier.');
                return;
            }

            const writer = fs.createWriteStream(filePath);
            let downloadedLength = 0;

            response.data.on('data', (chunk) => {
                downloadedLength += chunk.length;
                const progress = Math.round((downloadedLength / totalLength) * 100);
                event.reply('download-progress', `Téléchargé : ${progress}%`);
            });

            response.data.pipe(writer);

            writer.on('finish', () => {
                writer.close();
                event.reply('download-progress', 'Téléchargement terminé !');

                const quotedFilePath = `"${filePath}"`;

                console.log(`Tentative d'exécution du fichier : ${quotedFilePath}`);
                exec(quotedFilePath, (error, stdout, stderr) => {
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error(`Erreur lors de la suppression du fichier temporaire: ${err.message}`);
                        }
                    });

                    if (error) {
                        console.error(`Erreur lors de l'exécution du fichier: ${error.message}`);
                        event.reply('download-progress', `Erreur lors de l'exécution du fichier: ${error.message}`);
                        return;
                    }
                    if (stderr) {
                        console.error(`Erreur standard: ${stderr}`);
                        event.reply('download-progress', `Erreur standard: ${stderr}`);
                        return;
                    }
                    console.log(`Sortie standard: ${stdout}`);
                    event.reply('download-progress', 'Fichier exécuté avec succès.');
                });
            });

            writer.on('error', (err) => {
                console.error(`Erreur lors du téléchargement du fichier: ${err.message}`);
                fs.unlink(filePath, () => {});
                event.reply('download-progress', 'Erreur lors du téléchargement du fichier.');
            });

        } catch (error) {
            console.error(`Erreur lors du téléchargement: ${error.message}`);
            event.reply('download-progress', 'Erreur lors du téléchargement.');
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
    if (win === null) {
        createWindow()
    }
});
