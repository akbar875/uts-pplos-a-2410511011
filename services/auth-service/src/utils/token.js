const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/refreshTokenModel');

// Membuat access token dan refresh token
const buatToken = (pengguna) => {
const muatan = {
    id:    pengguna.id,
    email: pengguna.email,
    peran: pengguna.peran,
};

const accessToken = jwt.sign(muatan, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
});

const refreshToken = jwt.sign(
    { id: pengguna.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
);

    return { accessToken, refreshToken };
};

// Menyimpan refresh token ke tabel token_refresh di database
const simpanRefreshToken = async (idPengguna, token) => {
const kedaluwarsa = new Date();
kedaluwarsa.setDate(kedaluwarsa.getDate() + 7);
await RefreshToken.create({
    id_pengguna:      idPengguna,
    token,
    kedaluwarsa_pada: kedaluwarsa,
    });
};

module.exports = { buatToken, simpanRefreshToken };