<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

// Client untuk member-service
class MemberServiceClient
{
    private string $baseUrl;

    // Konstruktor untuk inisialisasi baseUrl dari env
    public function __construct()
    {
        $this->baseUrl = rtrim(env('MEMBER_SERVICE_URL', 'http://localhost:3002'));
    }

    // Cek apakah anggota masih memiliki pinjaman aktif
    public function getPinjamanAktifAnggota(string $idAnggota, string $token): array
    {
        try {
            $respon = Http::withToken($token)
                ->timeout(5)
                ->get("{$this->baseUrl}/api/anggota/{$idAnggota}/pinjaman/aktif");

            // Jika respon berhasil
            if ($respon->successful())
                return $respon->json();

        } catch (\Throwable $e) {
            \Log::warning("MemberServiceClient error: {$e->getMessage()}");
        }

        return ['success' => false, 'data' => []];
    }
}