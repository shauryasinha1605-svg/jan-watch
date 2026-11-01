import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { readStore } from '@/lib/store'; import { findPotentialDuplicates } from '@/lib/geo';
import { fail, ok } from '@/lib/http';
export async function GET(request:NextRequest, context:{params:Promise<{id:string}>}) {
  const user=await getCurrentUser(); const {id}=await context.params; const s=await readStore();
  const c=s.complaints.find(x=>x.id===id); if(!c)return fail('Complaint not found.','NOT_FOUND',404);
  const isAdmin=user?.role==='admin';
  const isReporter=user?.id===c.userId;
  const isOfficer=!!user && user.role==='officer' && s.departmentMembers.some(m=>m.userId===user.id&&m.departmentId===c.departmentId&&m.wardId===c.wardId);
  const isAuthorized=!!user && (isAdmin||isReporter||isOfficer);
  if(!isAuthorized && !c.isPublic)return fail('You do not have permission to view this complaint.','FORBIDDEN',403);
  const ward=s.wards.find(w=>w.id===c.wardId); const department=s.departments.find(d=>d.id===c.departmentId);
  if(!isAuthorized){
    return ok({ complaint:{id:c.id,ticketCode:c.ticketCode,title:c.title,description:c.description,category:c.category,issueType:c.issueType,severity:c.severity,status:c.status,latitude:Math.round(c.latitude*1000)/1000,longitude:Math.round(c.longitude*1000)/1000,locationText:c.locationText,wardId:c.wardId,imagePath:null,resolutionImagePath:null,isPublic:true,aiAnalysis:null,analysisState:c.analysisState,createdAt:c.createdAt,updatedAt:c.updatedAt},updates:[],duplicates:[],ward,department,assignedOfficer:null,reopeningRequests:[] });
  }
  const updates=s.complaintUpdates.filter(u=>u.complaintId===id).sort((a,b)=>a.createdAt.localeCompare(b.createdAt)).map(u=>({...u,actor:s.profiles.find(p=>p.id===u.updatedBy)?.name || (u.updatedBy?'User':'JanWatch system')}));
  const duplicates=(user?.role==='admin'||user?.role==='officer'?findPotentialDuplicates(c,s.complaints).filter(d=>user.role==='admin'||s.departmentMembers.some(m=>m.userId===user.id&&m.departmentId===d.complaint.departmentId&&m.wardId===d.complaint.wardId)):[]).map(d=>({id:d.complaint.id,ticketCode:d.complaint.ticketCode,title:d.complaint.title,status:d.complaint.status,distanceMetres:Math.round(d.distance)}));
  return ok({complaint:c,updates,duplicates,ward,department,assignedOfficer:s.profiles.find(p=>p.id===c.assignedOfficerId),reopeningRequests:s.reopeningRequests.filter(r=>r.complaintId===id)});
}
