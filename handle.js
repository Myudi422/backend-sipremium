const { importDigitalPanelCookie } = require('./platforms/digitalpanel');
const fs = require('fs').promises;
const path = require('path');

async function importCookie(platform) {
    try {
        let credentials;
        if (platform === 'digitalpanel') {
            credentials = await readCredentials('digitalpanel');
        } else {
            throw new Error('Platform not supported.');
        }

        const importResult = await importDigitalPanelCookie(credentials);
        return importResult;
    } catch (error) {
        console.error('Error importing cookie:', error);
        throw error;
    }
}

async function readCredentials(platform) {
    const credentialsPath = path.join(__dirname, 'credentials', `${platform}.json`);
    const data = await fs.readFile(credentialsPath);
    return JSON.parse(data);
}

module.exports = { importCookie };
