require('dotenv').config();

// Daftarkan model agar asosiasi terbentuk
require('./models/anggotaModel');
require('./models/pinjamanModel');
require('./models/dendaModel');

const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');

const anggotaController = require('./controllers/anggotaController');
const pinjamanController = require('./controllers/pinjamanController');
const dendaController = require('./controllers/dendaController');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware global
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Daftarkan semua router
app.use('/api/anggota', anggotaController);
app.use('/api/pinjaman', pinjamanController);
app.use('/api/denda', dendaController);

// Untuk menangani rute yang tidak ditemukan
app.use((req, res) =>
    res.status(404).json({ success: false, pesan: 'Rute tidak ditemukan', data: null })
);

// Untuk menangani error tidak terduga
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, pesan: 'Terjadi kesalahan pada server', data: null });
});

// Sinkronisasi database lalu jalankan server
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log('Database db_member berhasil tersinkronisasi');
    app.listen(PORT, () =>
      console.log(`Member-service berjalan di port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error('Koneksi database gagal:', err.message);
    process.exit(1);
  });