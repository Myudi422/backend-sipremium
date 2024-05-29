const { importDigitalPanelCookie } = require('./platforms/digitalpanel');
const { importWeTvCookie } = require('./platforms/wetv');
const { importNetflixCookie } = require('./platforms/netflix');
const { importPNGTreeCookie } = require('./platforms/pngtree');
const { importCanvaCookie } = require('./platforms/canva');
const fs = require('fs').promises;
const path = require('path');

async function importCookie(platform) {
    try {
        let credentials;
        if (platform === 'digitalpanel') {
            credentials = await readCredentials('digitalpanel');
            const importResult = await importDigitalPanelCookie(credentials);
            return importResult;
        } else if (platform === 'wetv') {
            credentials = await readCredentials('wetv');
            const importResult = await importWeTvCookie(credentials);
            return importResult;
        } else if (platform === 'pngtree') {
            credentials = await readCredentials('pngtree');
            const importResult = await importPNGTreeCookie(credentials);
            return importResult;
        } else if (platform === 'canva') {
            credentials = await readCredentials('canva');
            const importResult = await importCanvaCookie(credentials);
            return importResult;
        } else if (platform === 'netflix') {
            credentials = await readCredentials('netflix');
            const importResult = await importNetflixCookie(credentials, 'Official');
            return importResult;
        } else {
            throw new Error('Platform not supported.');
        }
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
