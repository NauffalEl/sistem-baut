# ARCHITECTURE — SISTEM INVENTORY BAUT

## 1. Architecture

Sistem menggunakan **Modular Monolith**.

* Satu repository.
* Satu aplikasi.
* Frontend dan backend dalam satu project.
* PostgreSQL sebagai database.
* Modul dipisahkan berdasarkan fungsi.
* Tidak menggunakan microservices pada versi awal.

```text
User
  ↓
Application UI
  ↓
Application/API
  ↓
Business Logic
  ↓
Database
```

External services:

```text
Application
   ├── OCR Engine
   └── AI Provider
```

**OCR dan AI adalah dua sistem yang berbeda.**

---

## 2. Stack

| Bagian         | Teknologi             |
| -------------- | --------------------- |
| Framework      | Next.js               |
| Language       | TypeScript            |
| UI             | React                 |
| Styling        | Tailwind CSS          |
| UI Components  | shadcn/ui             |
| Database       | PostgreSQL            |
| ORM            | Prisma                |
| Validation     | Zod                   |
| Authentication | Auth.js               |
| Testing        | Vitest + Playwright   |
| OCR            | OCR Engine/Provider   |
| AI             | OpenAI-compatible API |
| AI Router      | 9router               |
| Documentation  | Obsidian + Markdown   |
| Coding Agent   | OpenCode              |

---

## 3. Project Structure

```text
sistem-baut/
│
├── app/
│   ├── login/
│   ├── dashboard/
│   ├── products/
│   ├── inventory/
│   ├── purchases/
│   ├── sales/
│   ├── ocr/
│   ├── ai-agent/
│   ├── settings/
│   └── api/
│
├── components/
│   ├── ui/
│   ├── dashboard/
│   ├── products/
│   ├── inventory/
│   ├── purchases/
│   ├── sales/
│   ├── ocr/
│   └── ai-agent/
│
├── lib/
│   ├── auth/
│   ├── db/
│   ├── products/
│   ├── inventory/
│   ├── purchases/
│   ├── sales/
│   ├── ocr/
│   ├── ai/
│   └── utils/
│
├── prisma/
│   └── schema.prisma
│
├── tests/
├── public/
├── docs/
├── .opencode/
│
├── PRD.md
├── AGENTS.md
├── TASKS.md
├── SKILLS.md
├── ARCHITECTURE.md
├── package.json
├── .env.example
└── .gitignore
```

---

## 4. Main Modules

```text
Authentication
Products
Categories
Inventory
Purchases
Sales
Price History
OCR
Dashboard
AI Agent
Settings
Audit
```

---

## 5. Database

Database menggunakan **PostgreSQL + Prisma**.

Entity utama:

```text
User
Role
Category
Product
ProductAlias
Supplier

Inventory
StockMovement

Purchase
PurchaseItem

Sale
SaleItem

PriceHistory

Receipt
OCRResult

AIAgentSettings
AIExecutionLog
AIReport

AuditLog
```

Relasi utama:

```text
Category
   ↓
Product
   ├── ProductAlias
   ├── Inventory
   ├── StockMovement
   └── PriceHistory

Purchase
   └── PurchaseItem
          ↓
       Product

Sale
   └── SaleItem
          ↓
       Product
```

---

## 6. Inventory

Database adalah **source of truth**.

```text
Purchase
   ↓
Stock +
   ↓
Stock Movement

Sale
   ↓
Stock -
   ↓
Stock Movement

Adjustment
   ↓
Stock ±
   ↓
Stock Movement
```

Setiap perubahan stock harus memiliki `StockMovement`.

Stock tidak boleh negatif kecuali fitur tersebut diaktifkan oleh Admin.

---

## 7. Purchase Flow

```text
Create Purchase
      ↓
Add Items
      ↓
Review
      ↓
Confirm
      ↓
Stock +
      ↓
Stock Movement
      ↓
Price History
```

Purchase yang belum dikonfirmasi tidak mengubah stock.

---

## 8. Sales Flow

```text
Create Sale
      ↓
Add Items
      ↓
Check Stock
      ↓
Review
      ↓
Confirm
      ↓
Stock -
      ↓
Stock Movement
      ↓
Calculate Total
      ↓
Calculate Deposit
```

---

# 9. OCR Architecture

OCR **tidak menggunakan AI**.

OCR hanya bertugas membaca teks dari nota.

```text
Upload Nota
    ↓
OCR Engine
    ↓
Raw Text
    ↓
Text Parser
    ↓
Normalize Text
    ↓
Product Matching
    ↓
Admin Review
    ↓
Confirm
    ↓
Create Purchase
    ↓
Update Stock
```

---

## 10. OCR Processing

### 10.1 OCR Engine

OCR Engine membaca gambar/PDF nota dan menghasilkan teks.

```text
Nota
 ↓
OCR Engine
 ↓
Raw Text
```

OCR Engine tidak bertugas menentukan produk atau mengubah database.

---

### 10.2 Text Parser

Parser mengambil informasi dari hasil OCR.

Contoh:

```text
Raw Text:

BAUT M8 X 30    100 PCS    500
BAUT M10 X 40    50 PCS    750
```

Menjadi:

```text
[
  {
    name: "BAUT M8 X 30",
    quantity: 100,
    price: 500
  },
  {
    name: "BAUT M10 X 40",
    quantity: 50,
    price: 750
  }
]
```

---

### 10.3 Product Matching

Product matching tidak menggunakan AI.

Urutan:

```text
Exact Match
     ↓
Normalization
     ↓
Alias Match
     ↓
Similarity Match
     ↓
Manual Review
```

Contoh:

```text
OCR:
"Baut M8 30"

Master Product:
"Baut M8 x 30"
```

Sistem mencoba mencocokkan berdasarkan:

1. Exact name.
2. Normalized name.
3. Product alias.
4. String similarity.
5. Manual selection jika tidak ditemukan.

---

## 11. OCR Rule

OCR tidak boleh:

* mengubah stock secara langsung;
* membuat purchase final secara otomatis;
* mengubah harga master secara langsung;
* menggunakan AI untuk menentukan product.

OCR hanya menghasilkan **draft data**.

Finalisasi dilakukan setelah Admin melakukan review.

```text
OCR
 ↓
Draft
 ↓
Admin Review
 ↓
Confirmation
 ↓
Transaction
```

---

# 12. AI Agent

AI Agent adalah sistem terpisah dari OCR.

AI digunakan untuk analisis dan rekomendasi.

AI Agent dapat melakukan:

```text
Inventory Analysis
Price Analysis
Sales Analysis
Purchase Analysis
Product Name Normalization Suggestion
Product Grouping Suggestion
Weekly Report
```

AI bukan source of truth.

---

## 13. AI Architecture

```text
AI Agent
    ↓
AI Service
    ↓
AI Provider Interface
    ↓
AI Provider
```

Business logic tidak boleh langsung bergantung pada provider AI tertentu.

Environment variables:

```text
AI_PROVIDER=
AI_API_KEY=
AI_MODEL=
```

API key tidak boleh berada di frontend atau source code.

---

# 14. AI Agent Control

Admin memiliki:

```text
AI Agent
[ ON / OFF ]

Scheduled Run
[ ON / OFF ]

Run Now
[ BUTTON ]
```

Flow:

```text
Scheduler
   ↓
AI Agent ON?
   │
   ├── NO → STOP
   │
   └── YES
        ↓
   Schedule ON?
        │
        ├── NO → STOP
        │
        └── YES
             ↓
          AI Run
```

Scheduled AI menggunakan frekuensi default:

```text
Weekly
```

`Run Now` digunakan untuk menjalankan AI secara manual sesuai permission.

---

# 15. AI Cost Control

AI tidak digunakan untuk setiap operasi.

Prioritas:

```text
Database Query
      ↓
Rule-Based Logic
      ↓
Deterministic Algorithm
      ↓
AI
```

Contoh:

```text
Low Stock
→ Database Query
→ Tidak membutuhkan AI
```

Sedangkan:

```text
Analisis pola penjualan
→ AI dapat digunakan
```

Tujuannya mengurangi penggunaan API dan biaya.

---

# 16. Authentication

Role awal:

```text
ADMIN
USER
```

Flow:

```text
Login
  ↓
Authentication
  ↓
Authorization
  ↓
Application
```

Admin memiliki akses penuh.

User memiliki akses sesuai permission.

---

# 17. API

Endpoint dikelompokkan berdasarkan modul:

```text
/api/auth
/api/users
/api/products
/api/categories
/api/inventory
/api/purchases
/api/sales
/api/ocr
/api/dashboard
/api/ai-agent
/api/settings
```

Flow:

```text
Request
  ↓
Authentication
  ↓
Authorization
  ↓
Validation
  ↓
Business Logic
  ↓
Database
```

---

# 18. Security

Wajib:

* Password di-hash.
* API key menggunakan environment variable.
* `.env` tidak di-commit.
* Semua input divalidasi.
* API dilindungi authentication.
* Permission diperiksa sebelum operasi penting.
* Secret tidak boleh dikirim ke frontend.

---

# 19. Testing

Testing menggunakan:

```text
Unit Test
Integration Test
E2E Test
```

Prioritas:

```text
1. Inventory
2. Purchase
3. Sales
4. Authentication
5. OCR
6. AI Agent
```

---

# 20. Development Order

```text
1. Project Setup
       ↓
2. Database
       ↓
3. Authentication
       ↓
4. Product
       ↓
5. Inventory
       ↓
6. Purchase
       ↓
7. Sales
       ↓
8. Dashboard
       ↓
9. OCR
       ↓
10. AI Agent
       ↓
11. Testing
       ↓
12. Deployment
```

---

# 21. Architecture Rules

1. Gunakan satu project dan satu repository.
2. Gunakan Modular Monolith.
3. PostgreSQL adalah source of truth.
4. Setiap perubahan stock harus memiliki Stock Movement.
5. Purchase menambah stock.
6. Sale mengurangi stock.
7. OCR tidak menggunakan AI.
8. OCR hanya menghasilkan draft hasil pembacaan nota.
9. OCR harus melalui review sebelum transaksi final.
10. Product matching OCR menggunakan deterministic matching.
11. AI hanya digunakan untuk analisis dan rekomendasi.
12. AI bukan source of truth.
13. AI tidak boleh melakukan perubahan penting tanpa approval atau rule.
14. AI dan OCR menggunakan provider abstraction.
15. Gunakan skill yang sudah tersedia terlebih dahulu.
16. Gunakan `find-skills` jika skill yang tersedia tidak mencukupi.
17. Skill baru membutuhkan approval.
18. Hindari dependency yang tidak diperlukan.
19. Business logic harus dapat diuji.
20. Data transaksi penting harus dapat diaudit.
21. Gunakan database transaction untuk operasi yang membutuhkan konsistensi.
22. Secret tidak boleh di-hardcode.
23. Hindari premature optimization.
