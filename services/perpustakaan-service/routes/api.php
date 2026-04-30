<?php

use App\Http\Controllers\BukuController;
use App\Http\Controllers\KategoriController;
use App\Http\Controllers\UlasanController;
use Illuminate\Support\Facades\Route;

// Rute untuk katalog publik tidak membutuhkan autentikasi
Route::get('/buku', [BukuController::class, 'index']);
Route::get('/buku/{id}', [BukuController::class, 'show']);
Route::get('/kategori', [KategoriController::class, 'index']);

// Ulasan publik hanya baca
Route::get('/buku/{id}/ulasan', [UlasanController::class, 'index']);

// Rute yang membutuhkan autentikasi
Route::middleware('jwt.verify')->group(function () {

    // Inter-service route dipanggil member-service saat pinjam/kembali buku
    Route::patch('/buku/{id}/ketersediaan', [BukuController::class, 'updateKetersediaan']);

    // Tambah ulasan dilakukan oleh member
    Route::post('/buku/{id}/ulasan', [UlasanController::class, 'store']);
    Route::delete('/buku/{id}/ulasan/{ulasanId}', [UlasanController::class, 'destroy']);

    // Khusus untuk admin
    Route::middleware('jwt.verify:admin')->group(function () {
        Route::post('/buku', [BukuController::class, 'store']);
        Route::put('/buku/{id}', [BukuController::class, 'update']);
        Route::delete('/buku/{id}', [BukuController::class, 'destroy']);

        Route::post('/kategori', [KategoriController::class, 'store']);
        Route::delete('/kategori/{id}', [KategoriController::class, 'destroy']);
    });
});

// Rute untuk cek bisa diakses
Route::get('/health', fn() => response()->json([
    'success' => true,
    'service' => 'perpustakaan-service',
    'status' => 'aktif',
]));