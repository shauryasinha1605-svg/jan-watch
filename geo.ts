import type { Complaint } from './types';
export function distanceMetres(aLat:number, aLon:number, bLat:number, bLon:number) {
  const r = 6371000, rad = (v:number) => v * Math.PI / 180;
  const dLat = rad(bLat-aLat), dLon = rad(bLon-aLon);
  const h = Math.sin(dLat/2)**2 + Math.cos(rad(aLat))*Math.cos(rad(bLat))*Math.sin(dLon/2)**2;
  return 2*r*Math.asin(Math.sqrt(h));
}
export function findPotentialDuplicates(complaint: Pick<Complaint,'id'|'category'|'latitude'|'longitude'|'createdAt'>, all: Complaint[]) {
  const since = Date.now() - 30*24*60*60*1000;
  return all.filter(other => other.id !== complaint.id && other.category === complaint.category && new Date(other.createdAt).getTime() >= since)
    .map(other => ({ complaint: other, distance: distanceMetres(complaint.latitude, complaint.longitude, other.latitude, other.longitude) }))
    .filter(x => x.distance <= 100).sort((a,b) => a.distance-b.distance);
}
