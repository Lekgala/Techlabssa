import React, { useEffect, useState } from 'react';
import { ArrowRight, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiRequest, setApiSession } from '../../lib/api';

type AccessMode = 'login' | 'forgot' | 'magic' | 'setup' | 'reset' | 'verify';

export const StudentLogin: React.FC = () => {
  const { studentLogin, navigate } = useApp();
  const params = new URLSearchParams(window.location.search);
  const linkAction = params.get('action') as AccessMode | null;
  const token = params.get('token') || '';
  const [mode, setMode] = useState<AccessMode>(linkAction || 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !['magic', 'verify'].includes(mode)) return;
    setBusy(true);
    setError('');
    const endpoint = mode === 'magic' ? '/auth/magic-login' : '/auth/verify-email';
    void apiRequest<{ token?: string; message?: string }>(endpoint, {
      method: 'POST',
      body: JSON.stringify({ token }),
    }).then(result => {
      if (mode === 'magic' && result.token) {
        setApiSession(result.token);
        window.location.assign('/student');
        return;
      }
      window.history.replaceState({}, '', '/student/login');
      setMode('login');
      setMessage(result.message || 'Email verified. You can now sign in.');
    }).catch(() => setError('This secure link is invalid, expired, or has already been used.'))
      .finally(() => setBusy(false));
  }, [mode, token]);

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    if (await studentLogin(email.trim(), password)) navigate('/student');
    else setError('Sign-in failed. Check your details or reset your password.');
    setBusy(false);
  };

  const requestAccess = async (type: 'RESET_PASSWORD' | 'MAGIC_LOGIN') => {
    if (!email.trim()) {
      setError('Enter your registered email address first.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await apiRequest<{ message: string }>('/auth/request-access', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), type }),
      });
      setMessage(result.message);
    } catch {
      setError('The email could not be requested. Please try again shortly.');
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const result = await apiRequest<{ message: string }>('/auth/set-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      window.history.replaceState({}, '', '/student/login');
      setPassword('');
      setConfirmPassword('');
      setMode('login');
      setMessage(result.message);
    } catch {
      setError('Use at least 10 characters with uppercase, lowercase and a number, or request a new link.');
    } finally {
      setBusy(false);
    }
  };

  const passwordLinkMode = mode === 'setup' || mode === 'reset';

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-8 bg-white text-[#1A1A1A]">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
          <KeyRound className="w-6 h-6" />
        </div>
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] bg-[#FAFAFA] px-3 py-1 rounded-full border border-[#E0E0E0] font-bold">Secure Student Portal</span>
        <h1 className="text-2xl sm:text-3xl font-light tracking-tight">
          {passwordLinkMode ? (mode === 'setup' ? 'Create your password' : 'Reset your password') : mode === 'forgot' ? 'Recover your account' : mode === 'magic' ? 'Email sign-in link' : mode === 'verify' ? 'Verifying your email' : 'Student sign in'}
        </h1>
        <p className="text-xs text-[#707070] leading-relaxed">Application references are for payments and support only. Portal access uses your verified email and secure password.</p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E0E0E0] shadow-sm space-y-5">
        {message && <div className="p-3 rounded-xl bg-[#F2FFF5] border border-[#9AD5A6] text-xs text-[#176B2C]">{message}</div>}
        {error && <div className="p-3 rounded-xl bg-[#FFF5F5] border border-[#E6AAAA] text-xs text-[#9B1C1C]">{error}</div>}

        {passwordLinkMode ? (
          <form onSubmit={savePassword} className="space-y-4 text-xs font-mono">
            <PasswordField label="New Password" value={password} onChange={setPassword} />
            <PasswordField label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} />
            <p className="text-[10px] text-[#707070]">Minimum 10 characters, including uppercase, lowercase and a number.</p>
            <SubmitButton busy={busy} label={mode === 'setup' ? 'Create Account' : 'Save New Password'} />
          </form>
        ) : mode === 'login' ? (
          <form onSubmit={submitLogin} className="space-y-4 text-xs font-mono">
            <EmailField value={email} onChange={setEmail} />
            <PasswordField label="Password" value={password} onChange={setPassword} />
            <SubmitButton busy={busy} label="Sign In" />
          </form>
        ) : mode !== 'verify' ? (
          <div className="space-y-4 text-xs font-mono">
            <EmailField value={email} onChange={setEmail} />
            <button disabled={busy} onClick={() => void requestAccess(mode === 'magic' ? 'MAGIC_LOGIN' : 'RESET_PASSWORD')} className="w-full py-3 bg-black disabled:bg-[#A0A0A0] text-white font-bold uppercase tracking-[0.15em] rounded-xl">
              {busy ? 'Sending…' : mode === 'magic' ? 'Email One-Time Link' : 'Email Recovery Link'}
            </button>
          </div>
        ) : <p className="text-center text-xs text-[#707070]">{busy ? 'Checking your secure link…' : 'Verification finished.'}</p>}

        {!passwordLinkMode && mode !== 'verify' && (
          <div className="border-t border-[#E0E0E0] pt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[10px] font-bold uppercase tracking-wider">
            {mode !== 'login' && <button onClick={() => { setMode('login'); setError(''); setMessage(''); }} className="hover:underline">Password Sign In</button>}
            {mode === 'login' && <button onClick={() => { setMode('forgot'); setError(''); }} className="hover:underline">Forgot Password</button>}
            {mode !== 'magic' && <button onClick={() => { setMode('magic'); setError(''); }} className="hover:underline">Email Me a Login Link</button>}
          </div>
        )}

        <div className="flex items-start gap-2 bg-[#FAFAFA] p-3 rounded-xl border border-[#E0E0E0] text-[11px] text-[#707070]">
          <ShieldCheck className="w-4 h-4 text-black shrink-0" />
          <p>Secure links expire automatically and work once. If your application was approved before accounts were introduced, use <strong>Forgot Password</strong> to create your account.</p>
        </div>
      </div>
    </div>
  );
};

const EmailField = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <div className="space-y-1.5">
    <label className="font-bold uppercase tracking-wider text-[10px]">Registered Email *</label>
    <div className="relative"><Mail className="w-4 h-4 text-[#A0A0A0] absolute left-3 top-3.5" /><input type="email" required value={value} onChange={event => onChange(event.target.value)} className="w-full pl-9 pr-3 py-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl focus:border-black focus:outline-none" /></div>
  </div>
);

const PasswordField = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
  <div className="space-y-1.5">
    <label className="font-bold uppercase tracking-wider text-[10px]">{label} *</label>
    <div className="relative"><KeyRound className="w-4 h-4 text-[#A0A0A0] absolute left-3 top-3.5" /><input type="password" required autoComplete={label === 'Password' ? 'current-password' : 'new-password'} value={value} onChange={event => onChange(event.target.value)} className="w-full pl-9 pr-3 py-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl focus:border-black focus:outline-none" /></div>
  </div>
);

const SubmitButton = ({ busy, label }: { busy: boolean; label: string }) => (
  <button type="submit" disabled={busy} className="w-full py-3 bg-black disabled:bg-[#A0A0A0] text-white font-bold text-xs uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2"><span>{busy ? 'Please wait…' : label}</span><ArrowRight className="w-4 h-4" /></button>
);
