import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../api/auth';
import Wordmark from '../components/Wordmark';
import taglineImg from '../assets/tagline.png';

export default function Login() {
  const navigate = useNavigate();
  const { completeLogin } = useAuth();

  const [step, setStep] = useState('email'); // email | code
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSendCode(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.sendCode(email);
      setStep('code');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send code. Try again.');
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
          <img src={taglineImg} alt="Your local deal finder" className="h-16 mx-auto mt-2" />
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
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
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
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand-link text-white font-semibold py-3 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : isNewUser ? 'Create account' : 'Log in'}
            </button>
            <button
              type="button"
              onClick={() => setStep('email')}
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