import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="recovery-screen" role="alert">
        <AlertTriangle size={34} />
        <h1>Let’s reopen your studio.</h1>
        <p>
          This screen couldn’t load. Reload to reopen your saved sessions. A photo still awaiting
          “Keep Photo” has not been saved.
        </p>
        <button className="primary" onClick={() => location.reload()}>
          Reload studio
        </button>
        <p className="muted">Reloading does not clear your saved photos.</p>
      </main>
    );
  }
}
