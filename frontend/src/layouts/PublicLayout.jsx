import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import Button from '../components/Button';
import ConsentBanner, { openConsentSettings } from '../components/ConsentBanner';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { SiteProvider, useSite } from '../context/SiteContext';
import { useLeadSource } from '../hooks/useLeadSource';
import { trackPageView, GA_ID } from '../utils/analytics';
import { contactLink } from '../utils/leadSource';
import styles from './PublicLayout.module.css';

function navItems(portfolioVisible) {
  return [
    { to: '/services', label: 'Services & Pricing' },
    { to: '/about', label: 'About' },
    ...(portfolioVisible ? [{ to: '/portfolio', label: 'Portfolio' }] : []),
    { to: '/faq', label: 'FAQ' },
  ];
}

function Header() {
  const { site } = useSite();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [compact, setCompact] = useState(false);
  const location = useLocation();
  const items = navItems(site?.portfolioVisible);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 4);
      setCompact(window.scrollY > 48);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''} ${compact ? styles.compact : ''}`}>
        <div className={`container ${styles.headerInner}`}>
          <Link to="/" className={styles.brand} aria-label="Trilane Tech home" onClick={closeMenu}>
            <Logo />
          </Link>
          <nav className={styles.nav} aria-label="Main">
            {items.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className={styles.actions}>
            <ThemeToggle />
            <Button size="sm" to={contactLink({ cta: 'header-contact', from: location.pathname })} className={styles.headerCta}>
              Contact
            </Button>
            <button
              type="button"
              className={styles.menuButton}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className={`${styles.burger} ${menuOpen ? styles.burgerOpen : ''}`} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>
      {/* Kept outside <header> on purpose: the header's backdrop blur turns it into the
          positioning box for fixed children, which squashed this panel to nothing on iPhones. */}
      <div id="mobile-menu" className={`${styles.mobileMenu} ${menuOpen ? styles.mobileOpen : ''}`} hidden={!menuOpen}>
        <nav aria-label="Mobile" className={styles.mobileNav}>
          {[{ to: '/', label: 'Home' }, ...items].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) => `${styles.mobileLink} ${isActive ? styles.mobileActive : ''}`}
              onClick={closeMenu}
            >
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to={contactLink({ cta: 'mobile-menu-contact', from: location.pathname })}
            className={({ isActive }) => `${styles.mobileLink} ${isActive ? styles.mobileActive : ''}`}
            onClick={closeMenu}
          >
            Contact
          </NavLink>
        </nav>
      </div>
    </>
  );
}

function Footer() {
  const { site } = useSite();
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footerInner}`}>
        <div className={styles.footerBrand}>
          <Logo variant="tagline" className={styles.footerLogo} />
          <p className="muted">Websites that bring in leads, and the hands to follow them up.</p>
        </div>
        <nav aria-label="Footer" className={styles.footerNav}>
          {navItems(site?.portfolioVisible).map((item) => (
            <Link key={item.to} to={item.to}>
              {item.label}
            </Link>
          ))}
          <Link to="/contact">Contact</Link>
          <Link to="/privacy">Privacy policy</Link>
          {GA_ID && (
            <button type="button" className={styles.linkButton} onClick={openConsentSettings}>
              Cookie settings
            </button>
          )}
        </nav>
      </div>
      <div className={`container ${styles.footerBottom}`}>
        <p>© {year} Trilane Tech. All prices are in US dollars.</p>
      </div>
    </footer>
  );
}

/** Scrolls to the top (or to a #section) after navigation, and records page views. */
function RouteEffects() {
  const location = useLocation();
  useLeadSource();
  // Feeds the pointer position to .spotlight cards so their glow follows the cursor.
  useEffect(() => {
    const onMove = (event) => {
      const card = event.target instanceof Element ? event.target.closest('.spotlight') : null;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      card.style.setProperty('--my', `${event.clientY - rect.top}px`);
    };
    document.addEventListener('pointermove', onMove, { passive: true });
    return () => document.removeEventListener('pointermove', onMove);
  }, []);
  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);
  useEffect(() => {
    // Wait a tick so the page has set its title.
    const id = setTimeout(() => trackPageView(location.pathname), 50);
    return () => clearTimeout(id);
  }, [location.pathname]);
  return null;
}

export default function PublicLayout() {
  const location = useLocation();
  return (
    <SiteProvider>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <RouteEffects />
      <Header />
      <main id="main" key={location.pathname} className={`page-fade ${styles.main}`}>
        <Outlet />
      </main>
      <Footer />
      <ConsentBanner />
    </SiteProvider>
  );
}
