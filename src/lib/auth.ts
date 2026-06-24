import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "video-platform-default-secret-key-2026";

export function signToken(payload: any): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 24 * 3600 * 1000 * 7 })).toString("base64url"); // 7 days
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): any | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  
  const [header, body, signature] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
    
  if (signature !== expectedSignature) return null;
  
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch (e) {
    return null;
  }
}

// Next.js helper to get the current authenticated user/admin from cookies
export async function getAuthSession() {
  const cookieStore = await require("next/headers").cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  
  const payload = verifyToken(token);
  if (!payload) return null;
  
  return {
    id: payload.id,
    username: payload.username,
    role: payload.role || "user", // "user" or "admin" / "超级" / "审核" / "普通"
    isAdmin: payload.isAdmin || false,
  };
}
