import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/auth/AuthProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { setUpQueryCache } from '@/lib/queryCache';
import { initMonitoring } from '@/lib/monitoring';
import App from './App';
import './styles/index.css';

// Uncaught errors and rejections are reported once the SDK loads; off without a DSN.
void initMonitoring('student-web');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Catalog reads saved on this device are restored before the first render.
void setUpQueryCache(queryClient).finally(() =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </AuthProvider>
          </QueryClientProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </StrictMode>
  )
);
