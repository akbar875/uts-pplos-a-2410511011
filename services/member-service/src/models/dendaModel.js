const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Pinjaman = require('./pinjamanModel');

// Model untuk tabel denda di database member_db
const Denda = sequelize.define('Denda', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    // Satu pinjaman hanya bisa punya satu denda
    id_pinjaman: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'pinjaman', key: 'id' },
        onDelete: 'CASCADE',
    },
    // Jumlah denda dalam rupiah
    jumlah: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    // Status pembayaran denda
    sudah_dibayar: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    dibayar_pada: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, 
{
    tableName: 'denda',
    timestamps: true,
    createdAt: 'dibuat_pada',
    updatedAt: 'diperbarui_pada',
});

// Satu pinjaman punya maksimal satu denda
Pinjaman.hasOne(Denda,    { foreignKey: 'id_pinjaman' });
Denda.belongsTo(Pinjaman, { foreignKey: 'id_pinjaman' });

module.exports = Denda;