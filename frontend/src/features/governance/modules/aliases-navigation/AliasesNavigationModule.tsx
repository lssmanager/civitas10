import { useMemo, useState } from "react";
import { EmptyState, SectionCard } from "../../../../shared/ui";
import type { GovernanceAliasNavigationPolicy, GovernanceSurface } from "../../contracts";

type AliasRow = NonNullable<GovernanceAliasNavigationPolicy["aliases"]>[number];

const aliasValue = (alias: AliasRow, drafts: Record<string, string>) => drafts[alias.roleId] ?? alias.displayName ?? alias.defaultLabel ?? "";

export const AliasesNavigationModule = ({ policy }: { policy: GovernanceAliasNavigationPolicy; surface?: GovernanceSurface }) => {
  const aliases = useMemo(() => policy.aliases ?? [], [policy.aliases]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  if (!aliases.length) {
    return (
      <SectionCard title="Role names" description="Alias visuales para roles canónicos (ID inmutable).">
        <EmptyState message="No hay roles disponibles">
          <p className="text-sm text-muted-strong">No se recibieron roles para editar alias visuales.</p>
        </EmptyState>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Role names" description="Alias visuales para roles canónicos (ID inmutable).">
      <div className="civitas-workspace-stack">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                <th scope="col" className="px-3 py-2">Rol canónico (Logto)</th>
                <th scope="col" className="px-3 py-2">Alias visual</th>
              </tr>
            </thead>
            <tbody>
              {aliases.map((alias) => (
                <tr key={alias.roleId} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-3 align-middle font-mono text-xs text-muted-strong" title={alias.canonicalKey}>{alias.roleId}</td>
                  <td className="px-3 py-3 align-middle">
                    <input
                      className="civitas-field"
                      value={aliasValue(alias, drafts)}
                      maxLength={80}
                      onChange={(event) => {
                        setMessage(null);
                        setDrafts((current) => ({ ...current, [alias.roleId]: event.target.value }));
                      }}
                      aria-label={`Alias visual para ${alias.roleId}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {message ? <p className="text-sm text-muted-strong" aria-live="polite">{message}</p> : null}
        <div className="civitas-action-bar">
          <button type="button" className="civitas-primary-button" onClick={() => setMessage("Todavía no conectado al backend.")}>Guardar alias</button>
        </div>
      </div>
    </SectionCard>
  );
};
