import { useState } from 'react';
import { errorMessage, fieldErrors, fileUrl } from '../../api/client';
import { createProject, deleteProject, getProject, listProjects, updateProject } from '../../api/portfolio';
import { listServices } from '../../api/services';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import Field, { Checkbox } from '../../components/Field';
import ImageUpload from '../../components/ImageUpload';
import Modal from '../../components/Modal';
import { LoadingBlock } from '../../components/Spinner';
import { EmptyState, ErrorState, Notice } from '../../components/States';
import { useFetch } from '../../hooks/useFetch';
import { formatDate } from '../../utils/format';
import { slugify, validateSlug } from '../../utils/validation';
import a from './Admin.module.css';

function GalleryEditor({ images, onChange }) {
  const update = (index, patch) => onChange(images.map((img, i) => (i === index ? { ...img, ...patch } : img)));
  const move = (index, delta) => {
    const next = [...images];
    const [moved] = next.splice(index, 1);
    next.splice(index + delta, 0, moved);
    onChange(next);
  };
  return (
    <div className={a.listEditor}>
      <span style={{ fontSize: 'var(--text-small)', fontWeight: 600 }}>Gallery</span>
      {images.length === 0 && <p className={a.muted}>No gallery images yet.</p>}
      {images.map((img, i) => (
        <div key={`${img.fileId}-${i}`} className={a.listRow} style={{ gridTemplateColumns: '72px 1fr auto' }}>
          <img src={fileUrl(img.url)} alt="" style={{ width: 72, height: 54, objectFit: 'cover', borderRadius: 8 }} />
          <input className={a.smallControl} aria-label={`Description for image ${i + 1}`} placeholder="Short description of the image" maxLength={255} value={img.altText} onChange={(e) => update(i, { altText: e.target.value })} />
          <div className={a.rowActions}>
            <button type="button" className={a.iconButton} aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
              ↑
            </button>
            <button type="button" className={a.iconButton} aria-label="Move down" disabled={i === images.length - 1} onClick={() => move(i, 1)}>
              ↓
            </button>
            <button type="button" className={a.iconButton} aria-label="Remove image" onClick={() => onChange(images.filter((_, j) => j !== i))}>
              ✕
            </button>
          </div>
        </div>
      ))}
      {images.length < 30 && (
        <ImageUpload label="Add a gallery image" value={null} onChange={(file) => file && onChange([...images, { fileId: file.id, url: file.url, altText: '' }])} />
      )}
    </div>
  );
}

function ProjectEditor({ project, services, onClose, onSaved }) {
  const isNew = !project.id;
  const [form, setForm] = useState({
    slug: project.slug || '',
    title: project.title || '',
    clientName: project.clientName || '',
    summary: project.summary || '',
    description: project.description || '',
    serviceId: project.serviceId ?? '',
    projectUrl: project.projectUrl || '',
    cover: project.coverFileId ? { id: project.coverFileId, url: project.coverUrl } : null,
    completedOn: project.completedOn || '',
    displayOrder: project.displayOrder ?? 0,
    published: project.published ?? false,
    concept: project.concept ?? false,
    images: (project.images || []).map((i) => ({ fileId: i.fileId, url: i.url, altText: i.altText || '' })),
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async (event) => {
    event.preventDefault();
    const found = {};
    const slugProblem = validateSlug(form.slug);
    if (slugProblem) found.slug = slugProblem;
    if (!form.title.trim()) found.title = 'Enter a title.';
    if (form.projectUrl && !/^https?:\/\/\S+$/.test(form.projectUrl.trim())) found.projectUrl = 'Enter a full address starting with https://';
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setError(null);
    const body = {
      slug: form.slug,
      title: form.title,
      clientName: form.clientName,
      summary: form.summary,
      description: form.description,
      serviceId: form.serviceId === '' ? null : Number(form.serviceId),
      projectUrl: form.projectUrl.trim(),
      coverFileId: form.cover?.id ?? null,
      completedOn: form.completedOn || null,
      displayOrder: Number(form.displayOrder) || 0,
      published: form.published,
      concept: form.concept,
      images: form.images.map((i) => ({ fileId: i.fileId, altText: i.altText })),
    };
    try {
      const saved = isNew ? await createProject(body) : await updateProject(project.id, body);
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
      title={isNew ? 'New project' : `Edit ${project.title}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="project-form" loading={busy}>
            Save project
          </Button>
        </>
      }
    >
      <form id="project-form" onSubmit={save} noValidate className={a.stack}>
        {error && <Notice tone="danger">{error}</Notice>}
        <div className={a.formGrid}>
          <Field
            label="Title"
            required
            value={form.title}
            maxLength={160}
            error={errors.title}
            onChange={(e) => {
              const title = e.target.value;
              setForm((f) => ({ ...f, title, slug: isNew && (!f.slug || f.slug === slugify(f.title)) ? slugify(title) : f.slug }));
            }}
          />
          <Field label="URL name" required value={form.slug} maxLength={80} onChange={set('slug')} error={errors.slug} hint={`Page address: /portfolio/${form.slug || '…'}`} />
          <Field label="Client name" value={form.clientName} maxLength={160} onChange={set('clientName')} error={errors.clientName} />
          <Field as="select" label="Service" value={form.serviceId} onChange={set('serviceId')} error={errors.serviceId}>
            <option value="">None</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Field>
          <Field className={a.full} as="textarea" rows={2} label="Summary" value={form.summary} maxLength={500} onChange={set('summary')} error={errors.summary} hint="One or two sentences shown on the portfolio list." />
          <Field className={a.full} as="textarea" rows={8} label="Description" value={form.description} maxLength={20000} onChange={set('description')} error={errors.description} />
          <Field label="Live site address" type="url" placeholder="https://" value={form.projectUrl} maxLength={500} onChange={set('projectUrl')} error={errors.projectUrl} />
          <Field label="Completed on" type="date" value={form.completedOn} onChange={set('completedOn')} error={errors.completedOn} />
          <div className={a.full}>
            <ImageUpload label="Cover image" value={form.cover} onChange={(cover) => setForm((f) => ({ ...f, cover }))} error={errors.coverFileId} />
          </div>
          <div className={a.full}>
            <GalleryEditor images={form.images} onChange={(images) => setForm((f) => ({ ...f, images }))} />
            {errors.images && <p className={a.overdue}>{errors.images}</p>}
          </div>
          <Field label="Display order" type="number" min="0" value={form.displayOrder} onChange={set('displayOrder')} error={errors.displayOrder} />
          <div style={{ alignSelf: 'center' }}>
            <Checkbox label="Published" hint="Publishing the first project adds Portfolio to the website menu." checked={form.published} onChange={set('published')} />
            <Checkbox label="Concept project" hint={'Built to show your work, not for a client. The website labels it "Concept" and hides the client name.'} checked={form.concept} onChange={set('concept')} />
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function PortfolioAdmin() {
  const { data, loading, error, reload } = useFetch(listProjects, []);
  const services = useFetch(listServices, []);
  const [editing, setEditing] = useState(null);
  const [loadingProject, setLoadingProject] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [removing, setRemoving] = useState(null);

  const openEditor = async (p) => {
    setLoadingProject(p.id);
    setLoadError(null);
    try {
      setEditing(await getProject(p.id));
    } catch (e) {
      setLoadError(errorMessage(e));
    } finally {
      setLoadingProject(null);
    }
  };

  const publishedCount = (data || []).filter((p) => p.published).length;

  return (
    <>
      <div className={a.pageHead}>
        <div>
          <h1 className={a.pageTitle}>Portfolio</h1>
          <p className={a.pageIntro}>
            {publishedCount > 0 ? `${publishedCount} published. The Portfolio page is visible on the website.` : 'The Portfolio page stays hidden until a project is published.'}
          </p>
        </div>
        <Button onClick={() => setEditing({})}>New project</Button>
      </div>
      {loadError && <Notice tone="danger">{loadError}</Notice>}
      {loading && <LoadingBlock label="Loading projects…" />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.length === 0 && <EmptyState title="No projects yet." action={<Button onClick={() => setEditing({})}>Add the first project</Button>} />}
      {data && data.length > 0 && (
        <div className={a.cards}>
          {data.map((p) => (
            <article key={p.id} className={a.itemCard}>
              <div style={{ aspectRatio: '16/10', borderRadius: 12, overflow: 'hidden', background: 'var(--color-surface)', display: 'grid', placeItems: 'center' }}>
                {p.coverUrl ? <img src={fileUrl(p.coverUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span className={a.muted}>No cover image</span>}
              </div>
              <div className={a.itemHead}>
                <span className={a.cellMain}>{p.title}</span>
                {p.published ? <Badge tone="success">Published</Badge> : <Badge>Draft</Badge>}
                {p.concept && <Badge>Concept</Badge>}
              </div>
              <p className={a.cellSub}>
                {[p.clientName, p.serviceName, p.completedOn && formatDate(p.completedOn)].filter(Boolean).join(' · ') || 'No details yet'}
              </p>
              <div className={a.rowActions}>
                {p.published && (
                  <Button variant="ghost" size="sm" href={`/portfolio/${p.slug}`} target="_blank" rel="noopener noreferrer">
                    View
                  </Button>
                )}
                <Button variant="secondary" size="sm" loading={loadingProject === p.id} onClick={() => openEditor(p)}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setRemoving(p)}>
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
      {editing && (
        <ProjectEditor
          project={editing}
          services={services.data || []}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
      <ConfirmDialog
        open={Boolean(removing)}
        title={`Delete ${removing?.title}?`}
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          await deleteProject(removing.id);
          reload();
        }}
      >
        The project and its gallery are removed from the website. To hide it temporarily, untick Published instead.
      </ConfirmDialog>
    </>
  );
}
