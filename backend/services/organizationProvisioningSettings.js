const APP_BASE_DOMAINS = Object.freeze(["didaxus.com", "socialstudies.cloud", "learnsocialstudies.com"]);
const APP_SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const DOMAIN_PATTERN = /^(?=.{1,253}$)(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/;

const emptyToNull = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const normalizeDomain = (value) =>
  emptyToNull(value)
    ?.toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "") || null;

const normalizeAppSubdomain = (value) => emptyToNull(value)?.toLowerCase() || null;
const normalizeAppBaseDomain = (value) => emptyToNull(value)?.toLowerCase() || null;

const buildEntryUrl = (appSubdomain, appBaseDomain) =>
  `https://${appSubdomain}.${appBaseDomain}`;

const buildOidcRedirectUri = (appSubdomain, appBaseDomain) =>
  `${buildEntryUrl(appSubdomain, appBaseDomain)}/callback`;

function normalizeProvisioningSettings(body = {}) {
  const appSubdomain = normalizeAppSubdomain(body.appSubdomain ?? body.subdomain);
  const appBaseDomain = normalizeAppBaseDomain(body.appBaseDomain);
  const adminDomain = normalizeDomain(body.adminDomain ?? body.institutionalProvisioningDomain);
  const errors = [];

  if (!appSubdomain) {
    errors.push({ field: "appSubdomain", message: "Application subdomain is required" });
  } else if (!APP_SUBDOMAIN_PATTERN.test(appSubdomain)) {
    errors.push({ field: "appSubdomain", message: "Application subdomain must be a single DNS label using lowercase letters, numbers and hyphens" });
  }

  if (!appBaseDomain) {
    errors.push({ field: "appBaseDomain", message: "Application base domain is required" });
  } else if (!APP_BASE_DOMAINS.includes(appBaseDomain)) {
    errors.push({ field: "appBaseDomain", message: `Application base domain must be one of: ${APP_BASE_DOMAINS.join(", ")}` });
  }

  if (!adminDomain) {
    errors.push({ field: "adminDomain", message: "Institutional provisioning domain is required" });
  } else if (!DOMAIN_PATTERN.test(adminDomain)) {
    errors.push({ field: "adminDomain", message: "Institutional provisioning domain must be a valid hostname such as colegio.edu.co" });
  }

  return {
    errors,
    value: {
      appSubdomain,
      appBaseDomain,
      adminDomain,
      entryUrl:
        appSubdomain && appBaseDomain
          ? buildEntryUrl(appSubdomain, appBaseDomain)
          : null,
      oidcRedirectUri:
        appSubdomain && appBaseDomain
          ? buildOidcRedirectUri(appSubdomain, appBaseDomain)
          : null,
    },
  };
}

module.exports = {
  APP_BASE_DOMAINS,
  buildEntryUrl,
  buildOidcRedirectUri,
  normalizeProvisioningSettings,
};