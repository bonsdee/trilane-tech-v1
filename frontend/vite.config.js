import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Public routes listed in sitemap.xml. Portfolio pages are left out because
// they stay hidden until the first project is published; add them once they exist.
const SITEMAP_ROUTES = ['/', '/services', '/about', '/faq', '/contact', '/privacy'];

/** Writes sitemap.xml and robots.txt into the build using VITE_SITE_URL. */
function seoFiles(siteUrl) {
  const base = siteUrl.replace(/\/$/, '');
  return {
    name: 'trilane-seo-files',
    // Puts the real site address into the sharing tags in index.html.
    transformIndexHtml(html) {
      return html.replaceAll('__SITE_URL__', base);
    },
    generateBundle() {
      const urls = SITEMAP_ROUTES.map(
        (path) => `  <url><loc>${base}${path === '/' ? '/' : path}</loc></url>`,
      ).join('\n');
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      });
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${base}/sitemap.xml\n`,
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const siteUrl = env.VITE_SITE_URL || 'https://trilanetech.com';
  return {
    plugins: [react(), seoFiles(siteUrl)],
    server: { port: 5173, strictPort: true },
    preview: { port: 4173 },
    build: { sourcemap: false },
  };
});
