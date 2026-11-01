import { readStore } from '@/lib/store'; import { ok } from '@/lib/http';
export async function GET() { const s = await readStore(); return ok({ wards:s.wards, departments:s.departments }); }
