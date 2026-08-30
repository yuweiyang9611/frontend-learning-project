export const dynamic = 'force-dynamic';

export function GET() {
  return new Response('User-agent: *\nAllow: /\n', {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
