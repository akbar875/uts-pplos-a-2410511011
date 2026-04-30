<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

// Model Ulasan
class UlasanBuku extends Model {
    protected $table    = 'ulasan_buku';
    protected $fillable = ['buku_id', 'id_pengguna', 'nama_pengulas', 'nilai', 'komentar'];
    protected $casts    = ['nilai' => 'integer'];
    // Relasi
    public function buku() { 
        return $this->belongsTo(Buku::class, 'buku_id'); }
}