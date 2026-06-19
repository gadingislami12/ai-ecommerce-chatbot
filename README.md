# AuraCart | AI Ecommerce Chatbot

AuraCart adalah aplikasi web e-commerce full-stack modern premium yang dibangun dengan **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase**, dan **Google Gemini API**.

Aplikasi ini menyediakan storefront publik dengan pencarian produk real-time dan filter kategori, panel kontrol admin untuk manajemen katalog produk, serta widget chatbot AI dengan pembatasan konteks yang dilengkapi dengan kartu rekomendasi produk interaktif secara inline.

---

## Teknologi & Fitur

- **Next.js 15 (App Router)**: Memanfaatkan rendering sisi server (Server-side Rendering) untuk query katalog dan API route handler untuk endpoint obrolan.
- **Supabase Database & Auth**: Menyimpan produk, log percakapan, dan pesan pelanggan dengan dashboard admin yang terproteksi dan route guard keamanan.
- **Supabase Storage**: Mendukung unggahan gambar produk secara langsung dari portal admin.
- **Google Gemini API**: Menggunakan model **`gemini-2.5-flash`** dengan instruksi sistem yang disesuaikan untuk menjawab pertanyaan dan memformat rekomendasi inline (`[RecommendProduct: <uuid>]`).
- **Tailwind CSS**: Desain responsif bertema dark mode & glassmorphism dengan transisi hover dan mikro-animasi premium.

---

## Konfigurasi Environment

Buat file `.env.local` di direktori utama (root) proyek Anda dan konfigurasi kredensial berikut:

```env
# Konfigurasi Supabase
NEXT_PUBLIC_SUPABASE_URL=https://project-id-anda.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Konfigurasi Google Gemini API
GEMINI_API_KEY=AQ.Ab8RN...
```

---

## Setup Database Supabase

### 1. Jalankan Migration SQL
Buka **Dashboard Proyek Supabase -> SQL Editor** Anda dan jalankan pernyataan SQL yang ditentukan dalam file migrasi:
[supabase/migrations/migration.sql](file:///c:/xampp/htdocs/ai_ecommerce_chabot/supabase/migrations/migration.sql)

Skrip ini akan mengatur:
- Tabel `products`, `conversations`, dan `messages`.
- Indeks performa untuk query kategori dan sesi.
- Kebijakan Row Level Security (RLS) yang mengizinkan baca/tulis publik untuk operasi chatbot, namun membatasi CRUD produk hanya untuk admin terautentikasi.

### 2. Konfigurasi Storage Bucket
1. Buka **Supabase Dashboard -> Storage**.
2. Klik **New Bucket** dan beri nama `product-images`.
3. Atur bucket menjadi **Public** agar gambar produk dapat diakses secara publik oleh browser.
4. Tambahkan kebijakan (Policies):
   - **Allowed operations (Select):** Terbuka untuk umum (`true`).
   - **Manage operations (Insert/Update/Delete):** Dibatasi hanya untuk pengguna terautentikasi (`authenticated` / admin).

### 3. Buat Akun Admin
1. Buka **Supabase Dashboard -> Authentication -> Users**.
2. Klik **Add User** dan pilih **Create User**.
3. Masukkan kredensial email dan password Anda. Gunakan kredensial ini untuk masuk pada halaman `/login` aplikasi Anda.

---

## Langkah Memulai

Pertama, instal dependensi proyek:

```bash
npm install
```

Kedua, jalankan server development lokal:

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) dengan browser Anda untuk melihat storefront AuraCart.

---

## Arsitektur Layout Aplikasi

- **Halaman Utama Publik** (`/`): Merender grid katalog, filter kategori, dan pencarian teks.
- **Detail Produk** (`/products/[id]`): Server Component yang menampilkan deskripsi dan status ketersediaan stok.
- **Autentikasi Admin** (`/login`): Formulir login admin di posisi tengah menggunakan Supabase Auth.
- **Panel Kontrol Admin** (`/admin`): Dashboard dengan tab untuk berpindah antara:
  - *Products*: Tabel CRUD produk lengkap dengan form slider dan unggahan gambar.
  - *Conversations*: Eksplorer sesi chat untuk mengaudit riwayat percakapan pelanggan.
- **AI Chatbot** (Global Widget): Widget melayang di pojok kanan bawah yang memproses balasan Gemini dan merender komponen `ProductCard` secara interaktif di dalam thread chat.

---

## Laporan Pengumpulan Proyek (Deliverables Checklist)

### 1. Repositori GitHub
* **URL Repositori:** [https://github.com/gadingislami12/ai-ecommerce-chatbot](https://github.com/gadingislami12/ai-ecommerce-chatbot)
* **Status:** Public (Siap di-review)

### 2. URL Live Demo
* **URL Website:** [https://ai-ecommerce-chabot.vercel.app/](https://ai-ecommerce-chabot.vercel.app/)

### 3. Skema Supabase / Migration File
* **Letak File SQL:** [supabase/migrations/migration.sql](file:///c:/xampp/htdocs/ai_ecommerce_chabot/supabase/migrations/migration.sql)

### 4. Ringkasan Fitur yang Selesai & Belum Selesai

#### Fitur yang Selesai (Completed):
* **Pencarian & Filter Produk:** Pencarian instan dan filter kategori dinamis di halaman depan.
* **Halaman Detail Produk:** Detail spesifikasi produk dan status ketersediaan stok.
* **Autentikasi Admin:** Akses terproteksi ke dashboard admin menggunakan Supabase Auth.
* **Manajemen Produk (CRUD):** Create, Read, Update, Delete produk dengan sistem upload gambar langsung ke Supabase Storage.
* **Audit Percakapan Chatbot:** Dashboard untuk melihat semua sesi percakapan chatbot pelanggan secara real-time.
* **AI Chatbot Belanja:** Chatbot dengan model `gemini-2.5-flash` yang dapat merekomendasikan produk secara inline menggunakan kartu produk interaktif.
* **Penyimpanan Sesi:** Menggunakan session ID lokal agar riwayat chat tidak hilang saat berpindah halaman.

#### Fitur yang Belum Selesai (Future Enhancements):
* **Sistem Checkout & Payment Gateway:** Saat ini tombol beli mengarah ke halaman detail. Integrasi payment gateway riil (seperti Midtrans) akan ditambahkan sebagai pengembangan berikutnya.
* **Pencarian Semantik (RAG):** Menggunakan vector search (`pgvector`) untuk pencarian produk berbasis kemiripan makna ketika katalog sudah berskala besar.

### 5. AI Tools yang Digunakan
* **Google Gemini API (`gemini-2.5-flash`):** Sebagai engine kecerdasan buatan utama untuk memproses pertanyaan pelanggan dan menghasilkan rekomendasi produk terformat.
* **Antigravity AI Coding Assistant:** Digunakan selama proses development untuk mempercepat bootstrap Next.js, pembuatan layout Tailwind CSS, debugging TypeScript, serta perancangan skema relasi database Supabase.

### 6. Trade-off Teknis yang Diambil
* **Client-side Fetching:** Kami menggunakan Client-side fetching (React Hooks) pada pencarian storefront agar performa pencarian terasa instan dan interaktif bagi pengguna, meskipun ini memindahkan proses rendering ke browser pengguna daripada Server-side Rendering (SSR).
* **Base64 vs Storage Bucket:** Gambar produk disimpan dalam Supabase Storage public bucket, bukan sebagai string Base64 di database. Hal ini menjaga ukuran baris database tetap kecil dan meningkatkan performa query, meskipun menambah kompleksitas manajemen kebijakan RLS pada storage.
* **Direct Prompt Injection vs RAG:** Kami memasukkan katalog produk langsung ke dalam instruksi sistem (system prompt) chatbot karena katalog saat ini masih kecil. Ini sangat cepat diimplementasikan, namun memiliki batasan kapasitas token jika katalog bertambah besar di masa depan.

---

## Jawaban Pertanyaan Refleksi

### 1. Mengapa Anda memilih tantangan ini?
Tantangan ini memadukan arsitektur web modern full-stack (Next.js & Supabase) dengan integrasi AI (Gemini SDK) secara real-world. Membangun asisten belanja AI (chatbot) yang cerdas, aman (session log audit di admin dashboard), dan interaktif (inline product cards) adalah studi kasus yang sangat relevan untuk industri e-commerce modern yang dinamis dan berorientasi pada konversi penjualan.

### 2. Bagian mana yang paling sulit?
* **Real-time Parsing & Dynamic Components**: Melakukan parsing dari output markdown mentah AI (seperti format penandaan `[RecommendProduct: <uuid>]`) dan menerjemahkannya secara dinamis menjadi komponen React `ProductCard` yang fungsional di dalam thread obrolan, sembari menjaga kelancaran animasi chat container.
* **Diagnostik Kecocokan Model & API Key**: Menemukan kecocokan antara tipe API Key (`AQ.` format baru Google AI Studio) dengan model yang didukung, di mana model lama seperti `1.5-flash` tidak ditemukan pada endpoint `v1beta`, dan `2.0-flash` memiliki batas kuota 0 gratis. Tantangan ini diselesaikan dengan melakukan query programatik untuk mencari model yang tersedia, hingga akhirnya berhasil menghubungkan model terbaru **`gemini-2.5-flash`**.

### 3. Apabila diberikan tambahan waktu satu hari, bagian mana yang akan Anda perbaiki?
* **Implementasi RAG (Retrieval-Augmented Generation) menggunakan Vector Search**: Saat ini katalog produk dikirim sebagai teks konteks statis ke Gemini. Jika katalog produk tumbuh menjadi ribuan item, hal ini akan melebihi context window dan sangat boros token. Saya akan menerapkan ekstensi `pgvector` di Supabase untuk mengubah katalog produk menjadi vector embeddings, lalu melakukan pencarian kemiripan semantik untuk mengambil produk relevan saja sebelum dikirim ke Gemini.
* **Keranjang Belanja (Cart) & Checkout Langsung**: Mengintegrasikan sistem keranjang belanja langsung di dalam chat widget, sehingga pengguna bisa menambahkan produk rekomendasi ke cart atau checkout langsung dengan Payment Gateway (seperti Midtrans) tanpa harus meninggalkan chatbot.

### 4. Bagaimana cara Anda melakukan scaling terhadap aplikasi ini apabila jumlah pengguna bertambah?
* **Optimasi Query & Read Replicas (Supabase)**: Memisahkan traffic baca dan tulis database. Mengaktifkan read-replicas untuk melayani query pencarian katalog produk yang berulang oleh pembaca/pengunjung storefront.
* **RAG Vector Search**: Membatasi muatan payload konteks sistem LLM menggunakan pencarian vector semantis, guna menghemat biaya token API Gemini dan mempercepat waktu tunggu respons AI.
* **Caching Layer**: Menerapkan Redis caching untuk menyimpan respons chatbot yang sering ditanyakan (FAQ) serta data session obrolan aktif pengguna guna mengurangi beban langsung ke database Supabase dan API Gemini.
* **Rate Limiting & Edge Functions**: Menerapkan pembatasan laju permintaan (rate limiting) menggunakan token bucket di Next.js middleware, serta memindahkan backend API Chatbot ke Edge Runtime (Vercel Edge / Supabase Edge Functions) untuk meminimalkan waktu respon (TTFB) secara global.
