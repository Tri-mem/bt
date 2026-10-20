import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-14 sm:top-auto sm:bottom-4 inset-x-3 sm:left-auto sm:right-4 z-50 flex flex-col gap-2 max-w-sm sm:w-full mx-auto sm:mx-0 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-indigo-500 shrink-0" />,
  };

  const borderColors = {
    success: 'border-emerald-200 bg-white',
    error: 'border-rose-200 bg-white',
    warning: 'border-amber-200 bg-white',
    info: 'border-indigo-200 bg-white',
  };

  return (
    <div className={`pointer-events-auto p-3.5 rounded-2xl shadow-xl border ${borderColors[toast.type]} flex items-start gap-3 transition-all duration-300 animate-slide-in`}>
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-slate-900">{toast.title}</h4>
        {toast.description && (
          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{toast.description}</p>
        )}
      </div>
      <button 
        onClick={onDismiss}
        className="text-slate-400 hover:text-slate-600 p-1"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
