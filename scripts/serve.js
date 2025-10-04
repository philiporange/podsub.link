#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'text/plain';
}

function serveFile(res, filePath) {
  const fullPath = path.join(__dirname, '..', filePath);

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }

    const mimeType = getMimeType(fullPath);
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  // Parse URL to separate path from query string
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let filePath = url.pathname === '/' ? 'src/index.html' : url.pathname.slice(1);

  // Default to index.html for directory requests
  if (filePath.endsWith('/')) {
    filePath += 'index.html';
  }

  // If file doesn't start with 'src/', check if it exists in src/ first
  if (!filePath.startsWith('src/')) {
    const srcPath = 'src/' + filePath;
    try {
      // Try to read from src/ first
      if (fs.existsSync(path.join(__dirname, '..', srcPath))) {
        filePath = srcPath;
      }
    } catch (err) {
      // If src/ doesn't exist, try the original path
    }
  }

  serveFile(res, filePath);
});

server.listen(PORT, () => {
  console.log(`Development server running at http://localhost:${PORT}`);
  console.log('Serving files from src/ directory');
});