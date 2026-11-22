import { useState } from 'react';
import { errorMessage, fieldErrors } from '../../api/client';
import { inviteUser, listUsers, resendInvite, setUserActive } from '../../api/users';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import Field from '../../components/Field';
import Modal from '../../components/Modal';
import { LoadingBlock } from '../../components/Spinner';
import { ErrorState, Notice } from '../../components/States';
import Table from '../../components/Table';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { formatDateTime } from '../../utils/format';
import { validateEmail } from '../../utils/validation';
import a from './Admin.module.css';

const STATUS = {
  ACTIVE: <Badge tone="success">Active</Badge>,
  INVITED: <Badge tone="warning">Invited</Badge>,
  DEACTIVATED: <Badge tone="danger">Deactivated</Badge>,
};

function InviteDialog({ onClose, onInvited }) {
  const [form, setForm] = useState({ fullName: '', email: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const found = {};
    if (!form.fullName.trim()) found.fullName = "Enter the person's name.";
    const emailProblem = validateEmail(form.email);
    if (emailProblem) found.email = emailProblem;
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setError(null);
    try {
      const user = await inviteUser({ fullName: form.fullName.trim(), email: form.email.trim() });
      onInvited(user);
    } catch (e) {
      setErrors(fieldErrors(e));
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      size="sm"
      title="Invite a team member"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="invite-form" loading={busy}>
            Send invite
          </Button>
        </>
      }
    >
      <form id="invite-form" onSubmit={submit} noValidate className={a.stack}>
        <p className={a.muted}>They'll get an email with a link to set their password. The link works once and expires in 72 hours.</p>
        {error && <Notice tone="danger">{error}</Notice>}
        <Field label="Name" required value={form.fullName} maxLength={120} onChange={(e) => setForm({ ...form, fullName: e.target.value })} error={errors.fullName} />
        <Field label="Email" required type="email" value={form.email} maxLength={254} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
      </form>
    </Modal>
  );
}

export default function UsersAdmin() {
  const { user: me } = useAuth();
  const { data, loading, error, reload } = useFetch(listUsers, []);
  const [inviting, setInviting] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [notice, setNotice] = useState(null);
  const [resending, setResending] = useState(null);

  const resend = async (u) => {
    setResending(u.id);
    setNotice(null);
    try {
      await resendInvite(u.id);
      setNotice({ tone: 'success', text: `A new invite was sent to ${u.email}. Earlier links no longer work.` });
    } catch (e) {
      setNotice({ tone: 'danger', text: errorMessage(e) });
    } finally {
      setResending(null);
    }
  };

  return (
    <>
      <div className={a.pageHead}>
        <div>
          <h1 className={a.pageTitle}>Users</h1>
          <p className={a.pageIntro}>Everyone who can sign in to this dashboard. All users have the Admin role.</p>
        </div>
        <Button onClick={() => setInviting(true)}>Invite someone</Button>
      </div>
      {notice && (
        <div style={{ marginBottom: 'var(--space-2)' }}>
          <Notice tone={notice.tone}>{notice.text}</Notice>
        </div>
      )}
      {loading && <LoadingBlock label="Loading users…" />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && (
        <Table caption="Users" stacked>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Status</th>
              <th scope="col">Last sign-in</th>
              <th scope="col">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className={a.cellMain}>
                    {u.fullName}
                    {u.id === me?.id ? ' (you)' : ''}
                  </div>
                  <div className={a.cellSub}>{u.email}</div>
                </td>
                <td data-label="Status">{STATUS[u.status]}</td>
                <td data-label="Last sign-in" className={a.cellSub}>{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Never'}</td>
                <td data-label="">
                  <div className={a.rowActions}>
                    {u.status === 'INVITED' && (
                      <Button variant="secondary" size="sm" loading={resending === u.id} onClick={() => resend(u)}>
                        Resend invite
                      </Button>
                    )}
                    {u.active ? (
                      <Button variant="ghost" size="sm" disabled={u.id === me?.id} title={u.id === me?.id ? 'You cannot deactivate your own account' : undefined} onClick={() => setToggling(u)}>
                        Deactivate
                      </Button>
                    ) : (
                      <Button variant="secondary" size="sm" onClick={() => setToggling(u)}>
                        Reactivate
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {inviting && (
        <InviteDialog
          onClose={() => setInviting(false)}
          onInvited={(u) => {
            setInviting(false);
            setNotice({ tone: 'success', text: `Invite sent to ${u.email}.` });
            reload();
          }}
        />
      )}
      <ConfirmDialog
        open={Boolean(toggling)}
        title={toggling?.active ? `Deactivate ${toggling?.fullName}?` : `Reactivate ${toggling?.fullName}?`}
        confirmLabel={toggling?.active ? 'Deactivate' : 'Reactivate'}
        tone={toggling?.active ? 'danger' : 'primary'}
        onClose={() => setToggling(null)}
        onConfirm={async () => {
          await setUserActive(toggling.id, !toggling.active);
          reload();
        }}
      >
        {toggling?.active
          ? 'They are signed out everywhere and can no longer sign in. Leads assigned to them stay assigned.'
          : 'They will be able to sign in again with their existing password.'}
      </ConfirmDialog>
    </>
  );
}
