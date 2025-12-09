/*
 * Simple Reverse Proxy for PixelPlanet (No external dependencies)
 * Runs on port 8080 and forwards to port 3500
 * Use this if http-proxy-middleware is not installed
 */

const http = require('http');
const { URL } = require('url');

const PROXY_PORT = 80; // Port 80 - requires admin rights
const TARGET_HOST = '127.0.0.1';
const TARGET_PORT = 3500;

const server = http.createServer((req, res) => {
  const targetUrl = `http://${TARGET_HOST}:${TARGET_PORT}${req.url}`;
  const url = new URL(targetUrl);
  
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname + url.search,
    method: req.method,
    headers: {
      ...req.headers,
      'host': `${TARGET_HOST}:${TARGET_PORT}`,
      'x-real-ip': req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress,
      'x-forwarded-for': req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress,
      'x-forwarded-proto': req.protocol || 'http',
      'x-forwarded-host': req.headers.host,
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy request error:', err);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Bad Gateway: ' + err.message);
    }
  });

  req.pipe(proxyReq);
});

server.on('upgrade', (req, socket, head) => {
  console.log('WebSocket upgrade:', req.url);
  const targetUrl = `http://${TARGET_HOST}:${TARGET_PORT}${req.url}`;
  const url = new URL(targetUrl);
  
  const proxySocket = require('net').createConnection({
    host: url.hostname,
    port: url.port,
  }, () => {
    proxySocket.write(head);
    socket.write('HTTP/1.1 101 Switching Protocols\r\n');
    socket.write('Upgrade: websocket\r\n');
    socket.write('Connection: Upgrade\r\n\r\n');
    
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });

  proxySocket.on('error', (err) => {
    console.error('WebSocket proxy error:', err);
    socket.destroy();
  });

  socket.on('error', () => {
    proxySocket.destroy();
  });
});

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`\n========================================`);
  console.log(`Reverse Proxy is running!`);
  console.log(`========================================`);
  console.log(`Proxy Port: ${PROXY_PORT}`);
  console.log(`Target: http://${TARGET_HOST}:${TARGET_PORT}`);
  console.log(`\nAccess your app at:`);
  console.log(`  http://localhost:${PROXY_PORT}`);
  console.log(`========================================\n`);
});

server.on('error', (err) => {
  if (err.code === 'EACCES') {
    console.error(`\nERROR: Permission denied. Port ${PROXY_PORT} requires administrator privileges.`);
    console.error('Please run this script as administrator.\n');
  } else if (err.code === 'EADDRINUSE') {
    console.error(`\nERROR: Port ${PROXY_PORT} is already in use.`);
    console.error('Please stop the application using this port.\n');
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

