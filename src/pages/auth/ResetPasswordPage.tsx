import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../store/inventoryStore';
import { Icon } from '../../components/common/Icon';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useInventory();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      addToast({
        type: 'success',
        title: 'Password Updated',
        message: 'Your account password has been successfully reset. Please sign in.',
      });
      navigate('/login');
    }, 400);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Reset Password</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
          Create a secure password adhering to enterprise authentication policies.
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
            New Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-9 px-3 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
            Confirm New Password
          </label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full h-9 px-3 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-9 mt-2 bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm rounded shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <span>Updating password...</span>
          ) : (
            <>
              <Icon name="lock_reset" className="text-base" />
              <span>Reset &amp; Sign In</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
