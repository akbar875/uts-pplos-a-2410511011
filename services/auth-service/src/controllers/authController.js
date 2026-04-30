const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const RefreshToken = require('../models/refreshTokenModel');
const jwt = require('jsonwebtoken');

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

//  Memperbarui access token 
router.post('/refresh', async (req, res) => {
    try {
        const { refresh_token } = req.body;

        // Pengecekan input
        if (!refresh_token)
            return res.status(400).json({ success: false, message: 'Refresh token wajib diisi', data: null });

        // Verifikasi refresh token
        const terdekode = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);

        // Cek token di database, pastikan belum dicabut
        const tersimpan = await RefreshToken.findOne({ where: { token: refresh_token, dicabut: false }});

        // Jika token tidak ditemukan, atau sudah dicabut, atau sudah kedaluwarsa   
        if (!tersimpan || new Date() > tersimpan.kedaluwarsa_pada)
            return res.status(401).json({ success: false, message: 'Refresh token tidak valid atau sudah kedaluwarsa', data: null });

        // Cari pengguna
        const pengguna = await User.findByPk(terdekode.id);
        if (!pengguna)
            return res.status(401).json({ success: false, message: 'Pengguna tidak ditemukan', data: null });

        // Cabut token lama lalu buat token baru (rotasi token)
        tersimpan.dicabut = true;
        await tersimpan.save();

        const { accessToken, refreshToken: tokenBaru } = buatToken(pengguna);
        await simpanRefreshToken(pengguna.id, tokenBaru);

        return res.status(200).json({ success: true, message: 'Token berhasil diperbarui', data: {
            access_token:  accessToken,
            refresh_token: tokenBaru,
            tipe_token:    'Bearer',
        },
    });

    } catch (err) {
        return res.status(401).json({ success: false, message: 'Refresh token tidak valid', data: null });
    }
});

//  Logout token 
router.post('/logout', async (req, res) => {
    try {
        const { refresh_token } = req.body;

        // Pengecekan input
        if (!refresh_token)
            return res.status(400).json({ success: false, message: 'Refresh token wajib diisi', data: null });

        // Cari refresh token lalu tandai sebagai dicabut (blacklist)
        const tersimpan = await RefreshToken.findOne({ where: { token: refresh_token } });
        if (tersimpan) {
            tersimpan.dicabut = true;
            await tersimpan.save();
        }

        return res.status(200).json({ success: true, message: 'Berhasil keluar', data: null });

    } catch (err) {
        return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server', data: null });
    }
});

// Mengambil data pengguna yang sedang login dengan verifikasiToken dipanggil dari middleware/jwtMiddleware.js
router.get('/me', verifikasiToken, async (req, res) => {
    try {
        const pengguna = await User.findByPk(req.pengguna.id, {
            attributes: ['id', 'nama', 'email', 'peran', 'provider_oauth', 'url_foto', 'dibuat_pada'],
        });

        // Jika pengguna tidak ditemukan
        if (!pengguna)
            return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan', data: null });

        return res.status(200).json({ success: true, message: 'Data pengguna berhasil diambil', data: pengguna });

    } catch (err) {
        return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server', data: null });
    }
});

module.exports = router;