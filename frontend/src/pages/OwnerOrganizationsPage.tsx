import { useEffect, useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { OwnerShell, PageHeader, primaryButtonClassName, secondaryButtonClassName } from "../components/owner/OwnerUI";
import { AlertStrip, ActionBar, FormField, SectionCard, StatusPill, Stepper } from "../shared/ui";
import { useOwnerApi, type CreateOwnerOrganizationInput } from "../api/owner";

const APP_BASE_DOMAINS = ["didaxus.com"] as const;

type GeographyRegion = {
  code: string;
  name: string;
  cities: readonly string[];
};

type GeographyCountry = {
  code: string;
  name: string;
  phonePrefix: string;
  regionLabel: string;
  regions: readonly GeographyRegion[];
};

const COUNTRY_OPTIONS: readonly GeographyCountry[] = [
  {
    code: "CO",
    name: "Colombia",
    phonePrefix: "+57",
    regionLabel: "Department",
    regions: [
      { code: "ANT", name: "Antioquia", cities: ["Medellin", "Envigado", "Bello"] },
      { code: "DC", name: "Bogota D.C.", cities: ["Bogota"] },
      { code: "CUN", name: "Cundinamarca", cities: ["Chia", "Soacha", "Zipaquira"] },
      { code: "VAC", name: "Valle del Cauca", cities: ["Cali", "Palmira", "Jamundi"] },
    ],
  },
  {
    code: "MX",
    name: "Mexico",
    phonePrefix: "+52",
    regionLabel: "State",
    regions: [
      { code: "CDMX", name: "Ciudad de Mexico", cities: ["Ciudad de Mexico"] },
      { code: "JAL", name: "Jalisco", cities: ["Guadalajara", "Zapopan", "Tlaquepaque"] },
      { code: "NLE", name: "Nuevo Leon", cities: ["Monterrey", "San Nicolas", "Guadalupe"] },
    ],
  },
  {
    code: "US",
    name: "United States",
    phonePrefix: "+1",
    regionLabel: "State",
    regions: [
      { code: "CA", name: "California", cities: ["Los Angeles", "San Diego", "San Francisco"] },
      { code: "FL", name: "Florida", cities: ["Miami", "Orlando", "Tampa"] },
      { code: "NY", name: "New York", cities: ["New York City", "Buffalo", "Albany"] },
    ],
  },
];

const DEFAULT_COUNTRY_CODE = "CO";

type AdministrativeContact = {
  id: string;
  firstName: string;
  middleName: string;
  firstSurname: string;
  secondSurname: string;
  email: string;
  phone: string;
  phoneExtension: string;
  position: string;
  organizationRoleName: string;
  username: string;
};

type OrganizationTemplateRole = {
  id: string;
  name: string;
};

type OrganizationTemplateResponse = {
  roles: OrganizationTemplateRole[];
  requiredRoleNames?: string[];
  missingRoleNames?: string[];
  ready: boolean;
};

type FormState = {
  name: string;
  description: string;
  appSubdomain: string;
  appBaseDomain: string;
  adminDomain: string;
  jitDefaultRoleName: string;
  business: {
    website: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    numberOfEmployees: string;
    industry: string;
    type: string;
    about: string;
    nit: string;
    verificationDigit: string;
  };
  segmentation: {
    tags: string[];
    lists: string[];
  };
  administrativeContacts: AdministrativeContact[];
};

type CreatedState = {
  organizationId: string;
  organizationName: string;
  organizationDescription: string | null;
  firstAdminUserId: string | null;
  assignedOrganizationRole: string | null;
  idempotencyKey: string | null;
  administrativeContactAssignments: Array<{
    key: string;
    email: string;
    logtoUserId: string;
    roleName: string;
    userCreated: boolean;
    userSource: string;
  }>;
};

const getCountryOption = (countryCode: string): GeographyCountry | null =>
  COUNTRY_OPTIONS.find((country) => country.code === countryCode) ?? null;

const getRegionOption = (countryCode: string, regionCode: string): GeographyRegion | null =>
  getCountryOption(countryCode)?.regions.find((region) => region.code === regionCode) ?? null;

const normalizePhoneValue = (value: string) => value.replace(/\s+/g, " ").trim();

const propagatePhonePrefix = (phone: string, previousPrefix: string | null, nextPrefix: string) => {
  const normalizedPhone = normalizePhoneValue(phone);
  if (!normalizedPhone) return nextPrefix;
  if (previousPrefix && normalizedPhone === previousPrefix) return nextPrefix;
  if (previousPrefix && normalizedPhone.startsWith(`${previousPrefix} `)) {
    return `${nextPrefix} ${normalizedPhone.slice(previousPrefix.length + 1)}`.trim();
  }
  if (previousPrefix && normalizedPhone.startsWith(previousPrefix)) {
    return `${nextPrefix}${normalizedPhone.slice(previousPrefix.length)}`.trim();
  }
  if (normalizedPhone.startsWith("+")) return normalizedPhone;
  return `${nextPrefix} ${normalizedPhone}`.trim();
};

const emptyContact = (
  index: number,
  roleName = "",
  countryCode = DEFAULT_COUNTRY_CODE,
): AdministrativeContact => ({
  id: `contact-${index}`,
  firstName: "",
  middleName: "",
  firstSurname: "",
  secondSurname: "",
  email: "",
  phone: getCountryOption(countryCode)?.phonePrefix || "",
  phoneExtension: "",
  position: "",
  organizationRoleName: roleName,
  username: "",
});

const initialFormState = (defaultRoleName = ""): FormState => ({
  name: "",
  description: "",
  appSubdomain: "",
  appBaseDomain: APP_BASE_DOMAINS[0],
  adminDomain: "",
  jitDefaultRoleName: "",
  business: {
    website: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: DEFAULT_COUNTRY_CODE,
    numberOfEmployees: "",
    industry: "",
    type: "",
    about: "",
    nit: "",
    verificationDigit: "",
  },
  segmentation: {
    tags: [],
    lists: [],
  },
  administrativeContacts: [emptyContact(1, defaultRoleName, DEFAULT_COUNTRY_CODE)],
});

const toSentence = (value: string) => value.trim();

const parseDelimitedValues = (value: string) =>
  Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );

const inputClassName = "civitas-field";

const wizardSteps = [
  { id: "canonical", label: "Canonical organization" },
  { id: "business", label: "Business profile" },
  { id: "admins", label: "Administrative users" },
  { id: "segmentation", label: "Segmentation" },
  { id: "review", label: "Review & submit" },
] as const;

const OwnerOrganizationsPage = () => {
  const ownerApi = useOwnerApi();
  const [template, setTemplate] = useState<OrganizationTemplateResponse | null>(null);
  const [templateLoading, setTemplateLoading] = useState(true);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialFormState());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedState | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadTemplate = async () => {
      setTemplateLoading(true);
      setTemplateError(null);
      try {
        const response = await ownerApi.getOrganizationTemplate();
        if (cancelled) return;
        setTemplate(response);
        setForm((current) => {
          return {
            ...current,
            jitDefaultRoleName: current.jitDefaultRoleName,
            administrativeContacts: current.administrativeContacts.map((contact, index) => ({
              ...contact,
              organizationRoleName: contact.organizationRoleName,
              phone:
                normalizePhoneValue(contact.phone) ||
                getCountryOption(current.business.country)?.phonePrefix ||
                getCountryOption(DEFAULT_COUNTRY_CODE)?.phonePrefix ||
                "",
              id: `contact-${index + 1}`,
            })),
          };
        });
      } catch (error) {
        if (cancelled) return;
        setTemplateError(error instanceof Error ? error.message : String(error));
      } finally {
        if (!cancelled) setTemplateLoading(false);
      }
    };

    void loadTemplate();
    return () => {
      cancelled = true;
    };
  }, [ownerApi]);

  const adminRoleOptions = useMemo(() => template?.roles ?? [], [template]);
  const selectedCountry = useMemo(
    () => getCountryOption(form.business.country) ?? getCountryOption(DEFAULT_COUNTRY_CODE),
    [form.business.country],
  );
  const regionOptions: readonly GeographyRegion[] = selectedCountry?.regions ?? [];
  const selectedRegion = useMemo(
    () => getRegionOption(form.business.country, form.business.state),
    [form.business.country, form.business.state],
  );
  const cityOptions: readonly string[] = selectedRegion?.cities ?? [];
  const canSubmit = Boolean(template?.ready) && !submitting;

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateBusinessField = <K extends keyof FormState["business"]>(field: K, value: string) => {
    setForm((current) => ({
      ...current,
      business: {
        ...current.business,
        [field]: value,
      },
    }));
  };

  const updateCountryField = (countryCode: string) => {
    setForm((current) => {
      const previousCountry = getCountryOption(current.business.country);
      const nextCountry = getCountryOption(countryCode);

      if (!nextCountry) {
        return {
          ...current,
          business: {
            ...current.business,
            country: countryCode,
            state: "",
            city: "",
          },
        };
      }

      const stateIsStillValid = nextCountry.regions.some(
        (region) => region.code === current.business.state,
      );
      const nextState = stateIsStillValid ? current.business.state : "";
      const nextRegion = nextCountry.regions.find((region) => region.code === nextState) ?? null;
      const cityIsStillValid = nextRegion
        ? nextRegion.cities.includes(current.business.city)
        : false;
      const nextCity = cityIsStillValid ? current.business.city : "";

      return {
        ...current,
        business: {
          ...current.business,
          country: countryCode,
          state: nextState,
          city: nextCity,
        },
        administrativeContacts: current.administrativeContacts.map((contact) => ({
          ...contact,
          phone: propagatePhonePrefix(
            contact.phone,
            previousCountry?.phonePrefix ?? null,
            nextCountry.phonePrefix,
          ),
        })),
      };
    });
  };

  const updateStateField = (stateCode: string) => {
    setForm((current) => {
      const nextRegion = getRegionOption(current.business.country, stateCode);
      const cityIsStillValid = nextRegion
        ? nextRegion.cities.includes(current.business.city)
        : false;
      return {
        ...current,
        business: {
          ...current.business,
          state: stateCode,
          city: cityIsStillValid ? current.business.city : "",
        },
      };
    });
  };

  const updateContact = (id: string, field: keyof AdministrativeContact, value: string) => {
    setForm((current) => ({
      ...current,
      administrativeContacts: current.administrativeContacts.map((contact) =>
        contact.id === id ? { ...contact, [field]: value } : contact,
      ),
    }));
  };

  const addContact = () => {
    const fallbackRole =
      adminRoleOptions[0]?.name ||
      "";
    setForm((current) => ({
      ...current,
      administrativeContacts: [
        ...current.administrativeContacts,
        emptyContact(current.administrativeContacts.length + 1, fallbackRole, current.business.country),
      ],
    }));
  };

  const removeContact = (id: string) => {
    setForm((current) => {
      const next = current.administrativeContacts.filter((contact) => contact.id !== id);
      return {
        ...current,
        administrativeContacts:
          next.length > 0 ? next : [emptyContact(1, "", current.business.country)],
      };
    });
  };

  const validate = () => {
    const errors: string[] = [];
    if (!toSentence(form.name)) errors.push("Organization name is required.");
    if (!toSentence(form.appSubdomain)) errors.push("Application subdomain is required.");
    if (!toSentence(form.appBaseDomain)) errors.push("Application base domain is required.");
    if (!toSentence(form.adminDomain)) errors.push("Institutional provisioning domain is required.");

    const seenEmails = new Set<string>();
    form.administrativeContacts.forEach((contact, index) => {
      if (!toSentence(contact.firstName)) {
        errors.push(`Administrative contact ${index + 1}: first name is required.`);
      }
      if (!toSentence(contact.firstSurname)) {
        errors.push(`Administrative contact ${index + 1}: first surname is required.`);
      }
      if (!toSentence(contact.email)) {
        errors.push(`Administrative contact ${index + 1}: email is required.`);
      }
      if (!toSentence(contact.organizationRoleName)) {
        errors.push(`Administrative contact ${index + 1}: organization role is required.`);
      }
      const email = contact.email.trim().toLowerCase();
      if (email) {
        if (seenEmails.has(email)) {
          errors.push(`Administrative contact ${index + 1}: email ${email} is duplicated.`);
        }
        seenEmails.add(email);
      }
    });

    return errors;
  };

  const buildPayload = (): CreateOwnerOrganizationInput => {
    const primaryAdministrativeContact = form.administrativeContacts[0];
    const primaryOwnerName = [
      primaryAdministrativeContact?.firstName,
      primaryAdministrativeContact?.middleName,
      primaryAdministrativeContact?.firstSurname,
      primaryAdministrativeContact?.secondSurname,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      idempotencyKey: idempotencyKey || undefined,
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      appSubdomain: form.appSubdomain.trim().toLowerCase(),
      appBaseDomain: form.appBaseDomain.trim().toLowerCase(),
      adminDomain: form.adminDomain.trim().toLowerCase(),
      jitProvisioning: {
        defaultRoleNames: form.jitDefaultRoleName ? [form.jitDefaultRoleName] : [],
      },
      contact: {
        email: primaryAdministrativeContact?.email.trim().toLowerCase() || undefined,
        phone: primaryAdministrativeContact?.phone.trim() || undefined,
        owner: primaryOwnerName || undefined,
      },
      business: {
        website: form.business.website.trim() || undefined,
        addressLine1: form.business.addressLine1.trim() || undefined,
        addressLine2: form.business.addressLine2.trim() || undefined,
        city: form.business.city.trim() || undefined,
        state: selectedRegion?.name || undefined,
        postalCode: form.business.postalCode.trim() || undefined,
        country: selectedCountry?.name || undefined,
        numberOfEmployees: form.business.numberOfEmployees.trim() || undefined,
        industry: form.business.industry.trim() || undefined,
        type: form.business.type.trim() || undefined,
        about: form.business.about.trim() || undefined,
        nit: form.business.nit.trim() || undefined,
        verificationDigit: form.business.verificationDigit.trim() || undefined,
      },
      segmentation: {
        tags: form.segmentation.tags,
        lists: form.segmentation.lists,
      },
      administrativeContacts: form.administrativeContacts.map((contact) => ({
        key: contact.id,
        firstName: contact.firstName.trim(),
        middleName: contact.middleName.trim() || undefined,
        firstSurname: contact.firstSurname.trim(),
        secondSurname: contact.secondSurname.trim() || undefined,
        email: contact.email.trim().toLowerCase(),
        phone: contact.phone.trim() || undefined,
        phoneExtension: contact.phoneExtension.trim() || undefined,
        position: contact.position.trim() || undefined,
        organizationRoleName: contact.organizationRoleName,
        username: contact.username.trim() || undefined,
      })),
    };
  };

  const saveDraft = async (stageIndex = activeStep) => {
    setDraftSaving(true);
    setDraftError(null);
    try {
      const response = await ownerApi.saveOrganizationDraft({
        idempotencyKey: idempotencyKey || undefined,
        currentStage: wizardSteps[stageIndex]?.id || "canonical",
        stagePayload: form as unknown as Record<string, unknown>,
        consolidatedPayload: buildPayload() as unknown as Record<string, unknown>,
        status: "draft",
        submitStatus: "not_submitted",
      });
      setIdempotencyKey(response.idempotencyKey);
      return response.idempotencyKey;
    } catch (error) {
      setDraftError(error instanceof Error ? error.message : String(error));
      return null;
    } finally {
      setDraftSaving(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    const errors = validate();
    if (errors.length > 0) {
      setSubmitError(errors.join(" "));
      return;
    }

    setSubmitting(true);
    try {
      const key = idempotencyKey || await saveDraft(4);
      const response = await ownerApi.createOrganization({ ...buildPayload(), idempotencyKey: key || undefined });
      setIdempotencyKey(response.idempotencyKey);
      setCreated({
        organizationId: response.data.id,
        organizationName: response.data.name || form.name,
        organizationDescription: response.data.description || form.description || null,
        firstAdminUserId: response.bootstrap?.firstAdminUserId || null,
        assignedOrganizationRole: response.bootstrap?.assignedOrganizationRole || null,
        idempotencyKey: response.idempotencyKey,
        administrativeContactAssignments:
          response.bootstrap?.administrativeContactAssignments || [],
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : String(error));
    } finally {
      setSubmitting(false);
    }
  };

  const templateStatus = templateLoading ? "unknown" : template?.ready ? "success" : "warning";
  const isLastStep = activeStep === wizardSteps.length - 1;
  const goNext = () => { void saveDraft(activeStep); setActiveStep((current) => Math.min(current + 1, wizardSteps.length - 1)); };
  const goBack = () => setActiveStep((current) => Math.max(current - 1, 0));

  return (
    <OwnerShell>
      <PageHeader
        eyebrow="Provisioning workspace"
        title="Create organization"
        description="Workspace enfocado en provisioning: template status, organización canónica, custom data, usuarios administrativos, segmentación y submit. La navegación primaria permanece en el shell owner."
      />

      {templateError ? <AlertStrip variant="danger" title="Organization template unavailable">Could not load the organization template from the API. {templateError}</AlertStrip> : null}
      {draftError ? <AlertStrip variant="warning" title="Draft not saved">{draftError}</AlertStrip> : null}
      {idempotencyKey ? <AlertStrip variant="info" title="Wizard request identifier">Idempotency key: <code>{idempotencyKey}</code>. Civitas stores this as operational draft/resume state; Logto remains canonical for the organization.</AlertStrip> : null}

      {created ? (
        <AlertStrip variant="success" title="Organization created in Logto">
          <p><strong>{created.organizationName}</strong> exists in Logto. Civitas keeps the idempotency key and operation history for traceability only.</p>
          <p>Request identifier: <code>{created.idempotencyKey}</code></p>
          <div className="civitas-grid-2">
            <div>
              <strong>Bootstrap</strong>
              <p>First admin user id: {created.firstAdminUserId || "-"}</p>
              <p>Assigned organization role: {created.assignedOrganizationRole || "-"}</p>
            </div>
            <div>
              <strong>Administrative assignments</strong>
              <ul>
                {created.administrativeContactAssignments.map((assignment) => (
                  <li key={`${assignment.email}-${assignment.logtoUserId}`}>{assignment.email} · {assignment.roleName} · {assignment.userCreated ? "new user" : assignment.userSource}</li>
                ))}
              </ul>
            </div>
          </div>
        </AlertStrip>
      ) : null}

      <form onSubmit={handleSubmit} className="civitas-stack" data-civitas-create-organization-wizard="true">
        <SectionCard className="civitas-wizard-progress-card">
          <Stepper steps={wizardSteps.map((step) => ({ id: step.id, label: step.label }))} activeStep={activeStep} />
        </SectionCard>

        {activeStep === 0 ? (
          <StepCanonicalOrganization
            form={form}
            adminRoleOptions={adminRoleOptions}
            templateLoading={templateLoading}
            updateField={updateField}
            inputClassName={inputClassName}
          />
        ) : null}

        {activeStep === 1 ? (
          <StepBusinessProfile
            form={form}
            selectedCountry={selectedCountry}
            regionOptions={regionOptions}
            cityOptions={cityOptions}
            updateBusinessField={updateBusinessField}
            updateCountryField={updateCountryField}
            updateStateField={updateStateField}
            inputClassName={inputClassName}
          />
        ) : null}

        {activeStep === 2 ? (
          <StepAdminUsers
            contacts={form.administrativeContacts}
            adminRoleOptions={adminRoleOptions}
            templateLoading={templateLoading}
            updateContact={updateContact}
            addContact={addContact}
            removeContact={removeContact}
            inputClassName={inputClassName}
          />
        ) : null}

        {activeStep === 3 ? (
          <StepSegmentation form={form} setForm={setForm} inputClassName={inputClassName} />
        ) : null}

        {activeStep === 4 ? (
          <StepReview form={form} template={template} templateLoading={templateLoading} submitError={submitError} />
        ) : null}

        <ActionBar sticky>
          <StatusPill status={templateStatus} noDot>Template: {templateLoading ? "loading" : template?.ready ? "ready" : "not ready"}</StatusPill>
          <div className="civitas-action-bar">
            <button type="button" className={secondaryButtonClassName} onClick={goBack} disabled={activeStep === 0}>Back</button>
            {!isLastStep ? <button type="button" className={primaryButtonClassName} onClick={goNext}>{draftSaving ? "Saving draft..." : "Save draft & next"}</button> : null}
            {isLastStep ? <button type="submit" disabled={!canSubmit} className={primaryButtonClassName}>{submitting ? "Creating organization..." : "Create organization"}</button> : null}
          </div>
        </ActionBar>
      </form>
    </OwnerShell>
  );
};


type UpdateField = <K extends keyof FormState>(field: K, value: FormState[K]) => void;
type UpdateBusinessField = <K extends keyof FormState["business"]>(field: K, value: string) => void;

const StepCanonicalOrganization = ({ form, adminRoleOptions, templateLoading, updateField, inputClassName }: { form: FormState; adminRoleOptions: OrganizationTemplateRole[]; templateLoading: boolean; updateField: UpdateField; inputClassName: string }) => (
  <SectionCard title="Identity & routing" description="Created canonically in Logto; configure display name, entry URL, provisioning domain and default role.">
    <div className="civitas-form-grid">
      <FormField id="organization-name" label="Organization name" required><input id="organization-name" className={inputClassName} value={form.name} onChange={(event) => updateField("name", event.target.value)} /></FormField>
      <FormField id="organization-description" label="Description"><input id="organization-description" className={inputClassName} value={form.description} onChange={(event) => updateField("description", event.target.value)} /></FormField>
      <FormField id="app-subdomain" label="Application subdomain" required><input id="app-subdomain" className={inputClassName} value={form.appSubdomain} onChange={(event) => updateField("appSubdomain", event.target.value)} placeholder="school-demo" /></FormField>
      <FormField id="app-base-domain" label="Application base domain" required><select id="app-base-domain" className={inputClassName} value={form.appBaseDomain} onChange={(event) => updateField("appBaseDomain", event.target.value)}>{APP_BASE_DOMAINS.map((domain) => <option value={domain} key={domain}>{domain}</option>)}</select></FormField>
      <FormField id="admin-domain" label="Institutional provisioning domain" required><input id="admin-domain" className={inputClassName} value={form.adminDomain} onChange={(event) => updateField("adminDomain", event.target.value)} placeholder="school.edu.co" /></FormField>
      <FormField id="jit-default-role" label="JIT default role"><select id="jit-default-role" className={inputClassName} value={form.jitDefaultRoleName} onChange={(event) => updateField("jitDefaultRoleName", event.target.value)} disabled={templateLoading || adminRoleOptions.length === 0}><option value="">No JIT default role</option>{adminRoleOptions.map((role) => <option key={role.id} value={role.name}>{role.name}</option>)}</select></FormField>
    </div>
    <AlertStrip variant="neutral" title="Entry URL preview">{form.appSubdomain && form.appBaseDomain ? `https://${form.appSubdomain}.${form.appBaseDomain}` : "Pending subdomain and domain"}</AlertStrip>
  </SectionCard>
);

const StepBusinessProfile = ({ form, selectedCountry, regionOptions, cityOptions, updateBusinessField, updateCountryField, updateStateField, inputClassName }: { form: FormState; selectedCountry: GeographyCountry | null; regionOptions: readonly GeographyRegion[]; cityOptions: readonly string[]; updateBusinessField: UpdateBusinessField; updateCountryField: (countryCode: string) => void; updateStateField: (stateCode: string) => void; inputClassName: string }) => (
  <SectionCard title="Profile fields" description="Populate custom data attached to the canonical organization record.">
    <AlertStrip variant="info">Country drives the phone prefix suggestion plus dependent region and city lists.</AlertStrip>
    <div className="civitas-form-grid">
      <FormField id="business-website" label="Website"><input id="business-website" className={inputClassName} value={form.business.website} onChange={(event) => updateBusinessField("website", event.target.value)} /></FormField>
      <FormField id="business-country" label="Country"><select id="business-country" className={inputClassName} value={form.business.country} onChange={(event) => updateCountryField(event.target.value)}>{COUNTRY_OPTIONS.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}</select></FormField>
      <FormField id="business-state" label={selectedCountry?.regionLabel || "State / region"}><select id="business-state" className={inputClassName} value={form.business.state} onChange={(event) => updateStateField(event.target.value)}><option value="">Select {selectedCountry?.regionLabel?.toLowerCase() || "region"}</option>{regionOptions.map((region) => <option key={region.code} value={region.code}>{region.name}</option>)}</select></FormField>
      <FormField id="business-city" label="City"><select id="business-city" className={inputClassName} value={form.business.city} onChange={(event) => updateBusinessField("city", event.target.value)} disabled={cityOptions.length === 0}><option value="">Select city</option>{cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}</select></FormField>
      <FormField id="postal-code" label="Postal code"><input id="postal-code" className={inputClassName} value={form.business.postalCode} onChange={(event) => updateBusinessField("postalCode", event.target.value)} /></FormField>
      <FormField id="employee-count" label="Number of employees"><input id="employee-count" className={inputClassName} value={form.business.numberOfEmployees} onChange={(event) => updateBusinessField("numberOfEmployees", event.target.value)} /></FormField>
      <FormField id="industry" label="Industry"><input id="industry" className={inputClassName} value={form.business.industry} onChange={(event) => updateBusinessField("industry", event.target.value)} /></FormField>
      <FormField id="organization-type" label="Organization type"><input id="organization-type" className={inputClassName} value={form.business.type} onChange={(event) => updateBusinessField("type", event.target.value)} /></FormField>
      <FormField id="tax-id" label="Tax id / NIT"><input id="tax-id" className={inputClassName} value={form.business.nit} onChange={(event) => updateBusinessField("nit", event.target.value)} /></FormField>
      <FormField id="verification-digit" label="Verification digit"><input id="verification-digit" className={inputClassName} value={form.business.verificationDigit} onChange={(event) => updateBusinessField("verificationDigit", event.target.value)} /></FormField>
      <FormField id="address-line-1" label="Address line 1" className="civitas-form-field-wide"><input id="address-line-1" className={inputClassName} value={form.business.addressLine1} onChange={(event) => updateBusinessField("addressLine1", event.target.value)} /></FormField>
      <FormField id="address-line-2" label="Address line 2" className="civitas-form-field-wide"><input id="address-line-2" className={inputClassName} value={form.business.addressLine2} onChange={(event) => updateBusinessField("addressLine2", event.target.value)} /></FormField>
      <FormField id="business-about" label="About" className="civitas-form-field-wide"><textarea id="business-about" className={inputClassName} value={form.business.about} onChange={(event) => updateBusinessField("about", event.target.value)} /></FormField>
    </div>
  </SectionCard>
);

const StepAdminUsers = ({ contacts, adminRoleOptions, templateLoading, updateContact, addContact, removeContact, inputClassName }: { contacts: AdministrativeContact[]; adminRoleOptions: OrganizationTemplateRole[]; templateLoading: boolean; updateContact: (id: string, field: keyof AdministrativeContact, value: string) => void; addContact: () => void; removeContact: (id: string) => void; inputClassName: string }) => (
  <SectionCard title="User bootstrap" description="Provision or resolve Logto users, add them to the organization and assign roles.">
    <div className="civitas-stack">
      {contacts.map((contact, index) => (
        <SectionCard key={contact.id} title={`Administrative contact ${index + 1}`} description="Users created here keep the custom data flow intact when sent to Logto." actions={contacts.length > 1 ? <button type="button" onClick={() => removeContact(contact.id)} className="civitas-secondary-button">Remove</button> : null}>
          <div className="civitas-form-grid">
            <FormField id={`${contact.id}-first-name`} label="First name" required><input id={`${contact.id}-first-name`} className={inputClassName} value={contact.firstName} onChange={(event) => updateContact(contact.id, "firstName", event.target.value)} /></FormField>
            <FormField id={`${contact.id}-middle-name`} label="Middle name"><input id={`${contact.id}-middle-name`} className={inputClassName} value={contact.middleName} onChange={(event) => updateContact(contact.id, "middleName", event.target.value)} /></FormField>
            <FormField id={`${contact.id}-first-surname`} label="First surname" required><input id={`${contact.id}-first-surname`} className={inputClassName} value={contact.firstSurname} onChange={(event) => updateContact(contact.id, "firstSurname", event.target.value)} /></FormField>
            <FormField id={`${contact.id}-second-surname`} label="Second surname"><input id={`${contact.id}-second-surname`} className={inputClassName} value={contact.secondSurname} onChange={(event) => updateContact(contact.id, "secondSurname", event.target.value)} /></FormField>
            <FormField id={`${contact.id}-email`} label="Email" required><input id={`${contact.id}-email`} className={inputClassName} type="email" value={contact.email} onChange={(event) => updateContact(contact.id, "email", event.target.value)} /></FormField>
            <FormField id={`${contact.id}-phone`} label="Phone"><input id={`${contact.id}-phone`} className={inputClassName} value={contact.phone} onChange={(event) => updateContact(contact.id, "phone", event.target.value)} /></FormField>
            <FormField id={`${contact.id}-extension`} label="Extension"><input id={`${contact.id}-extension`} className={inputClassName} value={contact.phoneExtension} onChange={(event) => updateContact(contact.id, "phoneExtension", event.target.value)} /></FormField>
            <FormField id={`${contact.id}-position`} label="Position"><input id={`${contact.id}-position`} className={inputClassName} value={contact.position} onChange={(event) => updateContact(contact.id, "position", event.target.value)} /></FormField>
            <FormField id={`${contact.id}-role`} label="Organization role" required><select id={`${contact.id}-role`} className={inputClassName} value={contact.organizationRoleName} onChange={(event) => updateContact(contact.id, "organizationRoleName", event.target.value)} disabled={templateLoading || adminRoleOptions.length === 0}><option value="">Select Logto organization role</option>{adminRoleOptions.map((role) => <option key={`${contact.id}-${role.id}`} value={role.name}>{role.name}</option>)}</select></FormField>
            <FormField id={`${contact.id}-username`} label="Username"><input id={`${contact.id}-username`} className={inputClassName} value={contact.username} onChange={(event) => updateContact(contact.id, "username", event.target.value)} /></FormField>
          </div>
        </SectionCard>
      ))}
      <div><button type="button" onClick={addContact} className="civitas-secondary-button">Add another administrative user</button></div>
    </div>
  </SectionCard>
);

const StepSegmentation = ({ form, setForm, inputClassName }: { form: FormState; setForm: Dispatch<SetStateAction<FormState>>; inputClassName: string }) => (
  <SectionCard title="Tags and lists" description="Store clean segmentation metadata for later connector orchestration.">
    <div className="civitas-form-grid">
      <FormField id="segmentation-tags" label="Tags"><input id="segmentation-tags" className={inputClassName} value={form.segmentation.tags.join(", ")} onChange={(event) => setForm((current) => ({ ...current, segmentation: { ...current.segmentation, tags: parseDelimitedValues(event.target.value) } }))} placeholder="school, k12, premium" /></FormField>
      <FormField id="segmentation-lists" label="Lists"><input id="segmentation-lists" className={inputClassName} value={form.segmentation.lists.join(", ")} onChange={(event) => setForm((current) => ({ ...current, segmentation: { ...current.segmentation, lists: parseDelimitedValues(event.target.value) } }))} placeholder="north-region, onboarding" /></FormField>
    </div>
  </SectionCard>
);

const StepReview = ({ form, template, templateLoading, submitError }: { form: FormState; template: OrganizationTemplateResponse | null; templateLoading: boolean; submitError: string | null }) => (
  <SectionCard title="Final confirmation" description="Review canonical organization, users, segmentation and template readiness before provisioning.">
    <div className="civitas-grid-2">
      <div><strong>Organization</strong><p>{form.name || "Unnamed organization"}</p><p>{form.appSubdomain && form.appBaseDomain ? `${form.appSubdomain}.${form.appBaseDomain}` : "Entry URL pending"}</p></div>
      <div><strong>Template</strong><p>{templateLoading ? "loading" : template?.ready ? "ready" : "not ready"}</p>{!templateLoading && template && (template.missingRoleNames || []).length > 0 ? <p>Missing roles: {(template.missingRoleNames || []).join(", ")}</p> : null}</div>
      <div><strong>Administrative users</strong><p>{form.administrativeContacts.length} contact(s)</p></div>
      <div><strong>Segmentation</strong><p>Tags: {form.segmentation.tags.join(", ") || "-"}</p><p>Lists: {form.segmentation.lists.join(", ") || "-"}</p></div>
    </div>
    {submitError ? <AlertStrip variant="danger" title="Cannot submit organization">{submitError}</AlertStrip> : null}
  </SectionCard>
);

export default OwnerOrganizationsPage;
