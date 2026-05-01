<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

// Model Penulis
class AuthorBuku extends Model {
    protected $table = 'author_buku';
    protected $fillable = ['buku_id', 'nama_penulis'];
    // Relasi
    public function buku() { 
        return $this->belongsTo(Buku::class, 'buku_id'); }
}