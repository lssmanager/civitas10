import { useLogto } from "@logto/react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, type MeResponse } from "../../api/me";
import { useOwnerApi, type OwnerOrganization } from "../../api/owner";
import { APP_ENV } from "../../env";
import { evaluateCapabilityRule, RBACMatrix } from "../../authz/rbacMatrix";
import CreateOrganizationForm from "../../components/CreateOrganizationForm";
import Topbar from "../../components/Topbar";

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
  const [createdOrganization, setCreatedOrganization] = useState<OrganizationCard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardState = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);

    try {
      const accessToken = await getAccessToken(APP_ENV.api.resourceIndicator);
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

  const handleOrgClick = (orgId: string) => navigate(`/${orgId}`);

  const handleCreateSuccess = async (orgId: string, name?: string, description?: string) => {
    setCreatedOrganization({
      id: orgId,
      name: name || "Organización creada",
      description: description || null,
      role: "Admin-org",
    });
    await loadDashboardState();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <div className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Fundación Civitas</h2>
            <p className="mt-1 text-sm text-gray-500">
              Espacio owner global con organizaciones canónicas consultadas por API desde Logto.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              No se pudo cargar el estado owner global. {error}
            </div>
          )}

          {createdOrganization && (
            <div className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
              <h3 className="text-lg font-semibold text-emerald-900">
                Organización creada correctamente
              </h3>
              <p className="mt-2 text-sm text-emerald-800">
                Logto creó <strong>{createdOrganization.name}</strong> y asignó el rol Admin-org al usuario bootstrap.
              </p>
              <button
                onClick={() => handleOrgClick(createdOrganization.id)}
                className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
              >
                Entrar a la organización
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full flex justify-center items-center py-12">
                <div className="text-gray-500">
                  Cargando autoridad owner desde /me y organizaciones reales desde la API...
                </div>
              </div>
            ) : organizations.length === 0 ? (
              <div className="col-span-full">
                <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-6 mb-8 text-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    No hay organizaciones owner visibles todavía
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Esta vista ya no usa organization_data como fuente principal. Consulta la API owner y Logto para listar organizaciones reales.
                  </p>
                </div>
                {canCreateOrganizations ? (
                  <CreateOrganizationForm onSuccess={handleCreateSuccess} />
                ) : (
                  <div className="max-w-2xl mx-auto rounded-xl bg-white p-6 text-center text-sm text-gray-600 shadow-sm">
                    Tu usuario no tiene el rol global owner_global. No se muestran capacidades owner.
                  </div>
                )}
              </div>
            ) : (
              organizations.map((org) => (
                <div
                  key={org.id}
                  onClick={() => handleOrgClick(org.id)}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 p-6 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{org.name}</h3>
                    {org.role && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        {org.role}
                      </span>
                    )}
                  </div>
                  {org.description && (
                    <p className="text-sm text-gray-600 mb-4">{org.description}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
