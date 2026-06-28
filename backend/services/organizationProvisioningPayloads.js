const trim = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const unique = (values) => [
  ...new Set((Array.isArray(values) ? values : []).map(trim).filter(Boolean)),
];

const cleanObject = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(
      ([, value]) =>
        value !== null &&
        value !== undefined &&
        !(Array.isArray(value) && value.length === 0),
    ),
  );

function buildLogtoUsername({ email }) {
  const localPart = String(email || "").split("@")[0] || "";
  return String(localPart)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^([^a-z_])/, "_$1")
    .replace(/^_+$/, "") || null;
}

function buildAdministrativeContactsCustomData(contacts = []) {
  return (Array.isArray(contacts) ? contacts : [])
    .map((contact) =>
      cleanObject({
        key: trim(contact?.key),
        firstName: trim(contact?.firstName),
        middleName: trim(contact?.middleName),
        firstSurname: trim(contact?.firstSurname),
        secondSurname: trim(contact?.secondSurname),
        name: trim(contact?.name),
        email: trim(contact?.email)?.toLowerCase(),
        phone: trim(contact?.phone),
        phoneExtension: trim(contact?.phoneExtension),
        position: trim(contact?.position),
        organizationRoleName: trim(contact?.organizationRoleName),
        username: trim(contact?.username) || buildLogtoUsername({ email: contact?.email }),
      }),
    )
    .filter((contact) => Object.keys(contact).length > 0);
}

function buildOrganizationCustomData({ canonical = {}, settings = {}, business = {}, segmentation = {} } = {}) {
  const administrativeContacts = buildAdministrativeContactsCustomData(canonical.administrativeContacts);
  const primaryContact = administrativeContacts.find((contact) => contact.email || contact.name) || null;

  return cleanObject({
    provisioning: cleanObject({
      appSubdomain: settings.appSubdomain,
      appBaseDomain: settings.appBaseDomain,
      entryUrl: settings.entryUrl,
      institutionalDomain: settings.adminDomain,
      jitDefaultRoleNames: unique(canonical.jitProvisioning?.defaultRoleNames),
    }),
    oidcRedirectUri: settings.oidcRedirectUri || null,
    civitasProfile: cleanObject({
      version: 1,
      business: cleanObject({
        website: trim(business.website),
        type: trim(business.type),
        industry: trim(business.industry),
        about: trim(business.about),
        description: trim(business.description) || canonical.description || null,
        addressLine1: trim(business.addressLine1),
        addressLine2: trim(business.addressLine2),
        city: trim(business.city),
        state: trim(business.state),
        postalCode: trim(business.postalCode),
        country: trim(business.country),
        numberOfEmployees: trim(business.numberOfEmployees),
        nit: trim(business.nit),
        verificationDigit: trim(business.verificationDigit),
      }),
      contact: cleanObject({
        owner: trim(primaryContact?.name),
        email: trim(primaryContact?.email),
        phone: trim(primaryContact?.phone),
      }),
      administrativeContacts,
      segmentation: cleanObject({
        tags: unique(segmentation.tags),
        lists: unique(segmentation.lists),
      }),
    }),
  });
}

function buildOrganizationCreatePayload({ canonical = {}, settings = {}, business = {}, segmentation = {} } = {}) {
  return cleanObject({
    name: canonical.name,
    description:
      canonical.description || trim(business.description) || undefined,
    customData: buildOrganizationCustomData({ canonical, settings, business, segmentation }),
  });
}

function buildUserCreatePayload(person = {}) {
  const firstName = trim(person.firstName);
  const middleName = trim(person.middleName);
  const firstSurname = trim(person.firstSurname);
  const secondSurname = trim(person.secondSurname);
  const fullName = [firstName, middleName, firstSurname, secondSurname]
    .filter(Boolean)
    .join(" ");
  const phoneExtension = trim(person.phoneExtension);

  return cleanObject({
    primaryEmail: trim(person.email)?.toLowerCase(),
    primaryPhone: phoneExtension ? null : trim(person.phone),
    username: trim(person.username) || buildLogtoUsername({ email: person.email }),
    name: trim(person.name) || fullName || null,
    profile: cleanObject({
      givenName: firstName,
      middleName,
      familyName: [firstSurname, secondSurname].filter(Boolean).join(" ") || null,
      preferredUsername: trim(person.username) || buildLogtoUsername({ email: person.email }),
    }),
    customData: cleanObject({
      civitasProfile: cleanObject({
        source: "owner_organization_provisioning",
        key: trim(person.key),
        firstName,
        middleName,
        firstSurname,
        secondSurname,
        fullName: fullName || null,
        email: trim(person.email)?.toLowerCase(),
        organizationRoleName: trim(person.organizationRoleName),
        position: trim(person.position),
        phone: trim(person.phone),
        phoneExtension,
      }),
    }),
  });
}

module.exports = {
  buildLogtoUsername,
  buildAdministrativeContactsCustomData,
  buildOrganizationCustomData,
  buildOrganizationCreatePayload,
  buildUserCreatePayload,
};