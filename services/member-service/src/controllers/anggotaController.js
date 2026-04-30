const express = require('express');
const Anggota  = require('../models/anggotaModel');
const Pinjaman = require('../models/pinjamanModel');

// JWT dipanggil dari file middleware terpisah
const { verifikasiToken, harusAdmin } = require('../middleware/jwtMiddleware');

const router = express.Router();

// GET /api/anggota untuk menlist semua anggota dilakukan oleh admin 
router.get('/', verifikasiToken, harusAdmin, async (req, res) => {
    try {
        const halaman = parseInt(req.query.halaman)    || 1;
        const perHalaman = parseInt(req.query.per_halaman) || 10;
        const cari = req.query.cari;

        const { Op } = require('sequelize');
        const where = {};
        if (cari) {
            where[Op.or] = [
                { nama: { [Op.like]: `%${cari}%` } },
                { email: { [Op.like]: `%${cari}%` } },
            ];
        }

        const { count, rows } = await Anggota.findAndCountAll({
            where,
            limit: perHalaman,
            offset: (halaman - 1) * perHalaman,
            order: [['dibuat_pada', 'DESC']],
        });

        return res.status(200).json({
            success: true,
            data: rows,
            meta: {
                total: count,
                halaman,
                per_halaman: perHalaman,
                halaman_akhir: Math.ceil(count / perHalaman),
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, pesan: 'Terjadi kesalahan pada server', data: null });
    }
});

// GET /api/anggota/:id  untuk menampilkan detail anggota 
router.get('/:id', verifikasiToken, async (req, res) => {
    try {
        const anggota = await Anggota.findByPk(req.params.id);

        // Jika anggota tidak ditemukan
        if (!anggota)
            return res.status(404).json({ success: false, pesan: 'Anggota tidak ditemukan', data: null });

        return res.status(200).json({ success: true, data: anggota });
    } catch (err) {
        return res.status(500).json({ success: false, pesan: 'Terjadi kesalahan pada server', data: null });
    }
});

// POST /api/anggota untuk daftar sebagai anggota
router.post('/', verifikasiToken, async (req, res) => {
    try {
        const { nama, email, telepon, alamat } = req.body;

        // Cek nama dan email wajib diisi
        if (!nama)
            return res.status(400).json({ success: false, pesan: 'Nama wajib diisi', data: null });

        if (!email)
            return res.status(400).json({ success: false, pesan: 'Email wajib diisi', data: null });

        // Cek apakah pengguna sudah terdaftar sebagai anggota
        const sudahAnggota = await Anggota.findOne({ where: { id_pengguna: req.pengguna.id } });
        if (sudahAnggota)
            return res.status(409).json({ success: false, pesan: 'Anda sudah terdaftar sebagai anggota', data: null });

        const anggota = await Anggota.create({
            id_pengguna: req.pengguna.id,
            nama,
            email,
            telepon,
            alamat,
        });

        return res.status(201).json({ success: true, pesan: 'Berhasil terdaftar sebagai anggota', data: anggota});
    } catch (err) {
        return res.status(500).json({ success: false, pesan: 'Terjadi kesalahan pada server', data: null });
    }
});

// PUT /api/anggota/:id untuk mengupdate profil anggota
router.put('/:id', verifikasiToken, async (req, res) => {
    try {
        const anggota = await Anggota.findByPk(req.params.id);

        // Jika anggota tidak ditemukan
        if (!anggota)
            return res.status(404).json({ success: false, pesan: 'Anggota tidak ditemukan', data: null });

        // Hanya bisa edit diri sendiri atau admin
        if (req.pengguna.peran !== 'admin' && anggota.id_pengguna !== req.pengguna.id)
            return res.status(403).json({ success: false, pesan: 'Tidak memiliki akses', data: null });

        const { nama, email, telepon, alamat } = req.body;
        await anggota.update({ nama, email, telepon, alamat });

        return res.status(200).json({ success: true, pesan: 'Profil anggota berhasil diperbarui', data: anggota });
    } catch (err) {
        return res.status(500).json({ success: false, pesan: 'Terjadi kesalahan pada server', data: null });
    }
});

// GET /api/anggota/:id/pinjaman/aktif untuk inter-service, dipanggil perpustakaan-service untuk cek pinjaman aktif anggota
router.get('/:id/pinjaman/aktif', verifikasiToken, async (req, res) => {
    try {
        const pinjaman = await Pinjaman.findAll({
            where: { id_anggota: req.params.id, status: 'aktif' },
        });

        return res.status(200).json({ success: true, data: pinjaman });
    } catch (err) {
        return res.status(500).json({ success: false, pesan: 'Terjadi kesalahan pada server', data: null });
    }
});

module.exports = router;