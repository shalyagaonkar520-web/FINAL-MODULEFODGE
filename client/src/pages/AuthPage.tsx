import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Layers,
  Lock,
  Mail,
  User,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Zap,
  Code2,
  ArrowLeft,
  X,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

interface AuthPageProps {
  initialMode?: 'signin' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, loginWithGoogle, resetPassword, isAuthenticated } = useAuthStore();

  // Determine mode from prop or path
  const isSignUpPath = location.pathname.includes('signup') || location.pathname.includes('register');
  const [isRegister, setIsRegister] = useState<boolean>(
    initialMode ? initialMode === 'signup' : isSignUpPath
  );

  useEffect(() => {
    setIsRegister(initialMode ? initialMode === 'signup' : isSignUpPath);
  }, [location.pathname, initialMode, isSignUpPath]);

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forgot password modal state
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState<{ success?: boolean; msg?: string } | null>(null);

  // Password strength calculation
  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;
    return score; // 0 to 4
  };

  const passStrength = calculatePasswordStrength(password);
  const strengthLabels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-rose-500', 'bg-rose-400', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-500'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (isRegister) {
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (isRegister) {
        const result = await register(name, email, password);
        if (result.success) {
          navigate('/dashboard', { replace: true });
        } else {
          setErrorMsg(result.error ?? 'Registration failed.');
        }
      } else {
        const result = await login(email, password);
        if (result.success) {
          navigate('/dashboard', { replace: true });
        } else {
          setErrorMsg(result.error ?? 'Authentication failed.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsGoogleSubmitting(true);
    const result = await loginWithGoogle();
    setIsGoogleSubmitting(false);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setErrorMsg(result.error ?? 'Google sign-in failed.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    setResetStatus(null);

    const res = await resetPassword(resetEmail.trim());
    setResetLoading(false);
    if (res.success) {
      setResetStatus({
        success: true,
        msg: `Password reset link sent to ${resetEmail}. Check your inbox!`,
      });
    } else {
      setResetStatus({
        success: false,
        msg: res.error || 'Failed to send reset email.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Dynamic Background Glowing Gradients */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/10 blur-[140px] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-slate-800/80 px-6 sm:px-12 flex items-center justify-between sticky top-0 bg-slate-950/70 backdrop-blur-xl z-40">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 p-0.5 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Layers className="w-4.5 h-4.5 text-indigo-400" />
            </div>
          </div>
          <span className="font-bold text-lg tracking-tight text-white">ModuleForge</span>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 z-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Hero/Branding Showcase (visible on LG screens) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Modular App Composer</span>
              </div>

              <div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight leading-snug">
                  Build faster with verified modules.
                </h2>
                <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                  Combine backend microservices, visual canvases, and pre-built frontend blocks into a production-ready stack in seconds.
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="space-y-3.5 pt-2">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0 mt-0.5">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Visual Drag & Drop Flow</h4>
                    <p className="text-[11px] text-slate-400">Compose complex microservice pipelines with node-based canvas.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 shrink-0 mt-0.5">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Full Git Sync & Webhooks</h4>
                    <p className="text-[11px] text-slate-400">Auto-sync GitHub repositories, commits, and multi-service runners.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Secure Firebase Authentication</h4>
                    <p className="text-[11px] text-slate-400">Enterprise token management, OAuth, and encrypted session store.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom mini status badge */}
            <div className="pt-8 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Platform Online
              </span>
              <span className="text-[11px] text-slate-500">v1.0.0</span>
            </div>
          </div>

          {/* Right Card: Auth Form */}
          <div className="w-full lg:col-span-7 flex flex-col justify-center">
            <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl relative">
              {/* Tab Selector: Sign In vs Sign Up */}
              <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800/80 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`py-2.5 text-xs font-semibold rounded-xl transition-all ${
                    !isRegister
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`py-2.5 text-xs font-semibold rounded-xl transition-all ${
                    isRegister
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Header Title */}
              <div className="mb-6 space-y-1">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {isRegister ? 'Create your ModuleForge account' : 'Welcome back to ModuleForge'}
                </h1>
                <p className="text-xs text-slate-400">
                  {isRegister
                    ? 'Start building modular full-stack projects in minutes.'
                    : 'Enter your credentials to access your workspaces and modules.'}
                </p>
              </div>

              {/* Error Banner */}
              {errorMsg && (
                <div className="flex items-start gap-2.5 p-3.5 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span className="flex-1">{errorMsg}</span>
                  <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-200">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Success Banner */}
              {successMsg && (
                <div className="flex items-start gap-2.5 p-3.5 mb-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  <span className="flex-1">{successMsg}</span>
                  <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Google 1-Click Sign-in Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleSubmitting || isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-3 transition shadow-sm disabled:opacity-60 group"
              >
                {isGoogleSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                ) : (
                  <svg className="w-4 h-4 transition group-hover:scale-110" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.4 0 15.3s.7 5.6 1.9 8l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-6">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-slate-900 px-3 text-[11px] text-slate-500 font-mono uppercase tracking-wider">
                  or with email
                </span>
                <div className="border-t border-slate-800 w-full" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name for Registration */}
                {isRegister && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Morgan"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@company.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Password</label>
                    {!isRegister && (
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(email);
                          setIsResetOpen(true);
                          setResetStatus(null);
                        }}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 transition"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition font-mono"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter (On Registration) */}
                  {isRegister && password.length > 0 && (
                    <div className="pt-1 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Strength: {strengthLabels[passStrength]}</span>
                        <span>{password.length < 6 ? 'Min 6 chars' : '✓ Length OK'}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 h-1">
                        {[0, 1, 2, 3].map((idx) => (
                          <div
                            key={idx}
                            className={`h-full rounded-full transition-all ${
                              passStrength > idx ? strengthColors[passStrength] : 'bg-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password (On Registration) */}
                {isRegister && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full bg-slate-950 border rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition font-mono ${
                          confirmPassword && confirmPassword !== password
                            ? 'border-rose-500 focus:border-rose-500'
                            : 'border-slate-800 focus:border-indigo-500'
                        }`}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Remember Me & Terms Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-xs text-slate-400">
                      {isRegister ? 'I agree to Terms & Conditions' : 'Keep me signed in'}
                    </span>
                  </label>
                </div>

                {/* Submit CTA Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || isGoogleSubmitting}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition transform active:scale-[0.99] mt-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{isRegister ? 'Create My Account' : 'Sign In to Workspace'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Switch Link */}
              <div className="pt-6 mt-6 border-t border-slate-800/80 text-center text-xs text-slate-400">
                {isRegister ? (
                  <span>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegister(false);
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold transition underline-offset-4 hover:underline"
                    >
                      Sign In
                    </button>
                  </span>
                ) : (
                  <span>
                    Don't have an account yet?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegister(true);
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold transition underline-offset-4 hover:underline"
                    >
                      Create one for free
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer info */}
      <footer className="py-4 text-center text-[11px] text-slate-500 font-mono z-10">
        ModuleForge © {new Date().getFullYear()} • Powered by Firebase & Neon Postgres
      </footer>

      {/* Forgot Password Modal */}
      {isResetOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 w-full max-w-md space-y-5 shadow-2xl relative">
            <button
              onClick={() => setIsResetOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Reset your password</h3>
              <p className="text-xs text-slate-400">
                Enter your account email address and we will send you a secure link to reset your password.
              </p>
            </div>

            {resetStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  resetStatus.success
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                }`}
              >
                {resetStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{resetStatus.msg}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Account Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition disabled:opacity-60"
                >
                  {resetLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Send Reset Link</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
