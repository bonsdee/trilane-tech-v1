import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { errorMessage, fieldErrors } from '../../api/client';
import { addNote, deleteLead, deleteNote, getLead, listNotes, updateLead } from '../../api/leads';
import { listUsers } from '../../api/users';
import { StatusBadge } from '../../components/Badge';
import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import Field from '../../components/Field';
import { LoadingBlock } from '../../components/Spinner';
import { ErrorState, Notice } from '../../components/States';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { formatDate, formatDateTime, LEAD_STATUSES } from '../../utils/format';
import a from './Admin.module.css';
import styles from './LeadDetail.module.css';

function Info({ label, children }) {
  if (!children) return null;
  return (
    <div className={styles.info}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function websiteHref(url) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function TrackingPanel({ lead }) {
  const { user } = useAuth();
  const users = useFetch(listUsers, []);
  const [form, setForm] = useState({ status: lead.status, assignedToId: lead.assignedToId ?? '', followUpOn: lead.followUpOn ?? '' });
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [current, setCurrent] = useState(lead);

  const changed =
    form.status !== current.status ||
    String(form.assignedToId) !== String(current.assignedToId ?? '') ||
    form.followUpOn !== (current.followUpOn ?? '');

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    setMessage(null);
    try {
      const updated = await updateLead(lead.id, {
        status: form.status,
        assignedToId: form.assignedToId === '' ? null : Number(form.assignedToId),
        followUpOn: form.followUpOn || null,
      });
      setCurrent(updated);
      setMessage({ tone: 'success', text: 'Saved.' });
    } catch (e) {
      setErrors(fieldErrors(e));
      setMessage({ tone: 'danger', text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  const assignable = (users.data || []).filter((u) => u.active || u.id === current.assignedToId);

  return (
    <form onSubmit={save} className={`${styles.panel} ${a.stack}`}>
      <h2 className={a.sectionTitle}>Tracking</h2>
      <Field as="select" label="Status" required value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} error={errors.status}>
        {LEAD_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </Field>
      <Field as="select" label="Assigned to" value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })} error={errors.assignedToId}>
        <option value="">Unassigned</option>
        {assignable.map((u) => (
          <option key={u.id} value={u.id}>
            {u.fullName}
            {u.id === user?.id ? ' (you)' : ''}
          </option>
        ))}
      </Field>
      <Field label="Follow up on" type="date" value={form.followUpOn} onChange={(e) => setForm({ ...form, followUpOn: e.target.value })} error={errors.followUpOn} />
      {current.overdue && <p className={a.overdue}>This follow-up is overdue.</p>}
      {message && <Notice tone={message.tone}>{message.text}</Notice>}
      <Button type="submit" loading={busy} disabled={!changed}>
        Save changes
      </Button>
    </form>
  );
}

function Notes({ leadId }) {
  const { data, loading, error, reload, setData } = useFetch(() => listNotes(leadId), [leadId]);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState(null);
  const [removing, setRemoving] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    if (!body.trim()) {
      setFormError('Write a note first.');
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      const note = await addNote(leadId, body.trim());
      setData([note, ...(data || [])]);
      setBody('');
    } catch (e) {
      setFormError(fieldErrors(e).body || errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.panel}>
      <h2 className={a.sectionTitle}>Internal notes</h2>
      <p className={a.muted}>Only the team can see these.</p>
      <form onSubmit={submit} className={styles.noteForm}>
        <Field as="textarea" label="Add a note" required rows={3} maxLength={5000} value={body} onChange={(e) => setBody(e.target.value)} error={formError} />
        <div>
          <Button type="submit" size="sm" loading={busy}>
            Add note
          </Button>
        </div>
      </form>
      {loading && <LoadingBlock label="Loading notes…" />}
      {error && <ErrorState error={error} onRetry={reload} title="Notes could not load." />}
      {data && data.length === 0 && <p className={a.muted}>No notes yet.</p>}
      {data && data.length > 0 && (
        <ul className={styles.notes}>
          {data.map((note) => (
            <li key={note.id} className={styles.note}>
              <div className={styles.noteHead}>
                <span className={a.cellMain}>{note.authorName}</span>
                <span className={a.cellSub}>{formatDateTime(note.createdAt)}</span>
                <button type="button" className={a.iconButton} aria-label="Delete note" onClick={() => setRemoving(note)}>
                  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                    <path d="M3 4h10M6 4V2.5h4V4M4.5 4l.7 9.5h5.6l.7-9.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <p className={styles.noteBody}>{note.body}</p>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={Boolean(removing)}
        title="Delete this note?"
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          await deleteNote(leadId, removing.id);
          setData(data.filter((n) => n.id !== removing.id));
        }}
      >
        The note will be removed for everyone. This cannot be undone.
      </ConfirmDialog>
    </section>
  );
}

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: lead, loading, error, reload } = useFetch(() => getLead(id), [id]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (lead) document.title = `${lead.fullName} | Leads | Trilane Tech`;
  }, [lead]);

  if (loading) return <LoadingBlock label="Loading lead…" />;
  if (error)
    return (
      <>
        <Link to="/admin/leads" className={styles.back}>
          ← All leads
        </Link>
        <ErrorState error={error} onRetry={error.response?.status === 404 ? undefined : reload} title={error.response?.status === 404 ? 'This lead no longer exists.' : 'This lead could not load.'} />
      </>
    );

  return (
    <>
      <Link to="/admin/leads" className={styles.back}>
        ← All leads
      </Link>
      <div className={a.pageHead}>
        <div>
          <h1 className={a.pageTitle}>{lead.fullName}</h1>
          <p className={a.pageIntro}>
            Received {formatDateTime(lead.createdAt)} · <StatusBadge status={lead.status} label={lead.statusLabel} />
          </p>
        </div>
        <div className={a.toolbarActions}>
          <Button variant="secondary" href={`mailto:${lead.email}`}>
            Email {lead.fullName.split(' ')[0]}
          </Button>
          <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
            Delete lead
          </Button>
        </div>
      </div>

      <div className={styles.layout}>
        <div className={a.stack}>
          <section className={styles.panel}>
            <h2 className={a.sectionTitle}>Contact</h2>
            <dl className={styles.infoList}>
              <Info label="Email">
                <a href={`mailto:${lead.email}`}>{lead.email}</a>
              </Info>
              <Info label="Phone">{lead.phone && <a href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`}>{lead.phone}</a>}</Info>
              <Info label="Company">{lead.company}</Info>
              <Info label="Website">
                {lead.websiteUrl && (
                  <a href={websiteHref(lead.websiteUrl)} target="_blank" rel="noopener noreferrer nofollow">
                    {lead.websiteUrl}
                  </a>
                )}
              </Info>
              <Info label="Interested in">{lead.serviceName || 'Not specified'}</Info>
            </dl>
          </section>
          <section className={styles.panel}>
            <h2 className={a.sectionTitle}>Message</h2>
            <p className={styles.message}>{lead.message}</p>
          </section>
          <section className={styles.panel}>
            <h2 className={a.sectionTitle}>Where they came from</h2>
            <dl className={styles.infoList}>
              <Info label="Source">{lead.source}</Info>
              <Info label="Page">{lead.sourcePage}</Info>
              <Info label="Button">{lead.sourceCta}</Info>
              <Info label="Referrer">{lead.referrer}</Info>
              <Info label="UTM source">{lead.utmSource}</Info>
              <Info label="UTM medium">{lead.utmMedium}</Info>
              <Info label="UTM campaign">{lead.utmCampaign}</Info>
            </dl>
          </section>
          <Notes leadId={lead.id} />
        </div>
        <div className={styles.side}>
          <TrackingPanel lead={lead} />
          {lead.followUpOn && <p className={a.muted}>Follow-up set for {formatDate(lead.followUpOn)}.</p>}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${lead.fullName}?`}
        confirmLabel="Delete lead"
        onClose={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await deleteLead(lead.id);
          navigate('/admin/leads', { replace: true });
        }}
      >
        The lead and all its notes will be permanently deleted. Use this when someone asks for their information to be removed.
      </ConfirmDialog>
    </>
  );
}
