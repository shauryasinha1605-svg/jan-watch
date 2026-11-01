import { NextRequest } from 'next/server'; import { randomUUID } from 'node:crypto'; import { promises as fs } from 'node:fs'; import path from 'node:path';
import { requireUser } from '@/lib/auth'; import { readStore,writeStore,addUpdate } from '@/lib/store'; import { authError,fail,ok } from '@/lib/http';
export async function POST(request:NextRequest,context:{params:Promise<{id:string}>}){
  try{
    const user=await requireUser();if(!['officer','admin'].includes(user.role))return fail('Authority access required.','FORBIDDEN',403);
    const {id}=await context.params;const form=await request.formData();const image=form.get('image');const note=String(form.get('note')||'').trim();
    if(!image||typeof image==='string')return fail('Choose a resolution photograph.','VALIDATION_ERROR',400);
    if(!['image/jpeg','image/png','image/webp'].includes(image.type)||image.size>5*1024*1024)return fail('Use a JPEG, PNG or WebP image up to 5 MB.','INVALID_IMAGE',400);
    const s=await readStore();const c=s.complaints.find(x=>x.id===id);if(!c)return fail('Complaint not found.','NOT_FOUND',404);
    if(user.role==='officer'&&!s.departmentMembers.some(m=>m.userId===user.id&&m.departmentId===c.departmentId&&m.wardId===c.wardId))return fail('Complaint is outside your permissions.','FORBIDDEN',403);
    const ext=image.type==='image/jpeg'?'jpg':image.type==='image/png'?'png':'webp',name=`resolution-${randomUUID()}.${ext}`;const dir=path.join(process.cwd(),'data','uploads');await fs.mkdir(dir,{recursive:true});await fs.writeFile(path.join(dir,name),Buffer.from(await image.arrayBuffer()));
    c.resolutionImagePath=`/api/files/${name}`;c.updatedAt=new Date().toISOString();addUpdate(s,{complaintId:id,updatedBy:user.id,oldStatus:c.status,newStatus:c.status,remarks:note||'Resolution evidence uploaded.',evidencePath:c.resolutionImagePath,eventType:'resolution_evidence'});await writeStore(s);return ok({complaint:c},'Resolution evidence uploaded.');
  }catch(e){return authError(e)||fail('Could not upload resolution evidence.');}
}
