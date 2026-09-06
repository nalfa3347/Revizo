import { Component, ErrorInfo, ReactNode } from 'react';
import { FriendlyNotice } from './FriendlyNotice';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log développeur uniquement — invisible à l'élève
    console.error('Erreur capturée par ErrorBoundary :', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{ padding: 'var(--space-6)', maxWidth: '600px', margin: 'var(--space-12) auto' }}>
          <FriendlyNotice
            type="error"
            title="Un instant de respiration..."
            message="L’affichage a rencontré une petite difficulté passagère. Tu peux recharger l’écran en toute sécurité pour reprendre ton travail."
            actionText="Recharger la page"
            onAction={this.handleReset}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
