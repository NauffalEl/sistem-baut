import { AIProvider, AIAnalysisResult } from "./types";
import { OpenAICompatibleProvider } from "./providers/openai-compatible";

/**
 * Mock AI provider for development.
 * In production, replace with real AI API (OpenAI, Anthropic, etc.)
 */
export class MockAIProvider implements AIProvider {
  name = "mock";

  async analyze(prompt: string, data: unknown): Promise<AIAnalysisResult> {
    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Generate mock analysis based on prompt type
    const promptLower = prompt.toLowerCase();

    if (promptLower.includes("inventory")) {
      return this.mockInventoryAnalysis(data);
    }
    if (promptLower.includes("sales")) {
      return this.mockSalesAnalysis(data);
    }
    if (promptLower.includes("purchase")) {
      return this.mockPurchaseAnalysis(data);
    }
    if (promptLower.includes("price")) {
      return this.mockPriceAnalysis(data);
    }
    if (promptLower.includes("product")) {
      return this.mockProductAnalysis(data);
    }
    if (promptLower.includes("weekly")) {
      return this.mockWeeklyReport(data);
    }

    return {
      type: "custom",
      title: "AI Analysis",
      content: "Analysis completed.",
      recommendations: [],
      dataPoints: [],
      confidence: 0.5,
    };
  }

  private mockInventoryAnalysis(data: unknown): AIAnalysisResult {
    const products = data as Array<{
      name: string;
      sku: string;
      minStock: number;
      inventory: { quantity: number } | null;
    }>;

    const lowStock = products.filter(
      (p) => p.inventory && p.inventory.quantity > 0 && p.inventory.quantity <= p.minStock
    );
    const outOfStock = products.filter((p) => !p.inventory || p.inventory.quantity <= 0);

    return {
      type: "inventory",
      title: "Inventory Analysis",
      content: `Found ${lowStock.length} low stock items and ${outOfStock.length} out of stock items.`,
      recommendations: [
        ...lowStock.map((p) => `Consider restocking ${p.name} (${p.sku}) — only ${p.inventory?.quantity} left`),
        ...outOfStock.map((p) => `URGENT: ${p.name} (${p.sku}) is out of stock`),
      ],
      dataPoints: [
        { label: "Low Stock", value: lowStock.length },
        { label: "Out of Stock", value: outOfStock.length },
        { label: "Total Products", value: products.length },
      ],
      confidence: 0.85,
    };
  }

  private mockSalesAnalysis(data: unknown): AIAnalysisResult {
    const sales = data as Array<{
      saleNo: string;
      total: number;
      status: string;
      createdAt: string;
    }>;

    const confirmed = sales.filter((s) => s.status === "confirmed");
    const totalRevenue = confirmed.reduce((sum, s) => sum + s.total, 0);

    return {
      type: "sales",
      title: "Sales Analysis",
      content: `${confirmed.length} confirmed sales with total revenue of Rp ${totalRevenue.toLocaleString()}.`,
      recommendations: [
        "Monitor top-selling products for restocking",
        "Review sales trends for seasonal patterns",
      ],
      dataPoints: [
        { label: "Total Sales", value: sales.length },
        { label: "Confirmed", value: confirmed.length },
        { label: "Revenue", value: totalRevenue },
      ],
      confidence: 0.8,
    };
  }

  private mockPurchaseAnalysis(data: unknown): AIAnalysisResult {
    const purchases = data as Array<{
      purchaseNo: string;
      total: number;
      status: string;
      supplier: { name: string };
    }>;

    const confirmed = purchases.filter((p) => p.status === "confirmed");
    const totalSpent = confirmed.reduce((sum, p) => sum + p.total, 0);

    return {
      type: "purchase",
      title: "Purchase Analysis",
      content: `${confirmed.length} confirmed purchases with total spend of Rp ${totalSpent.toLocaleString()}.`,
      recommendations: [
        "Review supplier performance",
        "Optimize purchase timing for better prices",
      ],
      dataPoints: [
        { label: "Total Purchases", value: purchases.length },
        { label: "Confirmed", value: confirmed.length },
        { label: "Total Spent", value: totalSpent },
      ],
      confidence: 0.75,
    };
  }

  private mockPriceAnalysis(data: unknown): AIAnalysisResult {
    const priceHistory = data as Array<{
      product: { name: string };
      price: number;
      type: string;
      createdAt: string;
    }>;

    const recent = priceHistory.slice(0, 10);
    const avgPrice =
      recent.length > 0
        ? recent.reduce((sum, p) => sum + p.price, 0) / recent.length
        : 0;

    return {
      type: "price",
      title: "Price Analysis",
      content: `Analyzed ${priceHistory.length} price changes. Average recent price: Rp ${avgPrice.toLocaleString()}.`,
      recommendations: [
        "Monitor price volatility for key products",
        "Consider bulk purchasing for stable prices",
      ],
      dataPoints: [
        { label: "Price Changes", value: priceHistory.length },
        { label: "Avg Price", value: Math.round(avgPrice) },
      ],
      confidence: 0.7,
    };
  }

  private mockProductAnalysis(data: unknown): AIAnalysisResult {
    const products = data as Array<{
      name: string;
      sku: string;
      aliases: Array<{ alias: string }>;
    }>;

    const withAliases = products.filter((p) => p.aliases.length > 0);
    const withoutAliases = products.filter((p) => p.aliases.length === 0);

    return {
      type: "product",
      title: "Product Name Normalization",
      content: `${withAliases.length} products have aliases. ${withoutAliases.length} products may need alias review.`,
      recommendations: [
        ...withoutAliases.slice(0, 5).map((p) => `Consider adding aliases for ${p.name} (${p.sku})`),
        "Review product names for consistency",
      ],
      dataPoints: [
        { label: "With Aliases", value: withAliases.length },
        { label: "Without Aliases", value: withoutAliases.length },
      ],
      confidence: 0.6,
    };
  }

  private mockWeeklyReport(data: unknown): AIAnalysisResult {
    const { products, sales, purchases } = data as {
      products: unknown[];
      sales: unknown[];
      purchases: unknown[];
    };

    return {
      type: "weekly",
      title: "Weekly Report",
      content: `Weekly summary: ${products.length} products, ${sales.length} sales, ${purchases.length} purchases.`,
      recommendations: [
        "Review low stock items and place orders",
        "Analyze sales trends for next week",
        "Check pending purchases for confirmation",
      ],
      dataPoints: [
        { label: "Products", value: products.length },
        { label: "Sales", value: sales.length },
        { label: "Purchases", value: purchases.length },
      ],
      confidence: 0.9,
    };
  }
}

/**
 * Factory to get AI provider based on env config
 */
export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || "mock";

  switch (provider) {
    case "mock":
      return new MockAIProvider();
    default:
      // Any non-mock value uses OpenAI-compatible provider (Agnes, OpenAI, Groq, etc.)
      return new OpenAICompatibleProvider(provider);
  }
}
