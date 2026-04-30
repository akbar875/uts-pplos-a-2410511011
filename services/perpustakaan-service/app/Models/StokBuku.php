<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

// Model Stok
class StokBuku extends Model {
    protected $table    = 'stok_buku';
    protected $fillable = ['buku_id', 'kondisi', 'sumber_pengadaan', 'tanggal_pengadaan', 'tersedia'];
    protected $casts    = ['tersedia' => 'boolean', 'tanggal_pengadaan' => 'date'];
    // Relasi
    public function buku() { 
        return $this->belongsTo(Buku::class, 'buku_id'); }
}