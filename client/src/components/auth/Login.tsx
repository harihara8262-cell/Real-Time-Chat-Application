import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/useAuthStore';
import { Lock, Mail, Loader2 } from 'lucide-react';

interface LoginProps {
  onSwitchToRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSwitchToRegister }) => {
  const { login, isLoading, error, clearError } = useAuthStore();
  const [inputVal, setInputVal] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal || !password) return;
    try {
      await login(inputVal, password);
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
        <h2 className="text-3xl font-display font-extrabold tracking-tight">Welcome Back</h2>
        <p className="text-sm text-muted-text mt-1">Sign in to Aether Chat to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text mb-1">
            Username or Email
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-text">
              <Mail size={16} />
            </span>
            <input
              type="text"
              required
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="alex123 or alex@mail.com"
              className="w-full bg-dark-bg border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-white/20 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text mb-1">
            Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-text">
              <Lock size={16} />
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-dark-bg border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-white/20 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-text">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="accent-indigo-500 rounded border-white/10"
            />
            <span>Remember me</span>
          </label>
          <a href="#" className="hover:underline text-indigo-400">Forgot password?</a>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg text-center"
          >
            {error}
          </motion.div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:brightness-110 active:scale-[0.98] transition-all font-semibold shadow-lg shadow-indigo-500/25 text-white text-sm"
        >
          {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
          Sign In
        </button>
      </form>

      <p className="text-center text-xs text-muted-text mt-5">
        Don't have an account?{' '}
        <button
          onClick={() => {
            clearError();
            onSwitchToRegister();
          }}
          className="text-indigo-400 hover:underline font-semibold"
        >
          Register here
        </button>
      </p>
    </motion.div>
  );
};
