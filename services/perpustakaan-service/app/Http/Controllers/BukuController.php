<?php

namespace App\Http\Controllers;

use App\Models\Buku;
use App\Models\AuthorBuku;
use App\Models\StokBuku;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

// Controller Buku
class BukuController extends Controller
{
    // GET /api/buku untuk katalog publik dengan paging dan filtering
    public function index(Request $request)
    {
        // Paging
        $perHalaman = (int) $request->query('per_halaman', 10);
        $halaman = (int) $request->query('halaman', 1);
        $cari = $request->query('cari');
        $kategoriId = $request->query('kategori_id');
        $tahun = $request->query('tahun_terbit');

        // Filtering
        $query = Buku::with(['kategori', 'penulis'])
            ->when($cari, fn($q) => $q->where('judul', 'like', "%{$cari}%"))
            ->when($kategoriId, fn($q) => $q->where('kategori_id', $kategoriId))
            ->when($tahun, fn($q) => $q->where('tahun_terbit', $tahun))
            ->orderBy('created_at', 'desc');

        // Mengambil data
        $total = $query->count();
        $buku = $query->skip(($halaman - 1) * $perHalaman)->take($perHalaman)->get();

        return response()->json([
            'success' => true,
            'data' => $buku,
            'meta' => [
                'total' => $total,
                'halaman' => $halaman,
                'per_halaman' => $perHalaman,
                'halaman_akhir' => (int) ceil($total / $perHalaman),
            ],
        ]);
    }

    // GET /api/buku/{id} untuk menampilkan detail buku
    public function show(int $id)
    {
        $buku = Buku::with(['kategori', 'penulis', 'stok', 'tag', 'ulasan'])->find($id);

        // Pengecekan buku ada
        if (!$buku)
            return response()->json([ 'success' => false, 'pesan' => 'Buku tidak ditemukan', 'data' => null ], 404);

        return response()->json(['success' => true, 'data' => $buku]);
    }

    // POST /api/buku untuk menambah buku dilakukan oleh admin
    public function store(Request $request)
    {
        // Pengecekan data buku
        if (!$request->kategori_id)
            return response()->json(['success' => false, 'pesan' => 'Kategori wajib diisi', 'data' => null], 400);

        if (!$request->judul)
            return response()->json(['success' => false, 'pesan' => 'Judul wajib diisi', 'data' => null], 400);

        if (!$request->penulis || !is_array($request->penulis) || count($request->penulis) === 0)
            return response()->json(['success' => false, 'pesan' => 'Minimal 1 penulis wajib diisi', 'data' => null], 400);

        // Cek kategori ada
        if (!\App\Models\Kategori::find($request->kategori_id))
            return response()->json(['success' => false, 'pesan' => 'Kategori tidak ditemukan', 'data' => null], 404);

        DB::beginTransaction();
        try {
            $jumlahTotal = $request->input('jumlah_total', 1);

            // Simpan buku
            $buku = Buku::create([
                'kategori_id' => $request->kategori_id,
                'judul' => $request->judul,
                'isbn' => $request->isbn,
                'jumlah_halaman' => $request->jumlah_halaman,
                'deskripsi' => $request->deskripsi,
                'tahun_terbit' => $request->tahun_terbit,
                'penerbit' => $request->penerbit,
                'url_sampul' => $request->url_sampul,
                'jumlah_total' => $jumlahTotal,
                'jumlah_tersedia' => $jumlahTotal,
            ]);

            // Simpan penulis buku
            foreach ($request->penulis as $namaPenulis) {
                PenulisBuku::create(['buku_id' => $buku->id, 'nama_penulis' => $namaPenulis]);
            }

            // Buat stok sesuai jumlah total
            for ($i = 0; $i < $jumlahTotal; $i++) {
                StokBuku::create(['buku_id' => $buku->id]);
            }

            // database commit
            DB::commit();

            return response()->json([ 'success' => true, 'pesan' => 'Buku berhasil ditambahkan', 'data' => $buku->load(['kategori', 'penulis', 'stok'])], 201);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([ 'success' => false, 'pesan' => 'Gagal menambahkan buku', 'data' => null ], 500);
        }
    }

    // PUT /api/buku/{id} untuk update buku dilakukan oleh admin
    public function update(Request $request, int $id)
    {
        $buku = Buku::find($id);

        // Pengecekan buku ada
        if (!$buku)
            return response()->json(['success' => false, 'pesan' => 'Buku tidak ditemukan', 'data' => null], 404);

        DB::beginTransaction();
        try {
            $buku->update([
                'kategori_id' => $request->kategori_id  ?? $buku->kategori_id,
                'judul' => $request->judul ?? $buku->judul,
                'isbn' => $request->isbn ?? $buku->isbn,
                'jumlah_halaman' => $request->jumlah_halaman ?? $buku->jumlah_halaman,
                'deskripsi' => $request->deskripsi ?? $buku->deskripsi,
                'tahun_terbit' => $request->tahun_terbit ?? $buku->tahun_terbit,
                'penerbit' => $request->penerbit ?? $buku->penerbit,
                'url_sampul' => $request->url_sampul ?? $buku->url_sampul,
            ]);

            // Update penulis jika ada
            if ($request->has('penulis') && is_array($request->penulis)) {
                PenulisBuku::where('buku_id', $id)->delete();
                foreach ($request->penulis as $namaPenulis) {
                    PenulisBuku::create(['buku_id' => $id, 'nama_penulis' => $namaPenulis]);
                }
            }

            DB::commit();

            return response()->json([ 'success' => true, 'pesan' => 'Buku berhasil diperbarui', 'data' => $buku->load(['kategori', 'penulis']) ]);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'pesan' => 'Gagal memperbarui buku', 'data' => null], 500);
        }
    }

    // DELETE /api/buku/{id} untuk menghapus buku dilakukan oleh admin
    public function destroy(int $id)
    {
        $buku = Buku::find($id);

        // Pengecekan buku ada
        if (!$buku)
            return response()->json(['success' => false, 'pesan' => 'Buku tidak ditemukan', 'data' => null], 404);

        // Hapus buku
        $buku->delete();

        return response()->json(['success' => true, 'pesan' => 'Buku berhasil dihapus', 'data' => null]);
    }

    // PATCH /api/buku/{id}/ketersediaan untuk ketersediaan buku dipanggil member-service
    public function updateKetersediaan(Request $request, int $id)
    {
        $buku = Buku::find($id);

        // Pengecekan buku ada
        if (!$buku)
            return response()->json(['success' => false, 'pesan' => 'Buku tidak ditemukan', 'data' => null], 404);

        $aksi = $request->input('aksi'); // 'pinjam' | 'kembali'

        // Update ketersediaan
        if ($aksi === 'pinjam') {
            if ($buku->jumlah_tersedia <= 0)
                return response()->json(['success' => false, 'pesan' => 'Tidak ada stok tersedia', 'data' => null], 409);
            $buku->decrement('jumlah_tersedia');

        // Kembalikan semua stok
        } elseif ($aksi === 'kembali') {
            if ($buku->jumlah_tersedia >= $buku->jumlah_total)
                return response()->json(['success' => false, 'pesan' => 'Semua stok sudah dikembalikan', 'data' => null], 409);
            $buku->increment('jumlah_tersedia');

        } else {
            return response()->json(['success' => false, 'pesan' => 'Aksi tidak valid, gunakan pinjam atau kembali', 'data' => null], 400);
        }

        return response()->json([ 'success' => true, 'pesan' => 'Ketersediaan buku berhasil diperbarui', 'data' => ['buku_id' => $id, 'jumlah_tersedia' => $buku->fresh()->jumlah_tersedia] ]);
    }
}