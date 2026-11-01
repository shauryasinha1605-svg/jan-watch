export type Role = 'citizen' | 'officer' | 'admin';
export type Category = 'roads' | 'sanitation' | 'water' | 'drainage' | 'electricity' | 'pollution' | 'public_infrastructure' | 'other';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type Status = 'submitted' | 'under_review' | 'assigned' | 'in_progress' | 'resolved' | 'verified' | 'reopened' | 'rejected';
export type AnalysisState = 'processing' | 'completed' | 'needs_review' | 'failed';

export interface Profile { id: string; name: string; email: string; role: Role; wardId?: string | null; passwordHash?: string; }
export interface Ward { id: string; name: string; city: string; }
export interface Department { id: string; name: string; category: Category; }
export interface DepartmentMember { id: string; userId: string; departmentId: string; wardId: string; }
export interface AIAnalysis {
  title: string; summary: string; category: Category; issue_type: string; severity: Severity;
  recommended_action: string; confidence: number; needs_human_review: boolean; uncertainty_reason: string;
  source: 'gemini' | 'rule_based';
}
export interface Complaint {
  id: string; ticketCode: string; userId: string; title: string; description: string;
  category: Category; issueType: string; severity: Severity; status: Status;
  latitude: number; longitude: number; locationText: string; wardId: string;
  departmentId: string; assignedOfficerId: string | null; imagePath: string | null;
  resolutionImagePath: string | null; isPublic: boolean; aiAnalysis: AIAnalysis | null;
  analysisState: AnalysisState; createdAt: string; updatedAt: string;
}
export interface ComplaintUpdate {
  id: string; complaintId: string; updatedBy: string | null; oldStatus: Status | null;
  newStatus: Status | null; remarks: string; evidencePath: string | null; createdAt: string;
  eventType?: string;
}
export interface ReopeningRequest { id: string; complaintId: string; requestedBy: string; reason: string; state: 'pending'|'approved'|'declined'; createdAt: string; }
export interface AppNotification { id: string; userId: string; complaintId: string | null; title: string; body: string; readAt: string | null; createdAt: string; }
export interface Store {
  profiles: Profile[]; wards: Ward[]; departments: Department[]; departmentMembers: DepartmentMember[];
  complaints: Complaint[]; complaintUpdates: ComplaintUpdate[]; reopeningRequests: ReopeningRequest[]; notifications: AppNotification[];
}
export interface SessionUser { id: string; name: string; email: string; role: Role; }
