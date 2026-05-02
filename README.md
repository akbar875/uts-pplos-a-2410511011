# Sistem Informasi Perpustakaan Digital
UTS Pembangunan Perangkat Lunak Berorientasi Service  
Dosen: Muhammad Panji Muslim, S.Pd., M.Kom


## Identitas
| Field | Detail |
|---|---|
| Nama | Akbar Fitri Andhika |
| NIM | 2410511011 |
| Kelas | A |
| Studi Kasus | Sistem Informasi Perpustakaan Digital |
| OAuth Provider | GitHub OAuth |

## Demo Video
Tautan demo: [https://youtu.be/LINK_VIDEO](https://youtu.be/LINK_VIDEO)

## Tech Stack
- auth-service: Node.js, Express, Sequelize, MySQL, JWT, GitHub OAuth
- library-service: PHP 8.2, Laravel 11, MySQL
- member-service: Node.js, Express, Sequelize, MySQL
- gateway: Node.js, Express, http-proxy-middleware


## Cara Menjalankan
### Prasyarat
Pastikan sudah terinstall:
- Docker dan Docker Compose
- Git

### 1. Clone Repository
```bash
git clone https://github.com/akbar875/uts-pplos-a-2410511011.git
cd uts-pplos-a-2410511011
```

### 2. Buat File .env di Root
Buat file .env di folder root sejajar dengan `docker-compose.yml` lalu isi:

```env
JWT_SECRET=supersecretjwtkey_minimal32karakter
JWT_REFRESH_SECRET=refreshsecretkey_minimal32karakter
GITHUB_CLIENT_ID=isi_dengan_client_id_github_oauth_app
GITHUB_CLIENT_SECRET=isi_dengan_client_secret_github_oauth_app
APP_KEY=base64:isi_dengan_laravel_app_key
```

>**Catatan:** Untuk mendapatkan `GITHUB_CLIENT_ID` dan `GITHUB_CLIENT_SECRET`, harus membuat OAuth App dahulu di [GitHub Developer Settings](https://github.com/settings/developers) dengan Callback URL: `http://localhost:3001/api/auth/oauth/github/callback`

### 3. Menjalankan Semua Service

```bash
docker-compose up --build
```

Tunggu hingga semua containernya berjalan. Urutan startup otomatis:
1. `auth-db`, `perpustakaan-db`, `member-db` (MySQL)
2. `auth-service`, `perpustakaan-service`, `member-service`
3. `api-gateway`

### 4. Verifikasi Sistem Berjalan
```bash
curl http://localhost:8080/health
```

Jika sistem berjalan normal, respons yang muncul adalah:

```json
{ "success": true, "service": "api-gateway", "status": "aktif" }
```

### 5. Menghentikan Sistem

```bash
# Untuk menghentikan container
docker-compose down
# Untuk menghentikan dan menghapus data database juga:
docker-compose down -v
```


## Peta Endpoint

> Semua request dikirim ke **API Gateway** di `http://localhost:8080`  
> Klien tidak dapat mengakses service secara langsung dari luar gateway.

### Auth Service (`/api/auth`)

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `POST` | `/api/auth/register` | Publik | Daftar akun baru |
| `POST` | `/api/auth/login` | Publik | Login, mendapat access & refresh token |
| `POST` | `/api/auth/refresh` | Publik | Perbarui access token dengan refresh token |
| `POST` | `/api/auth/logout` | Publik | Logout, invalidasi refresh token |
| `GET` | `/api/auth/me` | JWT | Lihat data diri sendiri |
| `GET` | `/api/auth/oauth/github` | Publik | Redirect ke halaman login GitHub |
| `GET` | `/api/auth/oauth/github/callback` | Publik | Callback OAuth dari GitHub |

### Perpustakaan Service (`/api/buku`, `/api/kategori`)

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `GET` | `/api/buku` | Publik | Daftar semua buku (paging & filter) |
| `GET` | `/api/buku/:id` | Publik | Detail satu buku |
| `POST` | `/api/buku` | JWT (Admin) | Tambah buku baru |
| `PUT` | `/api/buku/:id` | JWT (Admin) | Update data buku |
| `DELETE` | `/api/buku/:id` | JWT (Admin) | Hapus buku |
| `PATCH` | `/api/buku/:id/ketersediaan` | JWT | Update stok buku (dipanggil member-service) |
| `GET` | `/api/buku/:id/ulasan` | Publik | Daftar ulasan buku (paging) |
| `POST` | `/api/buku/:id/ulasan` | JWT | Tambah ulasan buku |
| `DELETE` | `/api/buku/:id/ulasan/:ulasanId` | JWT | Hapus ulasan (pemilik / admin) |
| `GET` | `/api/kategori` | Publik | Daftar semua kategori |
| `POST` | `/api/kategori` | JWT (Admin) | Tambah kategori |
| `DELETE` | `/api/kategori/:id` | JWT (Admin) | Hapus kategori |

### Member Service (`/api/anggota`, `/api/pinjaman`, `/api/denda`)

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `GET` | `/api/anggota` | JWT (Admin) | Daftar semua anggota (paging & cari) |
| `GET` | `/api/anggota/:id` | JWT | Detail anggota |
| `POST` | `/api/anggota` | JWT | Daftar sebagai anggota |
| `PUT` | `/api/anggota/:id` | JWT | Update profil anggota |
| `GET` | `/api/anggota/:id/pinjaman/aktif` | JWT | Daftar pinjaman aktif anggota |
| `GET` | `/api/pinjaman` | JWT | Daftar semua pinjaman |
| `POST` | `/api/pinjaman` | JWT | Buat pinjaman buku baru |
| `PATCH` | `/api/pinjaman/:id/kembali` | JWT | Proses pengembalian buku |
| `GET` | `/api/denda` | JWT | Daftar semua denda |
| `PATCH` | `/api/denda/:id/bayar` | JWT (Admin) | Tandai denda sebagai lunas |

### Gateway

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `GET` | `/health` | Publik | Cek status gateway & routing |

---

## Catatan Tambahan
- Access token berlaku selama 15 menit, refresh token berlaku 7 hari.
- Gateway membatasi request sebesar 60 request/menit per IP. Jika batas terlampaui, server akan mengembalikan status `429 Too Many Requests`.
- Koleksi Postman tersedia di folder `/postman/collection.json`.