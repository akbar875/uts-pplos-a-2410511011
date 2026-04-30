<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    // Menbuat table kategori
    public function up(): void {
        Schema::create('kategori', function (Blueprint $table) {
            $table->id();
            $table->string('nama_kategori', 100)->unique();
            $table->string('slug', 120)->unique();
            $table->integer('untuk_usia')->nullable();
            $table->timestamps();
        });
    }
    // Menghapus table kategori
    public function down(): void { Schema::dropIfExists('kategori'); }
};