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
      // Tambahkan IP asli klien ke header jika dibutuhkan
      proxyReq.setHeader('X-Forwarded-For', req.ip);
    },
    onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
      const contentType = proxyRes.headers['content-type'] || '';
      const isJson = contentType.includes('application/json');

      if (isJson) {
        const originalBody = responseBuffer.toString('utf8');

        // Dapatkan alamat IP dan port dari header request
        const host = req.headers.host || `localhost:${PORT}`;
        const serverUrl = `http://${host}`;

        // Ganti semua URL asli dengan IP VPS
        const replaced = originalBody.replace(/https:\/\/api\.mainnet\.minepi\.com/g, serverUrl);
        return replaced;
      }

      // Kalau bukan JSON, kirim apa adanya
      return responseBuffer;
    }),
  })
);

app.listen(PORT, () => {
  console.log(`✅ Proxy aktif di http://0.0.0.0:${PORT}`);
});
