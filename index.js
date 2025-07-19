const http = require('http');
const https = require('https');
const httpProxy = require('http-proxy');

// === CONFIG ===
const IP_VPS = '202.10.36.84'; // Ganti dengan IP VPS kamu
const PORT = 31401;

// === PROXY SETUP ===
const proxy = httpProxy.createProxyServer({
  target: 'https://api.mainnet.minepi.com',
  changeOrigin: true,
  secure: false,
  selfHandleResponse: true,
  agent: new https.Agent({ rejectUnauthorized: false }),
});

// === HANDLE RESPONSE ===
proxy.on('proxyRes', function (proxyRes, req, res) {
  let body = [];

  proxyRes.on('data', function (chunk) {
    body.push(chunk);
  });

  proxyRes.on('end', function () {
    body = Buffer.concat(body).toString();

    // Ganti semua domain dengan IP VPS
    const replacedBody = body.replaceAll(
      'https://api.mainnet.minepi.com',
      `http://${IP_VPS}:${PORT}`
    );

    // Simulasi rate limit headers
    const now = Math.floor(Date.now() / 1000);
    res.writeHead(proxyRes.statusCode, {
      ...proxyRes.headers,
      'X-RateLimit-Limit': '101',
      'X-RateLimit-Remaining': '100',
      'X-RateLimit-Reset': (now + 1).toString(),
    });

    res.end(replacedBody);
  });
});

// === ERROR HANDLER ===
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err.message);
  res.writeHead(500, { 'Content-Type': 'text/plain' });
  res.end('Proxy error');
});

// === START SERVER ===
http.createServer((req, res) => {
  proxy.web(req, res);
}).listen(PORT, () => {
  console.log(`✅ Pi Proxy running at http://${IP_VPS}:${PORT}`);
});
