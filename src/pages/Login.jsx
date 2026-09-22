import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../api/auth';
import Wordmark from '../components/Wordmark';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve();

  const existing = document.querySelector(`script[src="${TURNSTILE_SCRIPT_SRC}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Turnstile failed to load')));
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Turnstile failed to load'));
    document.head.appendChild(script);
  });
}

export default function Login() {
  const navigate = useNavigate();
  const { completeLogin } = useAuth();

  const [step, setStep] = useState('email'); // email | code
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');

  const turnstileContainerRef = useRef(null);
  const turnstileWidgetIdRef = useRef(null);

  // Render the Turnstile widget whenever the email step is showing
  useEffect(() => {
    if (step !== 'email') return;

    let cancelled = false;
    setTurnstileToken('');

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !turnstileContainerRef.current) return;
        turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'light',
          callback: (token) => setTurnstileToken(token),
          'expired-callback': () => setTurnstileToken(''),
          'error-callback': () => setTurnstileToken(''),
        });
      })
      .catch(() => {
        if (!cancelled) {
          setError('Security check failed to load. Refresh the page and try again.');
        }
      });

    return () => {
      cancelled = true;
      if (turnstileWidgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(turnstileWidgetIdRef.current);
      }
      turnstileWidgetIdRef.current = null;
    };
  }, [step]);

  function resetTurnstile() {
    setTurnstileToken('');
    if (turnstileWidgetIdRef.current !== null && window.turnstile) {
      window.turnstile.reset(turnstileWidgetIdRef.current);
    }
  }

  async function handleSendCode(e) {
    e.preventDefault();
    setError('');

    if (!turnstileToken) {
      setError('Please wait for the security check to finish.');
      return;
    }

    setLoading(true);
    try {
      await authApi.sendCode(email, turnstileToken);
      setStep('code');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send code. Try again.');
      // Tokens are single-use, so get a fresh one for the next attempt
      resetTurnstile();
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = isNewUser
        ? await authApi.signup({ email, code, username })
        : await authApi.verifyCode({ email, code });
      completeLogin(result);
      navigate('/');
    } catch (err) {
      if (err.response?.status === 404) {
        setIsNewUser(true);
        setError('No account found — pick a username to create one.');
      } else {
        setError(err.response?.data?.error || 'Invalid code. Try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-2">
          <Wordmark className="h-24 mx-auto" />
          <p className="text-brand-navy font-semibold text-xl tracking-wide mt-2">
            Local, Organized.
          </p>
        </div>

        {step === 'email' && (
          <form onSubmit={handleSendCode} className="space-y-4 mt-8">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Email</label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-link"
              />
            </div>
            <div ref={turnstileContainerRef} className="flex justify-center" />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || !turnstileToken}
              className="w-full rounded-xl bg-brand-link text-white font-semibold py-3 disabled:opacity-50"
            >
              {loading ? 'Sending code...' : 'Continue'}
            </button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleVerifyCode} className="space-y-4 mt-8">
            <p className="text-slate-500 text-sm text-center">
              We sent a code to <span className="text-brand-navy font-medium">{email}</span>
            </p>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Verification code</label>
              <input
                type="text"
                required
                autoFocus
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-link tracking-widest text-center text-lg"
              />
            </div>
            {isNewUser && (
              <div>
                <label className="block text-sm text-slate-600 mb-1">Choose a username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="gullfather"
                  className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-link"
                />
              </div>
            )}
            {isNewUser && (
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-brand-link cursor-pointer flex-shrink-0"
                />
                <span className="text-brand-gray text-sm">
                  I agree to the{' '}
                  <Link to="/terms" target="_blank" className="text-brand-link underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" target="_blank" className="text-brand-link underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>
            )}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || (isNewUser && !agreedToTerms)}
              className="w-full rounded-xl bg-brand-link text-white font-semibold py-3 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : isNewUser ? 'Create account' : 'Log in'}
            </button>
            <button
              type="button"
              onClick={() => {
                setError('');
                setStep('email');
              }}
              className="w-full text-brand-gray text-sm py-2"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}