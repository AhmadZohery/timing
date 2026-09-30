import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  isRoot?: boolean;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  showDetails: boolean;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    showDetails: false,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Midmar ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  private handleFullRecovery = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('midmar_active_station', 'HOME');
      }
      if (typeof window !== 'undefined') {
        window.location.hash = '';
        window.location.reload();
      }
    } catch {
      this.handleReset();
    }
  };

  private handleCopyError = () => {
    if (this.state.error) {
      const details = `${this.state.error.name}: ${this.state.error.message}\n${this.state.error.stack || ''}`;
      navigator.clipboard?.writeText(details).then(() => {
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2500);
      });
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="w-full p-5 sm:p-6 my-4 rounded-3xl bg-rose-50/95 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 shadow-md flex flex-col items-center justify-center text-center space-y-3.5 select-none animate-fade-in"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-black text-rose-950 dark:text-rose-200">
              {this.props.fallbackTitle || 'حدث تنبيه مؤقت أثناء عرض هذا القسم'}
            </h4>
            <p className="text-xs text-rose-700 dark:text-rose-300/80 max-w-md leading-relaxed">
              {this.props.fallbackMessage ||
                'يمكنك النقر على الزر أدناه لإعادة تشغيل القسم بسلاسة أو العودة إلى المحطة الرئيسية دون فقدان بياناتك.'}
            </p>
          </div>

          {/* Action Recovery Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة المحاولة 🔄</span>
            </button>

            <button
              type="button"
              onClick={this.handleFullRecovery}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
            >
              <Home className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>العودة للرئيسية والتعافي 🏠</span>
            </button>
          </div>

          {/* Technical Diagnostic Details Drawer */}
          {this.state.error && (
            <div className="w-full max-w-lg mt-2 pt-2 border-t border-rose-200/60 dark:border-rose-900/40 text-right">
              <button
                type="button"
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                className="text-[11px] font-bold text-rose-700 dark:text-rose-300/70 hover:underline flex items-center justify-center gap-1 w-full cursor-pointer py-1"
              >
                <span>{this.state.showDetails ? 'إخفاء التفاصيل الفنية' : 'عرض التفاصيل الفنية للتشخيص'}</span>
                {this.state.showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {this.state.showDetails && (
                <div className="mt-2 p-3 rounded-xl bg-black/80 text-rose-200 text-[10px] font-mono overflow-x-auto text-left dir-ltr max-h-36 scrollbar-thin space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-zinc-700/50 pb-1">
                    <span>{this.state.error.name}</span>
                    <button
                      type="button"
                      onClick={this.handleCopyError}
                      className="flex items-center gap-1 text-[10px] text-zinc-300 hover:text-white px-2 py-0.5 rounded bg-zinc-800 cursor-pointer"
                    >
                      {this.state.copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{this.state.copied ? 'تم النسخ' : 'نسخ الخطأ'}</span>
                    </button>
                  </div>
                  <div className="text-rose-300 font-bold">{this.state.error.message}</div>
                  {this.state.error.stack && (
                    <pre className="text-zinc-400 whitespace-pre-wrap leading-tight text-[9px]">
                      {this.state.error.stack.slice(0, 400)}...
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
