const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./userModel');

// Model untuk tabel token_refresh di database auth_db
const RefreshToken = sequelize.define('RefreshToken', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },

    // Relasi ke tabel pengguna
    id_pengguna: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'pengguna', key: 'id' },
        onDelete: 'CASCADE',
    },

    token: {
        type: DataTypes.TEXT,
        allowNull: false,
    },

    // Waktu kedaluwarsa token
    kedaluwarsa_pada: {
        type: DataTypes.DATE,
        allowNull: false,
    },

    // Status token: true jika sudah dicabut saat logout
    dicabut: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, 
{
    tableName: 'token_refresh',
    timestamps: true,
    createdAt: 'dibuat_pada',
    updatedAt: false,
});

// Satu pengguna bisa punya banyak refresh token
User.hasMany(RefreshToken, { foreignKey: 'id_pengguna' });
RefreshToken.belongsTo(User, { foreignKey: 'id_pengguna' });

module.exports = RefreshToken;