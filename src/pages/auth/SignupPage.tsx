import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useInventory } from '../../store/inventoryStore';
import { Icon } from '../../components/common/Icon';

export const SignupPage: React.FC = () => {
  const { signup } = useInventory();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Inventory Controller');
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
      signup(name, email, role);
      setIsLoading(false);
      navigate('/dashboard');
    }, 400);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Register Operator</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
          Create an inventory controller profile with role-based access.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <Icon name="error" className="text-base shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
            Full Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-8 px-3 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary"
            placeholder="Elena Rostova"
          />
        </div>

        <div>
          <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
            Work Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-8 px-3 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary"
            placeholder="e.rostova@stocksense.corp"
          />
        </div>

        <div>
          <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
            Operational Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="Operations Manager">Operations Manager</option>
            <option value="Warehouse Lead">Warehouse Lead</option>
            <option value="Inventory Controller">Inventory Controller</option>
            <option value="Logistics Dispatcher">Logistics Dispatcher</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-8 px-3 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary"
              placeholder="••••••"
            />
          </div>
          <div>
            <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
              Confirm
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-8 px-3 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary"
              placeholder="••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-9 mt-4 bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm rounded shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <span>Creating account...</span>
          ) : (
            <>
              <Icon name="person_add" className="text-base" />
              <span>Create Account</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-outline-variant flex items-center justify-between text-xs text-on-surface-variant">
        <span>Already have an operator account?</span>
        <Link to="/login" className="text-primary font-semibold hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
};
