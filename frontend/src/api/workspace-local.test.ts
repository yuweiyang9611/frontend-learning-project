import { it, expect, vi, afterEach } from 'vitest';
afterEach(() => vi.unstubAllEnvs());
it('local settings survive re-login and do not overwrite another account', async () => {
  vi.stubEnv('NEXT_PUBLIC_DEMO_MODE', 'local');
  vi.resetModules();
  const { issueflowApi } = await import('./issueflowApi');
  await expect(issueflowApi.getSettings()).rejects.toMatchObject({ status: 401 });
  await issueflowApi.login('demo@issueflow.dev', 'issueflow');
  expect((await issueflowApi.getOverview()).total).toBeGreaterThan(0);
  await issueflowApi.updateProfile('Demo Updated');
  await issueflowApi.savePreferences({ assigned: false, mentions: false, digest: true });
  expect((await issueflowApi.getSettings()).session.displayName).toBe('Demo Updated');
  expect((await issueflowApi.getMembers())[0].displayName).toBe('Demo Updated');
  await issueflowApi.logout();
  await issueflowApi.login('alice@example.com', 'password');
  expect((await issueflowApi.getSettings()).notifications.digest).toBe(false);
  await issueflowApi.updateProfile('Alice');
  expect((await issueflowApi.getSettings()).session.displayName).toBe('Alice');
  await issueflowApi.logout();
  expect((await issueflowApi.login('demo@issueflow.dev', 'issueflow')).displayName).toBe('Demo Updated');
  expect((await issueflowApi.getSettings()).notifications.digest).toBe(true);
  await expect(issueflowApi.updateProfile(' ')).rejects.toThrow();
  await expect(
    issueflowApi.savePreferences({ assigned: 'yes', mentions: true, digest: false } as never),
  ).rejects.toThrow();
});
it('corrupt local settings do not erase product data', async () => {
  vi.stubEnv('NEXT_PUBLIC_DEMO_MODE', 'local');
  vi.resetModules();
  const { issueflowApi } = await import('./issueflowApi');
  await issueflowApi.login('demo@issueflow.dev', 'issueflow');
  const original = (await issueflowApi.getOverview()).total;
  localStorage.setItem('issueflow-settings:demo@issueflow.dev', '{broken');
  expect((await issueflowApi.getSettings()).notifications.assigned).toBe(true);
  expect((await issueflowApi.getOverview()).total).toBe(original);
  localStorage.setItem('issueflow-settings:demo@issueflow.dev', '{}');
  expect((await issueflowApi.getSettings()).notifications.digest).toBe(false);
});
