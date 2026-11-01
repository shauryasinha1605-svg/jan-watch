export async function api<T=any>(url:string, init:RequestInit={}):Promise<T>{
  const response=await fetch(url,{...init,headers:{...(init.body instanceof FormData?{}:{'Content-Type':'application/json'}),...(init.headers||{})}});
  const payload=await response.json().catch(()=>({success:false,error:{message:'Unexpected server response.'}}));
  if(!response.ok||payload.success===false)throw new Error(payload.error?.message||'Request failed.');
  return payload.data as T;
}
export function pretty(value:string){return value.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());}
export function dateLabel(value:string){return new Date(value).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});}
