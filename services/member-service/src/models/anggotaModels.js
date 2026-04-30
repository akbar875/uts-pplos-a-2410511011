const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Model untuk tabel anggota di database member_db
const Anggota = sequelize.define('Anggota', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    // Referensi ke id pengguna di auth-service
    id_pengguna: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
    },
    nama: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
    },
    telepon: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    alamat: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    // Status aktif atau tidak
    aktif: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
}, 
{
    tableName: 'anggota',
    timestamps: true,
    createdAt: 'dibuat_pada',
    updatedAt: 'diperbarui_pada',
});

module.exports = Anggota;