const express = require('express');
const { createProxyMiddleware, responseInterceptor } = require('http-proxy-middleware');
const os = require('os');

const app = express();
const PORT = 31401;

// Ambil IP address publik VPS secara otomatis
function getPublicIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost'; // fallback
}

const SERVER_IP = getPublicIP();
const SERVER_URL = `http://${SERVER_IP}:${PORT}`;

app.use(
  '/',
  createProxyMiddleware({
    target: 'https://api.mainnet.minepi.com',
    changeOrigin: true,
    selfHandleResponse: true,
    secure: true,
    pathRewrite: {
      '^/': '/',
    },
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('X-Forwarded-For', req.ip);
    },
    onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
      const contentType = proxyRes.headers['content-type'] || '';
      const isJson = contentType.includes('application/json');

      if (isJson) {
        const originalBody = responseBuffer.toString('utf8');
        // Replace all links to api.mainnet.minepi.com with your server IP
        const replacedBody = originalBody.replace(/https:\/\/api\.mainnet\.minepi\.com/g, SERVER_URL);
        return replacedBody;
      }

      return responseBuffer;
    }),
  })
);

app.listen(PORT, () => {
  console.log(`Proxy aktif di ${SERVER_URL}`);
});
