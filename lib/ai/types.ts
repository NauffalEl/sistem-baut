export interface AIAnalysisResult {
  type: "inventory" | "sales" | "purchase" | "price" | "product" | "weekly" | "custom";
  title: string;
  content: string;
  recommendations: string[];
  dataPoints: Array<{
    label: string;
    value: string | number;
  }>;
  confidence: number;
  costUSD?: number;
  tokensUsed?: number;
}

export interface AIProvider {
  name: string;
  analyze(prompt: string, data: unknown): Promise<AIAnalysisResult>;
}

export interface AIReport {
  id: string;
  title: string;
  content: string;
  type: string;
  status: "generated" | "reviewed" | "archived";
  createdAt: string;
}

export interface AIExecutionLog {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt: string;
  completedAt: string | null;
  error: string | null;
  tokensUsed: number;
  costUSD: number;
  result: string | null;
}

export interface AIAgentSettings {
  id: string;
  enabled: boolean;
  scheduledEnabled: boolean;
  frequency: string;
  dayOfWeek: number;
  timeOfDay: string;
  lastRun: string | null;
  nextRun: string | null;
}
