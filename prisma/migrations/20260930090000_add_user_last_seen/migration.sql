-- Add lastSeen to users so the app can show who is currently online.
ALTER TABLE "users" ADD COLUMN "lastSeen" TIMESTAMP(3);
