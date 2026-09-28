# SKILLS

## Purpose

Dokumen ini mengatur penggunaan skills dalam project Sistem Inventory Baut.

Prinsip utama:

> Gunakan skill yang sudah terinstall terlebih dahulu.

Jangan menginstall skill baru jika skill yang tersedia sudah mampu menyelesaikan task.

---

# 1. Skill Priority

Urutan penggunaan:

1. Built-in capability OpenCode.
2. Skill yang sudah terinstall.
3. Skill yang ditemukan menggunakan find-skills.
4. Custom skill hanya jika benar-benar diperlukan.

---

# 2. Existing Skills

Sebelum mengerjakan task:

1. Periksa skill yang tersedia.
2. Identifikasi skill yang relevan.
3. Gunakan skill tersebut.

Jangan mengasumsikan sebuah skill tersedia tanpa memeriksanya.

---

# 3. find-skills

find-skills digunakan ketika:

- Tidak ada skill yang sesuai.
- Skill existing tidak cukup.
- Task membutuhkan kemampuan khusus.

Contoh:

- OCR receipt.
- PostgreSQL.
- Prisma.
- Testing tertentu.
- Deployment tertentu.
- AI SDK tertentu.

---

# 4. Installation Policy

Jika skill belum tersedia:

1. Cari menggunakan find-skills.
2. Tampilkan kandidat.
3. Jelaskan fungsi kandidat.
4. Jelaskan kenapa skill diperlukan.
5. Tunggu persetujuan user.
6. Install hanya skill yang disetujui.
7. Gunakan skill tersebut.

Jangan melakukan auto-install.

---

# 5. Do Not Over-Install

Jangan menginstall skill hanya karena populer.

Jangan menginstall:

- skill duplikat,
- skill yang tidak relevan,
- skill yang tidak digunakan,
- skill hanya untuk mencoba-coba.

Tujuan skill adalah meningkatkan kemampuan coding, bukan memperbanyak jumlah skill.

---

# 6. Task-Based Skill Selection

## Project setup

Gunakan skill existing yang relevan.

Jika tidak tersedia, gunakan find-skills.

---

## Database

Kebutuhan:

- Database design
- ORM
- Migration
- Query
- Testing

Cari skill baru hanya jika existing skill tidak mencukupi.

---

## Frontend

Kebutuhan:

- UI
- React jika dipilih
- Accessibility
- Responsive design

Gunakan skill existing terlebih dahulu.

---

## Backend

Kebutuhan:

- API
- Authentication
- Validation
- Error handling

Gunakan skill existing terlebih dahulu.

---

## OCR

Ketika OCR mulai dikerjakan:

1. Periksa skill existing.
2. Jika belum ada kemampuan OCR yang relevan:
   gunakan find-skills.
3. Tampilkan kandidat.
4. Tunggu approval.
5. Install skill yang dipilih.

---

## AI Agent

Ketika AI Agent mulai dikerjakan:

1. Periksa skill existing.
2. Tentukan apakah skill baru benar-benar diperlukan.
3. Gunakan find-skills jika diperlukan.
4. Jangan install tanpa approval.

---

# 7. Skill Evaluation

Sebelum menggunakan skill baru, evaluasi:

- Relevansi.
- Maintenance.
- Dokumentasi.
- Compatibility.
- Security.
- Apakah skill benar-benar dibutuhkan.

---

# 8. Skill Usage Log

Jika skill baru diinstall, catat:

- Nama skill.
- Source.
- Alasan.
- Task yang menggunakan skill.
- Tanggal install.

---

# 9. Principle

Fokus pada:

> Minimum required skills.

Project harus tetap dapat dipahami dan dipelihara tanpa bergantung pada banyak skill yang tidak diperlukan.