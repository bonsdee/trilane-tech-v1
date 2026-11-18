import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { errorCode, errorMessage, fieldErrors } from '../../api/client';
import { submitLead } from '../../api/leads';
import { getPublicServices } from '../../api/services';
import Button from '../../components/Button';
import Field from '../../components/Field';
import Reveal from '../../components/Reveal';
import { Notice } from '../../components/States';
import { useFetch } from '../../hooks/useFetch';
import { usePageMeta } from '../../hooks/usePageMeta';
import { formatPrice } from '../../utils/format';
import { getLeadSource } from '../../utils/leadSource';
import { hasErrors, validateContact } from '../../utils/validation';
import PageHeader from './PageHeader';
import styles from './Contact.module.css';

const EMPTY = { fullName: '', email: '', phone: '', company: '', websiteUrl: '', serviceSlug: '', message: '', nickname: '' };

const STEPS = [
  { title: 'We read it ourselves', text: 'Your message goes straight to the team, not a ticket queue.' },
  { title: 'You get a confirmation', text: 'An email lands in your inbox right away so you know it arrived.' },
  { title: 'We reply personally', text: 'One of us answers with next steps or a few questions about your project.' },
];

export default function Contact() {
  usePageMeta({
    title: 'Contact',
    description: 'Tell Trilane Tech about your business and what you need. We reply personally.',
    path: '/contact',
  });
  const [params] = useSearchParams();
  const services = useFetch(getPublicServices, []);
  const options = useMemo(() => (services.data || []).flatMap((g) => g.services), [services.data]);

  const requested = params.get('service') || '';
  const [values, setValues] = useState(() => ({ ...EMPTY, serviceSlug: requested }));
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent
  const [formError, setFormError] = useState(null);

  // Drop a pre-selected service that is not offered (once the list has loaded).
  const serviceKnown = !values.serviceSlug || !services.data || options.some((o) => o.slug === values.serviceSlug);

  const update = (name) => (event) => {
    setValues((v) => ({ ...v, [name]: event.target.value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setFormError(null);
    const found = validateContact(values);
    setErrors(found);
    if (hasErrors(found)) {
      const first = Object.keys(found)[0];
      document.querySelector(`[name="${first}"]`)?.focus();
      return;
    }
    const source = getLeadSource();
    setStatus('sending');
    try {
      await submitLead({
        ...values,
        serviceSlug: serviceKnown ? values.serviceSlug : '',
        sourcePage: (params.get('from') || source.landingPage || '/contact').slice(0, 255),
        sourceCta: (params.get('cta') || '').slice(0, 120),
        referrer: source.referrer || '',
        utmSource: source.utmSource || '',
        utmMedium: source.utmMedium || '',
        utmCampaign: source.utmCampaign || '',
      });
      setStatus('sent');
      setValues(EMPTY);
      window.scrollTo({ top: 0 });
    } catch (error) {
      setStatus('idle');
      const fields = fieldErrors(error);
      if (Object.keys(fields).length) {
        setErrors(fields);
        setFormError('Please check the highlighted fields.');
      } else if (errorCode(error) === 'RATE_LIMITED') {
        setFormError(errorMessage(error));
      } else {
        setFormError(`${errorMessage(error)} Your message was not sent.`);
      }
    }
  };

  if (status === 'sent') {
    return (
      <>
        <PageHeader eyebrow="Message sent" title="Thank you. We've got it.">
          A confirmation is on its way to your inbox. One of the team will read your message and reply personally.
        </PageHeader>
        <div className="container">
          <div className={styles.sentActions}>
            <Button to="/services" variant="secondary">
              Browse services
            </Button>
            <Button to="/">Back to the home page</Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Contact" title="Tell us what you need.">
        A few details about your business are enough to start. We reply personally to every message.
      </PageHeader>
      <div className={`container ${styles.layout}`}>
        <Reveal className={styles.formCard}>
          <form onSubmit={submit} noValidate className={styles.form} aria-describedby={formError ? 'form-error' : undefined}>
            {formError && (
              <div id="form-error">
                <Notice tone="danger">{formError}</Notice>
              </div>
            )}
            <div className={styles.row}>
              <Field label="Name" name="fullName" autoComplete="name" required value={values.fullName} onChange={update('fullName')} error={errors.fullName} maxLength={120} />
              <Field label="Email" name="email" type="email" autoComplete="email" required value={values.email} onChange={update('email')} error={errors.email} maxLength={254} />
            </div>
            <div className={styles.row}>
              <Field label="Phone" name="phone" type="tel" autoComplete="tel" value={values.phone} onChange={update('phone')} error={errors.phone} maxLength={40} />
              <Field label="Company" name="company" autoComplete="organization" value={values.company} onChange={update('company')} error={errors.company} maxLength={160} />
            </div>
            <Field
              label="Current website"
              name="websiteUrl"
              inputMode="url"
              autoComplete="url"
              placeholder="example.com"
              value={values.websiteUrl}
              onChange={update('websiteUrl')}
              error={errors.websiteUrl}
              maxLength={255}
            />
            <Field
              as="select"
              label="Service you're interested in"
              name="serviceSlug"
              value={serviceKnown ? values.serviceSlug : ''}
              onChange={update('serviceSlug')}
              error={errors.serviceSlug}
              hint={services.error ? 'The service list could not load, but you can still send your message.' : undefined}
            >
              <option value="">Not sure yet</option>
              {options.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name} — {formatPrice(s.price, s.billingPeriod)}
                </option>
              ))}
            </Field>
            <Field
              as="textarea"
              label="What do you need?"
              name="message"
              required
              rows={6}
              value={values.message}
              onChange={update('message')}
              error={errors.message}
              maxLength={5000}
              hint="Tell us about your business, what you have today and what you'd like to change."
            />
            {/* Spam trap: hidden from people and screen readers; bots tend to fill it. */}
            <div className={styles.trap} aria-hidden="true">
              <label htmlFor="nickname">Leave this field empty</label>
              <input id="nickname" name="nickname" tabIndex={-1} autoComplete="off" value={values.nickname} onChange={update('nickname')} />
            </div>
            <div className={styles.submitRow}>
              <Button type="submit" size="lg" loading={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : 'Send message'}
              </Button>
              <p className={styles.privacy}>
                We use your details only to reply to you. See our <Link to="/privacy">privacy policy</Link>.
              </p>
            </div>
          </form>
        </Reveal>
        <aside className={styles.aside} aria-label="What happens next">
          <Reveal>
            <h2 className={styles.asideTitle}>What happens next</h2>
            <ol className={styles.steps}>
              {STEPS.map((step) => (
                <li key={step.title}>
                  <strong>{step.title}</strong>
                  <span className="muted">{step.text}</span>
                </li>
              ))}
            </ol>
          </Reveal>
          {/* Reserved for a future "Book a call" button (calendar booking is not part of this version). */}
        </aside>
      </div>
    </>
  );
}
