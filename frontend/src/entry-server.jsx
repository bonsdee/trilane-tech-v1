// Build-time entry: renders a public page to HTML for the pre-render step
// (scripts/prerender.mjs). It is never shipped to the browser.
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import AppRoutes from './routes';

export function render(path, data) {
  globalThis.__TRILANE_PATH__ = path;
  globalThis.__TRILANE_DATA__ = data;
  globalThis.__TRILANE_META__ = null;
  const html = renderToString(
    <ThemeProvider>
      <StaticRouter location={path}>
        <AppRoutes />
      </StaticRouter>
    </ThemeProvider>,
  );
  return { html, meta: globalThis.__TRILANE_META__ };
}
