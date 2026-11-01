import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Store, Complaint, ComplaintUpdate, Category, Severity, Status, AppNotification } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'janwatch.json');
const now = new Date().toISOString();

function seedStore(): Store {
  const wards = [
    { id: 'ward-1', name: 'Ward 1 – North Zone', city: 'Demo City' },
    { id: 'ward-2', name: 'Ward 2 – South Zone', city: 'Demo City' },
    { id: 'ward-3', name: 'Ward 3 – Central Zone', city: 'Demo City' },
    { id: 'ward-4', name: 'Ward 4 – East Zone', city: 'Demo City' },
    { id: 'ward-5', name: 'Ward 5 – West Zone', city: 'Demo City' }
  ];
  const departments = [
    { id: 'dept-roads', name: 'Public Works Department', category: 'roads' as Category },
    { id: 'dept-waste', name: 'Waste Management Department', category: 'sanitation' as Category },
    { id: 'dept-water', name: 'Water Supply Department', category: 'water' as Category },
    { id: 'dept-drainage', name: 'Drainage Department', category: 'drainage' as Category },
    { id: 'dept-electrical', name: 'Electrical Department', category: 'electricity' as Category },
    { id: 'dept-environment', name: 'Environmental Department', category: 'pollution' as Category },
    { id: 'dept-engineering', name: 'Municipal Engineering Department', category: 'public_infrastructure' as Category },
    { id: 'dept-control', name: 'Municipal Control Room', category: 'other' as Category }
  ];
  const profiles = [
    { id: 'citizen-1', name: 'Aarav Sharma', email: 'citizen@janwatch.demo', role: 'citizen' as const, wardId: 'ward-3' },
    { id: 'citizen-2', name: 'Meera Iyer', email: 'citizen2@janwatch.demo', role: 'citizen' as const, wardId: 'ward-1' },
    { id: 'officer-1', name: 'Rohan Verma', email: 'roads@janwatch.demo', role: 'officer' as const, wardId: 'ward-3' },
    { id: 'officer-2', name: 'Ananya Das', email: 'sanitation@janwatch.demo', role: 'officer' as const, wardId: 'ward-1' },
    { id: 'officer-3', name: 'Kabir Nair', email: 'water@janwatch.demo', role: 'officer' as const, wardId: 'ward-2' },
    { id: 'admin-1', name: 'City Administrator', email: 'admin@janwatch.demo', role: 'admin' as const, wardId: null }
  ];
  const departmentMembers = [
    { id: 'dm-1', userId: 'officer-1', departmentId: 'dept-roads', wardId: 'ward-3' },
    { id: 'dm-2', userId: 'officer-2', departmentId: 'dept-waste', wardId: 'ward-1' },
    { id: 'dm-3', userId: 'officer-3', departmentId: 'dept-water', wardId: 'ward-2' }
  ];
  const examples: Array<Pick<Complaint, 'id'|'ticketCode'|'userId'|'title'|'description'|'category'|'issueType'|'severity'|'status'|'latitude'|'longitude'|'locationText'|'wardId'|'departmentId'|'assignedOfficerId'|'imagePath'|'resolutionImagePath'|'isPublic'|'analysisState'>> = [
    { id:'demo-1', ticketCode:'JW-A83F19B2', userId:'citizen-1', title:'Large pothole near central junction', description:'A deep pothole is causing two-wheelers to swerve near the central junction.', category:'roads', issueType:'pothole', severity:'high', status:'in_progress', latitude:20.004, longitude:78.002, locationText:'Central junction, Demo City', wardId:'ward-3', departmentId:'dept-roads', assignedOfficerId:'officer-1', imagePath:null, resolutionImagePath:null, isPublic:true, analysisState:'completed' },
    { id:'demo-2', ticketCode:'JW-B21D73C4', userId:'citizen-2', title:'Overflowing community waste bin', description:'Garbage has accumulated around the public bin for three days.', category:'sanitation', issueType:'overflowing bin', severity:'medium', status:'assigned', latitude:20.012, longitude:78.009, locationText:'North market, Demo City', wardId:'ward-1', departmentId:'dept-waste', assignedOfficerId:'officer-2', imagePath:null, resolutionImagePath:null, isPublic:true, analysisState:'completed' },
    { id:'demo-3', ticketCode:'JW-C91E04A7', userId:'citizen-1', title:'Water pipeline leakage', description:'A continuous water leak is visible beside the footpath.', category:'water', issueType:'pipeline leakage', severity:'high', status:'under_review', latitude:19.991, longitude:78.006, locationText:'South avenue, Demo City', wardId:'ward-2', departmentId:'dept-water', assignedOfficerId:'officer-3', imagePath:null, resolutionImagePath:null, isPublic:true, analysisState:'completed' },
    { id:'demo-4', ticketCode:'JW-D55A12E9', userId:'citizen-2', title:'Streetlight not working', description:'Streetlight near the park entrance has not worked for a week.', category:'electricity', issueType:'damaged streetlight', severity:'medium', status:'resolved', latitude:20.018, longitude:78.018, locationText:'East park entrance, Demo City', wardId:'ward-4', departmentId:'dept-electrical', assignedOfficerId:null, imagePath:null, resolutionImagePath:null, isPublic:true, analysisState:'completed' },
    { id:'demo-5', ticketCode:'JW-E17B66F0', userId:'citizen-1', title:'Blocked roadside drain', description:'Rainwater is collecting because the roadside drain is blocked.', category:'drainage', issueType:'blocked drain', severity:'critical', status:'submitted', latitude:20.006, longitude:77.987, locationText:'West road, Demo City', wardId:'ward-5', departmentId:'dept-drainage', assignedOfficerId:null, imagePath:null, resolutionImagePath:null, isPublic:true, analysisState:'needs_review' },
    { id:'demo-6', ticketCode:'JW-F02C88A1', userId:'citizen-2', title:'Smoke from open waste burning', description:'Dark smoke is coming from waste being burned on an open plot.', category:'pollution', issueType:'open waste burning', severity:'high', status:'verified', latitude:19.997, longitude:78.022, locationText:'Industrial lane, Demo City', wardId:'ward-4', departmentId:'dept-environment', assignedOfficerId:null, imagePath:null, resolutionImagePath:null, isPublic:true, analysisState:'completed' },
    { id:'demo-7', ticketCode:'JW-G42D90B3', userId:'citizen-1', title:'Damaged public park bench', description:'A broken bench has exposed sharp edges in the children’s park.', category:'public_infrastructure', issueType:'damaged park facility', severity:'medium', status:'submitted', latitude:20.021, longitude:77.998, locationText:'Children’s park, Demo City', wardId:'ward-1', departmentId:'dept-engineering', assignedOfficerId:null, imagePath:null, resolutionImagePath:null, isPublic:false, analysisState:'completed' },
    { id:'demo-8', ticketCode:'JW-H68E31D5', userId:'citizen-2', title:'Damaged public information sign', description:'A public information sign near the bus stop is damaged and unreadable.', category:'other', issueType:'unclassified civic issue', severity:'low', status:'assigned', latitude:20.009, longitude:78.014, locationText:'Central bus stop, Demo City', wardId:'ward-3', departmentId:'dept-control', assignedOfficerId:null, imagePath:null, resolutionImagePath:null, isPublic:true, analysisState:'completed' },
    { id:'demo-9', ticketCode:'JW-J39F75A2', userId:'citizen-2', title:'Pothole near central junction approach', description:'A second resident report describes a pothole on the same junction approach.', category:'roads', issueType:'pothole', severity:'high', status:'submitted', latitude:20.0043, longitude:78.0022, locationText:'Central junction approach, Demo City', wardId:'ward-3', departmentId:'dept-roads', assignedOfficerId:'officer-1', imagePath:null, resolutionImagePath:null, isPublic:true, analysisState:'completed' }
  ];
  const complaints: Complaint[] = examples.map((c, i) => ({ ...c, aiAnalysis: { title:c.title, summary:c.description, category:c.category, issue_type:c.issueType, severity:c.severity, recommended_action:'Inspect the reported location and take appropriate corrective action.', confidence:0.84, needs_human_review:c.severity==='critical', uncertainty_reason:c.severity==='critical'?'Critical reports require immediate human review.':'', source:'rule_based' as const }, createdAt:new Date(Date.now() - (i+1)*86400000).toISOString(), updatedAt:now }));
  const complaintUpdates: ComplaintUpdate[] = complaints.map(c => ({ id:randomUUID(), complaintId:c.id, updatedBy:c.userId, oldStatus:null, newStatus:'submitted' as Status, remarks:'Complaint registered (fictional Demo City seed record).', evidencePath:null, createdAt:c.createdAt, eventType:'created' }));
  return { profiles, wards, departments, departmentMembers, complaints, complaintUpdates, reopeningRequests: [], notifications: [] };
}

async function ensureDb() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try { await fs.access(DB_FILE); } catch { await fs.writeFile(DB_FILE, JSON.stringify(seedStore(), null, 2)); }
}
export async function readStore(): Promise<Store> {
  await ensureDb();
  const raw = await fs.readFile(DB_FILE, 'utf8');
  return JSON.parse(raw) as Store;
}
export async function writeStore(store: Store): Promise<void> {
  await ensureDb();
  const temp = `${DB_FILE}.${process.pid}.tmp`;
  await fs.writeFile(temp, JSON.stringify(store, null, 2));
  await fs.rename(temp, DB_FILE);
}
export async function resetStore(): Promise<Store> {
  const s = seedStore(); await writeStore(s); return s;
}
export function addUpdate(store: Store, input: Omit<ComplaintUpdate, 'id'|'createdAt'>): ComplaintUpdate {
  const update: ComplaintUpdate = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
  store.complaintUpdates.push(update); return update;
}
export function newComplaintId() { return randomUUID(); }

export function addNotification(store: Store, input: Omit<AppNotification,'id'|'createdAt'|'readAt'>): AppNotification {
  const notification: AppNotification = { ...input, id: randomUUID(), readAt: null, createdAt: new Date().toISOString() };
  store.notifications ||= []; store.notifications.push(notification); return notification;
}
