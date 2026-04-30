<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

// Model Tag
class TagBuku extends Model {
    protected $table    = 'tag_buku';
    protected $fillable = ['buku_id', 'tag'];
    // Relasi
    public function buku() { 
        return $this->belongsTo(Buku::class, 'buku_id'); }
}