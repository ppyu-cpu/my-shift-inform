import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-14 right-6 z-[200] max-w-md bg-[#1c192d] text-white px-4 py-3 rounded-lg shadow-xl border border-[#c7c4d8]/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200 text-xs">
      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
      <span className="flex-1 font-medium">{message}</span>
      <button
        onClick={onClose}
        className="text-white/60 hover:text-white transition-colors cursor-pointer p-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
