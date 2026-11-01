import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import type { SessionUser, Role } from './types';
import { readStore } from './store';

const COOKIE = 'janwatch_session';
const secret = () => process.env.JANWATCH_SESSION_SECRET || 'janwatch-local-demo-secret-change-me';
function sign(value: string) { return createHmac('sha256', secret()).update(value).digest('base64url'); }
export function createSessionToken(user: SessionUser) {
  const payload = Buffer.from(JSON.stringify({ ...user, exp: Date.now() + 1000*60*60*24*7 })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}
function parseToken(token: string): SessionUser | null {
  const [payload, signature] = token.split('.'); if (!payload || !signature) return null;
  const expected = sign(payload);
  try { if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null; } catch { return null; }
  try { const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); if (data.exp < Date.now()) return null; return { id:data.id, name:data.name, email:data.email, role:data.role as Role }; } catch { return null; }
}
export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies(); const token = jar.get(COOKIE)?.value; return token ? parseToken(token) : null;
}
export async function requireUser() {
  const user = await getCurrentUser(); if (!user) throw new Error('UNAUTHENTICATED'); return user;
}
export async function canAccessComplaint(user: SessionUser, complaintId: string) {
  const s = await readStore(); const c = s.complaints.find(x => x.id === complaintId); if (!c) return false;
  if (user.role === 'admin' || c.userId === user.id || c.isPublic) return true;
  if (user.role === 'officer') return s.departmentMembers.some(m => m.userId === user.id && m.departmentId === c.departmentId && m.wardId === c.wardId);
  return false;
}
export const sessionCookieName = COOKIE;
