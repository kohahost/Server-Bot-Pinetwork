const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios'); // Kita butuh axios untuk meminta IP publik

const app = express();
const PORT = 31401;

// --- FUNGSI BARU UNTUK MENDAPATKAN IP PUBLIK ---
async function getPublicIp() {
  try {
    // Bertanya ke layanan eksternal untuk mendapatkan IP publik kita
    const response = await axios.get('https://api.ipify.org?format=json');
    const publicIp = response.data.ip;
    console.log(`✅ IP Publik berhasil dideteksi: ${publicIp}`);
    return publicIp;
  } catch (error) {
    console.error('❌ Gagal mendapatkan IP Publik! Cek koneksi internet atau layanan ipify.org.');
    console.error('Server akan berhenti.');
    process.exit(1); // Menghentikan server jika IP publik tidak bisa didapat
  }
}

// Kita buat fungsi utama menjadi async agar bisa menunggu IP publik didapatkan
async function startServer() {
  // 1. Dapatkan IP publik terlebih dahulu
  const PUBLIC_IP = await getPublicIp();
  const SERVER_URL = `http://${PUBLIC_IP}:${PORT}`;

  // 2. Setelah IP didapat, lanjutkan konfigurasi dan jalankan server proxy
  app.use(
    '/',
    createProxyMiddleware({
      target: 'https://api.mainnet.minepi.com',
      changeOrigin: true,
      selfHandleResponse: true,
      onProxyRes: (proxyRes, req, res) => {
        let body = Buffer.from([]);

        proxyRes.on('data', chunk => {
          body = Buffer.concat([body, chunk]);
        });

        proxyRes.on('end', () => {
          const contentType = proxyRes.headers['content-type'] || '';
          const statusCode = proxyRes.statusCode;

          Object.keys(proxyRes.headers).forEach((key) => {
            res.setHeader(key, proxyRes.headers[key]);
          });

          if (contentType.includes('application/json') || contentType.includes('text/')) {
            const originalBody = body.toString('utf8');
            // Mengganti URL API dengan URL server kita yang IP-nya dideteksi otomatis
            const modifiedBody = originalBody.replace(/https:\/\/api\.mainnet\.minepi\.com/g, SERVER_URL);
            res.status(statusCode).send(modifiedBody);
          } else {
            res.status(statusCode).send(body);
          }
        });
      },
      onError: (err, req, res) => {
          console.error('Proxy error:', err);
          res.status(500).send('Proxy Error');
      }
    })
  );

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Proxy Pi Network Siap!`);
    console.log(`   Meneruskan permintaan ke: https://api.mainnet.minepi.com`);
    console.log(`   Server berjalan dan dapat diakses di: ${SERVER_URL}`);
  });
}

// Jalankan fungsi utama
startServer();
