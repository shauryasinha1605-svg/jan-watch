import type { ReactNode } from 'react';
export default function MetricCard({label,value,icon,caption}:{label:string;value:string|number;icon:ReactNode;caption?:string}){return <div className="metric-card"><div className="metric-top"><span>{label}</span><span className="metric-icon">{icon}</span></div><strong>{value}</strong>{caption&&<small>{caption}</small>}</div>}
