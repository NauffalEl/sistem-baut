import { prisma } from "@/lib/db";

// ─────────────────────────────────────────────
// Audit logging
// ─────────────────────────────────────────────

export interface AuditLogInput {
  userId: string | null;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: string | null;
  newValue?: string | null;
}

export async function logAudit(data: AuditLogInput) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        oldValue: data.oldValue,
        newValue: data.newValue,
      },
    });
  } catch (error) {
    console.error("Audit log failed:", error);
  }
}

// ─────────────────────────────────────────────
// Get audit logs
// ─────────────────────────────────────────────

export async function getAuditLogs(filters?: {
  userId?: string;
  entity?: string;
  entityId?: string;
  limit?: number;
}) {
  return prisma.auditLog.findMany({
    where: {
      userId: filters?.userId,
      entity: filters?.entity,
      entityId: filters?.entityId,
    },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: filters?.limit ?? 50,
  });
}
