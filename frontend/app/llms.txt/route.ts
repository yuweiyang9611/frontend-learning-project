export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  return new Response(
    [
      '# IssueFlow',
      '',
      '> A production-shaped issue tracker used by a 91-day frontend curriculum.',
      '',
      `- [Open the learning application](${origin}/login)`,
      `- [Check service health](${origin}/api/health)`,
      '',
    ].join('\n'),
    {
      headers: {
        'Cache-Control': 'public, max-age=3600',
        'Content-Type': 'text/markdown; charset=utf-8',
      },
    },
  );
}
