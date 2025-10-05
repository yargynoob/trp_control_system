import { NextRequest } from 'next/server';

export function getAuthHeaders(request: NextRequest): HeadersInit {
  let token = request.headers.get('authorization');
  
  if (!token) {
    token = request.cookies.get('token')?.value || null;
  }
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }
  
  return headers;
}
