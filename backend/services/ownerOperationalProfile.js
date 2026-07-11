function getLogtoOrganizationId(organization = {}) { return organization.id || organization.organizationId || organization.logtoOrganizationId || null; }
function getLogtoOrganizationName(organization = {}) { return organization.name || organization.nameCache || null; }
function getLogtoOrganizationCustomData(organization = {}) {
  const customData = organization.customData || organization.custom_data || {};
  return customData && typeof customData === "object" && !Array.isArray(customData) ? customData : {};
}

function runtimeStateMap(rows = []) {
  return rows.reduce((acc, row) => {
    if (!row || !row.capability || !row.stateKey) return acc;
    acc[`${row.capability}:${row.stateKey}`] = row;
    return acc;
  }, {});
}

function runtimeRowToProfileValue(row) {
  if (!row) return null;
  return {
    value: row.stateValue ?? null,
    source: row.source || "organization_runtime_state",
    provider: row.metadata?.provider || null,
    stateKey: row.stateKey,
    status: row.status || "active",
    legacyFallback: false,
  };
}

function deriveLegacyCrmCompany(customData = {}) {
  const civitasProfile = customData.civitasProfile && typeof customData.civitasProfile === "object" ? customData.civitasProfile : {};
  const downstream = civitasProfile.downstream && typeof civitasProfile.downstream === "object" ? civitasProfile.downstream : {};
  const crm = downstream.crm && typeof downstream.crm === "object" ? downstream.crm : {};
  const value = crm.companyId || crm.company_id || downstream.fluentcrmCompanyId || customData.fluentcrmCompanyId || null;
  if (!value) return null;
  return {
    value,
    source: "legacy_logto_custom_data_fallback",
    provider: crm.provider || "fluentcrm",
    stateKey: "crm.company_id",
    status: "linked",
    legacyFallback: true,
  };
}

function deriveOperationalProfile(organization = {}, { runtimeStateRows = [] } = {}) {
  const customData = getLogtoOrganizationCustomData(organization);
  const mainContactOfCivitas = customData.mainContactOfCivitas && typeof customData.mainContactOfCivitas === "object" ? customData.mainContactOfCivitas : {};
  const civitasProfile = customData.civitasProfile && typeof customData.civitasProfile === "object" ? customData.civitasProfile : mainContactOfCivitas;
  const business = civitasProfile.business && typeof civitasProfile.business === "object" ? civitasProfile.business : {};
  const state = runtimeStateMap(runtimeStateRows);
  const crmCompany = runtimeRowToProfileValue(state["crm:crm.company_id"]) || deriveLegacyCrmCompany(customData);
  const customDataRuntimeStateFallback = Boolean(crmCompany?.legacyFallback);
  return {
    id: getLogtoOrganizationId(organization),
    logtoOrganizationId: getLogtoOrganizationId(organization),
    nameCache: getLogtoOrganizationName(organization),
    slug: business.slug || null,
    updatedAt: civitasProfile.updatedAt || organization.updatedAt || organization.createdAt || new Date().toISOString(),
    fluentcrmCompanyId: crmCompany?.value || null,
    fluentcrmSyncStatus: crmCompany?.value ? "linked" : "not_linked",
    runtimeState: {
      crm: {
        companyId: crmCompany?.value || null,
        source: crmCompany?.source || "organization_runtime_state",
        provider: crmCompany?.provider || null,
        stateKey: crmCompany?.stateKey || "crm.company_id",
        status: crmCompany?.status || (crmCompany?.value ? "linked" : "not_linked"),
      },
    },
    legacy: { customDataRuntimeStateFallback },
    settings: { mainContactOfCivitas: civitasProfile },
  };
}

function buildOperationalOrganization(organization, profile) {
  return {
    logtoOrganizationId: profile?.logtoOrganizationId || getLogtoOrganizationId(organization),
    name: profile?.nameCache || getLogtoOrganizationName(organization),
    profileId: profile?.id || null,
    sourceAnchors: { logtoOrganizationId: profile?.logtoOrganizationId || getLogtoOrganizationId(organization) },
  };
}

module.exports = { buildOperationalOrganization, deriveOperationalProfile, getLogtoOrganizationCustomData, getLogtoOrganizationId, getLogtoOrganizationName };
