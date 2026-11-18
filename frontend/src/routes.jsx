import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { LoadingBlock } from './components/Spinner';
import PublicLayout from './layouts/PublicLayout';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import Faq from './pages/public/Faq';
import Home from './pages/public/Home';
import NotFound from './pages/public/NotFound';
import Portfolio from './pages/public/Portfolio';
import PortfolioDetail from './pages/public/PortfolioDetail';
import Privacy from './pages/public/Privacy';
import Services from './pages/public/Services';

// The dashboard is a separate bundle that only downloads when someone visits /admin.
const AdminApp = lazy(() => import('./pages/admin/AdminApp'));

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="services" element={<Services />} />
        <Route path="about" element={<About />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="portfolio/:slug" element={<PortfolioDetail />} />
        <Route path="faq" element={<Faq />} />
        <Route path="contact" element={<Contact />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route
        path="admin/*"
        element={
          <Suspense fallback={<LoadingBlock label="Loading dashboard…" />}>
            <AdminApp />
          </Suspense>
        }
      />
    </Routes>
  );
}
