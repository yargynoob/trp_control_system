import { NextResponse } from 'next/server';
import { getBackendUrl } from '@/utils/config';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const response = await fetch(getBackendUrl('files/upload'), {
      method: 'POST',
      body: formData,
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
