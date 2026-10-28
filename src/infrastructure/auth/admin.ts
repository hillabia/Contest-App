import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
/** Temporary server-side gate until a full admin session is implemented. Never use client-side keys. */
export function isAdminAuthorized(request: Request): boolean {
 const expected=process.env.CONTEST_ADMIN_API_TOKEN;
 if(!expected || expected.length<32) return false;
 const provided=request.headers.get("authorization");
 if(!provided?.startsWith("Bearer ")) return false;
 const token=provided.slice(7);
 if(token.length<32 || token.length>512) return false;
 const providedHash = new Uint8Array(createHash("sha256").update(token).digest());
 const expectedHash = new Uint8Array(createHash("sha256").update(expected).digest());
 return timingSafeEqual(providedHash, expectedHash);
}
