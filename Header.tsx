'use client';
import Link from 'next/link'; import { useEffect,useState } from 'react'; import { usePathname,useRouter } from 'next/navigation';
import { ShieldCheck,MapPinned,LayoutDashboard,PlusCircle,LogOut,Menu,X,UserCircle,Bell } from 'lucide-react';
import { api,dateLabel } from '@/lib/client'; import type { SessionUser } from '@/lib/types';
export default function Header(){
  const [user,setUser]=useState<SessionUser|null>(null),[open,setOpen]=useState(false),[notifOpen,setNotifOpen]=useState(false),[notifications,setNotifications]=useState<any[]>([]),[unread,setUnread]=useState(0); const path=usePathname(),router=useRouter();
  async function refresh(){try{const me=await api<{user:SessionUser|null}>('/api/auth/me');setUser(me.user);if(me.user){const n=await api<{notifications:any[];unread:number}>('/api/notifications');setNotifications(n.notifications);setUnread(n.unread);}else{setNotifications([]);setUnread(0);}}catch{setUser(null);}}
  useEffect(()=>{refresh();},[path]);
  async function logout(){await api('/api/auth/logout',{method:'POST'});setUser(null);router.push('/');}
  async function openNotification(n:any){try{await api(`/api/notifications/${n.id}`,{method:'PATCH'});setUnread(x=>Math.max(0,x-(!n.readAt?1:0)));setNotifications(items=>items.map(x=>x.id===n.id?{...x,readAt:new Date().toISOString()}:x));setNotifOpen(false);if(n.complaintId)router.push(`/complaints/${n.complaintId}`);}catch{}}
  const links=[{href:'/public',label:'Public dashboard',icon:MapPinned},...(user?[{href:user.role==='citizen'?'/citizen':'/authority',label:user.role==='citizen'?'My complaints':'Authority',icon:LayoutDashboard}]:[]),...(user?.role==='citizen'?[{href:'/report',label:'Report an issue',icon:PlusCircle}]:[])];
  return <header className="site-header"><div className="nav-wrap"><Link className="brand" href="/"><span className="brand-mark"><ShieldCheck size={21}/></span><span>JanWatch<small>DEMO CITY · CIVIC WATCH</small></span></Link>
    <nav className={`nav-links ${open?'nav-open':''}`}>{links.map(l=><Link key={l.href} href={l.href} className={path===l.href?'nav-active':''} onClick={()=>setOpen(false)}><l.icon size={16}/>{l.label}</Link>)}
      {user&&<div className="notification-wrap"><button className="notification-trigger" aria-label="Notifications" onClick={()=>setNotifOpen(!notifOpen)}><Bell size={17}/>{unread>0&&<span>{unread}</span>}</button>{notifOpen&&<div className="notification-menu"><div className="notification-menu-head"><strong>Notifications</strong><small>{unread} unread</small></div>{notifications.length?notifications.map(n=><button key={n.id} onClick={()=>openNotification(n)} className={`notification-item ${n.readAt?'':'unread'}`}><strong>{n.title}</strong><span>{n.body}</span><small>{dateLabel(n.createdAt)}</small></button>):<div className="notification-empty">No notifications yet.</div>}</div>}</div>}
      {user?<><span className="nav-user"><UserCircle size={16}/>{user.name}</span><button className="nav-login" onClick={logout}><LogOut size={15}/> Sign out</button></>:<Link className="nav-login" href="/login">Sign in</Link>}
    </nav><button className="mobile-menu" aria-label="Toggle menu" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button></div></header>
}
