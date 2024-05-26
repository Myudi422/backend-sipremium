const express = require('express');
const cors = require('cors');
const { importCookie } = require('./handle');
const http = require("http");

const app = express();
const port = process.env.PORT || 3000; // Gunakan PORT Heroku atau default 3000

app.use(express.json());
app.use(cors());

app.post('/import-cookie', async (req, res) => {
    const { platform } = req.body;
    try {
        const importResult = await importCookie(platform);
        res.json({ status: "success", message: importResult });
    } catch (error) {
        console.error('Error importing cookie:', error);
        res.status(500).json({ status: "error", message: "Error importing cookie." });
    }
});

// Create HTTP server
const server = http.createServer(app);

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
