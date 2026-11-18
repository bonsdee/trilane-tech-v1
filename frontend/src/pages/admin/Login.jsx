import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { errorMessage } from '../../api/client';
import Button from '../../components/Button';
import Field from '../../components/Field';
import { Notice } from '../../components/States';
import { LoadingBlock } from '../../components/Spinner';
import { useAuth } from '../../hooks/useAuth';
import AuthShell from './AuthShell';
import shell from './AuthShell.module.css';

export default function Login() {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const from = location.state?.from && location.state.from.startsWith('/admin') ? location.state.from : '/admin';

  if (status === 'loading') return <LoadingBlock label="Checking your session…" />;
  if (status === 'authenticated') return <Navigate to={from} replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Sign in" intro="Trilane Tech team dashboard.">
      <form onSubmit={submit} noValidate style={{ display: 'grid', gap: 'var(--space-2)' }}>
        {error && <Notice tone="danger">{error}</Notice>}
        <Field label="Email" type="email" name="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Password" type="password" name="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" size="lg" loading={busy}>
          Sign in
        </Button>
      </form>
      <div className={shell.links}>
        <Link to="/admin/forgot-password">Forgot password?</Link>
        <Link to="/">Back to the website</Link>
      </div>
    </AuthShell>
  );
}
