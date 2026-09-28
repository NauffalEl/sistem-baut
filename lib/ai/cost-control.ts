import { AIProvider } from "./types";
import { getAIProvider } from "./provider";

// ─────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────

interface CostControlConfig {
  maxTokensPerRun: number;
  maxCostPerRunUSD: number;
  maxCostPerDayUSD: number;
  maxCallsPerHour: number;
  timeoutMs: number;
  maxDataSize: number; // bytes of input data to send to AI
  retryAttempts: number;
  retryDelayMs: number;
}

const DEFAULT_CONFIG: CostControlConfig = {
  maxTokensPerRun: 4000,
  maxCostPerRunUSD: 1.0,
  maxCostPerDayUSD: 10.0,
  maxCallsPerHour: 20,
  timeoutMs: 30000,
  maxDataSize: 50000, // 50KB
  retryAttempts: 2,
  retryDelayMs: 1000,
};

// ─────────────────────────────────────────────
// In-memory tracking (use Redis in production)
// ─────────────────────────────────────────────

const callsPerHour = new Map<string, number>(); // userId -> count
const dailyCost = new Map<string, number>(); // date -> total cost

export function getCostControlConfig(): CostControlConfig {
  return {
    ...DEFAULT_CONFIG,
    maxTokensPerRun: parseInt(process.env.AI_MAX_TOKENS ?? "4000"),
    maxCostPerRunUSD: parseFloat(process.env.AI_MAX_COST_PER_RUN ?? "1.0"),
    maxCostPerDayUSD: parseFloat(process.env.AI_MAX_COST_PER_DAY ?? "10.0"),
    maxCallsPerHour: parseInt(process.env.AI_MAX_CALLS_PER_HOUR ?? "20"),
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS ?? "30000"),
    maxDataSize: parseInt(process.env.AI_MAX_DATA_SIZE ?? "50000"),
    retryAttempts: parseInt(process.env.AI_RETRY_ATTEMPTS ?? "2"),
    retryDelayMs: parseInt(process.env.AI_RETRY_DELAY_MS ?? "1000"),
  };
}

// ─────────────────────────────────────────────
// Rate limiting
// ─────────────────────────────────────────────

export function isRateLimited(userId: string): boolean {
  const config = getCostControlConfig();
  const now = new Date();
  const hourKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
  const count = callsPerHour.get(hourKey) || 0;
  return count >= config.maxCallsPerHour;
}

export function recordCall(userId: string): void {
  const config = getCostControlConfig();
  const now = new Date();
  const hourKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
  callsPerHour.set(hourKey, (callsPerHour.get(hourKey) || 0) + 1);

  // Cleanup old keys
  for (const key of callsPerHour.keys()) {
    if (!key.startsWith(hourKey.slice(0, 8))) {
      callsPerHour.delete(key);
    }
  }
}

// ─────────────────────────────────────────────
// Daily cost tracking
// ─────────────────────────────────────────────

export function getDailyCost(): number {
  const config = getCostControlConfig();
  const today = new Date().toISOString().slice(0, 10);
  return dailyCost.get(today) || 0;
}

export function recordCost(usd: number): void {
  const config = getCostControlConfig();
  const today = new Date().toISOString().slice(0, 10);
  const current = dailyCost.get(today) || 0;
  const newTotal = current + usd;

  if (newTotal > config.maxCostPerDayUSD) {
    throw new Error(
      `Daily AI cost limit exceeded (${newTotal.toFixed(2)} > ${config.maxCostPerDayUSD.toFixed(2)} USD)`
    );
  }
  dailyCost.set(today, newTotal);
}

// ─────────────────────────────────────────────
// Data sampling
// ─────────────────────────────────────────────

export function sampleData(data: unknown, maxSize: number = 50000): unknown {
  const config = getCostControlConfig();
  const maxBytes = maxSize || config.maxDataSize;

  // Serialize and check size
  const json = JSON.stringify(data);
  const bytes = Buffer.byteLength(json);

  if (bytes <= maxBytes) {
    return data;
  }

  // Sample down
  if (Array.isArray(data)) {
    const ratio = maxBytes / bytes;
    const sampledLength = Math.max(1, Math.floor(data.length * ratio));
    return data.slice(0, sampledLength);
  }

  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    const keys = Object.keys(obj);
    const ratio = maxBytes / bytes;
    const sampledKeys = Math.max(1, Math.floor(keys.length * ratio));
    const sampled: Record<string, unknown> = {};
    for (let i = 0; i < sampledKeys; i++) {
      sampled[keys[i]] = obj[keys[i]];
    }
    return sampled;
  }

  return data;
}

// ─────────────────────────────────────────────
// Timeout wrapper
// ─────────────────────────────────────────────

export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number
): Promise<T> {
  const config = getCostControlConfig();
  const timeout = ms || config.timeoutMs;

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`AI request timed out after ${timeout}ms`));
    }, timeout);

    promise.then(
      (result) => {
        clearTimeout(timer);
        resolve(result);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

// ─────────────────────────────────────────────
// Retry wrapper
// ─────────────────────────────────────────────

export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts: number = 2
): Promise<T> {
  const config = getCostControlConfig();
  const maxAttempts = attempts || config.retryAttempts;
  const delayMs = config.retryDelayMs;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i === maxAttempts - 1) throw error;

      // Check for rate limit
      if (error.message?.includes("rate limit") || error.status === 429) {
        await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
        continue;
      }

      // Don't retry on certain errors
      if (error.message?.includes("insufficient stock") || error.message?.includes("not found")) {
        throw error;
      }

      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error("Unexpected retry failure");
}

// ─────────────────────────────────────────────
// Provider fallback
// ─────────────────────────────────────────────

const FALLBACK_PROVIDERS = ["mock"];

export async function runWithFallback(
  providerName: string,
  fn: (provider: AIProvider) => Promise<any>
): Promise<any> {
  const provider = getAIProvider();
  const currentName = provider.name;

  // Try primary provider
  try {
    return await fn(provider);
  } catch (primaryError: any) {
    console.error(`Primary provider "${currentName}" failed:`, primaryError.message);

    // Try fallback providers
    for (const fallbackName of FALLBACK_PROVIDERS) {
      if (fallbackName === currentName) continue;
      try {
        const fallbackProvider = createFallbackProvider(fallbackName);
        return await fn(fallbackProvider);
      } catch (fallbackError: any) {
        console.error(`Fallback provider "${fallbackName}" also failed:`, fallbackError.message);
      }
    }

    throw primaryError;
  }
}

function createFallbackProvider(name: string): AIProvider {
  // Return a mock fallback that always succeeds
  return {
    name,
    async analyze(prompt: string, data: unknown) {
      return {
        type: "inventory",
        title: "Fallback Analysis",
        content: "Primary provider failed. Using fallback with limited analysis.",
        recommendations: ["Check primary provider configuration"],
        dataPoints: [],
        confidence: 0.3,
      };
    },
  };
}

// ─────────────────────────────────────────────
// Usage stats
// ─────────────────────────────────────────────

export interface UsageStats {
  callsToday: number;
  callsThisHour: number;
  costTodayUSD: number;
  costThisHourUSD: number;
  rateLimitRemaining: number;
}

export function getUsageStats(): UsageStats {
  const config = getCostControlConfig();
  const now = new Date();
  const hourKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;

  const callsThisHour = callsPerHour.get(hourKey) || 0;
  const callsToday = Array.from(callsPerHour.values()).reduce((a, b) => a + b, 0);
  const costToday = getDailyCost();

  return {
    callsToday,
    callsThisHour,
    costTodayUSD: costToday,
    costThisHourUSD: costToday, // simplified
    rateLimitRemaining: Math.max(0, config.maxCallsPerHour - callsThisHour),
  };
}
