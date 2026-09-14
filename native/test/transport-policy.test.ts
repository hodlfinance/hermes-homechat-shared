import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createNativeR8Transport } from '../transport';
import { workspaceStatusTruthRequest } from '../core/status-truth';
import { permitsHodlNativeR8Request, isPreinstalledR8Suggestion } from '../policy';

test('native R8 preserves user work and rejects account/admin/default-task authority, including encoded escapes', () => {
  for (const [method, path] of [['POST', '/hermes/runs'], ['POST', '/hermes/runs/run_a/stop'], ['GET', '/hermes/runs/run_a/events'], ['GET', '/hermes/jobs'], ['DELETE', '/hermes/jobs/user_job'], ['POST', '/voice/transcriptions'], ['POST', '/voice/speech'], ['GET', '/workspace/model-options'], ['POST', '/workspace/chat-route-preference'], ['GET', '/plugins'], ['GET', '/workspace/hermes-dashboard-route'], ['GET', '/workspace/preview/8080/index.html'], ['POST', '/secure-secrets/requests/request_a/complete'], ['GET', '/tools/action-approvals'], ['POST', '/tools/action-approvals/23800000-0000-4000-8000-000000000001']] as const) {
    assert.equal(permitsHodlNativeR8Request(method, path), true, `${method} ${path}`);
  }
  for (const path of ['/auth/login', '/auth/logout', '/admin/accounts', '/ranked-tasks/automations', '/tasks/ranked', '/workspace/../admin/accounts', '/workspace/preview/8080/%2e%2e/admin', '/workspace/preview/8080/%252e%252e/admin', '/workspace/preview/8080/a%2fb', '//example.com/snapshot']) {
    assert.equal(permitsHodlNativeR8Request('GET', path), false, path);
    assert.equal(permitsHodlNativeR8Request('POST', path), false, path);
  }
  assert.equal(isPreinstalledR8Suggestion({ target: { capabilityId: 'tasks' } }), true);
  assert.equal(isPreinstalledR8Suggestion({ templateId: 'hey.ranked-tasks.email-scanner' }), true);
  assert.equal(isPreinstalledR8Suggestion({ id: 'user-job', name: 'Ranker', prompt: 'Scan my email' }), false);
  assert.equal(isPreinstalledR8Suggestion({ id: 'connect_email', target: { connectionId: 'email' } }), false);
  assert.equal(isPreinstalledR8Suggestion({ id: 'set_reminder_simple' }), false);
});

test('native Finance approval decisions return the exact reviewed payload and context', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const proposal = {
    approvalId: '23800000-0000-4000-8000-000000000001',
    actionId: '23800000-0000-4000-8000-000000000001',
    kind: 'finance_tool_action',
    family: 'hodl',
    tool: 'hodl_add_watchlist_item',
    payloadSha256: 'a'.repeat(64),
    approvalVersion: 1,
    canonicalRunId: 'run_a',
    canonicalConversationId: 'conversation_a',
    originSurface: 'finhermes',
    confirmationSurface: 'finhermes',
    channel: 'hodl_mobile',
    review: {
      version: 1,
      family: 'hodl',
      tool: 'hodl_add_watchlist_item',
      title: 'Add DOGE/USD?',
      summary: 'Hermes wants to update your watchlist.',
      fields: [{ key: 'market', label: 'Market', value: 'DOGE/USD' }],
    },
    expiresAt: '2026-09-14T00:15:00.000Z',
  };
  const transport = createNativeR8Transport({
    baseUrl: 'https://finhermes.test/api',
    identity: { surface: 'finhermes', channel: 'hodl_mobile', allowedSurfaces: ['finhermes'] },
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      const body = String(url).includes('/tools/action-approvals?')
        ? { status: 'ok', approvals: [proposal], recoveries: [] }
        : { status: 'ok' };
      return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
    },
  });

  const [approval] = await transport.listPendingFinanceActionApprovals({
    token: 'test-session',
    conversationSessionId: 'conversation_a',
  });
  await transport.confirmFinanceActionApproval({ token: 'test-session', approval });
  await transport.cancelFinanceActionApproval({ token: 'test-session', approval });

  assert.match(calls[0]!.url, /\/tools\/action-approvals\?conversationId=conversation_a&surface=finhermes$/);
  assert.deepEqual(JSON.parse(String(calls[1]!.init?.body)), {
    decision: 'confirm',
    expectedPayloadSha256: 'a'.repeat(64),
    context: {
      canonicalRunId: 'run_a',
      canonicalConversationId: 'conversation_a',
      originSurface: 'finhermes',
      confirmationSurface: 'finhermes',
      channel: 'hodl_mobile',
    },
  });
  assert.equal(JSON.parse(String(calls[2]!.init?.body)).decision, 'cancel');
});

test('the installed native client routes bootstrap, settings and canonical mutations through the host transport', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const transport = createNativeR8Transport({ baseUrl: 'https://finhermes.test/api', identity: { surface: 'finhermes', channel: 'hodl_mobile', allowedSurfaces: ['finhermes'] },
    fetch: async (url, init) => { calls.push({ url: String(url), init }); return new Response(JSON.stringify({ state: null, conversation: { id: 'conversation_a', visibility: 'full', allowedSurfaces: ['finhermes'], surfaceOrigin: 'finhermes', channelOrigin: 'hodl_mobile', title: 'A', role: 'chat', status: 'active', messageCount: 0 }, run: { id: 'run_a', conversationId: 'conversation_a', surface: 'hey_hermes', channel: 'hey_hermes_mobile' } }), { headers: { 'content-type': 'application/json' } }); },
  });
  const client = transport.createApiClient({ baseUrl: 'https://finhermes.test/api', token: 'test-session' });
  await client.startupSnapshot();
  await client.modelOptions();
  await client.transcribeVoiceNote({ audioBase64: 'YQ==', mimeType: 'audio/m4a' });
  await transport.guidedSetup('test-session');
  const canonical = transport.createCanonicalClient({ baseUrl: client.baseUrl, token: client.token, fetchImpl: globalThis.fetch });
  await canonical.createConversation({ title: 'A' });
  assert.deepEqual(JSON.parse(String(calls.at(-1)?.init?.body)), { title: 'A', allowedSurfaces: ['finhermes'], surface: 'finhermes', channel: 'hodl_mobile' });
  await assert.rejects(canonical.createRun({ message: 'hello', conversationSessionId: 'conversation_a', idempotencyKey: 'fdd837b7-9401-40e7-af87-9cb9d7c46c5f' }), /surface binding/);
  assert.equal(calls.length, 6);
  assert.ok(calls.every(call => call.url.startsWith('https://finhermes.test/api/')));
  assert.ok(calls.every(call => new Headers(call.init?.headers).get('authorization') === 'Bearer test-session'));
  await transport.reportLatency('test-session', 'run_a', { outcome: 'success' });
  assert.deepEqual(JSON.parse(String(calls.at(-1)?.init?.body)), { summary: { outcome: 'success' } });
  // A malformed status response can fail validation, but it must use the same
  // host transport rather than leaking to an ambient/global fetch.
  await workspaceStatusTruthRequest(client).catch(() => undefined);
  assert.match(calls.at(-1)!.url, /\/workspace\/status-truth/);
});

test('the native transport never passes browser-only same-origin credentials to the host fetch', async () => {
  const credentials: Array<RequestCredentials | null> = [];
  const strictNativeFetch: typeof fetch = async (_url, init = {}) => {
    credentials.push(init.credentials ?? null);
    if (init.credentials === 'same-origin') {
      throw new TypeError('Cannot cast same-origin to NativeRequestCredentials');
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' },
    });
  };
  const transport = createNativeR8Transport({
    baseUrl: 'https://heyhermes.test/api',
    identity: {
      surface: 'hey_hermes',
      channel: 'hey_hermes_mobile',
      allowedSurfaces: ['hey_hermes'],
    },
    fetch: strictNativeFetch,
  });

  await transport.createApiClient({
    baseUrl: 'https://heyhermes.test/api',
    token: 'test-session',
  }).logout();
  await transport.fetchStream('https://heyhermes.test/api/events', {
    credentials: 'include',
  });

  assert.deepEqual(credentials, ['omit', 'include']);
});
