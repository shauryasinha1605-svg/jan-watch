import { requireUser } from '@/lib/auth'; import { readStore } from '@/lib/store'; import { authError,fail,ok } from '@/lib/http';
export async function GET(){
  try{
    const user=await requireUser(); if(!['officer','admin'].includes(user.role))return fail('Authority access required.','FORBIDDEN',403);
    const s=await readStore(); let rows=s.complaints;
    if(user.role==='officer'){const members=s.departmentMembers.filter(m=>m.userId===user.id);rows=rows.filter(c=>members.some(m=>m.departmentId===c.departmentId&&m.wardId===c.wardId));}
    const count=(fn:(x:typeof rows[number])=>boolean)=>rows.filter(fn).length;
    return ok({total:rows.length,pending:count(c=>['submitted','under_review','assigned','reopened'].includes(c.status)),inProgress:count(c=>c.status==='in_progress'),resolved:count(c=>['resolved','verified'].includes(c.status)),critical:count(c=>c.severity==='critical'),high:count(c=>c.severity==='high'),byCategory:s.departments.map(d=>({name:d.category.replace('_',' '),value:count(c=>c.category===d.category)})),byWard:s.wards.map(w=>({name:w.name.replace('Ward ','W'),value:count(c=>c.wardId===w.id)})),departments:s.departments,officers:user.role==='admin'?s.profiles.filter(p=>p.role==='officer').map(p=>({id:p.id,name:p.name})):[],departmentMembers:user.role==='admin'?s.departmentMembers:[],reopeningRequests:user.role==='admin'?s.reopeningRequests.filter(r=>r.state==='pending').map(r=>({ ...r, ticketCode:s.complaints.find(c=>c.id===r.complaintId)?.ticketCode, title:s.complaints.find(c=>c.id===r.complaintId)?.title })):[]});
  }catch(e){return authError(e)||fail('Could not load authority summary.');}
}
