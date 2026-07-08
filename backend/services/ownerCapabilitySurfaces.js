const { VALID_CAPABILITIES } = require('../connectors/adapters/contracts');

const OWNER_CAPABILITIES = Object.freeze([
  'crm',
  'marketing',
  'lms',
  'community',
  'payments',
  'notifications',
  'support',
  'analytics',
  'scheduling',
].filter((capability) => VALID_CAPABILITIES.includes(capability)));

const CAPABILITY_LABELS = Object.freeze({
  crm: 'CRM',
  marketing: 'Marketing',
  lms: 'LMS',
  community: 'Community',
  payments: 'Payments',
  notifications: 'Notifications',
  support: 'Support',
  analytics: 'Analytics',
  scheduling: 'Scheduling',
});

function labelForCapability(capability) {
  return CAPABILITY_LABELS[capability] || String(capability || '').replace(/(^|_)(\w)/g, (_match, sep, chr) => `${sep ? ' ' : ''}${chr.toUpperCase()}`);
}

const ADAPTER_LABELS = Object.freeze({ fluentcrm: 'FluentCRM', moodle: 'Moodle', buddyboss: 'BuddyBoss', wordpress: 'WordPress', stripe: 'Stripe' });

function labelForAdapter(adapter) {
  if (!adapter) return null;
  if (ADAPTER_LABELS[adapter]) return ADAPTER_LABELS[adapter];
  return String(adapter).split(/[-_]/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function normalizeHealthFromConnector(row, capability) {
  if (!row) {
    return {
      status: 'not_configured',
      lastCheckedAt: null,
      message: `No hay adapter configurado para la capacidad ${labelForCapability(capability)}.`,
    };
  }
  if (row.lastErrorJson) {
    const message = typeof row.lastErrorJson === 'string' ? row.lastErrorJson : row.lastErrorJson.message || row.lastErrorJson.error || 'El último health check del connector reportó un error.';
    return { status: 'unhealthy', lastCheckedAt: row.lastPingAt || null, message };
  }
  if (row.status === 'connected' || row.bindingStatus === 'active') return { status: 'healthy', lastCheckedAt: row.lastPingAt || null, message: null };
  if (row.bindingStatus || row.connectorStatus || row.adapterStatus) return { status: 'unknown', lastCheckedAt: row.lastPingAt || null, message: `Connector ${row.bindingStatus || row.connectorStatus || row.adapterStatus}.` };
  return { status: 'unknown', lastCheckedAt: null, message: null };
}

function runtimeRowsForCapability(rows = [], capability) {
  return rows.filter((row) => row && row.capability === capability);
}

function summarizeRuntimeRows(rows = [], capability) {
  if (!rows.length) return null;
  const summary = {};
  for (const row of rows) {
    const key = String(row.stateKey || '').split('.').slice(1).join('.') || row.stateKey;
    if (!key) continue;
    const camel = key.replace(/_([a-z])/g, (_match, chr) => chr.toUpperCase());
    summary[camel] = row.stateValue ?? null;
  }
  return {
    source: 'organization_runtime_state',
    summary,
    metadata: rows.reduce((acc, row) => ({ ...acc, ...(row.metadata && typeof row.metadata === 'object' ? row.metadata : {}) }), {}),
    status: rows.some((row) => row.status && row.status !== 'active') ? 'partial' : 'active',
  };
}

function legacyRuntimeStateFromProfile(profile, capability) {
  if (capability !== 'crm') return null;
  const crm = profile?.runtimeState?.crm;
  if (!crm?.companyId || !profile?.legacy?.customDataRuntimeStateFallback) return null;
  return {
    source: 'legacy_custom_data',
    legacy: true,
    summary: { companyId: crm.companyId },
    metadata: crm.provider ? { provider: crm.provider } : {},
    replacement: 'organization_runtime_state:crm.company_id',
  };
}

function runtimeStateForCapability({ capability, runtimeStateRows = [], profile = null } = {}) {
  return summarizeRuntimeRows(runtimeRowsForCapability(runtimeStateRows, capability), capability) || legacyRuntimeStateFromProfile(profile, capability);
}

function blockerForUnconfigured(capability) {
  return {
    code: 'connector_not_configured',
    severity: 'info',
    message: `La capacidad ${labelForCapability(capability)} todavía no tiene un connector activo para esta organización.`,
    scope: 'organization',
    capability,
  };
}

function actionForUnconfigured(capability) {
  return { type: 'configure_connector', label: `Configurar connector ${labelForCapability(capability)}`, target: { capability } };
}

function buildOwnerCapabilityState({ capability, connectorRows = [], runtimeStateRows = [], profile = null } = {}) {
  const row = connectorRows.find((item) => item && item.capability === capability && !item.conflict) || null;
  const conflict = connectorRows.find((item) => item && item.capability === capability && item.conflict);
  const configured = Boolean(row) && !conflict;
  const health = conflict
    ? { status: 'unhealthy', lastCheckedAt: null, message: 'Hay múltiples bindings activos para esta capacidad; resolver conflicto antes de operar.' }
    : normalizeHealthFromConnector(row, capability);
  const blockers = [];
  const nextActions = [];
  if (conflict) {
    blockers.push({ code: 'connector_binding_conflict', severity: 'critical', message: 'Existe más de un binding activo para esta organización y capacidad.', scope: 'organization', capability });
    nextActions.push({ type: 'reconcile_runtime_state', label: `Resolver bindings duplicados de ${labelForCapability(capability)}`, target: { capability } });
  } else if (!configured) {
    blockers.push(blockerForUnconfigured(capability));
    nextActions.push(actionForUnconfigured(capability));
  } else if (health.status === 'unhealthy') {
    blockers.push({ code: 'connector_health_unhealthy', severity: 'warning', message: health.message || 'El connector reporta error operacional.', scope: 'organization', capability });
    nextActions.push({ type: 'retry_health_check', label: `Reintentar health check ${labelForCapability(capability)}`, target: { capability } });
  }
  return {
    capability,
    label: labelForCapability(capability),
    configured,
    adapter: configured ? { key: row.adapter, label: labelForAdapter(row.adapter), status: row.adapterStatus || row.connectorStatus || 'active' } : null,
    health,
    runtimeState: runtimeStateForCapability({ capability, runtimeStateRows, profile }),
    blockers,
    nextActions,
  };
}

function buildOwnerCapabilities({ connectorRows = [], runtimeStateRows = [], profile = null, capabilities = OWNER_CAPABILITIES } = {}) {
  return capabilities.map((capability) => buildOwnerCapabilityState({ capability, connectorRows, runtimeStateRows, profile }));
}

function buildOwnerRegistryPayload(rows = [], { capabilities = OWNER_CAPABILITIES } = {}) {
  const grouped = new Map(capabilities.map((capability) => [capability, { capability, label: labelForCapability(capability), availableAdapters: [] }]));
  for (const row of rows || []) {
    if (!row?.capability || !grouped.has(row.capability) || !row.adapter) continue;
    const item = grouped.get(row.capability);
    if (item.availableAdapters.some((adapter) => adapter.key === row.adapter)) continue;
    item.availableAdapters.push({
      key: row.adapter,
      label: labelForAdapter(row.adapter),
      status: row.adapterStatus || 'available',
      healthSupported: true,
      configurationRequired: true,
    });
  }
  return { capabilities: Array.from(grouped.values()) };
}

function buildOwnerOperationalStateResponse({ baseResponse = {}, organization = {}, connectorRows = [], runtimeStateRows = [], profile = null } = {}) {
  const capabilities = buildOwnerCapabilities({ connectorRows, runtimeStateRows, profile });
  return {
    contractVersion: '2026-07-civitas10-owner-capability-surfaces-v1',
    generatedAt: baseResponse.generatedAt || new Date().toISOString(),
    organization: {
      logtoOrganizationId: organization.logtoOrganizationId || profile?.logtoOrganizationId || baseResponse.organization?.logtoOrganizationId || null,
      name: organization.name || profile?.nameCache || baseResponse.organization?.name || null,
      status: organization.status || 'active',
    },
    summary: baseResponse.summary || null,
    capabilities,
    blockers: capabilities.flatMap((item) => item.blockers),
    nextActions: capabilities.flatMap((item) => item.nextActions),
    worker: baseResponse.worker || null,
    polling: baseResponse.polling || null,
    latestEventIds: baseResponse.latestEventIds || {},
    legacy: {
      deprecated: true,
      providerBlocks: {
        ...(baseResponse.fluentcrm ? { fluentcrm: baseResponse.fluentcrm } : {}),
        ...(baseResponse.wordpress ? { wordpress: baseResponse.wordpress } : {}),
      },
      replacement: 'capabilities[]',
    },
  };
}

function ownerQueueSignal({ queueName, classification }) {
  const healthy = classification === 'alive';
  return {
    code: healthy ? 'worker_queue_healthy' : 'worker_queue_degraded',
    severity: healthy ? 'success' : classification === 'stuck_in_queue' ? 'critical' : 'warning',
    message: healthy ? 'La cola está operativa.' : 'La cola de sincronización está retrasada o requiere revisión.',
    impact: healthy ? 'Las operaciones pueden procesarse normalmente.' : 'Las actualizaciones de conectores pueden tardar más en reflejarse.',
    nextAction: healthy ? { type: 'none', label: 'Sin acción requerida', target: { queue: queueName } } : { type: 'inspect_queue', label: 'Revisar cola de sincronización', target: { queue: queueName } },
  };
}

module.exports = {
  OWNER_CAPABILITIES,
  buildOwnerCapabilities,
  buildOwnerCapabilityState,
  buildOwnerOperationalStateResponse,
  buildOwnerRegistryPayload,
  labelForAdapter,
  labelForCapability,
  ownerQueueSignal,
};
