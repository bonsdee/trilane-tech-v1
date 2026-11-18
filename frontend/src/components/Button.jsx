import { Link } from 'react-router-dom';
import styles from './Button.module.css';
import Spinner from './Spinner';

/**
 * Pill-shaped button. Renders a router link when `to` is given, an external
 * link when `href` is given, otherwise a <button>.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  to,
  href,
  loading = false,
  disabled = false,
  arrow = false,
  className = '',
  children,
  type = 'button',
  ...rest
}) {
  const cls = [styles.button, styles[variant], styles[size], className].join(' ');
  const content = (
    <>
      {loading && <Spinner size="sm" label="" />}
      <span>{children}</span>
      {arrow && (
        <span className={styles.arrow} aria-hidden="true">
          →
        </span>
      )}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={cls} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <button type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  );
}
