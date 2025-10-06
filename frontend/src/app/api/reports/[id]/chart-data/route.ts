import { NextResponse } from 'next/server';
import { getBackendUrl } from '@/utils/config';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization token is required' },
        { status: 401 }
      );
    }

    const response = await fetch(
      getBackendUrl(`reports/${params.id}/chart-data`),
      {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Backend error' }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Backend connection error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend' },
      { status: 503 }
    );
  }
}
