import { useState } from 'react';
import { errorMessage, fieldErrors } from '../../api/client';
import { createFaq, deleteFaq, listFaqs, updateFaq } from '../../api/faqs';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import Field, { Checkbox } from '../../components/Field';
import Modal from '../../components/Modal';
import { LoadingBlock } from '../../components/Spinner';
import { EmptyState, ErrorState, Notice } from '../../components/States';
import { useFetch } from '../../hooks/useFetch';
import a from './Admin.module.css';

function FaqEditor({ faq, onClose, onSaved }) {
  const isNew = !faq.id;
  const [form, setForm] = useState({
    question: faq.question || '',
    answer: faq.answer || '',
    displayOrder: faq.displayOrder ?? 0,
    published: faq.published ?? true,
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async (event) => {
    event.preventDefault();
    const found = {};
    if (!form.question.trim()) found.question = 'Enter the question.';
    if (!form.answer.trim()) found.answer = 'Enter the answer.';
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setError(null);
    const body = { ...form, displayOrder: Number(form.displayOrder) || 0 };
    try {
      const saved = isNew ? await createFaq(body) : await updateFaq(faq.id, body);
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
      title={isNew ? 'New question' : 'Edit question'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="faq-form" loading={busy}>
            Save
          </Button>
        </>
      }
    >
      <form id="faq-form" onSubmit={save} noValidate className={a.stack}>
        {error && <Notice tone="danger">{error}</Notice>}
        <Field label="Question" required value={form.question} maxLength={300} onChange={set('question')} error={errors.question} />
        <Field as="textarea" rows={6} label="Answer" required value={form.answer} maxLength={5000} onChange={set('answer')} error={errors.answer} />
        <div className={a.formGrid}>
          <Field label="Display order" type="number" min="0" value={form.displayOrder} onChange={set('displayOrder')} error={errors.displayOrder} />
          <div style={{ alignSelf: 'center' }}>
            <Checkbox label="Published" hint="Shown on the FAQ page" checked={form.published} onChange={set('published')} />
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function FaqAdmin() {
  const { data, loading, error, reload } = useFetch(listFaqs, []);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  return (
    <>
      <div className={a.pageHead}>
        <div>
          <h1 className={a.pageTitle}>FAQ</h1>
          <p className={a.pageIntro}>Questions and answers on the FAQ page, in display order.</p>
        </div>
        <Button onClick={() => setEditing({})}>New question</Button>
      </div>
      {loading && <LoadingBlock label="Loading questions…" />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.length === 0 && <EmptyState title="No questions yet." action={<Button onClick={() => setEditing({})}>Add a question</Button>} />}
      {data && data.length > 0 && (
        <div className={a.stack}>
          {data.map((f) => (
            <article key={f.id} className={a.itemCard}>
              <div className={a.itemHead}>
                <span className={a.cellMain}>
                  {f.displayOrder}. {f.question}
                </span>
                {f.published ? <Badge tone="success">Published</Badge> : <Badge>Hidden</Badge>}
              </div>
              <p className={a.muted}>{f.answer}</p>
              <div className={a.rowActions}>
                <Button variant="secondary" size="sm" onClick={() => setEditing(f)}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setRemoving(f)}>
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
      {editing && (
        <FaqEditor
          faq={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
      <ConfirmDialog
        open={Boolean(removing)}
        title="Delete this question?"
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          await deleteFaq(removing.id);
          reload();
        }}
      >
        "{removing?.question}" will be removed from the FAQ page. To hide it temporarily, untick Published instead.
      </ConfirmDialog>
    </>
  );
}
