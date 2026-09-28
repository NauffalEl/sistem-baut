import { OCRProvider } from "./types";

/**
 * Mock OCR provider for development.
 * In production, replace with real OCR engine (Tesseract, Google Vision, etc.)
 */
export class MockOCRProvider implements OCRProvider {
  name = "mock";

  async extractText(imagePath: string): Promise<string> {
    // Simulate OCR processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Return mock receipt text
    return `TOKO BAUT JAYA
Jl. Raya No. 123
Telp: 021-1234567

Tanggal: ${new Date().toLocaleDateString("id-ID")}
No: INV-${Date.now().toString(36).toUpperCase()}

1. Baut M8x30    10 x 500    5000
2. Mur M8        20 x 200    4000
3. Paku 2"       15 x 300    4500

Total: 13500
Tunai: 15000
Kembali: 1500`;
  }
}

/**
 * Factory to get OCR provider based on env config
 */
export function getOCRProvider(): OCRProvider {
  const provider = process.env.OCR_PROVIDER || "mock";

  switch (provider) {
    case "mock":
    default:
      return new MockOCRProvider();
  }
}
