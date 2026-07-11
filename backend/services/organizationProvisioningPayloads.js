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

const LOGTO_USERNAME_MAX_LENGTH = 128;

function normalizeLogtoUsername(value) {
  const normalized = String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^([^a-z_])/, "_$1")
    .replace(/^_+$/, "")
    .slice(0, LOGTO_USERNAME_MAX_LENGTH);
  return normalized || null;
}

function buildLogtoUsername({ email }) {
  const localPart = String(email || "").split("@")[0] || "";
  return normalizeLogtoUsername(localPart);
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

function buildUserDataCustomData(person = {}) {
  const firstName = trim(person.firstName);
  const middleName = trim(person.middleName);
  const firstSurname = trim(person.firstSurname);
  const secondSurname = trim(person.secondSurname);
  const fullName = [firstName, middleName, firstSurname, secondSurname]
    .filter(Boolean)
    .join(" ");
  const roleTag = trim(person.segmentation?.roleTag) || trim(person.organizationRoleName) || "";
  const organizationTags = unique(person.segmentation?.organizationTags);
  const organizationLists = unique(person.segmentation?.organizationLists);
  const userTags = unique(person.segmentation?.userTags || [roleTag, ...organizationTags]);

  return {
    key: trim(person.key) || "",
    phone: trim(person.phone) || "",
    source: trim(person.source) || "owner_organization_provisioning",
    fullName: trim(person.name) || fullName || "",
    position: trim(person.position) || "",
    segmentation: {
      roleTag,
      userTags,
      organizationTags,
      organizationLists,
    },
    phoneExtension: trim(person.phoneExtension) || "",
    organizationRoleName: trim(person.organizationRoleName) || "",
  };
}

function buildOrganizationCustomData({ canonical = {}, settings = {}, contact = {}, business = {}, segmentation = {} } = {}) {
  const administrativeContacts = Array.isArray(canonical.administrativeContacts) ? canonical.administrativeContacts : [];
  const primaryContact = administrativeContacts[0] || {};
  const organizationTags = unique(segmentation.tags || segmentation.organizationTags);
  const organizationLists = unique(segmentation.lists || segmentation.organizationLists);

  return {
    provisioning: {
      entryUrl: trim(settings.entryUrl) || "",
      appSubdomain: trim(settings.appSubdomain) || "",
      appBaseDomain: trim(settings.appBaseDomain) || "",
      institutionalDomain: trim(settings.adminDomain) || trim(settings.institutionalDomain) || "",
    },
    civitasProfile: {
      contact: {
        email: trim(contact.email) || "",
        owner: trim(contact.owner) || "",
        phone: trim(contact.phone) || "",
      },
      version: Number.isInteger(canonical.version) ? canonical.version : 0,
      business: {
        nit: trim(business.nit) || "",
        city: trim(business.city) || "",
        type: trim(business.type) || "",
        state: trim(business.state) || "",
        country: trim(business.country) || "",
        website: trim(business.website) || "",
        entryUrl: trim(settings.entryUrl) || "",
        industry: trim(business.industry) || "",
        postalCode: trim(business.postalCode) || "",
        description: trim(business.description) || trim(canonical.description) || "",
        addressLine1: trim(business.addressLine1) || "",
        addressLine2: trim(business.addressLine2) || "",
        appSubdomain: trim(settings.appSubdomain) || "",
        appBaseDomain: trim(settings.appBaseDomain) || "",
        numberOfEmployees: trim(business.numberOfEmployees) || "",
        verificationDigit: trim(business.verificationDigit) || "",
        institutionalDomain: trim(settings.adminDomain) || trim(settings.institutionalDomain) || "",
      },
      segmentation: {
        organizationTags,
        organizationLists,
      },
      userData: buildUserDataCustomData({
        ...primaryContact,
        segmentation: {
          roleTag: primaryContact.segmentation?.roleTag || primaryContact.organizationRoleName,
          userTags: primaryContact.segmentation?.userTags,
          organizationTags,
          organizationLists,
        },
      }),
      secondFamilyName: trim(primaryContact.secondSurname) || "",
    },
    oidcRedirectUri: trim(settings.oidcRedirectUri) || "",
  };
}

function buildOrganizationCreatePayload({ canonical = {}, settings = {}, contact = {}, business = {}, segmentation = {} } = {}) {
  return cleanObject({
    name: canonical.name,
    description:
      canonical.description || trim(business.description) || undefined,
    customData: buildOrganizationCustomData({ canonical, settings, contact, business, segmentation }),
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
  const username = trim(person.username) || buildLogtoUsername({ email: person.email });
  const roleTag = trim(person.segmentation?.roleTag) || trim(person.organizationRoleName);
  const organizationTags = unique(person.segmentation?.organizationTags);
  const organizationLists = unique(person.segmentation?.organizationLists);
  const userTags = unique([roleTag, ...organizationTags]);

  return cleanObject({
    primaryEmail: trim(person.email)?.toLowerCase(),
    primaryPhone: phoneExtension ? null : trim(person.phone),
    username,
    name: trim(person.name) || fullName || null,
    profile: cleanObject({
      familyName: firstSurname,
      givenName: firstName,
      middleName,
      preferredUsername: username,
    }),
    customData: cleanObject({
      civitasProfile: cleanObject({
        phone: trim(person.phone),
        source: "owner_organization_provisioning",
        position: trim(person.position),
        key: trim(person.key),
        organizationRoleName: trim(person.organizationRoleName),
        segmentation: cleanObject({
          roleTag,
          organizationTags,
          organizationLists,
          userTags,
        }),
        phoneExtension,
        fullName: fullName || null,
      }),
      secondFamilyName: secondSurname,
    }),
  });
}

module.exports = {
  buildLogtoUsername,
  normalizeLogtoUsername,
  buildAdministrativeContactsCustomData,
  buildOrganizationCustomData,
  buildOrganizationCreatePayload,
  buildUserCreatePayload,
};
