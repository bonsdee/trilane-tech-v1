import { useState } from 'react';
import { errorMessage, fieldErrors } from '../../api/client';
import { createTeamMember, deleteTeamMember, listTeam, updateTeamMember } from '../../api/team';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import Field, { Checkbox } from '../../components/Field';
import ImageUpload from '../../components/ImageUpload';
import Modal from '../../components/Modal';
import { LoadingBlock } from '../../components/Spinner';
import { EmptyState, ErrorState, Notice } from '../../components/States';
import TeamAvatar from '../../components/TeamAvatar';
import { useFetch } from '../../hooks/useFetch';
import a from './Admin.module.css';

function MemberEditor({ member, onClose, onSaved }) {
  const isNew = !member.id;
  const [form, setForm] = useState({
    fullName: member.fullName || '',
    position: member.position || '',
    bio: member.bio || '',
    photo: member.photoFileId ? { id: member.photoFileId, url: member.photoUrl } : null,
    displayOrder: member.displayOrder ?? 0,
    published: member.published ?? true,
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async (event) => {
    event.preventDefault();
    if (!form.fullName.trim()) {
      setErrors({ fullName: 'Enter a name.' });
      return;
    }
    setBusy(true);
    setError(null);
    const body = {
      fullName: form.fullName,
      position: form.position,
      bio: form.bio,
      photoFileId: form.photo?.id ?? null,
      displayOrder: Number(form.displayOrder) || 0,
      published: form.published,
    };
    try {
      const saved = isNew ? await createTeamMember(body) : await updateTeamMember(member.id, body);
      onSaved(saved);
    } catch (e) {
      setErrors(fieldErrors(e));
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      title={isNew ? 'New team member' : `Edit ${member.fullName}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="member-form" loading={busy}>
            Save
          </Button>
        </>
      }
    >
      <form id="member-form" onSubmit={save} noValidate className={a.stack}>
        {error && <Notice tone="danger">{error}</Notice>}
        <div className={a.formGrid}>
          <Field label="Name" required value={form.fullName} maxLength={120} onChange={set('fullName')} error={errors.fullName} />
          <Field label="Position" value={form.position} maxLength={120} onChange={set('position')} error={errors.position} />
          <Field className={a.full} as="textarea" rows={5} label="Bio" value={form.bio} maxLength={3000} onChange={set('bio')} error={errors.bio} />
          <div className={a.full}>
            <ImageUpload label="Photo" value={form.photo} onChange={(photo) => setForm((f) => ({ ...f, photo }))} error={errors.photoFileId} />
          </div>
          <Field label="Display order" type="number" min="0" value={form.displayOrder} onChange={set('displayOrder')} error={errors.displayOrder} />
          <div style={{ alignSelf: 'center' }}>
            <Checkbox label="Published" hint="Shown on the website" checked={form.published} onChange={set('published')} />
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function TeamAdmin() {
  const { data, loading, error, reload } = useFetch(listTeam, []);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  return (
    <>
      <div className={a.pageHead}>
        <div>
          <h1 className={a.pageTitle}>Team</h1>
          <p className={a.pageIntro}>Public profiles on the Home and About pages. These are separate from sign-in accounts.</p>
        </div>
        <Button onClick={() => setEditing({})}>New team member</Button>
      </div>
      {loading && <LoadingBlock label="Loading team…" />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.length === 0 && <EmptyState title="No team profiles yet." action={<Button onClick={() => setEditing({})}>Add a team member</Button>} />}
      {data && data.length > 0 && (
        <div className={a.cards}>
          {data.map((m) => (
            <article key={m.id} className={a.itemCard}>
              <div className={a.itemHead}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <TeamAvatar name={m.fullName} photoUrl={m.photoUrl} size="sm" />
                  <div>
                    <div className={a.cellMain}>{m.fullName}</div>
                    <div className={a.cellSub}>{m.position || 'No position yet'}</div>
                  </div>
                </div>
                {m.published ? <Badge tone="success">Published</Badge> : <Badge>Hidden</Badge>}
              </div>
              <p className={a.muted}>{m.bio ? `${m.bio.slice(0, 140)}${m.bio.length > 140 ? '…' : ''}` : 'No bio yet.'}</p>
              <div className={a.rowActions}>
                <Button variant="secondary" size="sm" onClick={() => setEditing(m)}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setRemoving(m)}>
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
      {editing && (
        <MemberEditor
          member={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
      <ConfirmDialog
        open={Boolean(removing)}
        title={`Delete ${removing?.fullName}'s profile?`}
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          await deleteTeamMember(removing.id);
          reload();
        }}
      >
        The profile is removed from the website. Their sign-in account, if any, is not affected.
      </ConfirmDialog>
    </>
  );
}
