const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const os = require('os');

const app = express();
const PORT = 31401;

// Ambil IP lokal server otomatis
function getServerIp() {
  const interfaces = os.networkInterfaces();
  for (let name in interfaces) {
    for (let iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const SERVER_IP = getServerIp();
const SERVER_URL = `http://${SERVER_IP}:${PORT}`;

app.use(
  '/',
  createProxyMiddleware({
    target: 'https://api.mainnet.minepi.com',
    changeOrigin: true,
    selfHandleResponse: true, // ini penting!
    onProxyRes: async (proxyRes, req, res) => {
      let body = Buffer.from([]);

      proxyRes.on('data', chunk => {
        body = Buffer.concat([body, chunk]);
      });

      proxyRes.on('end', () => {
        const contentType = proxyRes.headers['content-type'] || '';
        const statusCode = proxyRes.statusCode;

        // Salin semua header
        Object.entries(proxyRes.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });

        if (contentType.includes('application/json') || contentType.includes('text/')) {
          const original = body.toString('utf8');
          const modified = original.replace(/https:\/\/api\.mainnet\.minepi\.com/g, SERVER_URL);
          res.status(statusCode).send(modified);
        } else {
          // Jika bukan JSON atau text, kirim apa adanya
          res.status(statusCode).send(body);
        }
      });
    },
  })
);

app.listen(PORT, () => {
  console.log(`✅ Proxy aktif di ${SERVER_URL}`);
});
