import { IconLogin2, IconLogout, IconUserPlus } from "@tabler/icons-react";
import { ActionButton } from "../../common/ActionButton";

type TopBarActionButtonProps = {
  onAction: () => void;
};

export const SignOutActionButton = ({ onAction }: TopBarActionButtonProps) => (
  <ActionButton label="Sign out" icon={IconLogout} onClick={onAction} variant="secondary" />
);

export const SignInActionButton = ({ onAction }: TopBarActionButtonProps) => (
  <ActionButton label="Sign in" icon={IconLogin2} onClick={onAction} variant="secondary" />
);

export const RequestAccessActionButton = ({ onAction }: TopBarActionButtonProps) => (
  <ActionButton label="Request access" icon={IconUserPlus} onClick={onAction} variant="primary" />
);
