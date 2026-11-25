import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { usePageMeta } from '../hooks/usePageMeta';
import styles from './AdminLayout.module.css';

const NAV = [
  { to: '/admin', label: 'Overview', end: true, icon: 'M3 12l9-8 9 8M5 10v10h14V10' },
  { to: '/admin/leads', label: 'Leads', icon: 'M4 6h16M4 12h16M4 18h10' },
  { to: '/admin/services', label: 'Services', icon: 'M4 7h16v12H4zM9 7V4h6v3' },
  { to: '/admin/team', label: 'Team', icon: 'M8 11a3 3 0 100-6 3 3 0 000 6zM16 11a3 3 0 100-6 3 3 0 000 6zM2 20c0-3 3-5 6-5s6 2 6 5M14 15c3 0 8 1 8 5' },
  { to: '/admin/portfolio', label: 'Portfolio', icon: 'M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6' },
  { to: '/admin/faq', label: 'FAQ', icon: 'M9 9a3 3 0 116 0c0 2-3 2-3 5M12 18h.01' },
  { to: '/admin/signatures', label: 'Signatures', icon: 'M4 6h16v12H4zM4 7l8 6 8-6' },
  { to: '/admin/settings', label: 'Settings', icon: 'M4 7h9M17 7h3M15 5v4M4 17h3M11 17h9M9 15v4M4 12h16' },
  { to: '/admin/users', label: 'Users', icon: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6' },
];

// On phones the bottom bar shows this many links; the rest sit behind "More".
const PHONE_BAR_ITEMS = 4;
const MORE_ICON = 'M5 12h.01M12 12h.01M19 12h.01';

function Icon({ d }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  usePageMeta({ title: 'Dashboard', noindex: true });
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);
  const extras = NAV.slice(PHONE_BAR_ITEMS);
  const extraActive = extras.some((item) => location.pathname.startsWith(item.to));

  useEffect(() => setMoreOpen(false), [location.pathname]);
  useEffect(() => {
    if (!moreOpen) return undefined;
    const onDown = (e) => moreRef.current && !moreRef.current.contains(e.target) && setMoreOpen(false);
    const onKey = (e) => e.key === 'Escape' && setMoreOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [moreOpen]);

  const linkClass = ({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`;
  return (
    <div className={styles.shell}>
      <a href="#admin-main" className="skip-link">
        Skip to content
      </a>
      <aside className={styles.sidebar}>
        <Link to="/admin" className={styles.brand}>
          <Logo className={styles.sidebarLogo} />
        </Link>
        <nav aria-label="Dashboard" className={styles.nav}>
          {NAV.map((item, i) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={(state) => `${linkClass(state)} ${i >= PHONE_BAR_ITEMS ? styles.extra : ''}`}
            >
              <Icon d={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
          {/* Phones only: the remaining pages, so they are never hidden off the edge. */}
          <div className={styles.more} ref={moreRef}>
            <button
              type="button"
              className={`${styles.navLink} ${styles.moreButton} ${extraActive || moreOpen ? styles.active : ''}`}
              aria-expanded={moreOpen}
              aria-controls="admin-more"
              onClick={() => setMoreOpen((o) => !o)}
            >
              <Icon d={MORE_ICON} />
              <span>More</span>
            </button>
            {moreOpen && (
              <div id="admin-more" className={styles.morePanel}>
                {extras.map((item) => (
                  <NavLink key={item.to} to={item.to} className={linkClass}>
                    <Icon d={item.icon} />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </nav>
      </aside>
      <div className={styles.content}>
        <header className={styles.topbar}>
          <Link to="/admin" className={styles.mobileBrand}>
            <Logo compact />
          </Link>
          <div className={styles.topActions}>
            <a href="/" className={styles.viewSite} target="_blank" rel="noopener noreferrer">
              View site
            </a>
            <ThemeToggle />
            <span className={styles.userName} title={user?.email}>
              {user?.fullName}
            </span>
            <Button variant="secondary" size="sm" onClick={logout}>
              Sign out
            </Button>
          </div>
        </header>
        <main id="admin-main" key={location.pathname} className={`page-fade ${styles.main}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
