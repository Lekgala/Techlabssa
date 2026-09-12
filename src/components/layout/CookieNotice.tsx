import React, { useEffect, useState } from 'react';
import { Cookie, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const COOKIE_NOTICE_KEY = 'techlabs_cookie_notice_seen';

export const CookieNotice: React.FC = () => {
  const { navigate } = useApp();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(localStorage.getItem(COOKIE_NOTICE_KEY) !== 'true');
  }, []);

  const dismiss = () => {
    localStorage.setItem(COOKIE_NOTICE_KEY, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto z-50 max-w-lg bg-[#000000] text-white border border-[#333333] rounded-2xl shadow-2xl p-4 sm:p-5 no-print" role="status" aria-label="Cookie notice">
      <div className="flex items-start gap-3">
        <Cookie className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="font-bold text-xs uppercase tracking-[0.16em]">Essential cookies only</h2>
          <p className="text-xs text-neutral-300 leading-relaxed">
            TechLabs uses an essential session cookie to keep student and staff accounts signed in, plus a security cookie to protect form submissions. We do not use advertising or analytics cookies.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-wider">
            <button type="button" onClick={() => { dismiss(); navigate('/privacy'); }} className="underline underline-offset-2 hover:text-white text-neutral-300">Privacy details</button>
            <button type="button" onClick={dismiss} className="px-3 py-1.5 bg-white text-black rounded-lg hover:bg-neutral-200">Okay</button>
          </div>
        </div>
        <button type="button" onClick={dismiss} className="text-neutral-400 hover:text-white p-1" aria-label="Dismiss cookie notice" title="Dismiss">
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};