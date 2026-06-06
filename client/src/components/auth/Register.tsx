import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/useAuthStore';
import { User, Mail, Lock, ShieldAlert, Loader2 } from 'lucide-react';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
  const { register, isLoading, error, clearError } = useAuthStore();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarSeed, setAvatarSeed] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (username.length < 3 || username.length > 20) {
      setValidationError('Username must be between 3 and 20 characters.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    const payload = {
      username,
      displayName: displayName || username,
      email,
      avatarUrl: avatarSeed 
        ? `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(avatarSeed)}` 
        : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}`,
      password,
      confirmPassword
    };

    try {
      await register(payload);
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md p-8 rounded-2xl bg-dark-surface border border-white/10 shadow-glass"
    >
      <div className="text-center mb-6">
        <div className="inline-block w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] mb-2" />
        <h2 className="text-3xl font-display font-extrabold tracking-tight">Create Profile</h2>
        <p className="text-sm text-muted-text mt-1">Register a new profile to start chatting</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text mb-1">
            Username
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-text">
              <User size={16} />
            </span>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="alex123"
              className="w-full bg-dark-bg border border-white/5 rounded-xl py-2 pl-10 pr-4 text-white placeholder-white/20 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text mb-1">
            Display Name
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-text">
              <User size={16} />
            </span>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Alex Mercer"
              className="w-full bg-dark-bg border border-white/5 rounded-xl py-2 pl-10 pr-4 text-white placeholder-white/20 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text mb-1">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-text">
              <Mail size={16} />
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              className="w-full bg-dark-bg border border-white/5 rounded-xl py-2 pl-10 pr-4 text-white placeholder-white/20 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text mb-1">
            Avatar Robot Phrase (Optional)
          </label>
          <input
            type="text"
            value={avatarSeed}
            onChange={(e) => setAvatarSeed(e.target.value)}
            placeholder="e.g. sparky (creates robotic avatar)"
            className="w-full bg-dark-bg border border-white/5 rounded-xl py-2 px-4 text-white placeholder-white/20 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-dark-bg border border-white/5 rounded-xl py-2 px-4 text-white placeholder-white/20 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text mb-1">
              Confirm
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-dark-bg border border-white/5 rounded-xl py-2 px-4 text-white placeholder-white/20 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
            />
          </div>
        </div>

        {(validationError || error) && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg"
          >
            <ShieldAlert size={14} className="shrink-0" />
            <span>{validationError || error}</span>
          </motion.div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:brightness-110 active:scale-[0.98] transition-all font-semibold shadow-lg shadow-indigo-500/25 text-white text-sm"
        >
          {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
          Register Profile
        </button>
      </form>

      <p className="text-center text-xs text-muted-text mt-4">
        Already have an account?{' '}
        <button
          onClick={() => {
            clearError();
            onSwitchToLogin();
          }}
          className="text-indigo-400 hover:underline font-semibold"
        >
          Sign In
        </button>
      </p>
    </motion.div>
  );
};
