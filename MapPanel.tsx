'use client';
import dynamic from 'next/dynamic'; import type { ComponentType } from 'react';
const MapClient=dynamic(()=>import('./MapClient'),{ssr:false,loading:()=> <div className="map-loading">Loading interactive city map…</div>});
export default function MapPanel({points}:{points:any[]}){return <MapClient points={points}/>}
