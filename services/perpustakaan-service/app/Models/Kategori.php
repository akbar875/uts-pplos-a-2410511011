<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

// Model Kategori
class Kategori extends Model {
    protected $table = 'kategori';
    protected $fillable = ['nama_kategori', 'slug', 'untuk_usia'];

    // Auto-generate slug saat create
    protected static function booted(): void {
        static::creating(function ($kategori) {
            if (empty($kategori->slug))
                $kategori->slug = Str::slug($kategori->nama_kategori);
        });
    }

    // Satu kategori punya banyak buku
    public function buku() {
        return $this->hasMany(Buku::class, 'kategori_id');
    }
}