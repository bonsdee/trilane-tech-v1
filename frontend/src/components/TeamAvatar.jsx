import { fileUrl } from '../api/client';
import { initials } from '../utils/format';
import styles from './TeamAvatar.module.css';

/**
 * Photo if one is uploaded, otherwise initials on a teal tile. `pattern`
 * (0, 1 or 2) gives each person a different line pattern, echoing the
 * three-lane mark, so placeholder tiles don't look identical.
 */
export default function TeamAvatar({ name, photoUrl, size = 'md', pattern }) {
  const patternClass = pattern === undefined ? '' : styles[`pattern${pattern % 3}`];
  return (
    <div className={`${styles.avatar} ${styles[size]} ${photoUrl ? '' : patternClass}`}>
      {photoUrl ? <img src={fileUrl(photoUrl)} alt="" loading="lazy" /> : <span aria-hidden="true">{initials(name)}</span>}
    </div>
  );
}
