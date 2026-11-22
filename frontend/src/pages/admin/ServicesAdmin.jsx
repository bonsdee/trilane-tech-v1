import { useState } from 'react';
import { errorMessage, fieldErrors } from '../../api/client';
import { createService, deleteService, listServices, updateService } from '../../api/services';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import Field, { Checkbox } from '../../components/Field';
import Modal from '../../components/Modal';
import { LoadingBlock } from '../../components/Spinner';
import { EmptyState, ErrorState, Notice } from '../../components/States';
import Table from '../../components/Table';
import { useFetch } from '../../hooks/useFetch';
import { CATEGORY_LABELS, formatPrice } from '../../utils/format';
import { slugify, validateSlug } from '../../utils/validation';
import a from './Admin.module.css';

const EMPTY = {
  slug: '',
  name: '',
  category: 'ONE_TIME',
  price: '',
  billingPeriod: 'ONCE',
  regularPrice: '',
  timeline: '',
  hours: '',
  summary: '',
  idealFor: '',
  displayOrder: 0,
  published: true,
  items: [],
};

function toForm(s) {
  return {
    ...EMPTY,
    ...s,
    price: s.price ?? '',
    regularPrice: s.regularPrice ?? '',
    hours: s.hours ?? '',
    timeline: s.timeline ?? '',
    summary: s.summary ?? '',
    idealFor: s.idealFor ?? '',
    items: s.items.map((i) => ({ ...i })),
  };
}

function ItemsEditor({ items, onChange, errors }) {
  const update = (index, patch) => onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const move = (index, delta) => {
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(index + delta, 0, moved);
    onChange(next);
  };
  return (
    <div className={a.listEditor}>
      <span className={a.sectionTitle} style={{ fontSize: 'var(--text-small)', fontWeight: 600 }}>
        Includes and not included
      </span>
      {items.length === 0 && <p className={a.muted}>No items yet.</p>}
      {items.map((item, i) => (
        <div key={i}>
          <div className={a.listRow}>
            <select className={a.smallControl} aria-label={`Item ${i + 1} type`} value={item.kind} onChange={(e) => update(i, { kind: e.target.value })}>
              <option value="INCLUDED">Included</option>
              <option value="NOT_INCLUDED">Not included</option>
            </select>
            <input className={a.smallControl} aria-label={`Item ${i + 1} text`} value={item.text} maxLength={300} onChange={(e) => update(i, { text: e.target.value })} />
            <div className={a.rowActions}>
              <button type="button" className={a.iconButton} aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                ↑
              </button>
              <button type="button" className={a.iconButton} aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                ↓
              </button>
              <button type="button" className={a.iconButton} aria-label="Remove item" onClick={() => onChange(items.filter((_, j) => j !== i))}>
                ✕
              </button>
            </div>
          </div>
          {errors[`items[${i}].text`] && <p className={a.overdue} style={{ fontSize: 'var(--text-tiny)' }}>{errors[`items[${i}].text`]}</p>}
        </div>
      ))}
      <div>
        <Button variant="secondary" size="sm" onClick={() => onChange([...items, { kind: 'INCLUDED', text: '' }])}>
          Add item
        </Button>
      </div>
    </div>
  );
}

function ServiceEditor({ service, onClose, onSaved }) {
  const isNew = !service.id;
  const [form, setForm] = useState(() => (isNew ? EMPTY : toForm(service)));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async (event) => {
    event.preventDefault();
    const found = {};
    const slugProblem = validateSlug(form.slug);
    if (slugProblem) found.slug = slugProblem;
    if (!form.name.trim()) found.name = 'Enter a name.';
    if (form.price === '' || Number(form.price) < 0) found.price = 'Enter a price of 0 or more.';
    form.items.forEach((item, i) => {
      if (!item.text.trim()) found[`items[${i}].text`] = 'Enter the item text, or remove it.';
    });
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setError(null);
    const body = {
      ...form,
      price: Number(form.price),
      regularPrice: form.regularPrice === '' ? null : Number(form.regularPrice),
      hours: form.hours === '' ? null : Number(form.hours),
      displayOrder: Number(form.displayOrder) || 0,
      items: form.items.map((i) => ({ kind: i.kind, text: i.text.trim() })),
    };
    delete body.id;
    try {
      const saved = isNew ? await createService(body) : await updateService(service.id, body);
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
      size="lg"
      title={isNew ? 'New service' : `Edit ${service.name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="service-form" loading={busy}>
            Save service
          </Button>
        </>
      }
    >
      <form id="service-form" onSubmit={save} noValidate className={a.stack}>
        {error && <Notice tone="danger">{error}</Notice>}
        <div className={a.formGrid}>
          <Field
            label="Name"
            required
            value={form.name}
            maxLength={120}
            error={errors.name}
            onChange={(e) => {
              const name = e.target.value;
              setForm((f) => ({ ...f, name, slug: isNew && (!f.slug || f.slug === slugify(f.name)) ? slugify(name) : f.slug }));
            }}
          />
          <Field label="URL name" required value={form.slug} maxLength={80} error={errors.slug} onChange={set('slug')} hint="Used in links, e.g. /services#foundation-website. Changing it breaks old links." />
          <Field as="select" label="Category" required value={form.category} onChange={set('category')} error={errors.category}>
            <option value="ONE_TIME">One-time project</option>
            <option value="RETAINER">Retainer</option>
            <option value="BUNDLE">Bundle</option>
          </Field>
          <Field as="select" label="Billing" required value={form.billingPeriod} onChange={set('billingPeriod')} error={errors.billingPeriod}>
            <option value="ONCE">One-time</option>
            <option value="MONTHLY">Monthly</option>
          </Field>
          <Field label="Price (USD)" required type="number" min="0" step="0.01" value={form.price} onChange={set('price')} error={errors.price} />
          <Field label="Price if bought separately (USD)" type="number" min="0" step="0.01" value={form.regularPrice} onChange={set('regularPrice')} error={errors.regularPrice} hint="For bundles." />
          <Field label="Timeline" value={form.timeline} maxLength={80} onChange={set('timeline')} error={errors.timeline} placeholder="e.g. 10–14 business days" />
          <Field label="Hours per month" type="number" min="1" max="744" value={form.hours} onChange={set('hours')} error={errors.hours} hint="For retainers with an hour cap." />
          <Field className={a.full} label="Ideal for" value={form.idealFor} maxLength={255} onChange={set('idealFor')} error={errors.idealFor} />
          <Field className={a.full} as="textarea" rows={4} label="Summary" value={form.summary} maxLength={2000} onChange={set('summary')} error={errors.summary} />
          <Field label="Display order" type="number" min="0" value={form.displayOrder} onChange={set('displayOrder')} error={errors.displayOrder} hint="Lower numbers appear first." />
          <div style={{ alignSelf: 'center' }}>
            <Checkbox label="Published" hint="Shown on the website" checked={form.published} onChange={set('published')} />
          </div>
        </div>
        <ItemsEditor items={form.items} onChange={(items) => setForm((f) => ({ ...f, items }))} errors={errors} />
      </form>
    </Modal>
  );
}

export default function ServicesAdmin() {
  const { data, loading, error, reload } = useFetch(listServices, []);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);

  return (
    <>
      <div className={a.pageHead}>
        <div>
          <h1 className={a.pageTitle}>Services</h1>
          <p className={a.pageIntro}>Prices, inclusions and bundles shown on the Services & Pricing page.</p>
        </div>
        <Button onClick={() => setEditing({})}>New service</Button>
      </div>
      {loading && <LoadingBlock label="Loading services…" />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.length === 0 && <EmptyState title="No services yet." action={<Button onClick={() => setEditing({})}>Add the first service</Button>} />}
      {data && data.length > 0 && (
        <Table caption="Services" stacked>
          <thead>
            <tr>
              <th scope="col">Service</th>
              <th scope="col">Category</th>
              <th scope="col">Price</th>
              <th scope="col">Order</th>
              <th scope="col">Status</th>
              <th scope="col">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((s) => (
              <tr key={s.id}>
                <td>
                  <div className={a.cellMain}>{s.name}</div>
                  <div className={a.cellSub}>{s.slug}</div>
                </td>
                <td data-label="Category">{CATEGORY_LABELS[s.category]}</td>
                <td data-label="Price">{formatPrice(s.price, s.billingPeriod)}</td>
                <td data-label="Order">{s.displayOrder}</td>
                <td data-label="Status">{s.published ? <Badge tone="success">Published</Badge> : <Badge>Hidden</Badge>}</td>
                <td data-label="">
                  <div className={a.rowActions}>
                    <Button variant="secondary" size="sm" onClick={() => setEditing(s)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setRemoving(s)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {editing && (
        <ServiceEditor
          service={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
      <ConfirmDialog
        open={Boolean(removing)}
        title={`Delete ${removing?.name}?`}
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          await deleteService(removing.id);
          reload();
        }}
      >
        It disappears from the website. Leads and portfolio projects that mention it are kept, without the link. To hide it temporarily, untick Published instead.
      </ConfirmDialog>
    </>
  );
}
