import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Midmar ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="w-full p-6 my-4 rounded-3xl bg-rose-50/90 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 shadow-sm flex flex-col items-center justify-center text-center space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-rose-950 dark:text-rose-200">
              {this.props.fallbackTitle || 'حدث تنبيه مؤقت أثناء عرض هذا القسم'}
            </h4>
            <p className="text-xs text-rose-700 dark:text-rose-300/80 max-w-sm leading-relaxed">
              {this.props.fallbackMessage ||
                'يمكنك النقر على الزر أدناه لإعادة تحميل القسم أو متابعة استخدام باقي أجزاء التطبيق بسلاسة.'}
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة المحاولة 🔄</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
