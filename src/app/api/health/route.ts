import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'maimang-readbox',
    timestamp: new Date().toISOString(),
  });
}