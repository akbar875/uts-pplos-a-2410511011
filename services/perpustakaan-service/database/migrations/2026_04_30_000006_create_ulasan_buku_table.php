<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    // Menbuat table ulasan_buku
    public function up(): void {
        Schema::create('ulasan_buku', function (Blueprint $table) {
            $table->id();
            $table->foreignId('buku_id')
                  ->constrained('buku')
                  ->onDelete('cascade');
            $table->uuid('id_pengguna'); // ref ke auth-service
            $table->string('nama_pengulas', 100);
            $table->tinyInteger('nilai'); // 1-5
            $table->text('komentar')->nullable();
            $table->timestamps();
            $table->unique(['buku_id', 'id_pengguna']);
        });
    }
    // Menghapus table ulasan_buku  
    public function down(): void { Schema::dropIfExists('ulasan_buku'); }
};