export interface OCRItem {
  rawName: string;
  quantity: number;
  price: number;
  confidence: number;
  matchedProductId?: string;
  matchedProductName?: string;
}

export interface OCRResult {
  rawText: string;
  items: OCRItem[];
  confidence: number;
  provider: string;
  processedAt: Date;
}

export interface OCRProvider {
  name: string;
  /** Accepts file path, URL, or base64 data. Provider determines how to interpret it. */
  extractText(imageSource: string): Promise<string>;
}

export interface OCRParser {
  parseItems(rawText: string): OCRItem[];
}

export interface OCRMatcher {
  matchProduct(itemName: string): Promise<{
    productId: string;
    productName: string;
    confidence: number;
  } | null>;
}
