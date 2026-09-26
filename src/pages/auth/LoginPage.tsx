import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useInventory } from '../../store/inventoryStore';
import { Icon } from '../../components/common/Icon';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useInventory();
  const navigate = useNavigate();

  // Form State
  const [email, setEmail] = useState('m.vance@stocksense.corp');
  const [password, setPassword] = useState('enterprise2024');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // If already authenticated, redirect immediately
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validateForm = (): boolean => {
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your operator email address.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid work email format (e.g., user@company.com).');
      return false;
    }

    if (!password) {
      setError('Please enter your password.');
      return false;
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    const res = await login(email.trim(), password);
    setIsLoading(false);

    if (res.success) {
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 200);
    } else {
      setError(res.message || 'Authentication failed. Please verify your credentials or contact facility lead.');
    }
  };

  const handleFillDemo = () => {
    setEmail('m.vance@stocksense.corp');
    setPassword('enterprise2024');
    setError('');
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
          Sign In to Console
        </h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
          Enter operational credentials to access multi-facility inventory ledger.
        </p>
      </div>

      {/* Quick Demo Credentials Banner */}
      <div className="mb-4 p-2.5 bg-surface-container-low border border-outline-variant rounded flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-on-surface-variant">
          <Icon name="badge" className="text-sm text-primary" />
          <span>Demo Operator: <strong className="text-on-surface font-mono">m.vance@stocksense.corp</strong></span>
        </div>
        <button
          type="button"
          onClick={handleFillDemo}
          className="px-2 py-0.5 rounded bg-surface-container-highest hover:bg-surface-container text-primary font-semibold transition-colors shrink-0"
        >
          Auto-fill
        </button>
      </div>

      {/* Error State Banner */}
      {error && (
        <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-in fade-in duration-150">
          <Icon name="error" className="text-base text-error shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Authentication Error</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Success State Banner */}
      {isSuccess && (
        <div className="mb-4 p-3 rounded bg-emerald-50 border border-emerald-200 text-tertiary text-xs flex items-center gap-2 animate-in fade-in duration-150">
          <Icon name="check_circle" className="text-base text-tertiary shrink-0" />
          <span className="font-semibold">Credentials verified. Connecting to StockSense workspace...</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
            Operator Work Email
          </label>
          <div className="relative">
            <Icon name="mail" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-outline pointer-events-none" />
            <input
              type="email"
              disabled={isLoading || isSuccess}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              className="w-full h-9 pl-8 pr-3 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors disabled:opacity-60"
              placeholder="operator@stocksense.corp"
            />
          </div>
        </div>

        {/* Password Field with Visibility Toggle */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-primary hover:underline font-medium"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Icon name="lock" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-outline pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              disabled={isLoading || isSuccess}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              className="w-full h-9 pl-8 pr-10 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors disabled:opacity-60"
              placeholder="••••••••"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-outline hover:text-on-surface transition-colors"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              <Icon name={showPassword ? 'visibility_off' : 'visibility'} className="text-base" />
            </button>
          </div>
        </div>

        {/* Sign In Button */}
        <button
          type="submit"
          disabled={isLoading || isSuccess}
          className="w-full h-9 mt-2 bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm rounded shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
              <span>Authenticating...</span>
            </span>
          ) : isSuccess ? (
            <span className="flex items-center gap-1.5">
              <Icon name="check" className="text-base" />
              <span>Redirecting...</span>
            </span>
          ) : (
            <>
              <Icon name="login" className="text-base" />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>

      {/* Footer Links */}
      <div className="mt-6 pt-4 border-t border-outline-variant flex items-center justify-between text-xs text-on-surface-variant">
        <span>Need facility access?</span>
        <Link to="/signup" className="text-primary font-semibold hover:underline">
          Create Account
        </Link>
      </div>

      <div className="mt-3 text-center">
        <Link to="/" className="text-xs text-outline hover:text-on-surface transition-colors inline-flex items-center gap-1">
          <Icon name="arrow_back" className="text-xs" />
          <span>Back to Public Overview</span>
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
