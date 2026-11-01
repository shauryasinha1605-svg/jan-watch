import type { Category, Status } from './types';
export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'roads', label: 'Roads' }, { value: 'sanitation', label: 'Sanitation' },
  { value: 'water', label: 'Water' }, { value: 'drainage', label: 'Drainage' },
  { value: 'electricity', label: 'Electricity' }, { value: 'pollution', label: 'Pollution' },
  { value: 'public_infrastructure', label: 'Public infrastructure' }, { value: 'other', label: 'Other' }
];
export const STATUS_LABELS: Record<Status, string> = {
  submitted: 'Submitted', under_review: 'Under review', assigned: 'Assigned', in_progress: 'In progress',
  resolved: 'Resolved', verified: 'Verified', reopened: 'Reopened', rejected: 'Rejected'
};
export const DEPARTMENT_BY_CATEGORY: Record<Category, string> = {
  roads: 'dept-roads', sanitation: 'dept-waste', water: 'dept-water', drainage: 'dept-drainage',
  electricity: 'dept-electrical', pollution: 'dept-environment', public_infrastructure: 'dept-engineering', other: 'dept-control'
};
export const VALID_TRANSITIONS: Record<Status, Status[]> = {
  submitted: ['under_review'], under_review: ['assigned', 'rejected'], assigned: ['in_progress', 'under_review'],
  in_progress: ['resolved'], resolved: ['verified', 'reopened'], verified: ['reopened'],
  reopened: ['under_review', 'assigned'], rejected: []
};
