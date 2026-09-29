import bcrypt from "bcryptjs";

// Cost 10 masih aman (2^10 = 1024 iterasi) tapi ~2x lebih cepat dari cost 12
const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}
