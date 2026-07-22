#!/usr/bin/env node
import crypto from 'node:crypto';
import net from 'node:net';

export const PROBE_VERSION = '2026-07-issue-154-phase-0-v1';
export const DEFAULT_MAX_RESPONSE_BYTES = 128 * 1024;
export const DEFAULT_TIMEOUT_MS = 5000;
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const SENSITIVE_KEY_PATTERN = /(authorization|password|secret|token|credential|cookie|client[_-]?secret|api[_-]?key|email|phone|name|subject|groups?)/i;

export class ProbePolicyError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ProbePolicyError';
    this.details = details;
  }
}

export function sha256(value) {
  if (!value) return null;
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

export function detectCredentialState(env = process.env) {
  return Object.freeze({
    credentialsPresent: Boolean((env.LOGTO_M2M_CLIENT_ID || env.LOGTO_M2M_APP_ID) && (env.LOGTO_M2M_CLIENT_SECRET || env.LOGTO_M2M_APP_SECRET)),
    credentialSource: (env.LOGTO_M2M_CLIENT_ID || env.LOGTO_M2M_APP_ID || env.LOGTO_M2M_CLIENT_SECRET || env.LOGTO_M2M_APP_SECRET) ? 'environment' : 'absent',
    managementAudiencePresent: Boolean(env.LOGTO_MANAGEMENT_API_RESOURCE),
    endpointConfigured: Boolean(env.LOGTO_ENDPOINT || env.LOGTO_ISSUER || env.VITE_LOGTO_ENDPOINT),
    remoteReadExplicitlyEnabled: env.LOGTO_IDENTITY_DISCOVERY_ALLOW_REMOTE_READ === 'true',
  });
}

export function assertPublicHost(host) {
  const candidate = String(host || '').split(':')[0];
  const ipVersion = net.isIP(candidate);
  if (!ipVersion) return true;
  if (candidate === '127.0.0.1' || candidate === '0.0.0.0' || candidate.startsWith('10.') || candidate.startsWith('192.168.') || /^172\.(1[6-9]|2\d|3[0-1])\./.test(candidate) || candidate.startsWith('169.254.') || candidate === '::1' || candidate.startsWith('fc') || candidate.startsWith('fd') || candidate.startsWith('fe80:')) throw new ProbePolicyError('private or loopback host blocked before network', { hostHash: sha256(candidate) });
  return true;
}

export function buildPolicy({ endpoint, tokenPath = '/oidc/token', allowedPaths = [], allowedHosts = [], allowedQueryKeys = [], maxResponseBytes = DEFAULT_MAX_RESPONSE_BYTES } = {}) {
  const endpointUrl = endpoint ? new URL(endpoint) : null;
  const endpointHost = endpointUrl?.host || null;
  for (const host of [endpointHost, ...allowedHosts].filter(Boolean)) assertPublicHost(host);
  const hosts = new Set([endpointHost, ...allowedHosts].filter(Boolean));
  const normalizedPaths = new Set(allowedPaths.map((path) => normalizePath(path)));
  normalizedPaths.add(normalizePath(tokenPath));
  return Object.freeze({ endpoint: endpointUrl?.origin || null, endpointHost, tokenPath: normalizePath(tokenPath), allowedHosts: [...hosts], allowedPaths: [...normalizedPaths], allowedQueryKeys: [...allowedQueryKeys].sort(), maxResponseBytes });
}

export function normalizePath(path) {
  if (!path || typeof path !== 'string') return '/';
  return path.startsWith('/') ? path.split('?')[0] || '/' : `/${path.split('?')[0]}`;
}

export function assertRequestAllowed({ method, url, policy, isTokenRequest = false }) {
  const upper = String(method || 'GET').toUpperCase();
  const parsed = new URL(url, policy.endpoint || 'https://logto.invalid');
  const path = normalizePath(parsed.pathname);
  if (!policy.allowedHosts.includes(parsed.host)) throw new ProbePolicyError('unknown host blocked before network', { hostHash: sha256(parsed.host), method: upper, path });
  assertPublicHost(parsed.hostname);
  if (!policy.allowedPaths.includes(path)) throw new ProbePolicyError('unknown path blocked before network', { method: upper, path });
  for (const key of parsed.searchParams.keys()) if (!policy.allowedQueryKeys.includes(key)) throw new ProbePolicyError('unknown query parameter blocked before network', { method: upper, path, key });
  if (isTokenRequest) {
    if (upper !== 'POST' || path !== policy.tokenPath) throw new ProbePolicyError('only exact token endpoint may use POST', { method: upper, path });
    return true;
  }
  if (!SAFE_METHODS.has(upper)) throw new ProbePolicyError('unsafe management method blocked before network', { method: upper, path });
  return true;
}

export async function guardedFetch(url, { method = 'GET', policy, isTokenRequest = false, transport = fetch, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  assertRequestAllowed({ method, url, policy, isTokenRequest });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await transport(url, { method, redirect: 'manual', signal: controller.signal });
    const location = response.headers?.get?.('location');
    if (location) {
      const redirect = new URL(location, url);
      if (!policy.allowedHosts.includes(redirect.host)) throw new ProbePolicyError('redirect to unknown host blocked', { hostHash: sha256(redirect.host) });
    }
    const text = await readBoundedResponseText(response, policy.maxResponseBytes);
    return { status: response.status, ok: response.ok, headers: redactHeaders(response.headers), bodyShape: summarizeShape(safeParseJson(text)) };
  } finally {
    clearTimeout(timeout);
  }
}

export async function readBoundedResponseText(response, maxResponseBytes) {
  if (response.body?.getReader) {
    const reader = response.body.getReader();
    const chunks = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = Buffer.from(value);
      total += chunk.byteLength;
      if (total > maxResponseBytes) { await reader.cancel?.(); throw new ProbePolicyError('response above size limit blocked during streaming', { maxResponseBytes }); }
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf8');
  }
  const text = await response.text?.() ?? '';
  if (Buffer.byteLength(text, 'utf8') > maxResponseBytes) throw new ProbePolicyError('response above size limit blocked', { maxResponseBytes });
  return text;
}

export function safeParseJson(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch { return { nonJson: true, length: text.length }; }
}

export function summarizeShape(value, depth = 0) {
  if (value == null) return { type: value === null ? 'null' : 'undefined' };
  if (depth > 4) return { type: 'max_depth' };
  if (Array.isArray(value)) return { type: 'array', length: value.length, itemShape: value.length ? summarizeShape(value[0], depth + 1) : null };
  if (typeof value === 'object') {
    return { type: 'object', keys: Object.keys(value).sort(), fields: Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, SENSITIVE_KEY_PATTERN.test(key) ? { type: 'redacted', hash: sha256(JSON.stringify(entry)) } : summarizeShape(entry, depth + 1)])) };
  }
  return { type: typeof value };
}

export function redactHeaders(headers) {
  if (!headers?.entries) return {};
  return Object.fromEntries([...headers.entries()].map(([key, value]) => [key, SENSITIVE_KEY_PATTERN.test(key) ? '[redacted]' : String(value).slice(0, 120)]));
}

export const DISCOVERY_ENDPOINTS = Object.freeze([
  '/api/.well-known/sign-in-exp',
  '/api/organizations',
  '/api/organization-roles',
  '/api/sso-connectors',
  '/api/connectors',
  '/api/users',
  '/api/hooks',
  '/api/resources',
]);

export async function runStaticDiscovery({ env = process.env } = {}) {
  const credentialState = detectCredentialState(env);
  return { probeVersion: PROBE_VERSION, remoteState: 'verification_required', remoteObservationPerformed: false, credentialState, plannedReadOnlyEndpoints: DISCOVERY_ENDPOINTS.map((path) => ({ method: 'GET', path })) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await runStaticDiscovery();
  console.log(JSON.stringify(result, null, 2));
}
