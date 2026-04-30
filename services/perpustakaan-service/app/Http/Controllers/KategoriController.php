<?php

namespace App\Http\Controllers;

use App\Models\Kategori;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

// Controller Kategori
class KategoriController extends Controller
{
    // GET /api/kategori untuk menlist semua kategori yang digunakan untuk publik
    public function index()
    {
        $kategori = Kategori::withCount('buku')->orderBy('nama_kategori')->get();

        return response()->json(['success' => true, 'data' => $kategori]);
    }

    // POST /api/kategori untuk menambah kategori yang digunakan oleh admin
    public function store(Request $request)
    {
        // Cek nama kategori wajib
        if (!$request->nama_kategori)
            return response()->json(['success' => false, 'pesan' => 'Nama kategori wajib diisi', 'data' => null], 400);

        // Cek apakah nama kategori sudah ada
        $sudahAda = Kategori::where('nama_kategori', $request->nama_kategori)->first();
        if ($sudahAda)
            return response()->json(['success' => false, 'pesan' => 'Nama kategori sudah terdaftar', 'data' => null], 409);

        // Simpan kategori
        $kategori = Kategori::create([
            'nama_kategori' => $request->nama_kategori,
            'slug' => Str::slug($request->nama_kategori),
        ]);

        return response()->json([
            'success' => true,
            'pesan' => 'Kategori berhasil ditambahkan',
            'data' => $kategori
        ], 201);
    }

    // DELETE /api/kategori/{id} untuk menghapus kategori dilakukan oleh admin
    public function destroy(int $id)
    {
        $kategori = Kategori::find($id);

        // Pengecekan kategori ada
        if (!$kategori)
            return response()->json(['success' => false, 'pesan' => 'Kategori tidak ditemukan', 'data' => null], 404);

        // Cegah hapus jika masih ada buku
        if ($kategori->buku()->count() > 0)
            return response()->json(['success' => false, 'pesan' => 'Tidak bisa hapus kategori yang masih memiliki buku', 'data' => null], 409);

        // Hapus kategori
        $kategori->delete();

        return response()->json(['success' => true, 'pesan' => 'Kategori berhasil dihapus', 'data' => null]);
    }
}