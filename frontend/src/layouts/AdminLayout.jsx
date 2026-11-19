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
  { to: '/admin/settings', label: 'Settings', icon: 'M4 7h9M17 7h3M15 5v4M4 17h3M11 17h9M9 15v4M4 12h16' },
  { to: '/admin/users', label: 'Users', icon: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6' },
];

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
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
              <Icon d={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
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
