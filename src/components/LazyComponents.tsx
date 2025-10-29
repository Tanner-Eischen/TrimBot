import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy loading components for better performance
const MediaLibrary = React.lazy(() => import('./MediaLibrary'));
const VideoPreview = React.lazy(() => import('./VideoPreview'));
const DualVideoPreview = React.lazy(() => import('./preview/DualVideoPreview'));
const Recording = React.lazy(() => import('./Recording'));
const ExportDialog = React.lazy(() => import('./ExportDialog'));

// Loading fallback component
const LoadingSpinner = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center space-x-2">
      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      <span className="text-gray-600">{message}</span>
    </div>
  </div>
);

// Lazy wrapper components with proper error boundaries
export const LazyMediaLibrary = React.memo((props: any) => (
  <Suspense fallback={<LoadingSpinner message="Loading media library..." />}>
    <MediaLibrary {...props} />
  </Suspense>
));

export const LazyVideoPreview = React.memo((props: any) => (
  <Suspense fallback={<LoadingSpinner message="Loading video preview..." />}>
    <VideoPreview {...props} />
  </Suspense>
));

export const LazyDualVideoPreview = React.memo((props: any) => (
  <Suspense fallback={<LoadingSpinner message="Loading dual preview..." />}>
    <DualVideoPreview {...props} />
  </Suspense>
));

export const LazyRecording = React.memo((props: any) => (
  <Suspense fallback={<LoadingSpinner message="Loading recording interface..." />}>
    <Recording {...props} />
  </Suspense>
));

export const LazyExportDialog = React.memo((props: any) => (
  <Suspense fallback={<LoadingSpinner message="Loading export dialog..." />}>
    <ExportDialog {...props} />
  </Suspense>
));

// Error boundary for lazy components
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class LazyComponentErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '0.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#dc2626', marginBottom: '0.5rem' }}>Component failed to load</div>
            <button
              onClick={() => this.setState({ hasError: false })}
              style={{ padding: '0.5rem 1rem', backgroundColor: '#dc2626', color: 'white', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontWeight: 500 }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


