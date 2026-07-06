import { useLogto } from "@logto/react";
import { getCivitasSignInOptions } from "../../auth/logtoConfig";
import { PublicLayout } from "../../layouts/PublicLayout";
import { KpiGrid, SectionCard } from "../../shared/ui";
import { primaryButtonClassName, secondaryButtonClassName } from "../../components/owner/OwnerUI";

const Landing = () => {
  const { signIn } = useLogto();
  const startSignIn = (firstScreen?: "register") => {
    signIn(getCivitasSignInOptions(firstScreen));
  };

  return (
    <PublicLayout
      actions={
        <div className="civitas-action-bar">
          <button className={secondaryButtonClassName} onClick={() => startSignIn()}>Sign in</button>
          <button className={primaryButtonClassName} onClick={() => startSignIn("register")}>Request access</button>
        </div>
      }
    >
      <SectionCard className="civitas-page-header">
        <p className="civitas-eyebrow">Civitas public portal</p>
        <h1 className="civitas-page-title">Operational governance for real organizations.</h1>
        <p className="civitas-page-description">
          Civitas connects the public entry point, global owner operations, and tenant workspaces through one canonical interface. Identity, organizations, memberships, roles, and permissions remain governed by Logto; Civitas keeps the local operational state and runtime visibility.
        </p>
        <div className="civitas-action-bar civitas-hero-actions">
          <button className="btn-civitas btn-primary" onClick={() => startSignIn()}>Enter Civitas</button>
          <button className="btn-civitas btn-secondary" onClick={() => startSignIn("register")}>Request access</button>
        </div>
      </SectionCard>

      <KpiGrid cols={3}>
        <CapabilityCard title="Owner global" description="Operational overview, organization provisioning, runtime health, and cross-tenant observability." />
        <CapabilityCard title="Organization admin" description="Tenant administration stays scoped to the selected Logto organization context." />
        <CapabilityCard title="Organization member" description="Workspace capabilities are resolved from organization tokens and tenant memberships." />
      </KpiGrid>
    </PublicLayout>
  );
};

const CapabilityCard = ({ title, description }: { title: string; description: string }) => (
  <SectionCard title={title} description={description}> </SectionCard>
);

export default Landing;
