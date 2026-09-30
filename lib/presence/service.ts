import { prisma } from "@/lib/db";

/**
 * A user counts as online when their last heartbeat is inside this window.
 * Heartbeats come from /api/presence, so this is a liveness signal, not a
 * permanent flag — a user who closes the tab goes offline on their own.
 */
export const ONLINE_WINDOW_MS = 5 * 60 * 1000;

export function isOnline(lastSeen: Date | null, now = new Date()): boolean {
  if (!lastSeen) return false;
  return now.getTime() - lastSeen.getTime() < ONLINE_WINDOW_MS;
}

/** Records activity for a user. Called by the presence heartbeat. */
export async function touchPresence(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { lastSeen: new Date() },
    select: { id: true, name: true, lastSeen: true },
  });
}

export type PresenceUser = {
  id: string;
  name: string;
  email: string;
  lastSeen: Date | null;
};

/** Active users, most recently seen first. */
export async function listPresence(): Promise<(PresenceUser & { online: boolean })[]> {
  const users = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true, email: true, lastSeen: true },
    orderBy: { lastSeen: "desc" },
  });
  const now = new Date();
  return users.map((u) => ({ ...u, online: isOnline(u.lastSeen, now) }));
}
