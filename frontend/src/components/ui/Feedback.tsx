import { ReactNode } from 'react';
import styles from './ui.module.css';

export function Spinner({ dark = false }: { dark?: boolean }) {
  return <span className={[styles.spinner, dark ? styles.spinnerDark : ''].filter(Boolean).join(' ')} aria-hidden />;
}

export function Skeleton({ height = 16, width = '100%', radius }: { height?: number | string; width?: number | string; radius?: number }) {
  return (
    <span
      className={styles.skeleton}
      style={{ display: 'block', height, width, borderRadius: radius }}
      aria-hidden
    />
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.state}>
      <h3 className={styles.stateTitle}>{title}</h3>
      {message ? <p className={styles.stateText}>{message}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  action,
}: {
  title?: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.state}>
      <h3 className={styles.stateTitle}>{title}</h3>
      {message ? <p className={styles.stateText}>{message}</p> : null}
      {action}
    </div>
  );
}
