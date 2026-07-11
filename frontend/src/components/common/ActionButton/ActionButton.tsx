import type { ButtonHTMLAttributes } from "react";
import type { Icon } from "@tabler/icons-react";
import styles from "./ActionButton.module.css";

type ActionButtonVariant = "primary" | "secondary" | "outline";

type ActionButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
  label: string;
  icon: Icon;
  variant?: ActionButtonVariant;
};

export const ActionButton = ({
  label,
  icon: Icon,
  variant = "secondary",
  type = "button",
  title,
  ...buttonProps
}: ActionButtonProps) => {
  return (
    <button
      {...buttonProps}
      type={type}
      className={`${styles.actionButton} ${styles[variant]}`}
      title={title ?? label}
      aria-label={buttonProps["aria-label"] ?? label}
    >
      <Icon size={20} aria-hidden="true" stroke={1.8} />
      <span className={styles.label}>{label}</span>
    </button>
  );
};
