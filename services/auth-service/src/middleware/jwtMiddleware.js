const jwt = require('jsonwebtoken');

// Middleware untuk memverifikasi access token JWT
const verifikasiToken = (req, res, next) => {
  const headerOtorisasi = req.headers['authorization'];
  const token = headerOtorisasi && headerOtorisasi.split(' ')[1]; // Ambil token dari header Bearer

  // Jika token tidak ada
  if (!token)
    return res.status(401).json({ success: false, message: 'Token akses diperlukan' });

  try {
    // Verifikasi token menggunakan secret key
    req.pengguna = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    const pesan = err.name === 'TokenExpiredError' ? 'Token akses sudah kedaluwarsa' : 'Token akses tidak valid';
    return res.status(401).json({ success: false, pesan });
  }
};

// Middleware untuk memastikan pengguna memiliki hak akses admin
const harusAdmin = (req, res, next) => {
  if (req.pengguna?.peran !== 'admin')
    return res.status(403).json({ success: false, message: 'Hak akses admin diperlukan' });
  next();
};

module.exports = { verifikasiToken, harusAdmin };