/*
 * Simple Reverse Proxy for PixelPlanet
 * Runs on port 80 and forwards to port 3500
 */

const http = require('http');
const httpProxy = require('http-proxy-middleware');
const express = require('express');

const app = express();
const PORT = 80;
const TARGET_PORT = 3500;
const TARGET_URL = `http://127.0.0.1:${TARGET_PORT}`;

// Proxy middleware configuration
const proxyOptions = {
  target: TARGET_URL,
  changeOrigin: true,
  ws: true, // WebSocket support
  logLevel: 'info',
  onProxyReq: (proxyReq, req, res) => {
    // Set real IP header
    const realIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
    proxyReq.setHeader('X-Real-IP', realIP);
    proxyReq.setHeader('X-Forwarded-For', realIP);
    proxyReq.setHeader('X-Forwarded-Proto', req.protocol || 'http');
    proxyReq.setHeader('X-Forwarded-Host', req.get('host'));
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    if (!res.headersSent) {
      res.status(500).send('Proxy Error: ' + err.message);
    }
  },
};

// Create proxy middleware
const proxy = httpProxy.createProxyMiddleware(proxyOptions);

// Apply proxy to all routes
app.use('/', proxy);

// Create HTTP server
const server = http.createServer(app);

// WebSocket upgrade handling
server.on('upgrade', (req, socket, head) => {
  console.log('WebSocket upgrade request:', req.url);
  proxy.upgrade(req, socket, head);
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Reverse Proxy running on port ${PORT}`);
  console.log(`Forwarding requests to ${TARGET_URL}`);
  console.log(`Access your app at: http://localhost`);
});

server.on('error', (err) => {
  if (err.code === 'EACCES') {
    console.error(`\nERROR: Permission denied. Port ${PORT} requires administrator privileges.`);
    console.error('Please run this script as administrator or use a different port (e.g., 8080).\n');
  } else if (err.code === 'EADDRINUSE') {
    console.error(`\nERROR: Port ${PORT} is already in use.`);
    console.error('Please stop the application using port 80 or use a different port.\n');
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

