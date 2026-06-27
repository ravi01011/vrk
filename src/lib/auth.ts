import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_COOKIE_NAME = "vrk_admin_token";
const DEFAULT_SECRET = "default_fallback_jwt_secret_key_make_sure_to_change_it";

function getJwtSecret(): string {
  return process.env.JWT_SECRET || DEFAULT_SECRET;
}

export function signToken(username: string): string {
  const secret = getJwtSecret();
  return jwt.sign({ username }, secret, { expiresIn: "24h" });
}

export function verifyToken(token: string): { username: string } | null {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as { username: string };
    return decoded;
  } catch {
    return null;
  }
}

export async function getAuthUser(): Promise<{ username: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(JWT_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(JWT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });
}

export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(JWT_COOKIE_NAME);
}
