import { NextRequest,NextResponse } from 'next/server'; import { promises as fs } from 'node:fs'; import path from 'node:path';
import { getCurrentUser } from '@/lib/auth'; import { readStore } from '@/lib/store'; import { fail } from '@/lib/http';
export async function GET(_request:NextRequest,context:{params:Promise<{filename:string}>}){
  const user=await getCurrentUser();if(!user)return fail('Sign in to view private evidence.','UNAUTHENTICATED',401);
  const {filename}=await context.params;if(path.basename(filename)!==filename||!/^([a-f0-9-]+|resolution-[a-f0-9-]+)\.(jpg|png|webp)$/i.test(filename))return fail('Invalid file path.','NOT_FOUND',404);
  const filePath=`/api/files/${filename}`;const s=await readStore();
  const complaint=s.complaints.find(c=>c.imagePath===filePath||c.resolutionImagePath===filePath);if(!complaint)return fail('Evidence not found.','NOT_FOUND',404);
  const allowed=user.role==='admin'||complaint.userId===user.id||(user.role==='officer'&&s.departmentMembers.some(m=>m.userId===user.id&&m.departmentId===complaint.departmentId&&m.wardId===complaint.wardId));
  if(!allowed)return fail('You do not have permission to view this evidence.','FORBIDDEN',403);
  try{const file=await fs.readFile(path.join(process.cwd(),'data','uploads',filename));const ext=filename.split('.').pop();const contentType=ext==='jpg'?'image/jpeg':ext==='png'?'image/png':'image/webp';return new NextResponse(new Uint8Array(file),{headers:{'Content-Type':contentType,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}catch{return fail('Evidence file is missing.','NOT_FOUND',404);}
}
