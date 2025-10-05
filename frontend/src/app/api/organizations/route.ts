import { NextResponse, NextRequest } from 'next/server';
import { getBackendUrl } from '@/utils/config';
import { getAuthHeaders } from '@/utils/serverAuth';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(getBackendUrl('organizations'), {
      method: 'GET',
      headers: getAuthHeaders(request),
      cache: 'no-store',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Backend error' }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Backend connection error:', error);
    return NextResponse.json(
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(getBackendUrl('organizations'), {
      method: 'POST',
      headers: getAuthHeaders(request),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Backend error' }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Backend connection error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend' },
      { status: 503 }
    );
  }
}
