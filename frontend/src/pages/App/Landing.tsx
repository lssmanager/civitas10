import { useLogto } from "@logto/react";
import { APP_ENV } from "../../env";
import { PublicLayout } from "../../components/layout/AppShell";
import { SectionCard, primaryButtonClassName, secondaryButtonClassName } from "../../components/owner/OwnerUI";

const Landing = () => {
  const { signIn } = useLogto();
  const startSignIn = (firstScreen?: "register") => {
    signIn({
      redirectUri: APP_ENV.app.redirectUri,
      ...(firstScreen ? { firstScreen } : {}),
    });
  };

  return (
    <PublicLayout
      actions={
        <div className="flex items-center gap-3">
          <button className={secondaryButtonClassName} onClick={() => startSignIn()}>Sign in</button>
          <button className={primaryButtonClassName} onClick={() => startSignIn("register")}>Request access</button>
        </div>
      }
    >
      <SectionCard className="civitas-page-header" >
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
          <div>
            <p className="civitas-eyebrow">Civitas public portal</p>
            <h1 className="civitas-page-title text-4xl lg:text-5xl">Operational governance for real organizations.</h1>
            <p className="civitas-page-description mt-4 text-base">
              Civitas connects the public entry point, global owner operations, and tenant workspaces through one canonical interface. Identity, organizations, memberships, roles, and permissions remain governed by Logto; Civitas keeps the local operational state and runtime visibility.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button className={primaryButtonClassName} onClick={() => startSignIn()}>Enter Civitas</button>
              <button className={secondaryButtonClassName} onClick={() => startSignIn("register")}>Request access</button>
            </div>
          </div>
          <div className="grid gap-3">
            <CapabilityCard title="Owner global" description="Operational overview, organization provisioning, runtime health, and cross-tenant observability." />
            <CapabilityCard title="Organization admin" description="Tenant administration stays scoped to the selected Logto organization context." />
            <CapabilityCard title="Organization member" description="Workspace capabilities are resolved from organization tokens and tenant memberships." />
          </div>
        </div>
      </SectionCard>
    </PublicLayout>
  );
};

const CapabilityCard = ({ title, description }: { title: string; description: string }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
    <h2 className="font-semibold text-slate-950">{title}</h2>
    <p className="mt-2 text-sm text-slate-600">{description}</p>
  </div>
);

export default Landing;
