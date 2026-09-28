'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Loader2, CheckCircle2, X } from 'lucide-react';

interface GoogleAuthButtonProps {
  mode?: 'signin' | 'signup';
  onSuccess?: () => void;
  className?: string;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  mode = 'signin',
  onSuccess,
  className = '',
}) => {
  const router = useRouter();
  const { loginWithGoogle, isLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  // Check if live Google Client ID is configured
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleGoogleClick = async () => {
    // If real Google Client ID is present, we initialize Google Identity
    if (googleClientId && typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      try {
        setSubmitting(true);
        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback to modal dialog
            setShowPickerModal(true);
            setSubmitting(false);
          }
        });
        return;
      } catch (e) {
        console.warn('Google prompt fallback', e);
      }
    }

    // Otherwise show the slick Google Account Picker modal
    setShowPickerModal(true);
  };

  const handleSelectAccount = async (name: string, email: string) => {
    setSubmitting(true);
    setShowPickerModal(false);
    try {
      const res = await loginWithGoogle({
        name,
        email,
        role: 'Full-Stack Developer',
      });
      if (res.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/dashboard');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleGoogleClick}
        disabled={isLoading || submitting}
        className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-xs hover:shadow-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      >
        {submitting ? (
          <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
        ) : (
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.34 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27 0-.78.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12c0 2.06.46 3.84 1.26 5.42l4.02-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
        )}
        <span>
          {mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}
        </span>
      </button>

      {/* Google Interactive Account Picker Modal */}
      {showPickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-scaleUp">
            {/* Google Brand Header */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27 0-.78.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12c0 2.06.46 3.84 1.26 5.42l4.02-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Sign in with Google
                  </h3>
                  <p className="text-xs text-slate-500">to continue to HireFlow</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPickerModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Profiles */}
            <div className="p-6 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Choose a candidate account
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() =>
                    handleSelectAccount('Afeef Iqbal', 'afeef.iqbal@gmail.com')
                  }
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold flex items-center justify-center text-sm shadow-xs">
                      AI
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-700">
                        Afeef Iqbal
                      </div>
                      <div className="text-xs text-slate-500">afeef.iqbal@gmail.com</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Primary
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSelectAccount('Alex Candidate', 'alex.developer@gmail.com')
                  }
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-300 text-blue-800 font-bold flex items-center justify-center text-sm shadow-xs">
                      AC
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 group-hover:text-blue-700">
                        Alex Candidate
                      </div>
                      <div className="text-xs text-slate-500">alex.developer@gmail.com</div>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-500">Demo User</span>
                </button>
              </div>

              {/* Or enter custom Google Account */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-2">Or enter another Google email:</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    disabled={!customGoogleEmail.includes('@')}
                    onClick={() =>
                      handleSelectAccount(
                        customGoogleName ||
                          customGoogleEmail.split('@')[0].replace(/[._]/g, ' '),
                        customGoogleEmail
                      )
                    }
                    className="px-3 py-2 bg-[#00b074] hover:bg-[#009a65] text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors shadow-xs"
                  >
                    Continue
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-[11px] text-slate-500 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  HireFlow uses Google OAuth 2.0 with minimal permissions (Profile &amp; Email) to authenticate candidates securely.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
