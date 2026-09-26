import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useInventory } from '../../store/inventoryStore';
import { Icon } from '../../components/common/Icon';

export const LoginPage: React.FC = () => {
  const { login } = useInventory();
  const navigate = useNavigate();

  const [email, setEmail] = useState('m.vance@stocksense.corp');
  const [password, setPassword] = useState('enterprise2024');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide work email and password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const ok = login(email, password);
      setIsLoading(false);
      if (ok) {
        navigate('/dashboard');
      } else {
        setError('Invalid credentials.');
      }
    }, 400);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Sign in to console</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
          Enter operational credentials to access multi-facility inventory ledger.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <Icon name="error" className="text-base shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
            Operator Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-9 px-3 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary focus:bg-surface-container-lowest"
            placeholder="operator@stocksense.corp"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
              Password
            </label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-9 px-3 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary focus:bg-surface-container-lowest"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-9 mt-2 bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm rounded shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <span>Authenticating...</span>
          ) : (
            <>
              <Icon name="login" className="text-base" />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-outline-variant flex items-center justify-between text-xs text-on-surface-variant">
        <span>Need facility access?</span>
        <Link to="/signup" className="text-primary font-semibold hover:underline">
          Request Operator Account
        </Link>
      </div>
    </div>
  );
};
