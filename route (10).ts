import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth'; import { readStore,writeStore,addUpdate,addNotification } from '@/lib/store';
import { VALID_TRANSITIONS } from '@/lib/constants'; import { authError,fail,ok } from '@/lib/http';
import type { Status } from '@/lib/types';
export async function PATCH(request:NextRequest,context:{params:Promise<{id:string}>}){
  try{
    const user=await requireUser(); if(!['officer','admin'].includes(user.role)) return fail('Only authorized officers or administrators can update status.','FORBIDDEN',403);
    const {id}=await context.params; const body=await request.json(); const next=body.status as Status; const note=String(body.note||'').trim();
    const s=await readStore(); const c=s.complaints.find(x=>x.id===id); if(!c)return fail('Complaint not found.','NOT_FOUND',404);
    if(user.role==='officer'&&!s.departmentMembers.some(m=>m.userId===user.id&&m.departmentId===c.departmentId&&m.wardId===c.wardId))return fail('Complaint is outside your department or ward permissions.','FORBIDDEN',403);
    if(!VALID_TRANSITIONS[c.status]?.includes(next))return fail(`Invalid status transition: ${c.status} → ${next}.`,'INVALID_TRANSITION',409);
    if((next==='resolved'||next==='rejected')&&note.length<5)return fail('Please provide a short note before resolving or rejecting.','VALIDATION_ERROR',400);
    const old=c.status; c.status=next; c.updatedAt=new Date().toISOString();
    addUpdate(s,{complaintId:id,updatedBy:user.id,oldStatus:old,newStatus:next,remarks:note||`Status changed to ${next.replace('_',' ')}.`,evidencePath:null,eventType:'status_change'});
    addNotification(s,{userId:c.userId,complaintId:id,title:'Complaint status updated',body:`${c.ticketCode} is now ${next.replace('_',' ')}.`});
    await writeStore(s); return ok({complaint:c},'Complaint status updated.');
  }catch(e){return authError(e)||fail('Could not update complaint status.');}
}
