import { useId, useRef, useState } from 'react';
import { errorMessage, fieldErrors, fileUrl } from '../api/client';
import { ACCEPTED_TYPES, MAX_UPLOAD_BYTES, uploadImage } from '../api/files';
import Button from './Button';
import styles from './ImageUpload.module.css';

/**
 * Picks an image, checks type and size, uploads it and reports the stored
 * file back as { id, url }.
 */
export default function ImageUpload({ label, value, onChange, error: outerError }) {
  const id = useId();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const pick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Choose a JPEG, PNG or WebP image.');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError('Images must be 5 MB or smaller.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const stored = await uploadImage(file);
      onChange({ id: stored.id, url: stored.url });
    } catch (e) {
      setError(fieldErrors(e).file || errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const shown = error || outerError;
  return (
    <div className={styles.wrap}>
      <span className={styles.label} id={`${id}-label`}>
        {label}
      </span>
      <div className={styles.row}>
        <div className={styles.preview}>{value?.url ? <img src={fileUrl(value.url)} alt="" /> : <span>No image</span>}</div>
        <div className={styles.actions}>
          <input ref={input} id={id} type="file" accept={ACCEPTED_TYPES.join(',')} onChange={pick} className="visually-hidden" aria-labelledby={`${id}-label`} />
          <Button variant="secondary" size="sm" loading={busy} onClick={() => input.current?.click()}>
            {value?.url ? 'Replace' : 'Upload'}
          </Button>
          {value?.url && (
            <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
              Remove
            </Button>
          )}
        </div>
      </div>
      <p className={styles.hint}>JPEG, PNG or WebP, up to 5 MB.</p>
      {shown && (
        <p className={styles.error} role="alert">
          {shown}
        </p>
      )}
    </div>
  );
}
