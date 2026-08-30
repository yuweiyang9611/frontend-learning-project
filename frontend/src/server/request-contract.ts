import type { Decoder } from '@/src/features/issues/runtime-contracts';
import { problem } from './problem';

export type RequestBodyResult<T> = { ok: true; value: T } | { ok: false; response: Response };

export async function readJsonBody<T>(request: Request, decoder: Decoder<T>): Promise<RequestBodyResult<T>> {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';
  if (!contentType.includes('application/json')) {
    return {
      ok: false,
      response: problem(400, 'Invalid request', 'Send the request with Content-Type: application/json.'),
    };
  }

  let value: unknown;
  try {
    value = await request.json();
  } catch {
    return { ok: false, response: problem(400, 'Invalid request', 'Send a valid JSON payload.') };
  }

  const decoded = decoder(value);
  return decoded.ok
    ? { ok: true, value: decoded.value }
    : {
        ok: false,
        response: problem(400, 'Validation failed', 'The JSON payload does not match the issue contract.', decoded.errors),
      };
}
