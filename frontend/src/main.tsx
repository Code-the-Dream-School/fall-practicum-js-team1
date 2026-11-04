import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.tsx';
import { BrowserRouter } from 'react-router';

// TEMPORARY: lets the fetch based login code use the mock data while we are in mock mode.
// Mock mode is turned on with VITE_USE_MOCKED_API_CALLS=true in frontend/.env.local (see env.d.ts).
if (import.meta.env.VITE_USE_MOCKED_API_CALLS === 'true') {
  await import('./api/mockFetch');
}

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
