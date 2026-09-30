import { OCRProvider } from "../types";

/**
 * OCR.space provider.
 * Sends base64 image to OCR.space API and returns parsed text.
 *
 * Env:
 *   OCR_PROVIDER="ocr.space"
 *   OCR_API_KEY="..."
 *   OCR_BASE_URL="https://api.ocr.space/parse/image"
 */
export class OCRSpaceProvider implements OCRProvider {
  name = "ocr.space";

  async extractText(imageSource: string): Promise<string> {
    const apiKey = process.env.OCR_API_KEY;
    const baseUrl = process.env.OCR_BASE_URL || "https://api.ocr.space/parse/image";

    if (!apiKey) {
      throw new Error("OCR_API_KEY is not set");
    }

    // Determine if imageSource is base64 or URL
    const isBase64 = imageSource.startsWith("data:") || imageSource.startsWith("/9j/") || imageSource.startsWith("iVBOR");

    const formData = new FormData();
    formData.append("apikey", apiKey);
    formData.append("isTable", "true");
    formData.append("scale", "true");

    if (isBase64) {
      // Ensure proper data URI prefix
      const base64Data = imageSource.startsWith("data:")
        ? imageSource
        : `data:image/png;base64,${imageSource}`;
      formData.append("base64Image", base64Data);
    } else {
      formData.append("url", imageSource);
    }

    const response = await fetch(baseUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`OCR.space API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (result.IsErroredOnProcessing) {
      const errorMsg = result?.ErrorMessage?.join("; ") || "OCR processing failed";
      throw new Error(`OCR.space error: ${errorMsg}`);
    }

    const parsedResults = result.ParsedResults;
    if (!parsedResults || parsedResults.length === 0) {
      throw new Error("OCR.space returned no results");
    }

    // Combine all parsed text blocks
    const text = parsedResults
      .map((r: any) => r.ParsedText || "")
      .join("\n")
      .trim();

    if (!text) {
      throw new Error("OCR.space returned empty text");
    }

    return text;
  }
}
