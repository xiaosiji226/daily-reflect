// Simple wrapper to serve the built frontend with API proxy
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5173;
const BACKEND = 'http://localhost:8000';
const DIST = path.join(__dirname, 'client', 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
};

function proxyReq(req) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: '127.0.0.1',
      port: 8000,
      path: req.url,
      method: req.method,
      headers: Object.fromEntries(
        Object.entries(req.headers).filter(([k]) => k !== 'host')
      ),
    };
    const backendReq = http.request(opts, (backendRes) => {
      let body = '';
      backendRes.on('data', (chunk) => (body += chunk));
      backendRes.on('end', () => resolve({ status: backendRes.statusCode, headers: backendRes.headers, body }));
    });
    backendReq.on('error', reject);
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      let data = '';
      req.on('data', (chunk) => (data += chunk));
      req.on('end', () => backendReq.end(data));
    } else {
      backendReq.end();
    }
  });
}

const server = http.createServer(async (req, res) => {
  // Proxy API calls to backend
  if (req.url.startsWith('/api/')) {
    try {
      const result = await proxyReq(req);
      res.writeHead(result.status, result.headers);
      res.end(result.body);
    } catch (e) {
      console.error('Proxy error:', e.message);
      res.writeHead(502);
      res.end('Backend unavailable');
    }
    return;
  }

  // SPA fallback: serve index.html for all non-file routes
  let filePath = path.join(DIST, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!path.extname(filePath)) {
    filePath = path.join(DIST, 'index.html');
  }

  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch {
    // SPA fallback
    try {
      const content = fs.readFileSync(path.join(DIST, 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend server running on http://0.0.0.0:${PORT}`);
});
