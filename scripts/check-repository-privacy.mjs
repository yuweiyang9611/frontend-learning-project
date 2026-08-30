import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const allowlist = JSON.parse(await readFile(new URL('./public-content-allowlist.json', import.meta.url), 'utf8'));
const allowedEmails = new Set(allowlist.emails.map((value) => value.toLowerCase()));
const findings = [];
const emailPattern = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const pathPattern = /(?:[A-Za-z]:\\Users\\|\/Users\/|\/home\/)[^\s"'<>]+/g;
const secretPattern = /(?:github_pat_|ghp_|sk-(?:proj-)?|AKIA)[A-Za-z0-9_-]{16,}/g;

function git(args, options = {}) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', ...options });
}

function redact(value) {
  if (value.includes('@')) {
    const [name, domain] = value.split('@');
    return (name.slice(0, 2) || '**') + '***@' + domain;
  }
  return value.slice(0, 6) + '…' + value.slice(-4);
}

function scan(source, text) {
  for (const email of text.match(emailPattern) ?? []) {
    if (!allowedEmails.has(email.toLowerCase()) && !allowlist.commitEmailSuffixes.some((suffix) => email.endsWith(suffix))) {
      findings.push({ rule: 'email', source, value: redact(email) });
    }
  }
  for (const value of text.match(pathPattern) ?? []) findings.push({ rule: 'absolute-user-path', source, value: redact(value) });
  for (const value of text.match(secretPattern) ?? []) findings.push({ rule: 'credential-pattern', source, value: redact(value) });
}

const repositoryFiles = new Set(
  [
    ...git(['ls-files', '-z']).split('\0'),
    ...git(['ls-files', '--others', '--exclude-standard', '-z']).split('\0'),
  ].filter(Boolean),
);
for (const relative of repositoryFiles) {
  const absolute = path.join(root, relative);
  const buffer = await readFile(absolute);
  if (buffer.includes(0)) continue;
  scan(relative, buffer.toString('utf8'));
}

scan('git-authors', git(['log', '--all', '--format=%ae%n%ce']));
scan('git-commit-messages', git(['log', '--all', '--format=%B%x00']));
scan('git-tag-messages', git(['for-each-ref', 'refs/tags', '--format=%(contents)%00']));
scan(
  'git-history',
  git(['log', '--all', '--root', '-p', '--format='], {
    maxBuffer: 50 * 1024 * 1024,
  }),
);

const unique = [...new Map(findings.map((item) => [item.rule + ':' + item.source + ':' + item.value, item])).values()];
if (unique.length) {
  for (const item of unique) console.error('PRIVACY', item.rule, item.source, item.value);
  throw new Error('Repository privacy check found ' + unique.length + ' unapproved value(s).');
}
console.log('Repository privacy: current files, history, authors, commits, and tags contain only approved demo values.');
