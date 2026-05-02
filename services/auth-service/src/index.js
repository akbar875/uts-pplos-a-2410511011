require('dotenv').config();

// Import model
require('./models/userModel');
require('./models/refreshTokenModel');

const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');

const authController = require('./controllers/authController');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware global
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mendaftarkan router auth
app.use('/api/auth', authController);

// Untuk menangani rute yang tidak ditemukan
app.use((req, res) =>
  res.status(404).json({ success: false, pesan: 'Rute tidak ditemukan' })
);

// Untuk menangani error tidak terduga
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, pesan: 'Terjadi kesalahan pada server' });
});

// Sinkronisasi database lalu jalankan server
sequelize
  .sync()
  .then(() => {
    console.log('Database db-auth berhasil tersinkronisasi');
    app.listen(PORT, () =>
      console.log(`Auth-service berjalan di port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error('Koneksi database gagal:', err.message);
    process.exit(1);
  });
