<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;
use Throwable;

// Middleware untuk verifikasi JWT
class JwtVerify
{
    // Fungsi middleware
    public function handle(Request $request, Closure $next, string $peran = null)
    {
        $headerOtorisasi = $request->header('Authorization');

        // Cek apakah header Authorization ada dan berformat Bearer
        if (!$headerOtorisasi || !str_starts_with($headerOtorisasi, 'Bearer '))
            return response()->json([ 'success' => false, 'message' => 'Token akses diperlukan', 'data' => null ], 401);

        // Ambil token dari header
        $token = substr($headerOtorisasi, 7);

        try {
            $terdekode = JWT::decode($token, new Key(env('JWT_SECRET'), 'HS256'));

            // Simpan data pengguna ke request agar bisa dipakai controller
            $request->merge(['pengguna' => (array) $terdekode]);

            // Cek peran jika ada parameter
            if ($peran && (!isset($terdekode->peran) || $terdekode->peran !== $peran))
                return response()->json([ 'success' => false, 'message' => 'Hak akses tidak mencukupi', 'data' => null ], 403);

        } catch (ExpiredException) {
            return response()->json([ 'success' => false, 'message' => 'Token akses sudah kedaluwarsa', 'data' => null ], 401);
        } catch (SignatureInvalidException) {
            return response()->json([ 'success' => false, 'message' => 'Tanda token tidak valid', 'data' => null  ], 401);
        } catch (Throwable) {
            return response()->json([ 'success' => false, 'message' => 'Token akses tidak valid', 'data' => null ], 401);
        }
        
        return $next($request);
    }
}