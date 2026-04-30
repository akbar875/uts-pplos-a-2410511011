// Helper untuk menghitung jumlah denda keterlambatan
const hitungDenda = (tanggalJatuhTempo) => {
    const sekarang = new Date();
    const jatuhTempo = new Date(tanggalJatuhTempo);
    const dendaPerHari = parseInt(process.env.DENDA_PER_HARI) || 10000;

    // Hitung selisih hari keterlambatan
    const selisihHari = Math.max( 0, Math.floor((sekarang - jatuhTempo) / (1000 * 60 * 60 * 24)));

    return {
        hariTerlambat: selisihHari,
        jumlahDenda: selisihHari * dendaPerHari,
    };
};

module.exports = { hitungDenda };