import { authenticatedSession, createLocalSession, isLocalRequest } from '@/src/server/auth';
import { problem } from '@/src/server/problem';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin)
    return problem(403, 'Cross-site request rejected', 'Sign-in must start from IssueFlow.');
  const platformSession = await authenticatedSession(request);
  if (platformSession) return Response.json(platformSession, { headers: { 'Cache-Control': 'no-store' } });
  if (!isLocalRequest(request))
    return problem(401, 'Platform sign-in required', 'Open IssueFlow through its private Sites URL to sign in.');

  let payload: { email?: unknown; password?: unknown };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return problem(400, 'Invalid request', 'Send an email and password as JSON.');
  }
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const password = typeof payload.password === 'string' ? payload.password : '';
  if (email !== 'demo@issueflow.dev' || password !== 'issueflow') {
    return problem(401, 'Invalid credentials', 'Use the demo credentials shown on the sign-in page.');
  }
  const created = await createLocalSession(request, email, 'Jordan Davis');
  return Response.json(created.session, {
    headers: { 'Set-Cookie': created.cookie, 'Cache-Control': 'no-store' },
  });
}
