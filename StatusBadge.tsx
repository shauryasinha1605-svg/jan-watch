import type { Status,Severity } from '@/lib/types'; import { STATUS_LABELS } from '@/lib/constants';
export function StatusBadge({status}:{status:Status}){return <span className={`badge status-${status}`}>{STATUS_LABELS[status]}</span>}
export function SeverityBadge({severity}:{severity:Severity}){return <span className={`badge severity-${severity}`}>{severity}</span>}
