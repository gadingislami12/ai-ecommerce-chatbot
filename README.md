# AuraCart | AI Ecommerce Chatbot

AuraCart is a premium, full-stack, modern ecommerce web application built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase**, and the **Google Gemini API**.

It features a public storefront with real-time product search and category filters, an admin control panel for product catalog management, and a context-restricted AI chatbot widget equipped with inline product recommendation cards.

---

## Technical Stack & Features

- **Next.js 15 (App Router)**: Utilizing server-side rendering for catalog queries and API route handlers for chat endpoints.
- **Supabase Database & Auth**: Stores products, conversation logs, and customer messages with protected admin dashboards and route guards.
- **Supabase Storage**: Supports direct product image uploads from the admin portal.
- **Google Gemini API**: Utilizes `gemini-2.5-flash` with tailored system instructions for query answering and inline recommendation formatting (`[RecommendProduct: <uuid>]`).
- **Tailwind CSS**: Responsive dark/glassmorphic designs with hover transitions and micro-animations.

---

## Environment Configuration

Create a `.env.local` file in the root directory and configure the following credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Gemini API Configuration
GEMINI_API_KEY=AIzaSy...
```

---

## Supabase Database Setup

### 1. Execute Migration SQL
Go to your **Supabase Project Dashboard -> SQL Editor** and execute the SQL statements defined in the migration file:
[supabase/migrations/migration.sql](file:///c:/xampp/htdocs/ai_ecommerce_chabot/supabase/migrations/migration.sql)

This script sets up:
- The `products`, `conversations`, and `messages` tables.
- Performance indexes for category and session queries.
- Row Level Security (RLS) policies allowing public read/insert for chatbot operations, but restricting CRUD edits to authenticated admins.

### 2. Configure Storage Bucket
1. Go to **Supabase Dashboard -> Storage**.
2. Click **New Bucket** and name it `product-images`.
3. Set the bucket to **Public** so product images are accessible.
4. Add policies:
   - **Allowed operations**: Select is public (`true`).
   - **Manage operations**: Insert, Update, and Delete are restricted to `authenticated` users (admins).

### 3. Create Admin Account
1. Go to **Supabase Dashboard -> Authentication -> Users**.
2. Click **Add User** and choose **Create User**.
3. Input your email and password credentials. Use these credentials to sign in on the `/login` page of your application.

---

## Getting Started

First, install dependencies:

```bash
npm install
```

Second, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the AuraCart storefront.

---

## Application Layout Architecture

- **Public Frontpage** (`/`): Renders catalog grids, categories, and text searches.
- **Product Detail** (`/products/[id]`): Server Component showcasing description and availability.
- **Admin Authentication** (`/login`): Centered login form using Supabase auth.
- **Admin Control Panel** (`/admin`): Toggle between:
  - *Products*: Listing CRUD table with form sliders and image uploads.
  - *Conversations*: Session log explorer auditing customer dialogues.
- **AI Chatbot** (Global Widget): Floating window parsing Gemini returns and rendering inline `ProductCard` components.

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

