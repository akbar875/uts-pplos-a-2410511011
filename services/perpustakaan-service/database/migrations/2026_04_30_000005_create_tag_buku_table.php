<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    // Menbuat table tag_buku
    public function up(): void {
        Schema::create('tag_buku', function (Blueprint $table) {
            $table->id();
            $table->foreignId('buku_id')
                  ->constrained('buku')
                  ->onDelete('cascade');
            $table->string('tag', 50);
            $table->timestamps();
            $table->unique(['buku_id', 'tag']);
        });
    }
    // Menghapus table tag_buku
    public function down(): void { Schema::dropIfExists('tag_buku'); }
};