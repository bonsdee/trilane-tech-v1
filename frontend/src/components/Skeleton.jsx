import styles from './Skeleton.module.css';

/** One grey placeholder shape. Width and height take any CSS length. */
export function Bone({ width = '100%', height = 14, round = false, className = '' }) {
  return (
    <span
      className={`${styles.bone} ${round ? styles.round : ''} ${className}`}
      style={{ width, height: typeof height === 'number' ? `${height}px` : height }}
    />
  );
}

/**
 * Wraps placeholder shapes while content loads. Screen readers hear the label
 * once; the shapes themselves are hidden from them. Pass the page's own grid
 * class so the placeholders take the same layout as the real content.
 */
export function SkeletonGroup({ label = 'Loading…', className = '', children }) {
  return (
    <div className={`${styles.group} ${className}`} role="status" aria-busy="true">
      <span className="visually-hidden">{label}</span>
      {children}
    </div>
  );
}

/** A card outline with a title line and a few text lines. */
export function SkeletonCard({ className = '', lines = 3, title = '55%', children }) {
  return (
    <div className={`${styles.card} ${className}`} aria-hidden="true">
      {title && <Bone width={title} height={20} />}
      {children}
      {Array.from({ length: lines }, (_, i) => (
        <Bone key={i} width={i === lines - 1 ? '68%' : '100%'} />
      ))}
    </div>
  );
}
