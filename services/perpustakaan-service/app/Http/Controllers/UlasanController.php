<?php

namespace App\Http\Controllers;

use App\Models\Buku;
use App\Models\UlasanBuku;
use Illuminate\Http\Request;

// Controller Ulasan
class UlasanController extends Controller
{
    // GET /api/buku/{id}/ulasan untuk menlist ulasan buku dilankan oleh publik
    public function index(Request $request, int $bukuId)
    {
        $buku = Buku::find($bukuId);

        // Cek apakah buku ditemukan
        if (!$buku)
            return response()->json(['success' => false, 'pesan' => 'Buku tidak ditemukan', 'data' => null], 404);

        // Paging
        $perHalaman = (int) $request->query('per_halaman', 10);
        $halaman = (int) $request->query('halaman', 1);

        // Ambil data
        $total = UlasanBuku::where('buku_id', $bukuId)->count();
        $ulasan = UlasanBuku::where('buku_id', $bukuId)
            ->orderBy('created_at', 'desc')
            ->skip(($halaman - 1) * $perHalaman)
            ->take($perHalaman)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $ulasan,
            'meta' => [
                'total' => $total,
                'halaman' => $halaman,
                'per_halaman' => $perHalaman,
                'halaman_akhir' => (int) ceil($total / $perHalaman),
                'rata_rata_nilai' => $buku->rataRataNilai(),
            ],
        ]);
    }

    // POST /api/buku/{id}/ulasan untuk menambah ulasan dilakan oleh member
    public function store(Request $request, int $bukuId)
    {
        $buku = Buku::find($bukuId);

        // Cek apakah buku ditemukan
        if (!$buku)
            return response()->json(['success' => false, 'pesan' => 'Buku tidak ditemukan', 'data' => null], 404);

        // Pengecekan data ulasan
        if (!$request->nilai)
            return response()->json(['success' => false, 'pesan' => 'Nilai wajib diisi', 'data' => null], 400);

        // Cek nilai antara 1 sampai 5
        if ($request->nilai < 1 || $request->nilai > 5)
            return response()->json(['success' => false, 'pesan' => 'Nilai harus antara 1 sampai 5', 'data' => null], 400);

        $pengguna = $request->pengguna; // dari middleware JwtVerify

        // Cek apakah pengguna sudah pernah memberi ulasan
        $sudahUlasan = UlasanBuku::where('buku_id', $bukuId)
            ->where('id_pengguna', $pengguna['id'])
            ->first();

        // Jika sudah pernah memberi ulasan
        if ($sudahUlasan)
            return response()->json(['success' => false, 'pesan' => 'Anda sudah memberikan ulasan untuk buku ini', 'data' => null], 409);

        // Simpan ulasan
        $ulasan = UlasanBuku::create([
            'buku_id' => $bukuId,
            'id_pengguna' => $pengguna['id'],
            'nama_pengulas' => $pengguna['nama'] ?? 'Anonim',
            'nilai' => $request->nilai,
            'komentar' => $request->komentar,
        ]);

        return response()->json([
            'success' => true,
            'pesan' => 'Ulasan berhasil ditambahkan',
            'data' => $ulasan
        ], 201);
    }

    // DELETE /api/buku/{id}/ulasan/{ulasanId} untuk menghapus ulasan
    public function destroy(Request $request, int $bukuId, int $ulasanId)
    {
        $ulasan = UlasanBuku::where('id', $ulasanId)->where('buku_id', $bukuId)->first();

        // Cek apakah ulasan ditemukan
        if (!$ulasan)
            return response()->json(['success' => false, 'pesan' => 'Ulasan tidak ditemukan', 'data' => null], 404);

        // Ambil data
        $pengguna = $request->pengguna;

        // Hanya pemilik ulasan atau admin yang bisa hapus
        if ($pengguna['peran'] !== 'admin' && $ulasan->id_pengguna !== $pengguna['id'])
            return response()->json(['success' => false, 'pesan' => 'Tidak memiliki akses', 'data' => null], 403);

        // Hapus ulasan
        $ulasan->delete();

        return response()->json(['success' => true, 'pesan' => 'Ulasan berhasil dihapus', 'data' => null]);
    }
}