import { useLogto } from "@logto/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMe, type MeResponse } from "../../api/me";
import { useOwnerApi, type OwnerOrganization } from "../../api/owner";
import { APP_ENV } from "../../env";
import { evaluateCapabilityRule, RBACMatrix } from "../../authz/rbacMatrix";
import Topbar from "../../components/Topbar";
import { appRoutes } from "../../navigation/routes";

type OrganizationCard = {
  id: string;
  name: string;
  description: string | null;
  role?: string;
};

const toOrganizationCards = (organizations: OwnerOrganization[]): OrganizationCard[] =>
  organizations
    .map((organization) => ({
      id: organization.logtoOrganizationId || "",
      name:
        organization.name ||
        (typeof organization.logtoOrganization?.name === "string"
          ? organization.logtoOrganization.name
          : null) ||
        "Untitled organization",
      description:
        typeof organization.logtoOrganization?.description === "string"
          ? organization.logtoOrganization.description
          : null,
      role: "Admin-org",
    }))
    .filter((organization) => Boolean(organization.id));

const Dashboard = () => {
  const { isAuthenticated, getAccessToken } = useLogto();
  const ownerApi = useOwnerApi();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<OrganizationCard[]>([]);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardState = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);

    try {
      const accessToken = await getAccessToken(APP_ENV.api.url);
      if (!accessToken) throw new Error("No API access token returned by Logto");

      const meResponse = await getMe(accessToken);
      setMe(meResponse);

      const canCreateOrganizations = evaluateCapabilityRule(
        RBACMatrix.capabilities.canCreateOrganizations,
        meResponse,
      );

      if (canCreateOrganizations) {
        const organizationsResponse = await ownerApi.getOrganizations();
        setOrganizations(toOrganizationCards(organizationsResponse.organizations));
      } else {
        setOrganizations([]);
      }
    } catch (loadError) {
      console.error("Failed to load Civitas owner dashboard:", loadError);
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, isAuthenticated, ownerApi]);

  useEffect(() => {
    void loadDashboardState();
  }, [loadDashboardState]);

  const canCreateOrganizations = evaluateCapabilityRule(
    RBACMatrix.capabilities.canCreateOrganizations,
    me ?? undefined,
  );

  const summary = useMemo(
    () => ({
      totalOrganizations: organizations.length,
      ownerGlobal: Boolean(me?.auth.owner.canReadOwner),
      globalRoles: me?.auth.globalRoles ?? [],
    }),
    [me, organizations.length],
  );

  const handleOrgClick = (orgId: string) => navigate(`/${orgId}`);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Topbar />
      <div className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-700">Owner global workspace</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">Civitas foundation</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                This dashboard now reads owner authority from <code>/me</code> and organizations from the owner API. It no longer treats <code>organization_data</code> as the source of truth.
              </p>
            </div>
            {canCreateOrganizations && (
              <Link
                to={appRoutes.ownerOrganizations.path}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Create organization
              </Link>
            )}
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Could not load the owner state from the API. {error}
            </div>
          )}

          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-medium text-slate-500">Owner authority</div>
              <div className="mt-3 text-2xl font-semibold text-slate-900">{summary.ownerGlobal ? "Validated" : "Unavailable"}</div>
              <div className="mt-2 text-sm text-slate-600">Resolved from global roles in Logto through <code>/me</code>.</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-medium text-slate-500">Organizations in API</div>
              <div className="mt-3 text-2xl font-semibold text-slate-900">{loading ? "…" : summary.totalOrganizations}</div>
              <div className="mt-2 text-sm text-slate-600">Fetched from the owner organizations endpoint backed by canonical Logto organizations.</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-medium text-slate-500">Global roles</div>
              <div className="mt-3 text-sm font-medium text-slate-900">{summary.globalRoles.length > 0 ? summary.globalRoles.join(", ") : "No global roles loaded"}</div>
              <div className="mt-2 text-sm text-slate-600">The clean owner flow only unlocks organization creation when <code>owner_global</code> is present.</div>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
              Loading owner authority from <code>/me</code> and canonical organizations from the API...
            </div>
          ) : organizations.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">No organizations visible yet</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                If organizations already exist in Logto, this state means the owner listing still needs attention. If you are starting from scratch, continue with the clean owner provisioning page to create the first organization, its administrative users, and the custom data payload that Civitas must preserve.
              </p>
              {canCreateOrganizations ? (
                <div className="mt-6">
                  <Link
                    to={appRoutes.ownerOrganizations.path}
                    className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                  >
                    Open full organization form
                  </Link>
                </div>
              ) : (
                <div className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Your session is authenticated but it does not have the <code>owner_global</code> role required to create organizations.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xl font-semibold text-slate-900">Organizations</h3>
                {canCreateOrganizations && (
                  <Link to={appRoutes.ownerOrganizations.path} className="text-sm font-medium text-blue-700 hover:text-blue-800">
                    Create another organization
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleOrgClick(org.id)}
                    className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-lg font-semibold text-slate-900">{org.name}</h4>
                      {org.role && (
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                          {org.role}
                        </span>
                      )}
                    </div>
                    {org.description && (
                      <p className="mt-3 text-sm leading-6 text-slate-600">{org.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
