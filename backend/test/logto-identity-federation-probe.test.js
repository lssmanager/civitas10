const test = require('node:test');
const assert = require('node:assert/strict');

async function loadProbe() {
  return import('../../scripts/discovery/logto-identity-federation-probe.mjs');
}

function policy(mod) {
  return mod.buildPolicy({ endpoint: 'https://auth.didaxus.com', allowedPaths: ['/api/users'], maxResponseBytes: 16 });
}

test('probe rejects unsafe management methods before transport', async () => {
  const mod = await loadProbe();
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    let called = false;
    await assert.rejects(() => mod.guardedFetch('https://auth.didaxus.com/api/users', { method, policy: policy(mod), transport: async () => { called = true; } }), /blocked before network/);
    assert.equal(called, false);
  }
});

test('probe allows POST only for the exact token endpoint', async () => {
  const mod = await loadProbe();
  const p = policy(mod);
  assert.equal(mod.assertRequestAllowed({ method: 'POST', url: 'https://auth.didaxus.com/oidc/token', policy: p, isTokenRequest: true }), true);
  assert.throws(() => mod.assertRequestAllowed({ method: 'POST', url: 'https://auth.didaxus.com/api/users', policy: p, isTokenRequest: true }), /only exact token endpoint/);
});

test('probe rejects unknown host and unknown path before transport', async () => {
  const mod = await loadProbe();
  for (const url of ['https://evil.example/api/users', 'https://auth.didaxus.com/api/unknown']) {
    let called = false;
    await assert.rejects(() => mod.guardedFetch(url, { method: 'GET', policy: policy(mod), transport: async () => { called = true; } }), /unknown (host|path)/);
    assert.equal(called, false);
  }
});

test('probe rejects redirect to unknown host', async () => {
  const mod = await loadProbe();
  const response = { status: 302, ok: false, headers: new Map([['location', 'https://evil.example/callback']]), text: async () => '' };
  await assert.rejects(() => mod.guardedFetch('https://auth.didaxus.com/api/users', { method: 'GET', policy: policy(mod), transport: async () => response }), /redirect to unknown host/);
});

test('probe rejects response above size limit', async () => {
  const mod = await loadProbe();
  const response = { status: 200, ok: true, headers: new Map(), text: async () => 'x'.repeat(32) };
  await assert.rejects(() => mod.guardedFetch('https://auth.didaxus.com/api/users', { method: 'GET', policy: policy(mod), transport: async () => response }), /response above size limit/);
});

test('probe blocks private IP hosts and unexpected query parameters before transport', async () => {
  const mod = await loadProbe();
  assert.throws(() => mod.buildPolicy({ endpoint: 'https://127.0.0.1', allowedPaths: ['/api/users'] }), /private or loopback/);
  let called = false;
  await assert.rejects(() => mod.guardedFetch('https://auth.didaxus.com/api/users?unsafe=true', { method: 'GET', policy: policy(mod), transport: async () => { called = true; } }), /unknown query parameter/);
  assert.equal(called, false);
});

test('probe enforces response size while streaming', async () => {
  const mod = await loadProbe();
  const encoder = new TextEncoder();
  const response = { status: 200, ok: true, headers: new Map(), body: new ReadableStream({ start(controller) { controller.enqueue(encoder.encode('0123456789')); controller.enqueue(encoder.encode('overflow')); controller.close(); } }) };
  await assert.rejects(() => mod.guardedFetch('https://auth.didaxus.com/api/users', { method: 'GET', policy: policy(mod), transport: async () => response }), /during streaming/);
});
