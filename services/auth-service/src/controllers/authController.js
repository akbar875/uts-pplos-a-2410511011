const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

// JWT dipanggil dari file middleware terpisah
const { verifikasiToken } = require('../middleware/jwtMiddleware');

// Helper token dipanggil dari file utils terpisah
const { buatToken, simpanRefreshToken } = require('../utils/tokenHelper');

const router = express.Router();

//  Mendaftarkan akun baru 
router.post('/register', async (req, res) => {
    try {
        const { nama, email, password } = req.body;

        // Pengecekan input nama, email, dan password
        if (!nama)
            return res.status(422).json({ success: false, message: 'Nama wajib diisi', data: null });

        if (!email)
            return res.status(422).json({ success: false, message: 'Email wajib diisi', data: null });

        if (!password)
            return res.status(422).json({ success: false, message: 'Password wajib diisi', data: null });

        if (password.length < 6)
            return res.status(422).json({ success: false, message: 'Password minimal 6 karakter', data: null });

        // Cek apakah email sudah terdaftar
        const sudahAda = await User.findOne({ where: { email } });
        if (sudahAda)
            return res.status(409).json({ success: false, message: 'Email sudah terdaftar', data: null });

        // Enkripsi password lalu simpan pengguna baru
        const hash_password = await bcrypt.hash(password, 12);
        const pengguna = await User.create({ nama, email, hash_password });

        return res.status(201).json({ success: true, message: 'Akun berhasil didaftarkan', data: { id: pengguna.id, nama: pengguna.nama, email: pengguna.email }});

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server', data: null });
    }
});

// Melakukan login dengan email dan password 
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Pengecekan input email dan password
        if (!email)
            return res.status(422).json({ success: false, message: 'Email wajib diisi', data: null });

        if (!password)
            return res.status(422).json({ success: false, message: 'Password wajib diisi', data: null });

        // Cari pengguna berdasarkan email
        const pengguna = await User.findOne({ where: { email } });
        if (!pengguna || !pengguna.hash_password)
            return res.status(401).json({ success: false, message: 'Email atau password salah', data: null });

        // Verifikasi password yang dimasukkan
        const valid = await bcrypt.compare(password, pengguna.hash_password);
        if (!valid)
            return res.status(401).json({ success: false, message: 'Email atau password salah', data: null });

        // Buat token lalu simpan refresh token ke database
        const { accessToken, refreshToken } = buatToken(pengguna);
        await simpanRefreshToken(pengguna.id, refreshToken);

        return res.status(200).json({ success: true, message: 'Berhasil masuk', data: {
            access_token:  accessToken,
            refresh_token: refreshToken,
            tipe_token:    'Bearer',
            pengguna: {
                id:       pengguna.id,
                nama:     pengguna.nama,
                email:    pengguna.email,
                peran:    pengguna.peran,
                url_foto: pengguna.url_foto,
            },
        },
    });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server', data: null });
    }
});

module.exports = router;