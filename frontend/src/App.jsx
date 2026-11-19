import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import AppRoutes from './routes';

export default function App() {
  // A pre-rendered page shown for a different path stays hidden until the app has drawn the right one.
  useEffect(() => {
    document.documentElement.classList.remove('pr-hide');
  }, []);
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}
