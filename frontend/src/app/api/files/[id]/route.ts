import { NextResponse } from 'next/server';
import { getBackendUrl } from '@/utils/config';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    
    const response = await fetch(getBackendUrl(`files/${params.id}`), {
      method: 'DELETE',
      headers: {
        ...(authHeader && { 'Authorization': authHeader }),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Backend error' }));
      return NextResponse.json(error, { status: response.status });
    }

    if (response.status === 204) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const data = await response.json().catch(() => ({ success: true }));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Backend connection error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 503 }
    );
  }
}
