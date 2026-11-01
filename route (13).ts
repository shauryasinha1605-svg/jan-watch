import { NextRequest } from 'next/server'; import { randomUUID } from 'node:crypto'; import { requireUser } from '@/lib/auth';
import { readStore,writeStore,addUpdate,addNotification } from '@/lib/store'; import { authError,fail,ok } from '@/lib/http';
export async function POST(request:NextRequest,context:{params:Promise<{id:string}>}){
  try{
    const user=await requireUser(); const {id}=await context.params; const body=await request.json(); const decision=body.decision; const note=String(body.note||'').trim();
    const s=await readStore(); const c=s.complaints.find(x=>x.id===id); if(!c)return fail('Complaint not found.','NOT_FOUND',404);
    if(decision==='verify'){
      if(user.role!=='admin'&&c.userId!==user.id)return fail('Only the reporter or an administrator can verify resolution.','FORBIDDEN',403);
      if(c.status!=='resolved')return fail('Only resolved complaints can be verified.','INVALID_TRANSITION',409);
      const old=c.status;c.status='verified';c.updatedAt=new Date().toISOString(); addUpdate(s,{complaintId:id,updatedBy:user.id,oldStatus:old,newStatus:'verified',remarks:note||'Citizen/administrator confirmed resolution.',evidencePath:null,eventType:'verified'});
      addNotification(s,{userId:c.userId,complaintId:id,title:'Resolution verified',body:`${c.ticketCode} has been marked verified.`});
      await writeStore(s);return ok({complaint:c},'Resolution verified.');
    }
    if(decision==='decline' && user.role==='admin') {
      const pending=s.reopeningRequests.find(r=>r.complaintId===id&&r.state==='pending'); if(!pending)return fail('No pending reopening request exists.','NOT_FOUND',404);
      pending.state='declined'; addUpdate(s,{complaintId:id,updatedBy:user.id,oldStatus:c.status,newStatus:c.status,remarks:note||'Administrator declined reopening request.',evidencePath:null,eventType:'reopen_declined'}); addNotification(s,{userId:c.userId,complaintId:id,title:'Reopening request reviewed',body:`Your request for ${c.ticketCode} was declined.`}); await writeStore(s); return ok({complaint:c},'Reopening request declined.');
    }
    if(decision==='reopen'){
      if(user.role==='citizen'){
        if(c.userId!==user.id)return fail('Only the original reporter can request reopening.','FORBIDDEN',403);
        if(!['resolved','verified'].includes(c.status))return fail('A complaint can only be reopened after resolution.','INVALID_TRANSITION',409);
        if(note.length<5)return fail('Please explain why the issue is not resolved.','VALIDATION_ERROR',400);
        const existing=s.reopeningRequests.find(r=>r.complaintId===id&&r.state==='pending'); if(existing)return fail('A reopening request is already pending.','REQUEST_EXISTS',409);
        s.reopeningRequests.push({id:randomUUID(),complaintId:id,requestedBy:user.id,reason:note,state:'pending',createdAt:new Date().toISOString()});
        addUpdate(s,{complaintId:id,updatedBy:user.id,oldStatus:c.status,newStatus:c.status,remarks:`Reopening requested: ${note}`,evidencePath:null,eventType:'reopen_requested'});
        const admins=s.profiles.filter(p=>p.role==='admin'); for(const admin of admins)addNotification(s,{userId:admin.id,complaintId:id,title:'Reopening request received',body:`${c.ticketCode} needs administrator review.`});
        await writeStore(s);return ok({complaint:c},'Reopening request sent to the administrator.');
      }
      if(user.role==='admin'){
        if(!['resolved','verified'].includes(c.status))return fail('Only resolved complaints can be reopened.','INVALID_TRANSITION',409);
        const old=c.status;c.status='reopened';c.updatedAt=new Date().toISOString();
        for(const r of s.reopeningRequests.filter(r=>r.complaintId===id&&r.state==='pending'))r.state='approved';
        addUpdate(s,{complaintId:id,updatedBy:user.id,oldStatus:old,newStatus:'reopened',remarks:note||'Administrator reopened complaint.',evidencePath:null,eventType:'reopened'});
        addNotification(s,{userId:c.userId,complaintId:id,title:'Complaint reopened',body:`${c.ticketCode} has been reopened for further action.`});
        await writeStore(s);return ok({complaint:c},'Complaint reopened.');
      }
    }
    return fail('Unsupported decision.','VALIDATION_ERROR',400);
  }catch(e){return authError(e)||fail('Could not process complaint decision.');}
}
