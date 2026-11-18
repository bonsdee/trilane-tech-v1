import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { setPassword } from '../../api/auth';
import { errorCode, errorMessage, fieldErrors } from '../../api/client';
import Button from '../../components/Button';
import Field from '../../components/Field';
import { Notice } from '../../components/States';
import { hasErrors, validateNewPassword } from '../../utils/validation';
import AuthShell from './AuthShell';
import shell from './AuthShell.module.css';

export default function SetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const isInvite = params.get('type') === 'invite';
  const [password, setPasswordValue] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [expired, setExpired] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const found = validateNewPassword(password, confirm);
    setErrors(found);
    setError(null);
    if (hasErrors(found)) return;
    setBusy(true);
    try {
      await setPassword(token, password);
      setDone(true);
    } catch (e) {
      if (errorCode(e) === 'INVALID_TOKEN') setExpired(true);
      setErrors(fieldErrors(e));
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const title = isInvite ? 'Welcome to the dashboard' : 'Choose a new password';

  if (!token || expired) {
    return (
      <AuthShell title="This link doesn't work" metaTitle="Set password">
        <Notice tone="danger">This link is invalid or has expired. Invite links last 72 hours and reset links last 1 hour.</Notice>
        <div className={shell.links}>
          <Link to="/admin/forgot-password">Request a new reset link</Link>
          <Link to="/admin/login">Sign in</Link>
        </div>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell title="Password set" metaTitle="Set password">
        <Notice tone="success">Your password is set. You can sign in now.</Notice>
        <Button size="lg" to="/admin/login">
          Go to sign in
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={title} metaTitle="Set password" intro="Use at least 10 characters. A short phrase is easier to remember than a jumble of symbols.">
      <form onSubmit={submit} noValidate style={{ display: 'grid', gap: 'var(--space-2)' }}>
        {error && <Notice tone="danger">{error}</Notice>}
        <Field label="New password" type="password" name="password" autoComplete="new-password" required value={password} onChange={(e) => setPasswordValue(e.target.value)} error={errors.password} maxLength={72} />
        <Field label="Confirm password" type="password" name="confirm" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} maxLength={72} />
        <Button type="submit" size="lg" loading={busy}>
          Set password
        </Button>
      </form>
    </AuthShell>
  );
}
