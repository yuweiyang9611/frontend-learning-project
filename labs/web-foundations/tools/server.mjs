import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const labRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspaceRoot = path.resolve(labRoot, '..', '..', 'learning-work');
const fixturePath = path.join(labRoot, 'fixtures', 'issues.json');
const port = Number(process.env.LEARNING_PORT || 4174);
const types = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
]);

function json(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(body));
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', 'http://127.0.0.1:' + port);
  if (url.pathname === '/api/issues') {
    const delay = Math.min(2000, Math.max(0, Number(url.searchParams.get('delay')) || 0));
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    return json(response, 200, JSON.parse(await readFile(fixturePath, 'utf8')));
  }
  if (url.pathname === '/api/fail') return json(response, 500, { title: 'Fixture failure', status: 500 });
  if (url.pathname.startsWith('/api/')) return json(response, 404, { title: 'Fixture route not found', status: 404 });

  const requested = url.pathname === '/' ? '/day-22/index.html' : url.pathname;
  const resolved = path.resolve(workspaceRoot, '.' + requested);
  if (!resolved.startsWith(workspaceRoot + path.sep)) return json(response, 403, { title: 'Forbidden', status: 403 });
  try {
    const body = await readFile(resolved);
    response.writeHead(200, { 'Content-Type': types.get(path.extname(resolved)) || 'application/octet-stream' });
    response.end(body);
  } catch {
    json(response, 404, { title: 'Create the workspace first', detail: 'Run npm run learn:create -- --day 22.' });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log('Learning fixture: http://127.0.0.1:' + port);
  console.log('The server is bound to this computer only. Press Ctrl+C to stop.');
});
