"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type PresenceUser = {
  id: string;
  name: string;
  email: string;
  online: boolean;
  lastSeen: string | null;
};

const POLL_MS = 30_000;

/** Shows only users currently online (admin only). Names are clickable through to their inventory. */
export function PresenceRail() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    let active = true;

    async function beat() {
      try {
        await fetch("/api/presence", { method: "POST" });
      } catch {}
    }

    async function pull() {
      try {
        const res = await fetch("/api/presence", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (active) {
          setUsers((data.users || []).filter((u: PresenceUser) => u.online));
          setLoading(false);
        }
      } catch {
        if (active) setLoading(false);
      }
    }

    beat();
    pull();
    const beatTimer = setInterval(beat, 60_000);
    const pollTimer = setInterval(pull, POLL_MS);

    return () => {
      active = false;
      clearInterval(beatTimer);
      clearInterval(pollTimer);
    };
  }, [status]);

  if (loading) return <div className="presence-rail" style={{ opacity: 0.5 }} />;
  if (users.length === 0) return null;

  return (
    <div className="presence-rail" aria-label="User yang sedang online">
      <div className="presence-rail-badge">
        <span className="presence-pulse" aria-hidden="true" />
        <span>{users.length} {users.length === 1 ? "user" : "user"} online</span>
      </div>
      <div className="presence-list">
        {users.map((u) => {
          const isYou = u.id === session?.user?.id;
          return (
            <Link key={u.id} href={`/inventory/user/${u.id}`} className={`presence-entry ${isYou ? "is-you" : ""}`}>
              <span className="presence-dot is-online" aria-hidden="true" />
              <span className="presence-name">
                {u.name}
                {isYou ? <span className="presence-you-tag">(kamu)</span> : null}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}