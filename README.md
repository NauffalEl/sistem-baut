# Sistem Inventory Baut

Aplikasi inventory untuk mengelola barang baut, pembelian, penjualan, stok, harga, OCR nota, dan AI Agent analisis.

## Tech Stack

| Bagian | Teknologi |
|--------|-----------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| UI | React + Tailwind CSS + shadcn/ui |
| Database | PostgreSQL |
| ORM | Prisma |
| Validation | Zod |
| Authentication | Auth.js |
| Testing | Vitest + Playwright |
| OCR | OCR.space |
| AI | OpenAI-compatible API (Agnes) |

## Project Structure

```
sistem-baut/
├── app/              # Pages & API routes
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
├── components/       # UI components
├── lib/              # Business logic & services
├── prisma/           # Database schema & migrations
├── tests/            # Unit & integration tests
├── public/           # Static assets
├── docs/             # Project documentation
├── PRD.md
├── ARCHITECTURE.md
├── TASKS.md
└── AGENTS.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- npm / pnpm / bun

### Installation

```bash
git clone <repository-url>
cd sistem-baut
npm install
```

### Environment Setup

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

### Generate `.env` from template

```bash
# Generate AUTH_SECRET
openssl rand -base64 32
```

### Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build & Start

```bash
npm run build
npm start
```

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/sistem_baut"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Authentication (Auth.js)
AUTH_SECRET=
AUTH_TRUST_HOST="true"

# AI Provider (OpenAI-compatible API)
AI_PROVIDER="Agnes"
AI_API_KEY=
AI_MODEL="agnes-3.0-flash"
AI_BASE_URL="https://apihub.agnes-ai.com/v1"

# OCR Provider
OCR_PROVIDER="ocr.space"
OCR_API_KEY=
OCR_BASE_URL="https://api.ocr.space/parse/image"

# AI Cost Control
AI_MAX_TOKENS=10000
AI_MAX_COST_PER_RUN=1.0
AI_MAX_COST_PER_DAY=10.0
AI_MAX_CALLS_PER_HOUR=20
AI_TIMEOUT_MS=120000
AI_MAX_DATA_SIZE=50000
AI_RETRY_ATTEMPTS=2
AI_RETRY_DELAY_MS=1000

# Production
NODE_ENV="production"
LOG_LEVEL="info"
ENABLE_METRICS="true"
```

## Features

- **Master Product** — Kelola data barang baut dengan SKU, kategori, ukuran, material, harga beli/jual, stok minimum
- **Product Grouping** — Hubungkan nama/alias barang yang merujuk pada produk yang sama
- **Inventory** — Stok masuk (purchase), stok keluar (sale), adjustment dengan audit trail
- **Stock Movement** — Riwayat perubahan stok berdasarkan sumbernya
- **Price History** — Simpan riwayat perubahan harga beli & jual
- **Purchase** — Catat pembelian, konfirm → stok bertambah
- **Sale** — Catat penjualan, konfirm → stok berkurang
- **OCR Receipt** — Upload nota → OCR → extract item → review → confirm → save
- **Dashboard** — Ringkasan inventory, stok rendah, aktivitas terbaru
- **AI Agent** — Analisis stok, harga, normalisasi produk, laporan mingguan
- **AI Control** — ON/OFF, scheduled run, manual run, cost limit
- **Authentication** — Register, login, role-based access
- **Audit Log** — Lacak setiap operasi penting

## Key Workflows

### Purchase Flow

```
Buat Purchase → Confirm → Stock In (+) → Update Price History
```

### Sale Flow

```
Buat Sale → Check Stock → Confirm → Stock Out (-) → Stock Movement
```

### OCR Flow

```
Upload Nota → OCR → Extract → Mapping Produk → Admin Review → Confirm → Save Purchase
```

### AI Agent Flow

```
Settings (enabled, schedule) → Scheduler/Cron → Read Data → Analyze → Generate Report → Save Log
```

## Tests

```bash
# All tests
npm test

# Database tests
npm run test:db

# Watch mode
npm run test -- --watch
```

## Documentation

- `PRD.md` — Product Requirements Document
- `ARCHITECTURE.md` — System architecture & design
- `AGENTS.md` — AI Agent behavior rules
- `TASKS.md` — Task tracking
- `docs/` — Additional documentation

## Security

- Password di-hash menggunakan bcrypt
- API key disimpan di `.env`, tidak di-commit
- Input divalidasi menggunakan Zod
- Role-based authorization pada protected routes
