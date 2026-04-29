require('dotenv').config();

const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');

// Daftarkan model agar asosiasi antar tabel terbentuk
require('./models/userModel');

const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware global
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rute utama auth service
app.use('/api/auth', authRoutes);

// Endpoint pengecekan status service
app.get('/info', (req, res) =>
  res.status(200).json({ 
    success: true, 
    service: 'auth-service', 
    status: 'aktif' 
  })
);

// Untuk menangani rute yang tidak ditemukan
app.use((req, res) =>
  res.status(404).json({ success: false, message: 'Rute tidak ditemukan' })
);

// Untuk menangani error yang tidak terduga
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
});

// Sinkronisasi database lalu jalankan ke server
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log('Database auth-db berhasil tersinkronisasi');
    app.listen(PORT, () => 
      console.log(`Auth-service berjalan di port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error('Koneksi database gagal:', err.message);
    process.exit(1);
  });