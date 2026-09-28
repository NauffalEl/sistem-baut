import { auth } from "./config";
import { logAudit } from "@/lib/security/audit";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;

  const u = session.user as SessionUser;
  if (!u.id || !u.role) return null;

  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
  };
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

export async function requireRole(role: string): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== role) throw new Error(`Requires ${role} role`);
  return user;
}

// Log audit for sensitive operations
export async function auditLog(
  userId: string | null,
  action: string,
  entity: string,
  entityId: string,
  oldValue?: string,
  newValue?: string
) {
  await logAudit({ userId, action, entity, entityId, oldValue, newValue });
}
