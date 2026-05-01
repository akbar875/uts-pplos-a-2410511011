require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');

const app  = express();
const PORT = process.env.PORT || 8080;

// Rate Limiter (in-memory per IP) 
const simpanRateLimit = new Map();

// Middleware rate limiter
const batasKecepatan = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const sekarang = Date.now();
    const jendela = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000;
    const maks = parseInt(process.env.RATE_LIMIT_MAX)        || 60;

    const catatan = simpanRateLimit.get(ip);

    // Jika catatan belum ada, atau catatan sudah melewati jendela, simpan catatan baru
    if (!catatan || sekarang > catatan.resetPada) {
        simpanRateLimit.set(ip, { jumlah: 1, resetPada: sekarang + jendela });
    return next();
    }

    // Jika jumlah permintaan melebihi batas
    if (catatan.jumlah >= maks)
        return res.status(429).json({ success: false, pesan:  `Batas permintaan terlampaui. Maksimal ${maks} permintaan per menit.`, data:   null});

    catatan.jumlah++;
    return next();
};

// Middleware verifikasi JWT 
const verifikasiToken = (req, res, next) => {
    const headerOtorisasi = req.headers['authorization'];
    const token = headerOtorisasi && headerOtorisasi.split(' ')[1];

    // Jika token tidak ada
    if (!token)
        return res.status(401).json({ success: false, pesan: 'Token akses diperlukan', data: null });

    try {
        // Verifikasi token menggunakan secret key
        req.pengguna = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        const pesan = err.name === 'TokenExpiredError' ? 'Token akses sudah kedaluwarsa' : 'Token akses tidak valid';
        return res.status(401).json({ success: false, pesan, data: null });
    }
};

// Proxy factory
const proksi = (target) =>
    createProxyMiddleware({
        target,
        changeOrigin: true,
        on: {
            error: (err, req, res) => {
                console.error(`[Gateway] Error proksi → ${target}:`, err.message);
                res.status(502).json({ success: false, pesan: 'Layanan tidak tersedia', data: null });
            },
        },
    });

// Menerapkan rate limiter ke semua request 
app.use(batasKecepatan);

// Auth Service untuk rute publik
app.use(
    ['/api/auth/register', '/api/auth/login', '/api/auth/refresh', '/api/auth/logout', '/api/auth/oauth'],
    proksi(process.env.AUTH_SERVICE_URL)
);

// Auth Service untuk rute terproteksi
app.use('/api/auth', verifikasiToken, proksi(process.env.AUTH_SERVICE_URL));

// Perpustakaan Service untuk rute publik 
app.get('/api/buku', proksi(process.env.PERPUSTAKAAN_SERVICE_URL));
app.get('/api/buku/:id', proksi(process.env.PERPUSTAKAAN_SERVICE_URL));
app.get('/api/kategori', proksi(process.env.PERPUSTAKAAN_SERVICE_URL));
app.get('/api/buku/:id/ulasan', proksi(process.env.PERPUSTAKAAN_SERVICE_URL));

// Perpustakaan Service untuk rute terproteksi
app.use('/api/buku', verifikasiToken, proksi(process.env.PERPUSTAKAAN_SERVICE_URL));
app.use('/api/kategori', verifikasiToken, proksi(process.env.PERPUSTAKAAN_SERVICE_URL));

// Member Service untuk semua terproteksi
app.use('/api/anggota', verifikasiToken, proksi(process.env.MEMBER_SERVICE_URL));
app.use('/api/pinjaman', verifikasiToken, proksi(process.env.MEMBER_SERVICE_URL));
app.use('/api/denda', verifikasiToken, proksi(process.env.MEMBER_SERVICE_URL));

// Untuk menangani rute health
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        service: 'api-gateway',
        status:'aktif',
        routing: {
            auth_service: process.env.AUTH_SERVICE_URL,
            perpustakaan_service: process.env.PERPUSTAKAAN_SERVICE_URL,
            member_service: process.env.MEMBER_SERVICE_URL,
        },
    });
});

// Error handler untuk rute yang tidak ditemukan
app.use((req, res) =>
    res.status(404).json({ success: false, pesan: 'Rute tidak ditemukan di gateway', data: null })
);

// Jalankan server 
app.listen(PORT, () => {
    console.log(` API Gateway berjalan di port ${PORT}`);
    console.log(` auth-service → ${process.env.AUTH_SERVICE_URL}`);
    console.log(` perpustakaan-service → ${process.env.PERPUSTAKAAN_SERVICE_URL}`);
    console.log(` member-service → ${process.env.MEMBER_SERVICE_URL}`);
    console.log(` Batas kecepatan → ${process.env.RATE_LIMIT_MAX || 60} permintaan/menit per IP`);
});