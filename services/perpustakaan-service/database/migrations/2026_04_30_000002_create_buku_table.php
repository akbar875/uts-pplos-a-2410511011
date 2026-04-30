<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    // Menbuat table buku
    public function up(): void {
        Schema::create('buku', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kategori_id')
                  ->constrained('kategori')
                  ->onDelete('restrict');
            $table->string('judul', 255);
            $table->string('isbn', 20)->unique()->nullable();
            $table->integer('jumlah_halaman')->nullable();
            $table->text('deskripsi')->nullable();
            $table->integer('tahun_terbit')->nullable();
            $table->string('penerbit', 150)->nullable();
            $table->string('url_sampul', 500)->nullable();
            $table->integer('jumlah_total')->default(1);
            $table->integer('jumlah_tersedia')->default(1);
            $table->timestamps();
        });
    }
    // Menghapus table buku
    public function down(): void { Schema::dropIfExists('buku'); }
};