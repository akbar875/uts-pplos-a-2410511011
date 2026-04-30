<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

// Model Buku
class Buku extends Model {
    protected $table    = 'buku';
    protected $fillable = [
        'kategori_id', 'judul', 'isbn', 'jumlah_halaman', 'deskripsi',
        'tahun_terbit', 'penerbit', 'url_sampul',
        'jumlah_total', 'jumlah_tersedia',
    ];

    // Konversi nilai integer
    protected $casts = [
        'jumlah_halaman' => 'integer',
        'tahun_terbit' => 'integer',
        'jumlah_total' => 'integer',
        'jumlah_tersedia' => 'integer',
    ];

    // Relasi
    public function kategori()  { 
        return $this->belongsTo(Kategori::class, 'kategori_id'); }
    public function penulis()   { 
        return $this->hasMany(PenulisBuku::class, 'buku_id'); }
    public function stok()      { 
        return $this->hasMany(StokBuku::class, 'buku_id'); }
    public function tag()       { 
        return $this->hasMany(TagBuku::class, 'buku_id'); }
    public function ulasan()    { 
        return $this->hasMany(UlasanBuku::class, 'buku_id'); }

    // Hitung rata-rata nilai ulasan
    public function rataRataNilai(): float {
        return round($this->ulasan()->avg('nilai') ?? 0, 1);
    }
}