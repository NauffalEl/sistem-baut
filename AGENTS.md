# AGENTS.md

## 1. Project Context

Project ini adalah Sistem Inventory Baut.

Gunakan PRD.md sebagai sumber utama requirement.

Dokumentasi project dapat dikelola menggunakan Obsidian.

Project menggunakan satu repository dan tidak memisahkan frontend dan backend menjadi repository terpisah.

---

# 2. Source of Truth

Prioritas informasi:

1. PRD.md
2. ARCHITECTURE.md
3. TASKS.md
4. Dokumentasi feature
5. Source code

Jika terdapat konflik requirement, jangan menebak.

Laporkan konflik dan minta keputusan user.

---

# 3. General Workflow

Sebelum mengerjakan task:

1. Baca PRD.md.
2. Baca TASKS.md.
3. Periksa struktur project.
4. Periksa source code yang berkaitan.
5. Periksa skill yang tersedia.
6. Gunakan skill yang relevan.
7. Buat rencana singkat.
8. Implementasikan perubahan.
9. Jalankan test.
10. Jalankan lint/typecheck jika tersedia.
11. Perbaiki error.
12. Update TASKS.md.

---

# 4. Skill Policy

Gunakan skill yang sudah terinstall terlebih dahulu.

Jangan menginstall skill baru hanya karena tersedia.

Jika task membutuhkan kemampuan khusus dan skill yang tersedia tidak cukup:

1. Gunakan find-skills.
2. Cari skill yang benar-benar relevan.
3. Tampilkan kandidat skill kepada user.
4. Jelaskan alasan skill dibutuhkan.
5. Jangan install skill tanpa persetujuan user.
6. Setelah user menyetujui, install skill tersebut.
7. Gunakan skill yang baru tersedia.

Jangan membuat custom skill jika skill yang tersedia sudah mencukupi.

---

# 5. Coding Policy

- Ikuti architecture.
- Jangan membuat duplikasi logic.
- Gunakan modular code.
- Gunakan naming yang jelas.
- Hindari hardcoded configuration.
- Gunakan environment variables.
- Validasi input.
- Tangani error.
- Jangan menghapus kode yang masih digunakan.
- Jangan melakukan perubahan besar tanpa alasan.

---

# 6. Database Policy

- Gunakan migration.
- Jangan mengubah database production secara destruktif.
- Gunakan foreign key.
- Gunakan transaction untuk operasi inventory penting.
- Pastikan perubahan stok konsisten.
- Jangan membuat duplicate source of truth untuk stock.

---

# 7. Inventory Rules

Stock harus mempunyai satu sumber kebenaran.

Purchase:
stock increase.

Sale:
stock decrease.

Adjustment:
stock change dengan alasan.

Setiap perubahan stock harus menghasilkan stock movement.

Jangan mengubah stock secara langsung tanpa mencatat sumber perubahan.

---

# 8. OCR Rules

OCR adalah alat ekstraksi data, bukan sumber kebenaran.

Workflow:

OCR
→ parsing
→ product matching
→ admin review
→ confirmation
→ database

Jangan menyimpan hasil OCR sebagai transaksi final tanpa proses confirmation jika confirmation diperlukan oleh business rule.

---

# 9. AI Agent Rules

AI Agent bukan sumber kebenaran database.

AI Agent hanya boleh:

- membaca data yang diperlukan,
- menganalisis,
- memberikan insight,
- menghasilkan rekomendasi,
- melakukan tindakan yang secara eksplisit diizinkan.

AI Agent tidak boleh melakukan destructive operation tanpa approval.

---

# 10. AI Agent State

AI Agent harus memiliki:

- enabled
- schedule enabled
- manual run
- last run
- next run

Jika enabled=false:

AI Agent tidak boleh dijalankan oleh scheduler.

---

# 11. AI Cost Policy

Hindari AI call yang tidak perlu.

Prioritas:

1. Database query/filter.
2. Rule-based logic.
3. Existing deterministic service.
4. AI hanya jika memang diperlukan.

AI Agent scheduled execution default sekitar weekly.

---

# 12. Security

- Jangan hardcode API key.
- Jangan commit .env.
- Gunakan .env.example.
- Jangan mengirim secret ke frontend.
- Hash password.
- Validate input.
- Authorize protected routes.
- Jangan expose stack trace ke user production.

---

# 13. Testing

Setiap fitur penting harus memiliki test yang sesuai.

Minimal test:

- Authentication.
- Product CRUD.
- Stock calculation.
- Purchase.
- Sale.
- Price history.
- AI Agent state.
- OCR mapping jika memungkinkan.

---

# 14. Change Management

Sebelum melakukan perubahan besar:

1. Jelaskan perubahan.
2. Identifikasi file terdampak.
3. Identifikasi risiko.
4. Implementasikan secara bertahap.

Setelah selesai:

- Test.
- Review.
- Update TASKS.md.

---

# 15. Do Not

Jangan:

- Membuat fitur yang tidak ada di PRD tanpa persetujuan.
- Menginstall banyak skill sekaligus.
- Menghardcode secret.
- Membuat AI berjalan terus-menerus tanpa kebutuhan.
- Menghapus database migration.
- Menghapus fitur existing tanpa alasan.
- Mengubah schema besar tanpa migration.