const express = require('express');
const axios   = require('axios');
const Anggota  = require('../models/anggotaModel');
const Pinjaman = require('../models/pinjamanModel');
const Denda    = require('../models/dendaModel');

// JWT dipanggil dari file middleware terpisah
const { verifikasiToken } = require('../middleware/jwtMiddleware');

// Helper denda dipanggil dari file utils terpisah
const { hitungDenda } = require('../utils/dendaHelper');

const router = express.Router();

const PERPUSTAKAAN_URL = () => process.env.PERPUSTAKAAN_SERVICE_URL || 'http://localhost:8000';

// GET /api/pinjaman untuk melihat list riwayat pinjaman 
router.get('/', verifikasiToken, async (req, res) => {
    try {
        // Query parameter
        const halaman = parseInt(req.query.halaman) || 1;
        const perHalaman = parseInt(req.query.per_halaman) || 10;
        const status = req.query.status;

        const where = {};

        // Anggota hanya bisa lihat pinjaman sendiri
        if (req.pengguna.peran !== 'admin') {
            const anggota = await Anggota.findOne({ where: { id_pengguna: req.pengguna.id } });
            
            // Jika anggota tidak ditemukan
            if (!anggota)
                return res.status(404).json({ success: false, pesan: 'Profil anggota tidak ditemukan', data: null });
            where.id_anggota = anggota.id;
        }

        // Filter berdasarkan status
        if (status) where.status = status;

        const { count, rows } = await Pinjaman.findAndCountAll({
            where,
            include: [{ model: Denda }],
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

// POST /api/pinjaman untuk pinjam buku 
router.post('/', verifikasiToken, async (req, res) => {
    try {
        const { id_buku } = req.body;

        // Cek ID buku wajib diisi
        if (!id_buku)
            return res.status(400).json({ success: false, pesan: 'ID buku wajib diisi', data: null });

    
        // Cek apakah pengguna sudah terdaftar sebagai anggota
        const anggota = await Anggota.findOne({ where: { id_pengguna: req.pengguna.id } });
        if (!anggota)
            return res.status(404).json({ success: false, pesan: 'Daftar sebagai anggota terlebih dahulu', data: null });

        // Cek apakah anggota aktif
        if (!anggota.aktif)
            return res.status(403).json({ success: false, pesan: 'Akun anggota tidak aktif', data: null });

        // Cek apakah buku yang sama sudah dipinjam
        const sudahDipinjam = await Pinjaman.findOne({
            where: { id_anggota: anggota.id, id_buku, status: 'aktif' },
        });
        
        // Jika sudah dipinjam
        if (sudahDipinjam)
            return res.status(409).json({ success: false, pesan: 'Buku sudah dipinjam', data: null });

        // Inter-service mengambil data buku dari perpustakaan-service 
        let judulBuku = `Buku #${id_buku}`;
            try {
                const responBuku = await axios.get(
                    `${PERPUSTAKAAN_URL()}/api/buku/${id_buku}`,
                    { timeout: 5000 }
                );

                // Jika buku tidak ditemukan
                if (!responBuku.data.success)
                    return res.status(404).json({ success: false, pesan: 'Buku tidak ditemukan', data: null });

                judulBuku = responBuku.data.data.judul;

                // Kurangi stok di perpustakaan-service
                await axios.patch(
                    `${PERPUSTAKAAN_URL()}/api/buku/${id_buku}/ketersediaan`,
                    { aksi: 'pinjam' },
                    { headers: { Authorization: req.headers['authorization'] }, timeout: 5000 }
                );

            } catch (err) {
                const pesan = err.response?.data?.pesan || 'Gagal berkomunikasi dengan perpustakaan-service';
                return res.status(err.response?.status || 502).json({ success: false, pesan, data: null });
            }

        // Buat record pinjaman dengan durasi 7 hari
        const tanggalPinjam = new Date();
        const tanggalJatuhTempo = new Date();
        tanggalJatuhTempo.setDate(tanggalJatuhTempo.getDate() + 7);

        // Buat record pinjaman
        const pinjaman = await Pinjaman.create({
            id_anggota: anggota.id,
            id_buku,
            judul_buku: judulBuku,
            tanggal_pinjam: tanggalPinjam.toISOString().split('T')[0],
            tanggal_jatuh_tempo: tanggalJatuhTempo.toISOString().split('T')[0],
        });

        return res.status(201).json({ success: true, pesan: 'Buku berhasil dipinjam', data: pinjaman});

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, pesan: 'Terjadi kesalahan pada server', data: null });
    }
});

// PATCH /api/pinjaman/:id/kembali untuk mengembalikan buku 
router.patch('/:id/kembali', verifikasiToken, async (req, res) => {
    try {
        const pinjaman = await Pinjaman.findByPk(req.params.id);

        // Jika pinjaman tidak ditemukan
        if (!pinjaman)
            return res.status(404).json({ success: false, pesan: 'Data pinjaman tidak ditemukan', data: null });

        // Jika buku sudah dikembalikan
        if (pinjaman.status === 'dikembalikan')
            return res.status(409).json({ success: false, pesan: 'Buku sudah dikembalikan', data: null });

        // Pastikan yang mengembalikan adalah peminjam atau admin
        const anggota = await Anggota.findOne({ where: { id_pengguna: req.pengguna.id } });
        if (req.pengguna.peran !== 'admin' && pinjaman.id_anggota !== anggota?.id)
            return res.status(403).json({ success: false, pesan: 'Tidak memiliki akses', data: null });

        // Hitung denda keterlambatan
        const { hariTerlambat, jumlahDenda } = hitungDenda(pinjaman.tanggal_jatuh_tempo);

        // Perbarui data pinjaman
        pinjaman.tanggal_kembali = new Date().toISOString().split('T')[0];
        pinjaman.status = 'dikembalikan';
        await pinjaman.save();

        // Buat record denda jika terlambat
        let denda = null;
        if (jumlahDenda > 0)
            denda = await Denda.create({ id_pinjaman: pinjaman.id, jumlah: jumlahDenda });

        // Inter-service memberi tahu perpustakaan-service untuk menambah kembali stok di perpustakaan-service 
        try {
            await axios.patch(
                `${PERPUSTAKAAN_URL()}/api/buku/${pinjaman.id_buku}/ketersediaan`,
                { aksi: 'kembali' },
                { headers: { Authorization: req.headers['authorization'] }, timeout: 5000 }
            );
        } catch (err) {
            console.warn('Gagal memberi tahu perpustakaan-service:', err.message);
        }

        return res.status(200).json({
            success: true,
            pesan: hariTerlambat > 0 ? `Buku dikembalikan. Denda: Rp ${jumlahDenda.toLocaleString('id-ID')}` : 'Buku dikembalikan tepat waktu',
            data: { pinjaman, denda, hari_terlambat: hariTerlambat },
        });

    } catch (err) {
        console.error(err);
    return res.status(500).json({ success: false, pesan: 'Terjadi kesalahan pada server', data: null });
    }
});

module.exports = router;