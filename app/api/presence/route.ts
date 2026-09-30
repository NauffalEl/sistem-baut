import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { handleApiError } from "@/lib/security/error-handler";
import { isOnline, listPresence, touchPresence } from "@/lib/presence/service";

/** GET — who is online right now. Only admin can see all users. */
export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role !== "ADMIN") {
      return NextResponse.json({ users: [] });
    }
    const users = await listPresence();
    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        online: u.online,
        lastSeen: u.lastSeen?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/** POST — heartbeat. The client calls this while a session is active. */
export async function POST() {
  try {
    const user = await requireAuth();
    const updated = await touchPresence(user.id);
    return NextResponse.json({
      online: isOnline(updated.lastSeen),
      lastSeen: updated.lastSeen?.toISOString() ?? null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
