import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { requireUser } from '@/lib/auth';
import { readStore, writeStore, addUpdate } from '@/lib/store';
import { analyzeComplaint } from '@/lib/ai';
import { findPotentialDuplicates } from '@/lib/geo';
import { DEPARTMENT_BY_CATEGORY } from '@/lib/constants';
import { authError, fail, ok } from '@/lib/http';
import type { Complaint } from '@/lib/types';

const allowed = new Set(['image/jpeg','image/png','image/webp']);
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(); const s = await readStore(); const q = request.nextUrl.searchParams;
    let rows = s.complaints;
    if (user.role === 'citizen') rows = rows.filter(c => c.userId === user.id);
    if (user.role === 'officer') {
      const memberships = s.departmentMembers.filter(m => m.userId === user.id);
      rows = rows.filter(c => memberships.some(m => m.departmentId === c.departmentId && m.wardId === c.wardId));
    }
    const status = q.get('status'), category = q.get('category'), severity = q.get('severity');
    if (status) rows = rows.filter(c => c.status === status);
    if (category) rows = rows.filter(c => c.category === category);
    if (severity) rows = rows.filter(c => c.severity === severity);
    rows = rows.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    const page = Math.max(1, Number(q.get('page') || 1)), limit = Math.min(100, Math.max(1, Number(q.get('limit') || 50)));
    return ok({ complaints:rows.slice((page-1)*limit,page*limit), total:rows.length, page, limit });
  } catch (e) { return authError(e) || fail('Could not fetch complaints.'); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(); if (user.role !== 'citizen') return fail('Only citizen accounts can submit complaints.', 'FORBIDDEN', 403);
    const form = await request.formData();
    const description = String(form.get('description') || '').trim();
    const latitude = Number(form.get('latitude')), longitude = Number(form.get('longitude'));
    if (description.length < 10 || description.length > 2000) return fail('Description must contain 10–2,000 characters.', 'VALIDATION_ERROR', 400);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) return fail('Enter valid latitude and longitude.', 'VALIDATION_ERROR', 400);
    const s = await readStore(); const profile = s.profiles.find(p => p.id === user.id);
    const wardId = String(form.get('wardId') || profile?.wardId || 'ward-3');
    if (!s.wards.some(w => w.id === wardId)) return fail('Selected ward is invalid.', 'VALIDATION_ERROR', 400);
    const image = form.get('image'); let imagePath: string | null = null; let imageBuffer: Buffer | undefined; let mimeType = '';
    if (image && typeof image !== 'string' && image.size > 0) {
      if (!allowed.has(image.type)) return fail('Only JPEG, PNG and WebP images are accepted.', 'INVALID_IMAGE_TYPE', 400);
      if (image.size > 5*1024*1024) return fail('Image must be 5 MB or smaller.', 'IMAGE_TOO_LARGE', 400);
      imageBuffer = Buffer.from(await image.arrayBuffer()); mimeType = image.type;
      const ext = image.type === 'image/jpeg' ? 'jpg' : image.type === 'image/png' ? 'png' : 'webp';
      const name = `${randomUUID()}.${ext}`; const uploadDir = path.join(process.cwd(),'data','uploads');
      await fs.mkdir(uploadDir,{recursive:true}); await fs.writeFile(path.join(uploadDir,name),imageBuffer); imagePath = `/api/files/${name}`;
    }
    const id = randomUUID();
    const ticketCode = `JW-${randomUUID().replace(/-/g,'').slice(0,8).toUpperCase()}`;
    const complaint: Complaint = {
      id, ticketCode, userId:user.id, title:'New civic complaint', description,
      category:'other', issueType:'pending analysis', severity:'medium', status:'submitted',
      latitude, longitude, locationText:String(form.get('locationText') || '').slice(0,180), wardId,
      departmentId:DEPARTMENT_BY_CATEGORY.other, assignedOfficerId:null, imagePath, resolutionImagePath:null,
      isPublic:form.get('isPublic') === 'true', aiAnalysis:null, analysisState:'processing',
      createdAt:new Date().toISOString(), updatedAt:new Date().toISOString()
    };
    s.complaints.push(complaint);
    addUpdate(s,{ complaintId:id, updatedBy:user.id, oldStatus:null, newStatus:'submitted', remarks:'Complaint registered.', evidencePath:null, eventType:'created' });
    await writeStore(s); // Persist before calling the AI service.

    try {
      const analysis = await analyzeComplaint(description, imageBuffer ? {data:imageBuffer,mimeType} : undefined);
      const fresh = await readStore(); const current = fresh.complaints.find(c => c.id === id)!;
      current.aiAnalysis = analysis; current.title = analysis.title; current.category = analysis.category;
      current.issueType = analysis.issue_type; current.severity = analysis.severity;
      current.departmentId = DEPARTMENT_BY_CATEGORY[analysis.category];
      current.analysisState = analysis.needs_human_review ? 'needs_review' : 'completed'; current.updatedAt = new Date().toISOString();
      addUpdate(fresh,{ complaintId:id, updatedBy:null, oldStatus:null, newStatus:null, remarks:`AI analysis ${analysis.source === 'gemini' ? 'completed' : 'completed using rule-based fallback'}. ${analysis.needs_human_review ? 'Human review required.' : ''}`, evidencePath:null, eventType:'ai_analysis' });
      const duplicates = findPotentialDuplicates(current, fresh.complaints);
      if (duplicates.length) addUpdate(fresh,{ complaintId:id, updatedBy:null, oldStatus:null, newStatus:null, remarks:'Potentially related reports were flagged for authorized officer review.', evidencePath:null, eventType:'duplicate_candidates' });
      await writeStore(fresh);
      return ok({ complaint:current, analysis }, 'Complaint submitted successfully.', 201);
    } catch (error) {
      console.error('AI processing failed:', error);
      const fresh = await readStore(); const current = fresh.complaints.find(c => c.id === id);
      if (current) { current.analysisState='failed'; current.updatedAt=new Date().toISOString(); addUpdate(fresh,{ complaintId:id, updatedBy:null, oldStatus:null, newStatus:null, remarks:'AI analysis unavailable. Complaint saved for manual review.', evidencePath:null, eventType:'ai_failed' }); await writeStore(fresh); }
      return ok({ complaint:current || complaint, analysis:null }, 'Complaint saved. AI analysis is unavailable; manual review is required.', 201);
    }
  } catch (e) { return authError(e) || fail(e instanceof Error ? e.message : 'Could not submit complaint.', 'SUBMISSION_FAILED', 500); }
}
