import { useEffect, useState } from 'react';
import { errorMessage, fieldErrors } from '../../api/client';
import { getBookingSettings, getPilotSettings, updateBookingSettings, updatePilotSettings } from '../../api/site';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Field, { Checkbox } from '../../components/Field';
import { LoadingBlock } from '../../components/Spinner';
import { ErrorState, Notice } from '../../components/States';
import { useFetch } from '../../hooks/useFetch';
import { formatMoney } from '../../utils/format';
import a from './Admin.module.css';

export default function SettingsAdmin() {
  const { data, loading, error, reload, setData } = useFetch(getPilotSettings, []);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data) setForm({ enabled: data.enabled, price: data.price, spotsRemaining: data.spotsRemaining });
  }, [data]);

  if (loading) return <LoadingBlock label="Loading settings…" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!form) return null;

  const save = async (event) => {
    event.preventDefault();
    const found = {};
    if (form.price === '' || Number(form.price) < 0) found.price = 'Enter a price of 0 or more.';
    if (form.spotsRemaining === '' || Number(form.spotsRemaining) < 0 || !Number.isInteger(Number(form.spotsRemaining))) found.spotsRemaining = 'Enter a whole number, 0 or more.';
    setErrors(found);
    setMessage(null);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const saved = await updatePilotSettings({ enabled: form.enabled, price: Number(form.price), spotsRemaining: Number(form.spotsRemaining) });
      setData(saved);
      setMessage({ tone: 'success', text: 'Saved. The website shows the change straight away.' });
    } catch (e) {
      setErrors(fieldErrors(e));
      setMessage({ tone: 'danger', text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className={a.pageHead}>
        <div>
          <h1 className={a.pageTitle}>Settings</h1>
          <p className={a.pageIntro}>Booking link and the pilot offer for the {data.serviceName || 'Launch Bundle'}.</p>
        </div>
      </div>
      <BookingSettings />
      <form onSubmit={save} noValidate className={`${a.itemCard} ${a.stack}`} style={{ maxWidth: 560, marginTop: 'var(--space-3)' }}>
        <div className={a.itemHead}>
          <h2 className={a.sectionTitle}>Pilot offer</h2>
          {data.live ? <Badge tone="success">Showing on the website</Badge> : <Badge>Not showing</Badge>}
        </div>
        {!data.serviceName && <Notice tone="danger">The Launch Bundle service (URL name "launch-bundle") is missing, so the pilot offer cannot show.</Notice>}
        <p className={a.muted}>
          The offer shows while it is switched on, at least one spot remains and the Launch Bundle is published. Regular price:{' '}
          {data.regularPrice != null ? formatMoney(data.regularPrice) : '—'}.
        </p>
        <Checkbox label="Pilot offer switched on" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
        <div className={a.formGrid}>
          <Field label="Pilot price (USD)" required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} error={errors.price} />
          <Field label="Spots remaining" required type="number" min="0" step="1" value={form.spotsRemaining} onChange={(e) => setForm({ ...form, spotsRemaining: e.target.value })} error={errors.spotsRemaining} hint="At 0 the offer disappears automatically." />
        </div>
        {message && <Notice tone={message.tone}>{message.text}</Notice>}
        <div>
          <Button type="submit" loading={busy}>
            Save settings
          </Button>
        </div>
      </form>
    </>
  );
}

/** The shared booking page behind every "Book a call" button. Empty hides the buttons. */
function BookingSettings() {
  const { data, loading, error, reload, setData } = useFetch(getBookingSettings, []);
  const [url, setUrl] = useState('');
  const [fieldError, setFieldError] = useState(null);
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data) setUrl(data.url || '');
  }, [data]);

  if (loading) return <LoadingBlock label="Loading booking link…" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const save = async (event) => {
    event.preventDefault();
    setMessage(null);
    const value = url.trim();
    if (value && !/^https:\/\/\S+$/.test(value)) {
      setFieldError('Enter a full address starting with https://');
      return;
    }
    setFieldError(null);
    setBusy(true);
    try {
      const saved = await updateBookingSettings({ url: value });
      setData(saved);
      setMessage({ tone: 'success', text: value ? 'Saved. "Book a call" now shows on the Home and Contact pages.' : 'Saved. The "Book a call" buttons are hidden.' });
    } catch (e) {
      setFieldError(fieldErrors(e).url || null);
      setMessage({ tone: 'danger', text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} noValidate className={`${a.itemCard} ${a.stack}`} style={{ maxWidth: 560 }}>
      <div className={a.itemHead}>
        <h2 className={a.sectionTitle}>Booking link</h2>
        {data?.url ? <Badge tone="success">Showing on the website</Badge> : <Badge>Not showing</Badge>}
      </div>
      <p className={a.muted}>
        Paste the link to your shared booking page, for example a Google Calendar appointment schedule or a Calendly or Cal.com page.
        Visitors see a "Book a call" button on the Home and Contact pages. Leave it empty to hide the button.
      </p>
      <Field
        label="Booking page link"
        type="url"
        inputMode="url"
        placeholder="https://calendar.app.google/…"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        error={fieldError}
        maxLength={500}
      />
      {data?.url && (
        <p className={a.muted}>
          Current link:{' '}
          <a href={data.url} target="_blank" rel="noopener noreferrer">
            open the booking page
          </a>
        </p>
      )}
      {message && <Notice tone={message.tone}>{message.text}</Notice>}
      <div>
        <Button type="submit" loading={busy}>
          Save booking link
        </Button>
      </div>
    </form>
  );
}
