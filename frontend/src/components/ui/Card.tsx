import { ReactNode } from 'react';
import styles from './ui.module.css';

export function Card({
  children,
  hover = false,
  className,
}: {
  children: ReactNode;
  hover?: boolean;
  className?: string;
}) {
  return (
    <div className={[styles.card, hover ? styles.cardHover : '', className ?? ''].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={[styles.cardBody, className ?? ''].filter(Boolean).join(' ')}>{children}</div>;
}
