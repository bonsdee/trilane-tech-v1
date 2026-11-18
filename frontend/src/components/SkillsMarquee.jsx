import styles from './SkillsMarquee.module.css';

// Simple line icons drawn for this site (24×24, stroked). They hint at what each
// item is; they are deliberately not the brands' own logos, which are trademarks.
const ICONS = {
  // A browser window.
  page: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M3 8.5h18M6.5 6.3h.01M9 6.3h.01" />
    </>
  ),
  // A page with a single big button.
  landing: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2.5" />
      <path d="M8 8h8M8 11h5" />
      <rect x="8" y="14.5" width="8" height="3" rx="1.5" />
    </>
  ),
  // Magnifier over a ranked list.
  seo: (
    <>
      <path d="M4 6h7M4 10h5M4 14h4" />
      <circle cx="15.5" cy="13.5" r="4" />
      <path d="m18.5 16.5 2.5 2.5" />
    </>
  ),
  // Bar chart.
  chart: (
    <>
      <path d="M4 20h16" />
      <rect x="5.5" y="12" width="3" height="6" rx="1" />
      <rect x="10.5" y="8" width="3" height="10" rx="1" />
      <rect x="15.5" y="4" width="3" height="14" rx="1" />
    </>
  ),
  // Magnifier.
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m15 15 5 5" />
    </>
  ),
  // Speed gauge.
  speed: (
    <>
      <path d="M4.5 17a8 8 0 1 1 15 0" />
      <path d="m12 13 3.5-4" />
      <circle cx="12" cy="13" r="1.2" />
    </>
  ),
  // Funnel.
  funnel: <path d="M4 5h16l-6 7.5V19l-4-2v-4.5z" />,
  // Contact card.
  crm: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <circle cx="9" cy="11" r="2.2" />
      <path d="M5.8 16c.6-1.6 1.8-2.4 3.2-2.4s2.6.8 3.2 2.4M14.5 10h3.5M14.5 13.5h2.5" />
    </>
  ),
  // Envelope with a return arrow.
  followup: (
    <>
      <rect x="3" y="6" width="14" height="11" rx="2" />
      <path d="m3.5 7 6.5 5 6.5-5" />
      <path d="M21 11v4a3 3 0 0 1-3 3h-1" />
      <path d="m19 9 2 2 2-2" />
    </>
  ),
  // Code brackets.
  code: <path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14" />,
  // Pen nib (design).
  pen: (
    <>
      <path d="M12 3 6 11l2 8h8l2-8z" />
      <path d="M12 3v8" />
      <circle cx="12" cy="12.5" r="1.4" />
    </>
  ),
  // Linked nodes (automation).
  flow: (
    <>
      <rect x="3" y="4" width="6" height="5" rx="1.5" />
      <rect x="15" y="10" width="6" height="5" rx="1.5" />
      <rect x="3" y="15" width="6" height="5" rx="1.5" />
      <path d="M9 6.5h2.5a1.5 1.5 0 0 1 1.5 1.5v4.5H15M9 17.5h2.5a1.5 1.5 0 0 0 1.5-1.5v-3.5" />
    </>
  ),
  // Notebook.
  notes: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2.5" />
      <path d="M9 3v18M12 8h4M12 11.5h4" />
    </>
  ),
  // Grid of app tiles.
  apps: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.8" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8" />
    </>
  ),
};

// What the team works on and with, taken from the packages document and the team bios.
const SKILLS = [
  { label: 'Custom websites', icon: 'page' },
  { label: 'Landing pages', icon: 'landing' },
  { label: 'On-page SEO', icon: 'seo' },
  { label: 'Google Analytics', icon: 'chart' },
  { label: 'Search Console', icon: 'search' },
  { label: 'Speed & performance', icon: 'speed' },
  { label: 'Lead triage', icon: 'funnel' },
  { label: 'CRM updates', icon: 'crm' },
  { label: 'Follow-up sequences', icon: 'followup' },
  { label: 'React', icon: 'code' },
  { label: 'Figma', icon: 'pen' },
  { label: 'GoHighLevel', icon: 'flow' },
  { label: 'Notion', icon: 'notes' },
  { label: 'Google Workspace', icon: 'apps' },
];

/** A slow, endless strip of skills and tools. Pauses on hover; still for reduced motion. */
export default function SkillsMarquee() {
  const row = (hidden) => (
    <ul className={styles.track} aria-hidden={hidden || undefined}>
      {SKILLS.map((skill) => (
        <li key={skill.label} className={styles.item}>
          <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            {ICONS[skill.icon]}
          </svg>
          {skill.label}
        </li>
      ))}
    </ul>
  );
  return (
    <section className={styles.marquee} aria-label="What we work with">
      <p className={styles.label}>What we work with</p>
      <div className={styles.viewport}>
        <div className={styles.belt}>
          {row(false)}
          {row(true)}
        </div>
      </div>
    </section>
  );
}
