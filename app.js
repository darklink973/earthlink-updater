document.getElementById('check-version-button').addEventListener('click', async () => {
    const filePath = document.getElementById('version-input').value; // Get the path to the .exe file
    const logDiv = document.getElementById('log');
    
    try {
        const installedVersion = await window.api.getFileVersion(filePath);
        logDiv.innerHTML += `Installed Version of ${filePath}: ${installedVersion}<br>`;
        
        // Fetch the latest version from GitHub
        const latestVersion = await window.api.getLatestVersion();
        logDiv.innerHTML += `Latest Version from GitHub: ${latestVersion}<br>`;
        
        // Compare versions
        if (installedVersion === latestVersion) {
            logDiv.innerHTML += 'Your application is up to date.<br>';
        } else {
            logDiv.innerHTML += 'A new version is available. Please consider updating.<br>';
        }
    } catch (error) {
        logDiv.innerHTML += `Error checking version: ${error}<br>`;
    }
});

// Existing download and execute button logic
document.getElementById('download-button').addEventListener('click', async () => {
    const url = document.getElementById('url-input').value;
    const logDiv = document.getElementById('log');
    logDiv.innerHTML += `Downloading from: ${url}<br>`;
    
    try {
        const filePath = await window.api.downloadFile(url);
        logDiv.innerHTML += `File downloaded: ${filePath}<br>`;
        logDiv.innerHTML += 'Executing the file...<br>';
        
        const output = await window.api.executeFile(filePath);
        logDiv.innerHTML += `File executed successfully! Output: ${output}<br>`;
    } catch (error) {
        logDiv.innerHTML += `Error: ${error}<br>`;
    }
});
