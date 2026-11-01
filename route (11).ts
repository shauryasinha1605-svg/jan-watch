import { NextRequest } from 'next/server'; import { requireUser } from '@/lib/auth';
import { readStore,writeStore,addUpdate,addNotification } from '@/lib/store'; import { authError,fail,ok } from '@/lib/http';
export async function POST(request:NextRequest,context:{params:Promise<{id:string}>}){
  try{
    const user=await requireUser(); if(user.role!=='admin')return fail('Administrator access required.','FORBIDDEN',403);
    const {id}=await context.params; const body=await request.json(); const s=await readStore();
    const c=s.complaints.find(x=>x.id===id); if(!c)return fail('Complaint not found.','NOT_FOUND',404);
    const dept=s.departments.find(d=>d.id===body.departmentId); if(!dept)return fail('Invalid department.','VALIDATION_ERROR',400);
    const officer=s.profiles.find(p=>p.id===body.officerId&&p.role==='officer');
    if(body.officerId && (!officer || !s.departmentMembers.some(m=>m.userId===officer.id&&m.departmentId===dept.id&&m.wardId===c.wardId)))return fail('Officer must be assigned to the selected department and complaint ward.','INVALID_ASSIGNMENT',400);
    const oldDept=c.departmentId, oldOfficer=c.assignedOfficerId; c.departmentId=dept.id; c.assignedOfficerId=body.officerId||null; c.updatedAt=new Date().toISOString();
    addUpdate(s,{complaintId:id,updatedBy:user.id,oldStatus:c.status,newStatus:c.status,remarks:String(body.note||`Assignment changed from ${oldDept}/${oldOfficer||'unassigned'} to ${dept.name}/${officer?.name||'unassigned'}.`),evidencePath:null,eventType:'assignment'});
    addNotification(s,{userId:c.userId,complaintId:id,title:'Complaint assignment updated',body:`${c.ticketCode} has been routed to ${dept.name}.`});
    if(officer)addNotification(s,{userId:officer.id,complaintId:id,title:'Complaint assigned to you',body:`${c.ticketCode} has been assigned to your queue.`});
    await writeStore(s); return ok({complaint:c},'Complaint assignment updated.');
  }catch(e){return authError(e)||fail('Could not assign complaint.');}
}
