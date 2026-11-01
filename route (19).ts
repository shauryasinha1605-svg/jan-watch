import { NextRequest } from 'next/server'; import { readStore } from '@/lib/store'; import { ok } from '@/lib/http';
export async function GET(request:NextRequest){
  const s=await readStore(),q=request.nextUrl.searchParams; let rows=s.complaints.filter(c=>c.isPublic);
  for(const key of ['category','severity','status','wardId'] as const){const value=q.get(key);if(value)rows=rows.filter(c=>String(c[key])===value);}
  const result=rows.map(c=>({id:c.id,ticketCode:c.ticketCode,title:c.title,category:c.category,severity:c.severity,status:c.status,wardId:c.wardId,latitude:Math.round(c.latitude*1000)/1000,longitude:Math.round(c.longitude*1000)/1000,createdAt:c.createdAt,locationText:c.locationText}));
  return ok({complaints:result,total:result.length});
}
