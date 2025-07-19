const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 31401;

app.use(
  '/',
  createProxyMiddleware({
    target: 'https://api.mainnet.minepi.com', // Tujuan akhir
    changeOrigin: true, // Agar header Host cocok
    secure: true,       // Tetap validasi SSL
    pathRewrite: {
      '^/': '/',        // biar path tetap sama
    },
    onProxyReq: (proxyReq, req, res) => {
      // Optional: kamu bisa ubah header di sini jika perlu
      proxyReq.setHeader('X-Forwarded-For', req.ip); // lacak IP asli jika mau
    },
  })
);

app.listen(PORT, () => {
  console.log(`Proxy aktif di http://0.0.0.0:${PORT}`);
});
