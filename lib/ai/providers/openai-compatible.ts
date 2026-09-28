import { AIProvider, AIAnalysisResult } from "../types";

/**
 * OpenAI-compatible AI provider.
 * Works with any API that follows the OpenAI Chat Completions format
 * (OpenAI, Agnes, Groq, Together, OpenRouter, local LLMs, etc.)
 *
 * Env:
 *   AI_PROVIDER="openai"  (or any non-mock value)
 *   AI_API_KEY="..."
 *   AI_MODEL="gpt-4o-mini"
 *   AI_BASE_URL="https://api.openai.com/v1"
 */
export class OpenAICompatibleProvider implements AIProvider {
  name: string;

  constructor(name: string = "openai") {
    this.name = name;
  }

  async analyze(prompt: string, data: unknown): Promise<AIAnalysisResult> {
    const apiKey = process.env.AI_API_KEY;
    const model = process.env.AI_MODEL;
    const baseUrl = process.env.AI_BASE_URL || "https://api.openai.com/v1";
    const maxTokens = parseInt(process.env.AI_MAX_TOKENS ?? "4000", 10);

    if (!apiKey) {
      throw new Error("AI_API_KEY is not set");
    }
    if (!model) {
      throw new Error("AI_MODEL is not set");
    }

    const systemPrompt = this.buildSystemPrompt(prompt);
    const userPrompt = this.buildUserPrompt(prompt, data);

    const controller = new AbortController();
    const timeout = parseInt(process.env.AI_TIMEOUT_MS ?? "30000", 10);
    const timer = setTimeout(() => controller.abort(), timeout);

    let response: Response;
    try {
      response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: maxTokens,
          temperature: 0.3,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `AI API error ${response.status}: ${errorText.slice(0, 300)}`
      );
    }

    const json = await response.json();
    const content = json?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("AI API returned empty response");
    }

    const parsed = this.parseResponse(content, prompt);

    // Attach token usage if available
    const usage = json?.usage;
    if (usage) {
      parsed.tokensUsed = usage.total_tokens ?? undefined;
    }

    return parsed;
  }

  private buildSystemPrompt(prompt: string): string {
    return `You are an inventory management analyst for a hardware store (toko baut) in Indonesia.
You analyze data and provide actionable insights in JSON format.

Always respond with valid JSON matching this exact schema:
{
  "type": "${this.detectType(prompt)}",
  "title": "Short analysis title",
  "content": "Detailed analysis in Indonesian language, 2-4 sentences",
  "recommendations": ["recommendation 1", "recommendation 2"],
  "dataPoints": [{"label": "Label", "value": 123}],
  "confidence": 0.85
}

Rules:
- "type" must be one of: inventory, sales, purchase, price, product, weekly
- "confidence" is a number between 0 and 1
- "recommendations" is an array of strings (max 6 items, in Indonesian)
- "dataPoints" is an array of {label, value} objects
- Write analysis content and recommendations in Indonesian
- Be concise and actionable`;
  }

  private buildUserPrompt(prompt: string, data: unknown): string {
    let serialized: string;
    try {
      serialized = JSON.stringify(data, null, 0);
    } catch {
      serialized = String(data);
    }

    // Truncate if too long (cost control)
    const maxLen = parseInt(process.env.AI_MAX_DATA_SIZE ?? "50000", 10);
    if (serialized.length > maxLen) {
      serialized = serialized.slice(0, maxLen) + "... (truncated)";
    }

    return `Analysis type: ${prompt}

Data:
${serialized}

Provide your analysis as JSON.`;
  }

  private detectType(prompt: string): string {
    const p = prompt.toLowerCase();
    if (p.includes("inventory")) return "inventory";
    if (p.includes("sales")) return "sales";
    if (p.includes("purchase")) return "purchase";
    if (p.includes("price")) return "price";
    if (p.includes("product")) return "product";
    if (p.includes("weekly")) return "weekly";
    return "custom";
  }

  private parseResponse(content: string, prompt: string): AIAnalysisResult {
    // Strip markdown code fences if present
    let cleaned = content.trim();
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/i, "");
    cleaned = cleaned.replace(/```\s*$/, "").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback: treat as plain text
      return {
        type: this.detectType(prompt) as AIAnalysisResult["type"],
        title: "AI Analysis",
        content: content.slice(0, 2000),
        recommendations: [],
        dataPoints: [],
        confidence: 0.5,
      };
    }

    return {
      type: (parsed.type || this.detectType(prompt)) as AIAnalysisResult["type"],
      title: parsed.title || "AI Analysis",
      content: parsed.content || "",
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations
        : [],
      dataPoints: Array.isArray(parsed.dataPoints) ? parsed.dataPoints : [],
      confidence:
        typeof parsed.confidence === "number" ? parsed.confidence : 0.7,
    };
  }
}
