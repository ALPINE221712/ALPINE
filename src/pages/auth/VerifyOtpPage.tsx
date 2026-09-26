import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useInventory } from '../../store/inventoryStore';
import { Icon } from '../../components/common/Icon';

export const VerifyOtpPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useInventory();
  const email = searchParams.get('email') || 'operator@stocksense.corp';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDigitChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const nextOtp = [...otp];
    nextOtp[index] = val.slice(-1);
    setOtp(nextOtp);

    // Auto focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      addToast({
        type: 'success',
        title: 'Identity Confirmed',
        message: 'OTP verified. You may now define your new password.',
      });
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    }, 400);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Verify Security OTP</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
          Enter the 6-digit one-time code sent to <strong className="text-on-surface">{email}</strong>.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <Icon name="error" className="text-base shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center justify-between gap-2">
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-12 text-center text-lg font-bold font-mono bg-surface-container-low border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface-container-lowest"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-9 bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm rounded shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <span>Verifying...</span>
          ) : (
            <>
              <Icon name="verified_user" className="text-base" />
              <span>Verify &amp; Proceed</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-outline-variant flex items-center justify-between text-xs text-on-surface-variant">
        <span>Didn't receive the code?</span>
        <button
          type="button"
          onClick={() => {
            setOtp(['1', '2', '3', '4', '5', '6']);
            addToast({ type: 'info', title: 'Code Refreshed', message: 'Demo OTP prefilled: 123456' });
          }}
          className="text-primary font-semibold hover:underline"
        >
          Resend OTP (Demo: 123456)
        </button>
      </div>
    </div>
  );
};
