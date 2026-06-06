import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/useAuthStore';
import { User, Mail, Lock, ShieldAlert, Loader2, Eye, EyeOff, Check, X } from 'lucide-react';

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
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Password criteria states
  const [criteria, setCriteria] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  const [strengthScore, setStrengthScore] = useState(0);

  // Monitor password changes to update criteria and strength
  useEffect(() => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    setCriteria(checks);

    // Calculate strength score (0 to 5)
    let score = 0;
    if (checks.length) score++;
    if (checks.uppercase) score++;
    if (checks.lowercase) score++;
    if (checks.number) score++;
    if (checks.special) score++;
    setStrengthScore(score);
  }, [password]);

  const getStrengthLabel = () => {
    if (password.length === 0) return '';
    if (strengthScore <= 2) return 'Weak';
    if (strengthScore <= 4) return 'Medium';
    return 'Strong';
  };

  const getStrengthColor = () => {
    if (strengthScore <= 2) return 'bg-red-500 shadow-[0_0_8px_#EF4444]';
    if (strengthScore <= 4) return 'bg-amber-500 shadow-[0_0_8px_#F59E0B]';
    return 'bg-success-color shadow-[0_0_8px_#10B981]';
  };

  const getStrengthTextColor = () => {
    if (strengthScore <= 2) return 'text-red-400';
    if (strengthScore <= 4) return 'text-amber-400';
    return 'text-success-color';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (username.length < 3 || username.length > 20) {
      setValidationError('Username must be between 3 and 20 characters.');
      return;
    }

    // Check all criteria are met
    const allCriteriaMet = Object.values(criteria).every(Boolean);
    if (!allCriteriaMet) {
      setValidationError('Please meet all password strength requirements.');
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
      className="w-full max-w-md p-6 rounded-2xl bg-dark-surface border border-white/10 shadow-glass overflow-y-auto max-h-[95vh]"
    >
      <div className="text-center mb-5">
        <div className="inline-block w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] mb-2" />
        <h2 className="text-2xl font-display font-extrabold tracking-tight">Create Profile</h2>
        <p className="text-xs text-muted-text mt-0.5">Register a new profile to start chatting</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Username */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-text mb-0.5">
            Username
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-text">
              <User size={14} />
            </span>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="alex123"
              className="w-full bg-dark-bg border border-white/5 rounded-xl py-2 pl-9 pr-4 text-white placeholder-white/20 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-xs"
            />
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-text mb-0.5">
            Display Name
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-text">
              <User size={14} />
            </span>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Alex Mercer"
              className="w-full bg-dark-bg border border-white/5 rounded-xl py-2 pl-9 pr-4 text-white placeholder-white/20 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-xs"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-text mb-0.5">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-text">
              <Mail size={14} />
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              className="w-full bg-dark-bg border border-white/5 rounded-xl py-2 pl-9 pr-4 text-white placeholder-white/20 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-xs"
            />
          </div>
        </div>

        {/* Avatar Seed */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-text mb-0.5">
            Avatar Robot Phrase (Optional)
          </label>
          <input
            type="text"
            value={avatarSeed}
            onChange={(e) => setAvatarSeed(e.target.value)}
            placeholder="e.g. sparky"
            className="w-full bg-dark-bg border border-white/5 rounded-xl py-2 px-3 text-white placeholder-white/20 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-xs"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-text mb-0.5">
            Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-text">
              <Lock size={14} />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-dark-bg border border-white/5 rounded-xl py-2 pl-9 pr-10 text-white placeholder-white/20 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-text hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {/* Password Strength Meter */}
          {password.length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-muted-text">Password Strength:</span>
                <span className={`font-bold ${getStrengthTextColor()}`}>{getStrengthLabel()}</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(strengthScore / 5) * 100}%` }}
                  className={`h-full ${getStrengthColor()} transition-all duration-300`} 
                />
              </div>
            </div>
          )}

          {/* Live Validation Criteria Checkboxes */}
          <div className="mt-2.5 grid grid-cols-2 gap-1.5 p-2 bg-dark-bg/40 border border-white/5 rounded-xl text-[10px]">
            <div className="flex items-center gap-1.5">
              {criteria.length ? <Check size={12} className="text-success-color" /> : <X size={12} className="text-red-400" />}
              <span className={criteria.length ? 'text-white/80' : 'text-muted-text'}>8+ Characters</span>
            </div>
            <div className="flex items-center gap-1.5">
              {criteria.uppercase ? <Check size={12} className="text-success-color" /> : <X size={12} className="text-red-400" />}
              <span className={criteria.uppercase ? 'text-white/80' : 'text-muted-text'}>Uppercase Letter</span>
            </div>
            <div className="flex items-center gap-1.5">
              {criteria.lowercase ? <Check size={12} className="text-success-color" /> : <X size={12} className="text-red-400" />}
              <span className={criteria.lowercase ? 'text-white/80' : 'text-muted-text'}>Lowercase Letter</span>
            </div>
            <div className="flex items-center gap-1.5">
              {criteria.number ? <Check size={12} className="text-success-color" /> : <X size={12} className="text-red-400" />}
              <span className={criteria.number ? 'text-white/80' : 'text-muted-text'}>Digit Number</span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              {criteria.special ? <Check size={12} className="text-success-color" /> : <X size={12} className="text-red-400" />}
              <span className={criteria.special ? 'text-white/80' : 'text-muted-text'}>Special Character (!@#$...)</span>
            </div>
          </div>

        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-text mb-0.5">
            Confirm Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-text">
              <Lock size={14} />
            </span>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-dark-bg border border-white/5 rounded-xl py-2 pl-9 pr-10 text-white placeholder-white/20 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-xs"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-text hover:text-white transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {(validationError || error) && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] rounded-lg"
          >
            <ShieldAlert size={14} className="shrink-0" />
            <span>{validationError || error}</span>
          </motion.div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:brightness-110 active:scale-[0.98] transition-all font-semibold shadow-lg shadow-indigo-500/25 text-pure-white text-xs"
        >
          {isLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
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
