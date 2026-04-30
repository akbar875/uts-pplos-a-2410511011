<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    // Menbuat table stok_buku
    public function up(): void {
        Schema::create('stok_buku', function (Blueprint $table) {
            $table->id();
            $table->foreignId('buku_id')
                  ->constrained('buku')
                  ->onDelete('cascade');
            $table->string('kondisi', 50)->default('baik'); // baik, rusak, hilang
            $table->string('sumber_pengadaan', 100)->nullable();
            $table->date('tanggal_pengadaan')->nullable();
            $table->boolean('tersedia')->default(true);
            $table->timestamps();
        });
    }
    // Menghapus table stok_buku
    public function down(): void { Schema::dropIfExists('stok_buku'); }
};