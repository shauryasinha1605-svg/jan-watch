import { NextRequest } from 'next/server'; import { randomBytes,scryptSync,randomUUID } from 'node:crypto';
import { readStore,writeStore } from '@/lib/store'; import { createSessionToken,sessionCookieName } from '@/lib/auth'; import { fail,ok } from '@/lib/http';
export async function POST(request:NextRequest){
  const body=await request.json().catch(()=>null);const name=String(body?.name||'').trim(),email=String(body?.email||'').trim().toLowerCase(),password=String(body?.password||''),wardId=String(body?.wardId||'ward-3');
  if(name.length<2||name.length>80||!/^\S+@\S+\.\S+$/.test(email)||password.length<8)return fail('Enter a valid name and email. Password must be at least 8 characters.','VALIDATION_ERROR',400);
  const s=await readStore();if(s.profiles.some(p=>p.email.toLowerCase()===email))return fail('An account with this email already exists.','EMAIL_EXISTS',409);
  if(!s.wards.some(w=>w.id===wardId))return fail('Choose a valid ward.','VALIDATION_ERROR',400);
  const salt=randomBytes(16).toString('hex'),hash=scryptSync(password,salt,64).toString('hex');const profile={id:randomUUID(),name,email,role:'citizen' as const,wardId,passwordHash:`${salt}:${hash}`};
  s.profiles.push(profile);await writeStore(s);const token=createSessionToken({id:profile.id,name,email,role:'citizen'});const response=ok({user:{id:profile.id,name,email,role:'citizen'}},'Account created.');
  response.cookies.set(sessionCookieName,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*7});return response;
}
