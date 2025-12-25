import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw } from 'lucide-react';

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
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Game error:', error, errorInfo);
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
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl p-8 text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center bg-destructive/20">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>

            <h2 className="font-display text-2xl font-bold text-destructive mb-2">
              Đã xảy ra lỗi
            </h2>

            <p className="text-muted-foreground mb-4">
              Game gặp sự cố không mong muốn. Vui lòng thử tải lại trang.
            </p>

            {this.state.error && (
              <details className="text-left mb-4 p-3 rounded bg-muted/50 text-xs">
                <summary className="cursor-pointer text-muted-foreground">
                  Chi tiết lỗi
                </summary>
                <pre className="mt-2 overflow-auto text-destructive">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <Button
              onClick={this.handleReset}
              className="w-full"
              variant="destructive"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Tải lại trang
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
