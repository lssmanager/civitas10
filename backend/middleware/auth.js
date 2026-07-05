const { createRemoteJWKSet, jwtVerify, errors: joseErrors } = require("jose");
const { withTimeout } = require("../services/timeouts");
const { validateDeploymentConfig } = require("../../core/deployment/deployment-kernel.cjs");
const deploymentConfig = validateDeploymentConfig({ service: "backend" });

const ORGANIZATION_AUDIENCE_PREFIX = deploymentConfig.contract.organizationAudiencePrefix || deploymentConfig.contract.logto?.organizationAudiencePrefix || deploymentConfig.logtoOrganizationAudiencePrefix;
const LOGTO_JWKS_TIMEOUT_MS = 5000;
const LOGTO_JWT_VERIFY_TIMEOUT_MS = 6000;
let jwks;

const getRequiredEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for Logto authentication`);
  }
  return value;
};

const normalizeLogtoEndpoint = (endpoint) => endpoint.replace(/\/+$/, "").replace(/\/oidc$/, "");
const assertLogicalResource = (resource) => {
  if (/^https?:\/\//i.test(resource || "")) {
    throw new Error("LOGTO_API_RESOURCE must be a logical Logto API resource identifier, not an HTTP URL");
  }
  if (resource !== deploymentConfig.logtoResource) {
    throw new Error("Invalid Logto API Resource drift detected");
  }
  return resource;
};
const getLogtoIssuer = () => `${normalizeLogtoEndpoint(deploymentConfig.logtoEndpoint)}/oidc`;
const getLogtoJwksUrl = () => `${getLogtoIssuer()}/jwks`;

const getJwks = () => {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(getLogtoJwksUrl()), {
      timeoutDuration: LOGTO_JWKS_TIMEOUT_MS,
    });
  }
  return jwks;
};

const normalizeAudience = (audience) => (Array.isArray(audience) ? audience[0] : audience);
const hasAudience = (payloadOrAudience, expectedAudience) => {
  const audiences = Array.isArray(payloadOrAudience) ? payloadOrAudience : [payloadOrAudience];
  return audiences.includes(expectedAudience);
};

const getTokenFromHeader = (headers) => {
  const authorization = headers.authorization;

  if (!authorization) {
    const error = new Error("Authorization header missing");
    error.status = 401;
    throw error;
  }

  const [type, token] = authorization.split(" ");
  if (type !== "Bearer" || !token) {
    const error = new Error("Authorization header must use Bearer token");
    error.status = 401;
    throw error;
  }

  return token;
};

const decodeJwtPayload = (token) => {
  try {
    const [, payloadBase64] = token.split(".");
    if (!payloadBase64) {
      throw new Error("Invalid token format");
    }

    return JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8"));
  } catch (error) {
    const decodeError = new Error("Failed to decode token payload");
    decodeError.status = 401;
    throw decodeError;
  }
};

const extractOrganizationId = (payloadOrAudience) => {
  if (payloadOrAudience && typeof payloadOrAudience === "object") {
    if (payloadOrAudience.organization_id) {
      return payloadOrAudience.organization_id;
    }

    if (payloadOrAudience.organizationId) {
      return payloadOrAudience.organizationId;
    }

    return extractOrganizationId(payloadOrAudience.aud);
  }

  const audiences = Array.isArray(payloadOrAudience) ? payloadOrAudience : [payloadOrAudience];
  const organizationAudience = audiences.find(
    (audience) => typeof audience === "string" && audience.startsWith(ORGANIZATION_AUDIENCE_PREFIX)
  );

  if (organizationAudience) {
    return organizationAudience.slice(ORGANIZATION_AUDIENCE_PREFIX.length);
  }

  return null;
};

const parseScopes = (scope) => (typeof scope === "string" ? scope.split(" ").filter(Boolean) : []);

const parseClaimList = (value) => {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") return value.split(/[\s,]+/).filter(Boolean);
  return [];
};

const getClaimValue = (payload = {}, claimNames = []) => {
  for (const claimName of claimNames) {
    if (Object.hasOwn(payload, claimName)) {
      return payload[claimName];
    }
  }
  return undefined;
};

const GLOBAL_ROLE_CLAIMS = [
  ["global_roles"],
  ["role_names"],
  ["roles"],
  ["globalRoles"],
  ["https://civitas.didaxus.com/claims/global_roles", "https://civitas.didaxus.com/global_roles"],
  ["https://civitas.didaxus.com/claims/role_names", "https://civitas.didaxus.com/role_names"],
];

const extractGlobalRoleNames = (payload = {}) => {
  const candidates = GLOBAL_ROLE_CLAIMS.map((claimNames) => getClaimValue(payload, claimNames));
  return [...new Set(candidates.flatMap(parseClaimList))];
};

const extractOrganizationRoleNames = (payload = {}) => {
  const candidates = [payload.organization_roles, payload.organizationRoles, payload.org_roles];
  return [...new Set(candidates.flatMap(parseClaimList))];
};

const extractRoleNames = (payload = {}) => {
  return [...new Set([...extractGlobalRoleNames(payload), ...extractOrganizationRoleNames(payload)])];
};

const hasRequiredScopes = (tokenScopes, requiredScopes = []) => {
  if (!requiredScopes || requiredScopes.length === 0) {
    return true;
  }

  const scopeSet = new Set(tokenScopes);
  return requiredScopes.every((scope) => scopeSet.has(scope));
};

const verifyJwt = async (token, audience) => {
  return withTimeout(
    async () => {
      const { payload } = await jwtVerify(token, getJwks(), {
        issuer: getLogtoIssuer(),
        audience,
      });

      return payload;
    },
    {
      timeoutMs: LOGTO_JWT_VERIFY_TIMEOUT_MS,
      label: "Logto JWT verification",
      code: "LOGTO_JWT_VERIFY_TIMEOUT",
      name: "LogtoJwtVerifyTimeoutError",
      status: 504,
    }
  );
};

const buildAuthFailure = (error, expiredMessage, invalidMessage) => {
  if (error instanceof joseErrors.JWTExpired) {
    return {
      status: 401,
      body: { error: "Unauthorized", message: expiredMessage },
    };
  }

  if (error?.code === "LOGTO_JWT_VERIFY_TIMEOUT") {
    return {
      status: 504,
      body: {
        error: "Gateway Timeout",
        message: "Logto tardó demasiado en validar el token de acceso. Reintenta en unos segundos o valida la disponibilidad del proveedor de identidad.",
        code: error.code,
        timeoutMs: error.timeoutMs || LOGTO_JWT_VERIFY_TIMEOUT_MS,
      },
    };
  }

  return {
    status: error?.status || 401,
    body: { error: "Unauthorized", message: invalidMessage },
  };
};

const requireGlobalAccess = ({ resource = deploymentConfig.logtoResource, requiredScopes = [] } = {}) => {
  if (!resource) {
    throw new Error("Resource parameter is required for authentication");
  }
  assertLogicalResource(resource);

  return async (req, res, next) => {
    try {
      const token = getTokenFromHeader(req.headers);
      const payload = await verifyJwt(token, resource);
      const scopes = parseScopes(payload.scope);
      const organizationId = extractOrganizationId(payload);

      if (organizationId) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Global API routes require a Logto global API access token, not an organization token.",
          code: "GLOBAL_TOKEN_REQUIRED",
        });
      }

      if (!hasRequiredScopes(scopes, requiredScopes)) {
        return res.status(403).json({
          error: "Forbidden",
          message: "Insufficient global API permissions",
          requiredScopes,
        });
      }

      req.user = {
        id: payload.sub,
        sub: payload.sub,
        scopes,
        organizationId,
        roles: extractRoleNames(payload),
        globalRoles: extractGlobalRoleNames(payload),
        organizationRoles: extractOrganizationRoleNames(payload),
        claims: payload,
      };

      return next();
    } catch (error) {
      const failure = buildAuthFailure(error, "Access token expired", "Invalid or missing access token");
      return res.status(failure.status).json(failure.body);
    }
  };
};

const requireAuth = (resource = deploymentConfig.logtoResource) => requireGlobalAccess({ resource });

const requireScope = (requiredScope) => {
  return (req, res, next) => {
    const scopes = Array.isArray(req.user?.scopes) ? req.user.scopes : [];

    if (!hasRequiredScopes(scopes, [requiredScope])) {
      return res.status(403).json({
        error: "Forbidden",
        message: `Missing required Logto scope: ${requiredScope}`,
        requiredScope,
      });
    }

    return next();
  };
};

const requireOrganizationRole = (requiredRoleName) => {
  return (req, res, next) => {
    const roles = Array.isArray(req.user?.organizationRoles)
      ? req.user.organizationRoles
      : Array.isArray(req.user?.roles)
        ? req.user.roles
        : extractOrganizationRoleNames(req.user?.claims || {});
    if (!roles.includes(requiredRoleName)) {
      return res.status(403).json({
        error: "Forbidden",
        message: `Missing required Logto organization role: ${requiredRoleName}`,
        requiredRole: requiredRoleName,
      });
    }
    return next();
  };
};

const requireOrganizationAccess = ({ resource = deploymentConfig.logtoResource, requiredScopes = [], requiredRoleName = null } = {}) => {
  return async (req, res, next) => {
    try {
      const token = getTokenFromHeader(req.headers);
      const decodedPayload = decodeJwtPayload(token);
      const audience = normalizeAudience(decodedPayload.aud);
      const organizationId = extractOrganizationId(decodedPayload);
      assertLogicalResource(resource);

      if (!hasAudience(decodedPayload.aud, resource)) {
        const error = new Error("Invalid organization token audience");
        error.status = 401;
        throw error;
      }

      if (!audience || !organizationId) {
        const error = new Error("Invalid organization token");
        error.status = 401;
        throw error;
      }

      const payload = await verifyJwt(token, resource);
      const verifiedOrganizationId = extractOrganizationId(payload);
      const scopes = parseScopes(payload.scope);

      if (!verifiedOrganizationId) {
        const error = new Error("Organization token is missing organization context");
        error.status = 401;
        throw error;
      }

      if (req.params?.organizationId && req.params.organizationId !== verifiedOrganizationId) {
        return res.status(403).json({
          error: "Forbidden",
          message: "Organization token does not match requested organization",
        });
      }

      if (!hasRequiredScopes(scopes, requiredScopes)) {
        return res.status(403).json({
          error: "Forbidden",
          message: "Insufficient organization permissions",
          requiredScopes,
        });
      }

      req.user = {
        id: payload.sub,
        sub: payload.sub,
        scopes,
        organizationId: verifiedOrganizationId,
        roles: extractRoleNames(payload),
        globalRoles: extractGlobalRoleNames(payload),
        organizationRoles: extractOrganizationRoleNames(payload),
        claims: payload,
      };

      if (requiredRoleName && !req.user.organizationRoles.includes(requiredRoleName)) {
        return res.status(403).json({
          error: "Forbidden",
          message: `Missing required Logto organization role: ${requiredRoleName}`,
          requiredRole: requiredRoleName,
        });
      }

      return next();
    } catch (error) {
      const failure = buildAuthFailure(error, "Organization token expired", "Invalid organization access token");
      return res.status(failure.status).json(failure.body);
    }
  };
};

module.exports = {
  decodeJwtPayload,
  extractOrganizationId,
  getTokenFromHeader,
  extractRoleNames,
  extractGlobalRoleNames,
  extractOrganizationRoleNames,
  hasRequiredScopes,
  requireAuth,
  requireGlobalAccess,
  requireOrganizationAccess,
  requireOrganizationRole,
  requireScope,
  verifyJwt,
};
