import { Link } from 'react-router-dom';
import { usePageMeta } from '../../hooks/usePageMeta';
import { GA_ID } from '../../utils/analytics';
import PageHeader from './PageHeader';
import styles from './Privacy.module.css';

const UPDATED = 'November 17, 2026';

export default function Privacy() {
  usePageMeta({ title: 'Privacy Policy', description: 'How Trilane Tech handles the information you share with us.', path: '/privacy' });
  return (
    <>
      <PageHeader eyebrow="Privacy Policy" title="How we handle your information.">
        In plain language. Last updated {UPDATED}.
      </PageHeader>
      <div className={`container ${styles.body}`}>
        <section>
          <h2>Who we are</h2>
          <p>
            Trilane Tech ("we", "us") runs this website at trilanetech.com. This page explains what information we
            collect through the site, why, and the choices you have.
          </p>
        </section>
        <section>
          <h2>What we collect</h2>
          <ul>
            <li>
              <strong>What you send through the contact form:</strong> your name, email address and message, plus your
              phone number, company, website and the service you're interested in if you choose to share them.
            </li>
            <li>
              <strong>How you found us:</strong> along with the form, we record the page and button you came from, the
              website that referred you, and any campaign tags in the link you followed (for example
              <code> utm_source</code>). This tells us which pages and channels are useful.
            </li>
            <li>
              <strong>Analytics, only with your consent:</strong>{' '}
              {GA_ID
                ? 'if you accept analytics cookies in the banner, Google Analytics collects information about how you use the site, such as the pages you visit. If you decline, it never loads.'
                : 'this site is set up so that analytics only load if you accept them in a cookie banner. Analytics are currently switched off.'}
            </li>
          </ul>
        </section>
        <section>
          <h2>How we use it</h2>
          <p>
            We use your contact details to reply to you, to discuss and deliver the work you ask about, and to follow up
            on your inquiry. When you send the form, our team receives an email notification and you receive an email
            confirming that your message arrived. We do not sell your information or use it for unrelated marketing.
          </p>
        </section>
        <section>
          <h2>Where it's kept</h2>
          <p>
            Inquiries are stored in our database and are visible only to the Trilane Tech team through a password
            protected dashboard. Email is delivered through our email provider. Our hosting providers store this data
            on our behalf.
          </p>
        </section>
        <section>
          <h2>Cookies and browser storage</h2>
          <ul>
            <li>Your light or dark mode choice and your cookie choice are saved in your browser so the site remembers them.</li>
            <li>How you arrived (the referring site and campaign tags) is kept in your browser for the current visit only.</li>
            <li>Analytics cookies are set only if you accept them{GA_ID ? '; you can change your choice from "Cookie settings" in the footer' : ''}.</li>
            <li>Team members who sign in to the dashboard receive a sign-in cookie that keeps them signed in.</li>
          </ul>
        </section>
        <section>
          <h2>How long we keep it</h2>
          <p>
            We keep inquiries for as long as they are useful for our working relationship with you, and delete them when
            you ask us to.
          </p>
        </section>
        <section>
          <h2>Your choices</h2>
          <p>
            You can ask us what information we hold about you, ask us to correct it, or ask us to delete it. Reply to
            any email you've received from us, or send a request through the <Link to="/contact">contact form</Link>,
            and we'll take care of it.
          </p>
        </section>
        <section>
          <h2>Changes</h2>
          <p>If we change how we handle information, we'll update this page and the date at the top.</p>
        </section>
      </div>
    </>
  );
}
