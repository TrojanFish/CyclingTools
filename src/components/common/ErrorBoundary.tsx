import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const { fallbackTitle = '此工具加载或运行发生异常' } = this.props;

      return (
        <div className="w-full max-w-2xl mx-auto py-8 px-4 sm:px-0 animate-in fade-in zoom-in-95 duration-200">
          <div className="ios-card p-4 sm:p-5 rounded-2xl border border-black/[0.08] dark:border-white/10 bg-white/85 dark:bg-[#1C1C1E]/85 backdrop-blur-2xl shadow-ios-card space-y-4 text-center">
            {/* Warning Icon Badge */}
            <div className="w-12 h-12 mx-auto rounded-2xl bg-ios-orange/15 dark:bg-ios-orange/20 text-ios-orange flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 stroke-[2]" />
            </div>

            {/* Error Titles */}
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white">
                {fallbackTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                页面未能正常呈现。可能由于网络连接闪断或组件依赖初始化中断，您可以尝试重新加载或返回首页。
              </p>
            </div>

            {/* Action Buttons (Strict Apple HIG Hierarchy: 1 Prominent + 1 Bordered) */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={this.handleReset}
                className="apple-touch h-9 px-4 rounded-xl bg-ios-blue hover:bg-ios-blue/90 text-white text-xs font-semibold shadow-ios-sm flex items-center justify-center gap-1.5 transition"
              >
                <Home className="w-4 h-4" />
                <span>返回首页</span>
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="apple-touch h-9 px-4 rounded-xl bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-black/[0.08] dark:border-white/10 shadow-ios-sm flex items-center justify-center gap-1.5 transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>重新加载页面</span>
              </button>
            </div>

            {/* Collapsible Error Debug Details */}
            {this.state.error && (
              <div className="pt-2 text-left">
                <button
                  type="button"
                  onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                  className="apple-touch text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 mx-auto transition"
                >
                  <span>{this.state.showDetails ? '隐藏技术诊断详情' : '查看技术诊断详情'}</span>
                  {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {this.state.showDetails && (
                  <div className="mt-3 p-3 rounded-xl bg-black/5 dark:bg-black/40 border border-black/[0.06] dark:border-white/[0.06] overflow-x-auto text-[11px] font-mono text-ios-red dark:text-red-400 leading-relaxed max-h-48">
                    <p className="font-bold">{this.state.error.name}: {this.state.error.message}</p>
                    {this.state.error.stack && (
                      <pre className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
