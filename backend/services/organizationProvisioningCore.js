const {
  addUserToLogtoOrganization,
  assignOrganizationRoleToUser,
  createOrResolveLogtoUserByEmail,
  ensureOrganizationTemplate,
  listLogtoOrganizationRoles,
  replaceJitDefaultRolesForLogtoOrganization,
  replaceJitEmailDomainsForLogtoOrganization,
} = require("./logtoManagement");
const {
  buildOrganizationCreatePayload,
  buildUserCreatePayload,
  buildLogtoUsername,
} = require("./organizationProvisioningPayloads");
const { normalizeProvisioningSettings } = require("./organizationProvisioningSettings");

const emptyToNull = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const normalizeRoleNames = (value) => {
  const input = Array.isArray(value) ? value : [];
  const roles = input.map((role) => (typeof role === "string" ? role.trim() : "")).filter(Boolean);
  return Array.from(new Set(roles));
};

const normalizePhone = (value) => {
  const raw = emptyToNull(value);
  if (!raw) return null;
  const compact = raw.replace(/[\s().-]+/g, "");
  if (!/^\+?[1-9]\d{6,14}$/.test(compact)) return null;
  return compact.startsWith("+") ? compact : `+${compact}`;
};

const normalizeAdministrativeContacts = (value = []) =>
  (Array.isArray(value) ? value : [])
    .map((contact, index) => {
      const firstName = emptyToNull(contact?.firstName) || emptyToNull(contact?.primerNombre);
      const middleName = emptyToNull(contact?.middleName) || emptyToNull(contact?.segundoNombre);
      const firstSurname =
        emptyToNull(contact?.firstSurname) ||
        emptyToNull(contact?.primerApellido) ||
        emptyToNull(contact?.lastName);
      const secondSurname =
        emptyToNull(contact?.secondSurname) || emptyToNull(contact?.segundoApellido);
      const email = emptyToNull(contact?.email)?.toLowerCase() || null;
      return {
        key:
          (typeof contact?.key === "string" && contact.key.trim()) ||
          `administrative_contact_${index + 1}`,
        firstName,
        middleName,
        firstSurname,
        secondSurname,
        name:
          emptyToNull(contact?.name) ||
          [firstName, middleName, firstSurname, secondSurname]
            .filter(Boolean)
            .join(" ") ||
          null,
        email,
        phone: normalizePhone(contact?.phone),
        phoneExtension: emptyToNull(contact?.phoneExtension ?? contact?.extension),
        position: emptyToNull(contact?.position),
        organizationRoleName: emptyToNull(contact?.organizationRoleName),
        username:
          emptyToNull(contact?.username) || buildLogtoUsername({ email }),
      };
    })
    .filter((contact) => contact.name || contact.email || contact.phone || contact.position);

const getAdministrativeContactUniquenessErrors = (contacts = []) => {
  const seen = new Map();
  const errors = [];
  for (const [index, contact] of contacts.entries()) {
    if (!contact.email) continue;
    if (seen.has(contact.email)) {
      errors.push({
        field: `administrativeContacts.${index}.email`,
        message: `Administrative contacts must use unique emails. ${contact.email} is repeated.`,
      });
      continue;
    }
    seen.set(contact.email, true);
  }
  return errors;
};

function normalizeProvisioningInput(body = {}) {
  const settings = normalizeProvisioningSettings(body);
  const administrativeContacts = normalizeAdministrativeContacts(body.administrativeContacts);
  const jitDefaultRoleNames = normalizeRoleNames(body.jitProvisioning?.defaultRoleNames);

  const errors = [];
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : undefined;

  if (!name) {
    errors.push({ field: "name", message: "Organization name is required" });
  }

  if (administrativeContacts.length === 0) {
    errors.push({ field: "administrativeContacts", message: "At least one administrative contact is required" });
  }

  administrativeContacts.forEach((contact, index) => {
    if (!contact.firstName) {
      errors.push({ field: `administrativeContacts.${index}.firstName`, message: "Administrative contact first name is required" });
    }
    if (!contact.firstSurname) {
      errors.push({ field: `administrativeContacts.${index}.firstSurname`, message: "Administrative contact first surname is required" });
    }
    if (!contact.email) {
      errors.push({ field: `administrativeContacts.${index}.email`, message: "Administrative contact email is required" });
    }
    if (!contact.organizationRoleName) {
      errors.push({ field: `administrativeContacts.${index}.organizationRoleName`, message: "Administrative contact role is required" });
    }
  });

  errors.push(...settings.errors);
  errors.push(...getAdministrativeContactUniquenessErrors(administrativeContacts));

  return {
    errors,
    value: {
      canonical: {
        name,
        description,
        administrativeContacts,
        jitProvisioning: {
          domain: settings.value.adminDomain,
          defaultRoleNames: jitDefaultRoleNames,
        },
      },
      settings: settings.value,
      contact:
        body.contact && typeof body.contact === "object"
          ? body.contact
          : {},
      business: body.business && typeof body.business === "object" ? body.business : {},
      segmentation:
        body.segmentation && typeof body.segmentation === "object"
          ? body.segmentation
          : {},
    },
  };
}

class InvalidInitialOrganizationRoleError extends Error {
  constructor({ requestedRole, availableRoles = [] } = {}) {
    super("El rol solicitado no existe en Logto para organizaciones.");
    this.name = "InvalidInitialOrganizationRoleError";
    this.error = "invalid_initial_organization_role";
    this.code = "INVALID_INITIAL_ORGANIZATION_ROLE";
    this.status = 422;
    this.requestedRole = requestedRole;
    this.availableRoles = availableRoles;
    this.body = { error: this.error, message: this.message, requestedRole, availableRoles };
  }
}

const getRoleName = (role = {}) => role.name || role.nameCache || role.key || null;
const getRoleId = (role = {}) => role.id || role.organizationRoleId || role.roleId || null;
const getUserId = (user = {}) => user.id || user.userId || user.logtoUserId || null;

function createRoleResolver(roles = []) {
  const normalizedRoles = roles.map((role) => ({ ...role, id: getRoleId(role), name: getRoleName(role) })).filter((role) => role.name);
  const byName = new Map(normalizedRoles.map((role) => [role.name, role]));
  const availableRoles = normalizedRoles.map((role) => role.name);
  return {
    availableRoles,
    normalizedRoles,
    requireRole(roleName) {
      const role = byName.get(roleName);
      if (!role) throw new InvalidInitialOrganizationRoleError({ requestedRole: roleName, availableRoles });
      return role;
    },
  };
}

async function runCanonicalOrganizationProvisioning({ input, actor = {}, recorder = null, logto = {} }) {
  const deps = {
    listLogtoOrganizationRoles,
    ensureOrganizationTemplate,
    createOrResolveLogtoUserByEmail,
    addUserToLogtoOrganization,
    assignOrganizationRoleToUser,
    replaceJitEmailDomainsForLogtoOrganization,
    replaceJitDefaultRolesForLogtoOrganization,
    createOrganization: createOrganizationFromCanonicalInput,
    ...logto,
  };
  const recordStep = async (stepName, status, metadata = {}) => {
    if (recorder?.recordStep) await recorder.recordStep({ stepName, status, metadata });
  };

  if (recorder?.startOperation) await recorder.startOperation({ operationType: "organization.bootstrap", actor, input: { organizationName: input.canonical.name } });
  await recordStep("organization.bootstrap.started", "completed", { actorType: actor?.type || "owner_global" });

  const requiredRoleNames = Array.from(new Set([
    ...input.canonical.jitProvisioning.defaultRoleNames,
    ...input.canonical.administrativeContacts.map((contact) => contact.organizationRoleName),
  ].filter(Boolean)));

  await recordStep("logto.organization_roles.list", "running", {});
  const roleResolver = createRoleResolver(await deps.listLogtoOrganizationRoles());
  await recordStep("logto.organization_roles.list", "completed", { availableRoles: roleResolver.availableRoles });
  for (const roleName of requiredRoleNames) roleResolver.requireRole(roleName);

  const template = await deps.ensureOrganizationTemplate({ requiredRoleNames });
  await recordStep("logto.organization_template.validate", "completed", { requiredRoleNames });

  const organization = await deps.createOrganization(input);
  const organizationId = organization.id;
  await recordStep("logto.organization.create", "completed", { organizationId });

  const jitRoleIds = [];
  for (const roleName of input.canonical.jitProvisioning.defaultRoleNames) {
    const role = roleResolver.requireRole(roleName);
    const roleId = getRoleId(role);
    if (!roleId) throw new Error(`Logto organization role ${roleName} exists but no role id was returned`);
    jitRoleIds.push(roleId);
  }

  if (input.canonical.jitProvisioning.domain) {
    await deps.replaceJitEmailDomainsForLogtoOrganization({ organizationId, emailDomains: [input.canonical.jitProvisioning.domain] });
    await recordStep("logto.organization_jit.email_domains.replace", "completed", { organizationId });
  }
  if (jitRoleIds.length > 0) {
    await deps.replaceJitDefaultRolesForLogtoOrganization({ organizationId, organizationRoleIds: jitRoleIds });
    await recordStep("logto.organization_jit.default_roles.replace", "completed", { organizationId, roleNames: input.canonical.jitProvisioning.defaultRoleNames });
  }

  const administrativeContactAssignments = [];
  for (const contact of input.canonical.administrativeContacts) {
    const resolved = await deps.createOrResolveLogtoUserByEmail(buildUserCreatePayload(contact));
    const userId = getUserId(resolved.user);
    if (!userId) throw new Error(`Administrative contact ${contact.email} did not resolve a Logto user id`);
    const role = roleResolver.requireRole(contact.organizationRoleName);
    const roleId = getRoleId(role);
    if (!roleId) throw new Error(`Logto organization role ${contact.organizationRoleName} exists but no role id was returned`);

    await deps.addUserToLogtoOrganization({ organizationId, userId });
    await deps.assignOrganizationRoleToUser({ organizationId, userId, organizationRoleId: roleId, organizationRoleName: contact.organizationRoleName });
    await recordStep("logto.organization_user.assign_role", "completed", { organizationId, userId, roleName: contact.organizationRoleName });

    administrativeContactAssignments.push({
      key: contact.key,
      email: contact.email,
      logtoUserId: userId,
      roleName: contact.organizationRoleName,
      userCreated: Boolean(resolved.created),
      userSource: resolved.source,
      membershipAdded: true,
      roleAssigned: true,
    });
  }

  if (recorder?.completeOperation) await recorder.completeOperation({ organizationId, status: "created_with_logto_bootstrap" });
  return {
    organization,
    organizationId,
    template,
    availableOrganizationRoles: roleResolver.availableRoles,
    jitProvisioning: { domain: input.canonical.jitProvisioning.domain, defaultRoleNames: input.canonical.jitProvisioning.defaultRoleNames, defaultRoleIds: jitRoleIds },
    administrativeContactAssignments,
    status: "created_with_logto_bootstrap",
  };
}

function createOrganizationFromCanonicalInput(input) {
  return require("./logtoManagement").createLogtoOrganization(
    buildOrganizationCreatePayload({
      canonical: input.canonical,
      settings: input.settings,
      contact: input.contact,
      business: input.business,
      segmentation: input.segmentation,
    }),
  );
}

module.exports = {
  InvalidInitialOrganizationRoleError,
  createRoleResolver,
  normalizeProvisioningInput,
  runCanonicalOrganizationProvisioning,
};