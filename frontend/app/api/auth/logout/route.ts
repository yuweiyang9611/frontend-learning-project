import { destroyLocalSession } from '@/src/server/auth';

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return new Response(null, { status: 403 });
  return new Response(null, {
    status: 204,
    headers: { 'Set-Cookie': await destroyLocalSession(request), 'Clear-Site-Data': '"cache"' },
  });
}
