const express  = require('express');
const Denda    = require('../models/dendaModel');
const Pinjaman = require('../models/pinjamanModel');
const Anggota  = require('../models/anggotaModel');

// JWT dipanggil dari file middleware terpisah
const { verifikasiToken, harusAdmin } = require('../middleware/jwtMiddleware');

const router = express.Router();

// GET /api/denda untuk melihat list denda 
router.get('/', verifikasiToken, async (req, res) => {
    try {
        const halaman = parseInt(req.query.halaman) || 1;
        const perHalaman = parseInt(req.query.per_halaman) || 10;
        const sudahDibayar = req.query.sudah_dibayar;

        const where = {};

        // Filter berdasarkan sudah dibayar
        if (sudahDibayar !== undefined)
            where.sudah_dibayar = sudahDibayar === 'true';

        // Anggota hanya lihat denda sendiri
        if (req.pengguna.peran !== 'admin') {
            const anggota = await Anggota.findOne({ where: { id_pengguna: req.pengguna.id } });
      
            // Jika anggota tidak ditemukan
            if (!anggota)
                return res.status(404).json({ success: false, pesan: 'Anggota tidak ditemukan', data: null });

            // Ambil id pinjaman anggota
            const pinjamanAnggota = await Pinjaman.findAll({
                where: { id_anggota: anggota.id },
                attributes: ['id'],
            });
      
            // Filter berdasarkan pinjaman anggota
            where.id_pinjaman = pinjamanAnggota.map((p) => p.id);
        }

        // Ambil data denda
        const { count, rows } = await Denda.findAndCountAll({
            where,
            include: [{
                model: Pinjaman,
                attributes: ['judul_buku', 'tanggal_pinjam', 'tanggal_jatuh_tempo', 'tanggal_kembali'],
            }],
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

// PATCH /api/denda/:id/bayar untuk menandai denda lunas dilakukan oleh admin
router.patch('/:id/bayar', verifikasiToken, harusAdmin, async (req, res) => {
    try {
        const denda = await Denda.findByPk(req.params.id);

        // Jika denda tidak ditemukan
        if (!denda)
            return res.status(404).json({ success: false, pesan: 'Data denda tidak ditemukan', data: null });

        // Jika denda sudah dibayar
        if (denda.sudah_dibayar)
            return res.status(409).json({ success: false, pesan: 'Denda sudah dibayar', data: null });

        // Perbarui data denda
        denda.sudah_dibayar = true;
        denda.dibayar_pada  = new Date();
        await denda.save();

        return res.status(200).json({ success: true, pesan: 'Denda berhasil ditandai lunas', data: denda});
    
    } catch (err) {
        return res.status(500).json({ success: false, pesan: 'Terjadi kesalahan pada server', data: null });
    }
});

module.exports = router;