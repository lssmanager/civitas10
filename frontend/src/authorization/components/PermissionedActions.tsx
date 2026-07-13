import type { ReactNode } from "react";
import type { ActionId } from "../contracts/ids";
import { Can } from "./Can";

export type BoundPermissionedAction<Row> = { actionId: ActionId | string; label: ReactNode; onSelect: (row: Row) => void };
export const PermissionedActions = <Row,>({ row, actions }: { row: Row; actions: readonly BoundPermissionedAction<Row>[] }) => <>{actions.map((action) => <Can key={String(action.actionId)} action={action.actionId}><button type="button" className="civitas-secondary-button" onClick={() => action.onSelect(row)}>{action.label}</button></Can>)}</>;
