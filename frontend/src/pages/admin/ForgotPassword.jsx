import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../api/auth';
import { errorMessage } from '../../api/client';
import Button from '../../components/Button';
import Field from '../../components/Field';
import { Notice } from '../../components/States';
import { validateEmail } from '../../utils/validation';
import AuthShell from './AuthShell';
import shell from './AuthShell.module.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState(null);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const problem = validateEmail(email);
    setFieldError(problem);
    setError(null);
    if (problem) return;
    setBusy(true);
    try {
      const res = await forgotPassword(email.trim());
      setSent(res.message);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Reset your password" intro="Enter your account email and we'll send you a link to choose a new password.">
      {sent ? (
        <Notice tone="success">{sent}</Notice>
      ) : (
        <form onSubmit={submit} noValidate style={{ display: 'grid', gap: 'var(--space-2)' }}>
          {error && <Notice tone="danger">{error}</Notice>}
          <Field label="Email" type="email" name="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} error={fieldError} />
          <Button type="submit" size="lg" loading={busy}>
            Send reset link
          </Button>
        </form>
      )}
      <div className={shell.links}>
        <Link to="/admin/login">Back to sign in</Link>
      </div>
    </AuthShell>
  );
}
