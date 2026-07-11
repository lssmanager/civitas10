import type { ReactNode } from "react";
import styles from "./TopBar.module.css";

type TopBarProps = {
  left: ReactNode;
  center?: ReactNode;
  right: ReactNode;
};

export const TopBar = ({ left, center, right }: TopBarProps) => {
  return (
    <header className={styles.topbar}>
      <div className={styles.container}>
        <div className={styles.left}>{left}</div>
        {center ? <div className={styles.center}>{center}</div> : null}
        <div className={styles.right}>{right}</div>
      </div>
    </header>
  );
};
