import { NextResponse } from 'next/server';
import { sessionCookieName } from '@/lib/auth';
export async function POST() { const response = NextResponse.json({ success:true, data:null, message:'Signed out.' }); response.cookies.set(sessionCookieName,'',{ httpOnly:true, path:'/', maxAge:0 }); return response; }
