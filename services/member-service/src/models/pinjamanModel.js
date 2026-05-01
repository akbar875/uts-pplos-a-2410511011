const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Anggota = require('./anggotaModel');

// Model untuk tabel pinjaman di database member_db
const Pinjaman = sequelize.define('Pinjaman', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    // Relasi ke tabel anggota
    id_anggota: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'anggota', key: 'id' },
        onDelete: 'CASCADE',
    },
    // ID buku dari perpustakaan-service bukan foreign key langsung
    id_buku: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    // Snapshot judul buku agar tidak bergantung perpustakaan-service
    judul_buku: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    tanggal_pinjam: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    tanggal_jatuh_tempo: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    tanggal_kembali: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    // Status pinjaman: aktif, dikembalikan, terlambat
    status: {
        type: DataTypes.ENUM('aktif', 'dikembalikan', 'terlambat'),
        defaultValue: 'aktif',
    },
}, 
{
    tableName: 'pinjaman',
    timestamps: true,
    createdAt: 'dibuat_pada',
    updatedAt: 'diperbarui_pada',
});

// Satu anggota bisa punya banyak pinjaman
Anggota.hasMany(Pinjaman, { foreignKey: 'id_anggota' });
Pinjaman.belongsTo(Anggota, { foreignKey: 'id_anggota' });

module.exports = Pinjaman;