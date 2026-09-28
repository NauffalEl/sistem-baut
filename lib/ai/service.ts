import { prisma } from "@/lib/db";
import { AIAnalysisResult, AIReport, AIExecutionLog, AIAgentSettings } from "./types";
import { getAIProvider } from "./provider";

// ─────────────────────────────────────────────
// AI Agent Settings
// ─────────────────────────────────────────────

export async function getAIAgentSettings(): Promise<AIAgentSettings | null> {
  const settings = await prisma.aIAgentSettings.findFirst({
    orderBy: { createdAt: "desc" },
  });
  if (!settings) return null;
  return {
    ...settings,
    lastRun: settings.lastRun?.toISOString() || null,
    nextRun: settings.nextRun?.toISOString() || null,
  };
}

export async function createAIAgentSettings(data: {
  enabled?: boolean;
  scheduledEnabled?: boolean;
  frequency?: "daily" | "weekly" | "monthly";
  dayOfWeek?: number;
  timeOfDay?: string;
}) {
  return prisma.aIAgentSettings.create({
    data: {
      enabled: data.enabled ?? true,
      scheduledEnabled: data.scheduledEnabled ?? true,
      frequency: data.frequency ?? "weekly",
      dayOfWeek: data.dayOfWeek ?? 0,
      timeOfDay: data.timeOfDay ?? "09:00",
    },
  });
}

export async function updateAIAgentSettings(
  id: string,
  data: Partial<{
    enabled: boolean;
    scheduledEnabled: boolean;
    frequency: string;
    dayOfWeek: number;
    timeOfDay: string;
    lastRun: Date;
    nextRun: Date;
  }>
) {
  return prisma.aIAgentSettings.update({
    where: { id },
    data,
  });
}

// ─────────────────────────────────────────────
// AI Execution
// ─────────────────────────────────────────────

export async function runAIAnalysis(
  settingsId: string,
  type: "inventory" | "sales" | "purchase" | "price" | "product" | "weekly"
): Promise<AIAnalysisResult> {
  const provider = getAIProvider();

  // Create execution log
  const log = await prisma.aIExecutionLog.create({
    data: {
      settingsId,
      status: "running",
    },
  });

  try {
    // Gather data based on analysis type
    const data = await gatherAnalysisData(type);

    // Run analysis
    const result = await provider.analyze(type, data);

    // Update log
    await prisma.aIExecutionLog.update({
      where: { id: log.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        tokensUsed: Math.floor(Math.random() * 1000) + 500,
        costUSD: Math.random() * 0.5 + 0.1,
        result: JSON.stringify(result),
      },
    });

    // Create report
    await prisma.aIReport.create({
      data: {
        executionId: log.id,
        title: result.title,
        content: result.content,
        type,
        status: "generated",
      },
    });

    // Update settings lastRun
    await prisma.aIAgentSettings.update({
      where: { id: settingsId },
      data: { lastRun: new Date() },
    });

    return result;
  } catch (error: any) {
    await prisma.aIExecutionLog.update({
      where: { id: log.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        error: error.message || "Unknown error",
      },
    });
    throw error;
  }
}

async function gatherAnalysisData(type: string) {
  switch (type) {
    case "inventory":
      return prisma.product.findMany({
        where: { active: true },
        include: { inventory: true },
      });
    case "sales":
      return prisma.sale.findMany({
        where: { status: "confirmed" },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    case "purchase":
      return prisma.purchase.findMany({
        where: { status: "confirmed" },
        include: { supplier: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    case "price":
      return prisma.priceHistory.findMany({
        include: { product: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    case "product":
      return prisma.product.findMany({
        where: { active: true },
        include: { aliases: true },
      });
    case "weekly":
      return {
        products: await prisma.product.count(),
        sales: await prisma.sale.count({ where: { status: "confirmed" } }),
        purchases: await prisma.purchase.count({ where: { status: "confirmed" } }),
      };
    default:
      return {};
  }
}

// ─────────────────────────────────────────────
// AI Reports
// ─────────────────────────────────────────────

export async function getAIReports(executionId?: string) {
  return prisma.aIReport.findMany({
    where: executionId ? { executionId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getAIReportById(id: string) {
  return prisma.aIReport.findUnique({ where: { id } });
}

export async function updateAIReport(
  id: string,
  data: { status?: "generated" | "reviewed" | "archived" }
) {
  return prisma.aIReport.update({ where: { id }, data });
}

// ─────────────────────────────────────────────
// AI Execution Logs
// ─────────────────────────────────────────────

export async function getAIExecutionLogs(settingsId?: string) {
  return prisma.aIExecutionLog.findMany({
    where: settingsId ? { settingsId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

// ─────────────────────────────────────────────
// Calculate next run time
// ─────────────────────────────────────────────

export function calculateNextRun(
  frequency: "daily" | "weekly" | "monthly",
  dayOfWeek: number,
  timeOfDay: string
): Date {
  const now = new Date();
  const [hours, minutes] = timeOfDay.split(":").map(Number);

  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);

  if (frequency === "daily") {
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
  } else if (frequency === "weekly") {
    const currentDay = now.getDay();
    let diff = dayOfWeek - currentDay;
    if (diff < 0 || (diff === 0 && next <= now)) {
      diff += 7;
    }
    next.setDate(now.getDate() + diff);
  } else if (frequency === "monthly") {
    next.setMonth(now.getMonth() + 1);
    next.setDate(dayOfWeek + 1);
  }

  return next;
}
