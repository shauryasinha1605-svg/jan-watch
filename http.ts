import { NextResponse } from 'next/server';
export function ok<T>(data:T, message='Operation successful', status=200) { return NextResponse.json({ success:true, data, message }, { status }); }
export function fail(message:string, code='INTERNAL_ERROR', status=500) { return NextResponse.json({ success:false, error:{ code, message } }, { status }); }
export function authError(error:unknown) {
  if (error instanceof Error && error.message === 'UNAUTHENTICATED') return fail('Please log in to continue.', 'UNAUTHENTICATED', 401);
  return null;
}
