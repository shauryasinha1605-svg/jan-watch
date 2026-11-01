'use client';
import dynamic from 'next/dynamic';
const LocationPickerClient=dynamic(()=>import('./LocationPickerClient'),{ssr:false,loading:()=> <div className="location-picker-map map-loading">Loading location picker…</div>});
export default function LocationPicker({latitude,longitude,onPick}:{latitude:number;longitude:number;onPick:(lat:number,lon:number)=>void}){return <LocationPickerClient latitude={latitude} longitude={longitude} onPick={onPick}/>}
