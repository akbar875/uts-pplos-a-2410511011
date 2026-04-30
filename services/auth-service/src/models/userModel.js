const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Model untuk tabel pengguna di database auth_db
const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
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

    // Null jika pengguna daftar lewat OAuth
    hash_password: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },

    // Provider OAuth yang digunakan: lokal atau github
    provider_oauth: {
        type: DataTypes.ENUM('lokal', 'github'),
        defaultValue: 'lokal',
    },

    // ID pengguna dari provider OAuth
    id_oauth: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },

    // Foto profil dari provider OAuth
    url_foto: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

    // Hak akses pengguna: admin atau anggota
    peran: {
        type: DataTypes.ENUM('admin', 'anggota'),
        defaultValue: 'anggota',
    },
}, 
{
    tableName: 'users',
    timestamps: true,
    createdAt: 'dibuat_pada',
    updatedAt: 'diperbarui_pada',
});

module.exports = User;