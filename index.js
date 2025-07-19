const express = require('express');
const { createProxyMiddleware, responseInterceptor } = require('http-proxy-middleware');

const app = express();
const PORT = 31401;

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
      proxyReq.setHeader('X-Forwarded-For', req.ip); // Optional
    },
    onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
      const contentType = proxyRes.headers['content-type'] || '';
      const isJson = contentType.includes('application/json');

      if (isJson) {
        const original = responseBuffer.toString('utf8');

        // Deteksi otomatis IP dan port server dari request
        const host = req.headers.host || `localhost:${PORT}`;
        const serverUrl = `http://${host}`;

        // Ganti semua URL asli dengan URL VPS (dinamis)
        const replaced = original.replace(/https:\/\/api\.mainnet\.minepi\.com/g, serverUrl);
        return replaced;
      }

      return responseBuffer;
    }),
  })
);

app.listen(PORT, () => {
  console.log(`Proxy aktif di http://0.0.0.0:${PORT}`);
});
