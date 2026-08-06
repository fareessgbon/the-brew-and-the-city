import { NextResponse } from 'next/server';
import { PORTAL_COOKIE_PREFIX } from '@/lib/portalSession';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const cafeId = typeof body?.cafeId === 'string' ? body.cafeId : '';
  const response = NextResponse.json({ success: true });
  if (cafeId) {
    response.cookies.set(`${PORTAL_COOKIE_PREFIX}${cafeId}`, '', { maxAge: 0, path: '/' });
  }
  return response;
}
