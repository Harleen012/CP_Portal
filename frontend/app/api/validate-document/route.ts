import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const backendRes = await fetch('http://127.0.0.1:9002/validate-document', {
      method: 'POST',
      body: formData,
    });

    const backendJson = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(backendJson, { status: backendRes.status });
    }

    return NextResponse.json(backendJson);
  } catch (error: any) {
    return NextResponse.json(
      { detail: error.message || 'Validation proxy failed' },
      { status: 500 }
    );
  }
}