async function onUpdateSuccess() {
    // Close the application
    await window.api.closeApp(); // Call the exposed closeApp function
}

// Call this function when the update is done
// onUpdateSuccess();


document.getElementById('check-version-button').addEventListener('click', async () => {
    const filePath = document.getElementById('version-input').value; // Get the path to the .exe file
    const logDiv = document.getElementById('log');
    const updateButton = document.getElementById('update-button');
    const checkVersionButton = document.getElementById('check-version-button');

    checkVersionButton.style.display = 'none';
    
    try {
        const installedVersion = await window.api.getFileVersion(filePath);
        logDiv.innerHTML += `Version installée ${filePath}: ${installedVersion}<br>`;
        
        // Fetch the latest version from GitHub
        const latestVersion = await window.api.getLatestVersion();
        logDiv.innerHTML += `Dernière version de github: ${latestVersion}<br>`;
        
        // Compare versions
        if (installedVersion === latestVersion) {
            logDiv.innerHTML += 'Earthlink est à jour.<br>';
            logDiv.innerHTML += 'Vous pouvez maintenant fermer cette fenètre.<br>';
            updateButton.style.display = 'none'; // Hide update button
            await window.api.executeFile(filePath); // Launch the application
            await onUpdateSuccess(); 
        } else {
            logDiv.innerHTML += 'Une nouvelle version est disponible ! Veuillez mettre à jour.<br>';
            updateButton.style.display = 'block'; // Show update button
        }
    } catch (error) {
        updateButton.style.display = 'block';
        logDiv.innerHTML += `Erreur de la vérification de la version: ${error}<br>`;
    }
});

// Add event listener for update button
document.getElementById('update-button').addEventListener('click', async () => {
    const logDiv = document.getElementById('log');
    const updateButton = document.getElementById('update-button');
    const url = 'https://github.com/darklink973/EarthLinkLauncher/releases/latest/download/EarthLink.Launcher-setup.exe'; // Update with the actual download URL

    updateButton.style.display = 'none';
    logDiv.innerHTML += `Téléchargement de la dernière version depuis: ${url}<br>`;
    
    try {
        const filePath = await window.api.downloadFile(url);
        logDiv.innerHTML += `Fichier installé: ${filePath}<br>`;
        logDiv.innerHTML += "Execution du fichier d'update...<br>";
        
        const output = await window.api.executeFile(filePath);
        logDiv.innerHTML += `Installation terminée ! ${output}<br>`;

        logDiv.innerHTML += 'Vous pouvez maintenant fermer cette fenètre.<br>';
    } catch (error) {
        updateButton.style.display = 'block';
        logDiv.innerHTML += `Erreur durant la mise à jours: ${error}<br>`;
    }
});
