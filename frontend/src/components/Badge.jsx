import styles from './Badge.module.css';

/** Small status label. Tones: neutral, accent, success, warning, danger. */
export default function Badge({ tone = 'neutral', children }) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}

const STATUS_TONES = {
  NEW: 'accent',
  CONTACTED: 'neutral',
  QUALIFIED: 'neutral',
  PROPOSAL_SENT: 'warning',
  WON: 'success',
  LOST: 'danger',
};

export function StatusBadge({ status, label }) {
  return <Badge tone={STATUS_TONES[status] || 'neutral'}>{label || status}</Badge>;
}
