const jwt = require('jsonwebtoken');

// Middleware untuk memverifikasi access token JWT
const verifikasiToken = (req, res, next) => {
    const headerOtorisasi = req.headers['authorization'];
    const token = headerOtorisasi && headerOtorisasi.split(' ')[1];

    // Jika token tidak ada
    if (!token)
        return res.status(401).json({ success: false, pesan: 'Token akses diperlukan', data: null });

    try {
        req.pengguna = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        const pesan = err.name === 'TokenExpiredError' ? 'Token akses sudah kedaluwarsa' : 'Token akses tidak valid';
        return res.status(401).json({ success: false, pesan, data: null });
    }
};

// Middleware untuk memastikan pengguna memiliki hak akses admin
const harusAdmin = (req, res, next) => {
    if (req.pengguna?.peran !== 'admin')
        return res.status(403).json({ success: false, pesan: 'Hak akses admin diperlukan', data: null });
    next();
};

module.exports = { verifikasiToken, harusAdmin };