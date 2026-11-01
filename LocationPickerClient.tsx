'use client';
import { useEffect } from 'react';
import { MapContainer,TileLayer,Marker,useMapEvents,useMap } from 'react-leaflet'; import L, { type LatLngExpression } from 'leaflet';
type Props={latitude:number;longitude:number;onPick:(lat:number,lon:number)=>void};
const pin=L.divIcon({className:'jw-map-pin',html:'<span></span>',iconSize:[18,18],iconAnchor:[9,9]});
function ClickEvents({onPick}:{onPick:(lat:number,lon:number)=>void}){useMapEvents({click(e){onPick(e.latlng.lat,e.latlng.lng);}});return null;}
function Recenter({latitude,longitude}:{latitude:number;longitude:number}){const map=useMap();useEffect(()=>{map.setView([latitude,longitude],map.getZoom());},[map,latitude,longitude]);return null;}
export default function LocationPickerClient({latitude,longitude,onPick}:Props){const position:LatLngExpression=[latitude,longitude];return <div className="location-picker-map"><MapContainer center={position} zoom={14} scrollWheelZoom className="map-view"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><ClickEvents onPick={onPick}/><Recenter latitude={latitude} longitude={longitude}/><Marker position={position} icon={pin}/></MapContainer></div>}
