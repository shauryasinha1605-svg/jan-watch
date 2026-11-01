'use client';
import { MapContainer,TileLayer,Marker,Popup } from 'react-leaflet';
import L from 'leaflet'; import Link from 'next/link'; import type { LatLngExpression } from 'leaflet';
import type { Status,Severity,Category } from '@/lib/types'; import { pretty } from '@/lib/client';
const icon=L.divIcon({className:'jw-map-pin',html:'<span></span>',iconSize:[18,18],iconAnchor:[9,9]});
type Point={id:string;ticketCode:string;title:string;category:Category;severity:Severity;status:Status;wardId:string;latitude:number;longitude:number;createdAt:string;locationText:string};
export default function MapClient({points}:{points:Point[]}){const center:LatLngExpression=[20.004,78.004];return <div className="map-shell"><MapContainer center={center} zoom={14} scrollWheelZoom className="map-view"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>{points.map(p=><Marker key={p.id} position={[p.latitude,p.longitude]} icon={icon}><Popup><div className="map-popup"><strong>{p.title}</strong><small>{p.ticketCode} · {pretty(p.category)}</small><small>{pretty(p.severity)} · {pretty(p.status)}</small><Link href={`/complaints/${p.id}`}>View report →</Link></div></Popup></Marker>)}</MapContainer></div>}
