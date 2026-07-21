import type { ReactNode } from "react";
import { SplitView } from "../SplitView";

export const HierarchyWorkbench = ({ canvas, inspector, toolbar }: { canvas: ReactNode; inspector: ReactNode; toolbar?: ReactNode }) => (
  <section className="civitas-workspace-stack" data-civitas-pattern="hierarchy-workbench">
    {toolbar ? <div className="civitas-card civitas-pad-tight">{toolbar}</div> : null}
    <SplitView label="Hierarchy workbench" list={canvas} detail={inspector} />
  </section>
);
