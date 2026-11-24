import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from '@/components/ui/sonner';
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import './index.css';
import App from './App.tsx';
import AuthInitializer from './components/auth/AuthInitializer';
import { ApiRequestError } from './api/client';
import { useAuthStore } from './store/authStore';

const MAX_RETRIES = 3;
const UNAUTHORIZED = 401;
const FIRST_SERVER_ERROR = 500;

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    // a 401 on any query means the login is gone, so the page must not keep showing the user as signed in
    onError: (error) => {
      if (error instanceof ApiRequestError && error.status === UNAUTHORIZED) {
        useAuthStore.getState().clearAuth();
      }
    },
  }),
  defaultOptions: {
    queries: {
      // asking again does not help for 401, 404 and other 4xx answers, only for network and server errors
      retry: (failureCount, error) => {
        const isClientError =
          error instanceof ApiRequestError &&
          error.status !== undefined &&
          error.status < FIRST_SERVER_ERROR;
        return !isClientError && failureCount < MAX_RETRIES;
      },
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthInitializer>
          <App />
        </AuthInitializer>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
);
