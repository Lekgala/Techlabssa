import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-6 sm:bottom-24 z-50 flex flex-col gap-2 max-w-md w-[92vw] sm:w-auto pointer-events-none no-print">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border border-[#E0E0E0] bg-[#000000] text-white text-xs transition-all duration-300 animate-in slide-in-from-bottom-3"
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-white" />}
              {isError && <AlertCircle className="w-4 h-4 text-neutral-300" />}
              {!isSuccess && !isError && <Info className="w-4 h-4 text-neutral-300" />}
            </div>

            <div className="flex-1 min-w-0">
              <h5 className="font-bold text-xs uppercase tracking-wider text-white">{toast.title}</h5>
              <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="text-neutral-400 hover:text-white p-1 rounded transition shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
