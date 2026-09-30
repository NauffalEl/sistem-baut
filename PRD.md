# PRD — Sistem Inventory Baut

## 1. Project Overview

Nama proyek: Sistem Inventory Baut

Sistem ini adalah aplikasi inventory untuk mengelola barang baut dan komponen terkait, pembelian, penjualan, stok, harga, OCR nota, serta AI Agent untuk membantu analisis dan administrasi.

Aplikasi dirancang sebagai satu project/repository dan dikembangkan menggunakan OpenCode dengan pendekatan vibe coding.

Dokumentasi proyek dikelola menggunakan Obsidian.

---

# 2. Problem Statement

Pengelolaan inventory baut memiliki beberapa masalah:

- Nama barang dapat berbeda tetapi merujuk pada barang yang sama.
- Harga barang dapat berubah dari waktu ke waktu.
- Stok harus diperbarui berdasarkan pembelian dan penjualan.
- Input nota secara manual membutuhkan waktu.
- Riwayat harga perlu disimpan.
- Admin membutuhkan informasi stok dan transaksi secara cepat.
- Data inventory yang besar membutuhkan analisis otomatis.
- AI Agent perlu dapat diaktifkan atau dinonaktifkan agar penggunaan AI dapat dikontrol.

Sistem harus menyediakan satu sumber data terpusat untuk inventory dan transaksi.

---

# 3. Goals

## Primary Goals

1. Mengelola master data barang.
2. Mengelola stok.
3. Mengelola pembelian.
4. Mengelola penjualan.
5. Menyimpan riwayat harga.
6. Menyimpan riwayat perubahan stok.
7. Membantu input nota menggunakan OCR.
8. Menyediakan dashboard.
9. Mengelompokkan nama barang yang berbeda tetapi kemungkinan merupakan barang yang sama.
10. Menyediakan AI Agent untuk analisis berkala.
11. Menyediakan kontrol ON/OFF untuk AI Agent.
12. Menyediakan eksekusi AI Agent secara manual.
13. Menyediakan scheduled AI Agent dengan frekuensi yang dapat dikonfigurasi.

---

# 4. Non Goals

Untuk versi awal sistem tidak mencakup:

- Marketplace.
- Payment gateway.
- Akuntansi lengkap.
- Payroll.
- Sistem ERP lengkap.
- AI yang secara bebas mengubah database tanpa kontrol.
- Continuous AI Agent yang berjalan setiap saat.

Fitur tersebut dapat dipertimbangkan pada versi berikutnya.

---

# 5. Users

## Admin

Admin memiliki akses penuh terhadap sistem.

Admin dapat:

- Mengelola barang.
- Mengelola kategori.
- Mengelola stok.
- Mengelola pembelian.
- Mengelola penjualan.
- Melihat dashboard.
- Mengelola user.
- Mengontrol AI Agent.
- Menjalankan AI Agent secara manual.
- Mengatur jadwal AI Agent.
- Melihat hasil analisis AI.

## User

User memiliki akses operasional sesuai permission yang diberikan.

User dapat:

- Melihat barang.
- Melihat stok.
- Membuat transaksi sesuai permission.
- Melihat transaksi yang diizinkan.

User tidak dapat mengubah konfigurasi sistem penting atau konfigurasi AI Agent kecuali diberikan permission.

---

# 6. Authentication

Sistem harus menyediakan:

- Register.
- Login.
- Logout.
- Session/token management.
- Password hashing.
- Role-based authorization.

Password tidak boleh disimpan dalam bentuk plaintext.

---

# 7. Master Product

Setiap barang memiliki data minimal:

- ID.
- Nama barang.
- SKU/kode barang.
- Kategori.
- Jenis.
- Ukuran.
- Material jika diperlukan.
- Satuan.
- Harga beli terakhir.
- Harga jual.
- Stok.
- Minimum stock.
- Status aktif/nonaktif.
- Created at.
- Updated at.

Sistem harus memungkinkan penambahan atribut produk di masa depan.

---

# 8. Product Grouping

Nama barang dapat berbeda tetapi mengacu pada barang yang sama.

Contoh:

- Baut M8 x 30
- Baut M8x30
- Baut M8 30mm
- Bolt M8x30

Sistem harus menyediakan mekanisme untuk menghubungkan beberapa nama/alias ke satu master product.

AI dapat membantu mengidentifikasi kemungkinan barang yang sama.

AI tidak boleh mengubah master product secara otomatis tanpa aturan atau approval yang ditentukan.

---

# 9. Inventory

Inventory harus mencatat:

- Stok saat ini.
- Minimum stock.
- Stok masuk.
- Stok keluar.
- Stok adjustment.
- Riwayat perubahan stok.

Setiap perubahan stok harus memiliki alasan/source.

Contoh source:

- Purchase.
- Sale.
- Adjustment.
- Return.
- Correction.

Sistem harus menjaga konsistensi stok dengan transaksi.

---

# 10. Price History

Sistem harus menyimpan riwayat harga.

Riwayat minimal:

- Product ID.
- Harga.
- Jenis harga.
- Sumber transaksi.
- Tanggal berlaku.
- Created at.

Jenis harga dapat berupa:

- Purchase price.
- Selling price.

Admin dapat melihat perubahan harga dari waktu ke waktu.

---

# 11. Purchase

Sistem harus dapat mencatat pembelian.

Data pembelian:

- Nomor transaksi.
- Supplier.
- Tanggal.
- Total.
- Item.
- Quantity.
- Harga satuan.
- Subtotal.
- Nota jika tersedia.

Pembelian yang telah dikonfirmasi akan menambah stok.

Harga pembelian dapat menghasilkan record pada price history.

---

# 12. OCR Receipt

Sistem dapat menerima foto atau file nota.

Workflow:

Upload nota
→ OCR
→ Extract text
→ Extract item
→ Extract quantity
→ Extract price
→ Mapping ke master product
→ Admin review
→ Admin confirm
→ Simpan purchase
→ Update inventory

Hasil OCR tidak boleh langsung dianggap benar.

Admin harus dapat:

- Mengubah nama barang.
- Mengubah quantity.
- Mengubah harga.
- Mengubah product mapping.
- Menghapus item yang salah terbaca.

OCR provider harus dibuat modular agar dapat diganti.

---

# 13. Sales

Sistem harus dapat mencatat penjualan.

Data:

- Nomor transaksi.
- Tanggal.
- Item.
- Quantity.
- Harga jual.
- Subtotal.
- Total.

Ketika transaksi penjualan dikonfirmasi:

- Stok berkurang.
- Stock movement dibuat.
- Penjualan disimpan.

Sistem harus mencegah stok menjadi negatif kecuali fitur tersebut secara eksplisit diaktifkan oleh Admin.

---

# 14. Deposit / Setoran

Sistem harus dapat menghitung total penjualan yang perlu disetorkan berdasarkan transaksi yang telah dikonfirmasi.

Setoran harus dapat ditelusuri kembali ke transaksi penjualan.

---

# 15. Dashboard

Dashboard minimal menampilkan:

- Total produk.
- Total stok.
- Produk stok rendah.
- Produk habis.
- Total pembelian.
- Total penjualan.
- Perubahan harga.
- Aktivitas inventory.
- Status AI Agent.

Dashboard harus menyediakan filter tanggal jika diperlukan.

---

# 16. AI Agent

AI Agent digunakan untuk membantu analisis dan administrasi.

AI Agent tidak menggantikan kontrol Admin.

AI Agent dapat:

### Inventory Analysis

- Mendeteksi stok rendah.
- Mendeteksi barang yang tidak bergerak.
- Menganalisis perubahan stok.

### Price Analysis

- Menganalisis perubahan harga.
- Membandingkan harga pembelian sebelumnya.
- Memberikan insight mengenai perubahan harga.

### Product Normalization

Membantu:

- Menormalisasi nama barang.
- Mendeteksi alias.
- Mengidentifikasi kemungkinan duplicate product.

### Weekly Report

AI Agent dapat membuat laporan:

- Kondisi inventory.
- Perubahan harga.
- Penjualan.
- Pembelian.
- Barang bermasalah.
- Rekomendasi yang dapat ditinjau Admin.

AI Agent harus menghasilkan rekomendasi yang dapat ditelusuri ke data sumber.

---

# 17. AI Agent ON/OFF

Admin memiliki kontrol:

- AI Agent ON/OFF.
- Scheduled Run ON/OFF.
- Run Now.

Contoh:

AI Agent:
ON

Scheduled Run:
OFF

Run Now:
Available

Artinya AI dapat dijalankan manual tetapi tidak dijalankan otomatis.

---

# 18. AI Agent Schedule

Default penggunaan AI Agent adalah sekitar satu kali per minggu untuk menghemat biaya.

Admin dapat mengatur:

- Enabled/disabled.
- Frequency.
- Hari.
- Waktu.

Scheduler tidak boleh menjalankan AI jika AI Agent dalam kondisi OFF.

---

# 19. AI Cost Control

Sistem harus menghindari penggunaan AI yang tidak perlu.

Prinsip:

- AI tidak berjalan terus-menerus.
- Scheduled execution dapat dimatikan.
- AI Agent default dapat dikonfigurasi menjadi weekly.
- Run Now dilakukan secara eksplisit.
- Data yang dikirim ke AI harus dibatasi pada data yang diperlukan.
- API key tidak boleh disimpan di frontend.

---

# 20. AI Provider

AI provider harus dibuat modular.

Konfigurasi provider menggunakan environment variables.

Contoh konsep:

AI_PROVIDER=
AI_API_KEY=
AI_MODEL=

Provider dapat menggunakan API compatible dengan OpenAI API.

Sistem tidak boleh hardcode provider tertentu di business logic.

---

# 21. Notifications

Sistem dapat memberikan notifikasi:

- Stok rendah.
- Stok habis.
- Hasil OCR siap direview.
- AI report tersedia.
- Perubahan harga penting.

---

# 22. Auditability

Operasi penting harus dapat ditelusuri.

Minimal:

- User.
- Action.
- Entity.
- Entity ID.
- Timestamp.
- Old value jika diperlukan.
- New value jika diperlukan.

---

# 23. Security

Sistem harus:

- Hash password.
- Melindungi API.
- Memvalidasi input.
- Menggunakan authorization.
- Tidak mengekspos API key.
- Menggunakan environment variables.
- Menghindari SQL injection.
- Menghindari insecure direct object access.
- Melakukan error handling tanpa membocorkan secret.

---

# 24. Technical Principles

- Single repository.
- Modular architecture.
- Separation of concerns.
- Reusable components.
- Validated API input.
- Database migrations.
- Automated testing.
- Environment-based configuration.
- Provider-agnostic AI service.
- Provider-agnostic OCR service.

---

# 25. Success Criteria

Versi pertama dianggap berhasil apabila:

1. Admin dapat login.
2. Admin dapat mengelola master barang.
3. Stok dapat bertambah melalui pembelian.
4. Stok dapat berkurang melalui penjualan.
5. Riwayat stok tersimpan.
6. Riwayat harga tersimpan.
7. Nota dapat diproses menggunakan OCR.
8. Hasil OCR dapat direview sebelum disimpan.
9. Dashboard menampilkan kondisi inventory.
10. AI Agent dapat ON/OFF.
11. AI Agent dapat dijalankan manual.
12. AI Agent dapat dijadwalkan.
13. AI Agent dapat menghasilkan laporan.
14. Sistem memiliki testing dasar.
15. Tidak ada API secret yang terekspos di frontend.