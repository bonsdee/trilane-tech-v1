import { useState } from 'react';
import Button from './Button';
import Modal from './Modal';
import { Notice } from './States';
import { errorMessage } from '../api/client';

/** Asks before a destructive action and shows any error from it. */
export default function ConfirmDialog({ open, title, children, confirmLabel = 'Delete', tone = 'danger', onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const close = () => {
    if (busy) return;
    setError(null);
    onClose();
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      setBusy(false);
      onClose();
    } catch (e) {
      setBusy(false);
      setError(errorMessage(e));
    }
  };

  return (
    <Modal
      open={open}
      title={title}
      onClose={close}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={confirm} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        <div className="muted">{children}</div>
        {error && <Notice tone="danger">{error}</Notice>}
      </div>
    </Modal>
  );
}
