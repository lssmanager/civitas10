// Cache structure: { token: string, expiresAt: number }
let tokenCache = null;
const { loadCivitasAuthContract } = require("../../core/auth/contract-loader.cjs");
const CivitasAuthContract = loadCivitasAuthContract();

const normalizeLogtoEndpoint = (endpoint) => endpoint.replace(/\/+$/, "").replace(/\/oidc$/, "");
const getRequiredEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for Logto Management API access`);
  }
  return value;
};

function getLogtoManagementConfig() {
  const endpoint = normalizeLogtoEndpoint(CivitasAuthContract.logto.managementApi);
  return {
    tokenEndpoint: `${endpoint}/oidc/token`,
    clientId: getRequiredEnv("LOGTO_M2M_CLIENT_ID"),
    clientSecret: getRequiredEnv("LOGTO_M2M_CLIENT_SECRET"),
    resource: CivitasAuthContract.logto.managementApi,
  };
}

async function fetchLogtoManagementApiAccessToken() {
  // Return cached token if it exists and not expiring within 5 minutes
  if (tokenCache?.expiresAt && Date.now() < tokenCache.expiresAt - 5 * 60 * 1000) {
    return tokenCache.token;
  }

  const config = getLogtoManagementConfig();
  const response = await fetch(config.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      resource: config.resource,
      scope: 'all',
    }).toString(),
  });
  const tokenResponse = await response.json();
  // Store new token with expiration time
  tokenCache = {
    token: tokenResponse.access_token,
    expiresAt: Date.now() + (tokenResponse.expires_in * 1000), // Convert seconds to milliseconds
  };
  
  return tokenCache.token;
}

module.exports = {
  fetchLogtoManagementApiAccessToken
};
