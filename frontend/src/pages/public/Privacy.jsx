import { Link } from 'react-router-dom';
import { usePageMeta } from '../../hooks/usePageMeta';
import { GA_ID } from '../../utils/analytics';
import PageHeader from './PageHeader';
import styles from './Privacy.module.css';

const UPDATED = 'November 19, 2026';
const EMAIL = 'jivonzdy@trilanetech.com';

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
            Trilane Tech ("we", "us") is a small web and operations team based in Cebu, Philippines. We run this
            website at trilanetech.com. This page explains what information we collect, why, and the choices you have.
          </p>
          <p>
            Questions or requests about your information: email <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
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
            <li>
              <strong>If we contacted you first:</strong> your name, job title, business name and business contact
              details (such as a work email, phone number or website), taken from publicly available business sources
              like your company website, business directories and professional profiles.
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
          <h2>Outreach emails</h2>
          <p>
            We sometimes email businesses we think our services could help, using business contact details that are
            publicly available. We keep these messages short and relevant to your business, and we don't buy email
            lists.
          </p>
          <p>
            You can opt out at any time: reply "unsubscribe" to any of our emails, or write to{' '}
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>. We'll stop contacting you and keep only the minimum needed (your
            email address) on a do-not-contact list, so you aren't contacted again.
          </p>
        </section>
        <section>
          <h2>Where it's kept</h2>
          <p>
            We operate from the Philippines. Inquiries are stored in our database and are visible only to the Trilane
            Tech team through a password protected dashboard. Our servers and database are hosted in Singapore, and our
            email runs on Google Workspace. These providers store and process the data on our behalf.
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
            You can ask us what information we hold about you, ask us to correct it, or ask us to delete it. Email{' '}
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>, reply to any email you've received from us, or use the{' '}
            <Link to="/contact">contact form</Link>, and we'll take care of it.
          </p>
          <p>
            We handle personal information in line with the Philippine Data Privacy Act of 2012. If you're not happy with
            how we've handled a request, you can also contact the National Privacy Commission of the Philippines.
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
