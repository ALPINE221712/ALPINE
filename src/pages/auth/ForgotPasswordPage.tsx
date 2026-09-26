import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useInventory } from '../../store/inventoryStore';
import { Icon } from '../../components/common/Icon';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useInventory();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      addToast({
        type: 'info',
        title: 'Verification Code Dispatched',
        message: `A 6-digit OTP security code has been sent to ${email}.`,
      });
      navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
    }, 400);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Forgot Password</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
          Enter your registered work email to receive a multi-factor verification code.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
            Registered Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-9 px-3 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary"
            placeholder="operator@stocksense.corp"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-9 bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm rounded shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <span>Sending code...</span>
          ) : (
            <>
              <Icon name="mail" className="text-base" />
              <span>Send OTP Verification Code</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-outline-variant flex items-center justify-center text-xs text-on-surface-variant">
        <Link to="/login" className="text-primary font-semibold hover:underline flex items-center gap-1">
          <Icon name="arrow_back" className="text-sm" />
          <span>Return to login</span>
        </Link>
      </div>
    </div>
  );
};
