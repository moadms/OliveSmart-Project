const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm'
};

const server = http.createServer((req, res) => {
    let reqPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
    if (reqPath === '/presentation_prof.html') reqPath = '/Preparation_Reunion_Encadrant_Pr_Lachgar.html';
    if (reqPath === '/guide_explication.html') reqPath = '/Synthese_Pedagogique_Fonctionnement_OliveSmart.html';
    let filePath = path.join(PUBLIC_DIR, reqPath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // SPA Fallback to index.html
                fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err2, fallbackContent) => {
                    if (err2) {
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end('404 Not Found');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end(fallbackContent, 'utf-8');
                    }
                });
            } else {
                res.writeHead(500);
                res.end(`Erreur serveur: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*'
            });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`==================================================================`);
    console.log(`🚀 Frontend React OliveSmart démarré sur : http://localhost:${PORT}`);
    console.log(`🔗 Connecté au Microservice Spring Boot : http://localhost:8080`);
    console.log(`==================================================================`);
});
