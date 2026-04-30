<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    // Menbuat table author_buku
    public function up(): void {
        Schema::create('author_buku', function (Blueprint $table) {
            $table->id();
            $table->foreignId('buku_id')
                  ->constrained('buku')
                  ->onDelete('cascade');
            $table->string('nama_penulis', 150);
            $table->timestamps();
        });
    }
    // Menghapus table author_buku
    public function down(): void { Schema::dropIfExists('author_buku'); }
};