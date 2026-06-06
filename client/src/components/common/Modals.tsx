import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useChatStore } from '../../stores/useChatStore';
import { X, Search, Hash, Shield, Lock, Compass, Check, Settings, Sparkles, Sliders, Laptop, Trash2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '../../socket';
import { Session } from '../../types/types';

// --- CREATE CHANNEL OR DM MODAL ---
interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartDM: (targetUserId: string) => void;
  onCreateChannel: (name: string, type: 'public' | 'private', invitedUsers: string[]) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onStartDM,
  onCreateChannel
}) => {
  const { usersList, fetchUsers } = useChatStore();
  const [activeTab, setActiveTab] = useState<'dm' | 'group'>('dm');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Group channel states
  const [channelName, setChannelName] = useState('');
  const [channelType, setChannelType] = useState<'public' | 'private'>('public');
  const [invitedUsers, setInvitedUsers] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchUsers(searchQuery);
    }
  }, [isOpen, searchQuery]);

  if (!isOpen) return null;

  const handleCheckboxChange = (userId: string) => {
    setInvitedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim()) return;
    onCreateChannel(channelName.trim(), channelType, invitedUsers);
    
    // Reset states
    setChannelName('');
    setChannelType('public');
    setInvitedUsers([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-dark-bg/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-dark-surface border border-white/10 rounded-2xl overflow-hidden shadow-glass flex flex-col max-h-[85vh]"
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-base font-bold font-display text-white">Create Conversation</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-full text-muted-text hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-white/5 bg-dark-bg/25">
          <button
            onClick={() => setActiveTab('dm')}
            className={`flex-1 py-3 text-center text-xs font-bold font-display border-b-2 transition-all ${
              activeTab === 'dm' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/[0.02]' : 'border-transparent text-muted-text hover:text-white'
            }`}
          >
            Direct Message
          </button>
          <button
            onClick={() => setActiveTab('group')}
            className={`flex-1 py-3 text-center text-xs font-bold font-display border-b-2 transition-all ${
              activeTab === 'group' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/[0.02]' : 'border-transparent text-muted-text hover:text-white'
            }`}
          >
            Create Group Channel
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {activeTab === 'dm' ? (
            /* DM Tab Content */
            <div className="space-y-4 h-full flex flex-col">
              <p className="text-xxs text-muted-text leading-relaxed">Search for users in the workspace to initiate a private chat thread.</p>
              
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-muted-text" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by username or display name..."
                  className="w-full bg-dark-bg border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-white/20 outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                {usersList.length === 0 ? (
                  <p className="text-center py-6 text-xs text-muted-text">No users found</p>
                ) : (
                  usersList.map((u) => (
                    <button
                      key={u._id}
                      onClick={() => onStartDM(u._id)}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-dark-bg shrink-0">
                          <img src={u.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col text-left min-w-0">
                          <span className="text-xs font-semibold truncate text-white">{u.displayName}</span>
                          <span className="text-xxs text-muted-text truncate">@{u.username}</span>
                        </div>
                      </div>
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        u.status === 'online' ? 'bg-success-color' : u.status === 'idle' ? 'bg-warning-color' : u.status === 'dnd' ? 'bg-danger-color' : 'bg-gray-500'
                      }`} />
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Group Channel Tab Content */
            <form onSubmit={handleGroupSubmit} className="space-y-4">
              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-muted-text mb-1">Channel Name</label>
                <div className="relative">
                  <Hash size={14} className="absolute left-3 top-3 text-muted-text" />
                  <input
                    type="text"
                    required
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    placeholder="e.g. general-development"
                    className="w-full bg-dark-bg border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-white outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-muted-text mb-1">Privacy Level</label>
                <select
                  value={channelType}
                  onChange={(e) => setChannelType(e.target.value as any)}
                  className="w-full bg-dark-bg border border-white/5 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-indigo-500 transition-all"
                >
                  <option value="public">🌐 Public (Visible to everyone in the workspace)</option>
                  <option value="private">🔒 Private (Only invited members can view)</option>
                </select>
              </div>

              {channelType === 'private' && (
                <div className="space-y-2">
                  <label className="block text-xxs font-bold uppercase tracking-wider text-muted-text">Invite Workspace Members</label>
                  <div className="border border-white/5 rounded-xl bg-dark-bg/30 max-h-[160px] overflow-y-auto p-2 space-y-1">
                    {usersList.map((u) => (
                      <label key={u._id} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white/5 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <img src={u.avatarUrl} alt="Avatar" className="w-6 h-6 rounded object-cover" />
                          <span className="text-xs">{u.displayName}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={invitedUsers.includes(u._id)}
                          onChange={() => handleCheckboxChange(u._id)}
                          className="accent-indigo-500 w-4 h-4"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:brightness-110 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-indigo-500/15"
              >
                Create Group Channel
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};


// --- ADVANCED SETTINGS MODAL ---
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, token, updateProfile, updatePreferences, logout } = useAuthStore();
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'appearance' | 'security'>('profile');
  
  // Profile settings
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarSeed, setAvatarSeed] = useState('');
  const [statusText, setStatusText] = useState('');
  const [presence, setPresence] = useState('online');

  // Appearance settings
  const [theme, setTheme] = useState<'midnight' | 'cyber-neon' | 'royal-purple' | 'emerald-dark' | 'crimson-elite' | 'light-professional'>('midnight');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontSizeUI, setFontSizeUI] = useState(14);
  const [fontSizeChat, setFontSizeChat] = useState(14);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [accentColor, setAccentColor] = useState('#6366F1');

  // Security password settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [securityMessage, setSecurityMessage] = useState('');
  const [securityError, setSecurityError] = useState('');

  // Active Sessions lists
  const [sessions, setSessions] = useState<Session[]>([]);

  // Load user data on mount/open
  useEffect(() => {
    if (isOpen && user) {
      setDisplayName(user.displayName);
      setAvatarUrl(user.avatarUrl);
      setStatusText(user.statusText || '');
      setPresence(user.status);

      setTheme(user.theme);
      setFontFamily(user.fontFamily);
      setFontSizeUI(user.fontSizeUI);
      setFontSizeChat(user.fontSizeChat);
      setLineHeight(user.lineHeight);
      setAccentColor(user.accentColor);
      
      // Fetch login sessions on security tab
      if (activeSubTab === 'security') {
        fetchSessions();
      }
    }
  }, [isOpen, user, activeSubTab]);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setSessions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to log out this device?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        if (data.isCurrentSession) {
          logout();
          onClose();
        } else {
          fetchSessions();
        }
      }
    } catch (err) {
      alert('Error revoking session: ' + err);
    }
  };

  const handleAvatarSeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setAvatarSeed(val);
    if (val) {
      setAvatarUrl(`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(val)}`);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(displayName, avatarUrl, statusText);
      if (socket) {
        socket.emit('status_change', { status: presence, statusText });
      }
      onClose();
    } catch (err) {
      alert('Failed to save profile: ' + err);
    }
  };

  // Instantly apply theme variables to CSS on changes
  useEffect(() => {
    if (!isOpen || activeSubTab !== 'appearance') return;
    applyThemeVariablesLocal({ theme, fontFamily, fontSizeUI, fontSizeChat, lineHeight, accentColor });
  }, [theme, fontFamily, fontSizeUI, fontSizeChat, lineHeight, accentColor, activeSubTab]);

  const applyThemeVariablesLocal = (prefs: any) => {
    const root = document.documentElement;

    // Font Family
    root.style.setProperty('--font-sans', `${prefs.fontFamily}, sans-serif`);

    // Font Sizes
    root.style.setProperty('--ui-font-size', `${prefs.fontSizeUI}px`);
    root.style.setProperty('--chat-font-size', `${prefs.fontSizeChat}px`);
    
    // Line Heights
    root.style.setProperty('--chat-line-height', `${prefs.lineHeight}`);

    // Colors mapping
    let bg = '#0F172A';
    let surface = '#111827';
    let card = '#1E293B';
    let text = '#FFFFFF';
    let muted = '#94A3B8';
    let accent = prefs.accentColor;
    let bubbleRecv = 'rgba(30, 41, 59, 0.65)';
    let bubbleSent = `linear-gradient(135deg, ${prefs.accentColor}, #7C3AED)`;

    switch (prefs.theme) {
      case 'cyber-neon':
        bg = '#050816';
        surface = '#090F26';
        card = '#121B3A';
        accent = '#00F5FF';
        bubbleRecv = 'rgba(18, 27, 58, 0.7)';
        bubbleSent = 'linear-gradient(135deg, #00F5FF, #005FDF)';
        break;
      case 'royal-purple':
        bg = '#100720';
        surface = '#180B30';
        card = '#26124C';
        accent = '#8B5CF6';
        bubbleRecv = 'rgba(38, 18, 76, 0.7)';
        bubbleSent = 'linear-gradient(135deg, #8B5CF6, #6366F1)';
        break;
      case 'emerald-dark':
        bg = '#021E0F';
        surface = '#042F18';
        card = '#084C27';
        accent = '#10B981';
        bubbleRecv = 'rgba(8, 76, 39, 0.7)';
        bubbleSent = 'linear-gradient(135deg, #10B981, #059669)';
        break;
      case 'crimson-elite':
        bg = '#140505';
        surface = '#220808';
        card = '#3F1212';
        accent = '#EF4444';
        bubbleRecv = 'rgba(63, 18, 18, 0.7)';
        bubbleSent = 'linear-gradient(135deg, #EF4444, #B91C1C)';
        break;
      case 'light-professional':
        bg = '#F8FAFC';
        surface = '#FFFFFF';
        card = '#F1F5F9';
        text = '#0F172A';
        muted = '#64748B';
        accent = '#4F46E5';
        bubbleRecv = '#E2E8F0';
        bubbleSent = 'linear-gradient(135deg, #4F46E5, #6366F1)';
        break;
    }

    root.style.setProperty('--bg-primary', bg);
    root.style.setProperty('--bg-secondary', `rgba(${hexToRgb(surface)}, 0.7)`);
    root.style.setProperty('--bg-surface', `rgba(${hexToRgb(card)}, 0.5)`);
    root.style.setProperty('--text-primary', text);
    root.style.setProperty('--text-secondary', muted);
    root.style.setProperty('--accent-indigo', accent);
    root.style.setProperty('--bubble-received', bubbleRecv);
    root.style.setProperty('--bubble-sent', bubbleSent);
  };

  const hexToRgb = (hex: string) => {
    let cleaned = hex.replace('#', '');
    if (cleaned.length === 3) {
      cleaned = cleaned.split('').map(c => c + c).join('');
    }
    const num = parseInt(cleaned, 16);
    return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
  };

  const handleSaveAppearance = async () => {
    try {
      await updatePreferences({
        theme,
        fontFamily,
        fontSizeUI,
        fontSizeChat,
        lineHeight,
        accentColor
      });
      alert('Appearance preferences saved successfully.');
      onClose();
    } catch (err) {
      alert('Failed to save appearance preferences: ' + err);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError('');
    setSecurityMessage('');

    if (newPassword !== confirmNewPassword) {
      setSecurityError('New passwords do not match.');
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSecurityMessage('Password updated successfully. Other devices have been logged out.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      fetchSessions();
    } catch (err: any) {
      setSecurityError(err.message || 'Error changing password.');
    }
  };

  return (
    <div className="fixed inset-0 bg-dark-bg/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl h-[80vh] bg-dark-surface border border-white/10 rounded-3xl overflow-hidden shadow-glass flex"
      >
        {/* Settings Left Sub-tabs (Appearance & Security rail) */}
        <div className="w-[180px] bg-dark-bg/30 border-r border-white/5 flex flex-col justify-between p-4 shrink-0">
          <div className="space-y-1">
            <h2 className="text-[10px] font-bold text-muted-text uppercase tracking-wider px-3 mb-2 flex items-center gap-1.5"><Settings size={12} /> Settings</h2>
            
            <button
              onClick={() => setActiveSubTab('profile')}
              className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold font-display transition-all ${
                activeSubTab === 'profile' ? 'bg-indigo-500/10 text-indigo-400 font-bold' : 'text-muted-text hover:bg-white/5 hover:text-white'
              }`}
            >
              My Profile
            </button>

            <button
              onClick={() => setActiveSubTab('appearance')}
              className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold font-display transition-all ${
                activeSubTab === 'appearance' ? 'bg-indigo-500/10 text-indigo-400 font-bold' : 'text-muted-text hover:bg-white/5 hover:text-white'
              }`}
            >
              Appearance & Styles
            </button>

            <button
              onClick={() => setActiveSubTab('security')}
              className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold font-display transition-all ${
                activeSubTab === 'security' ? 'bg-indigo-500/10 text-indigo-400 font-bold' : 'text-muted-text hover:bg-white/5 hover:text-white'
              }`}
            >
              Security & Sessions
            </button>
          </div>

          <button onClick={onClose} className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xxs font-bold text-muted-text hover:text-white transition-all text-center">
            Close Panel
          </button>
        </div>

        {/* Settings Right panel content scrollable */}
        <div className="flex-grow flex flex-col overflow-hidden bg-dark-surface/40 min-w-0">
          {/* Header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider font-display text-white">
              {activeSubTab === 'profile' ? 'Profile Details' : activeSubTab === 'appearance' ? 'Appearance & Interface Customization' : 'Account Security & Live Sessions'}
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-full text-muted-text hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Sub-tab Views */}
          <div className="flex-1 overflow-y-auto p-6 min-w-0">
            {activeSubTab === 'profile' && (
              /* PROFILE TAB FORM */
              <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-md">
                <div className="flex items-center gap-4 py-2 bg-dark-bg/25 p-3 rounded-2xl border border-white/5">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-dark-bg shrink-0">
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="block text-[10px] font-bold text-muted-text uppercase">Avatar Phrase Generator</label>
                    <input
                      type="text"
                      value={avatarSeed}
                      onChange={handleAvatarSeedChange}
                      placeholder="Type something to randomize avatar..."
                      className="w-full bg-dark-bg border border-white/5 rounded-xl py-1.5 px-3 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-muted-text mb-1">Display Name</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-dark-bg border border-white/5 rounded-xl py-2 px-3 text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-muted-text mb-1">Status Text Banner</label>
                  <input
                    type="text"
                    value={statusText}
                    onChange={(e) => setStatusText(e.target.value)}
                    placeholder="Set custom status bio..."
                    className="w-full bg-dark-bg border border-white/5 rounded-xl py-2 px-3 text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-muted-text mb-1">Presence Indicator</label>
                  <select
                    value={presence}
                    onChange={(e) => setPresence(e.target.value)}
                    className="w-full bg-dark-bg border border-white/5 rounded-xl py-2 px-3 text-xs outline-none focus:border-indigo-500 text-white"
                  >
                    <option value="online">🟢 Online</option>
                    <option value="idle">🟡 Idle / Away</option>
                    <option value="dnd">🔴 Do Not Disturb</option>
                    <option value="offline">⚪ Offline / Invisible</option>
                  </select>
                </div>

                <button type="submit" className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-xs font-semibold text-white shadow-md shadow-indigo-500/15">
                  Save Settings
                </button>
              </form>
            )}

            {activeSubTab === 'appearance' && (
              /* APPEARANCE CUSTOMIZATION TAB */
              <div className="space-y-6 max-w-lg pb-4">
                {/* Theme presets grid */}
                <div className="space-y-2">
                  <label className="block text-xxs font-bold uppercase tracking-wider text-muted-text">Interface Themes</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: 'midnight', name: 'Midnight', bg: 'bg-[#0F172A]', accent: 'bg-[#6366F1]' },
                      { id: 'cyber-neon', name: 'Cyber Neon', bg: 'bg-[#050816]', accent: 'bg-[#00F5FF]' },
                      { id: 'royal-purple', name: 'Royal Purple', bg: 'bg-[#140A2E]', accent: 'bg-[#8B5CF6]' },
                      { id: 'emerald-dark', name: 'Emerald Dark', bg: 'bg-[#052E16]', accent: 'bg-[#10B981]' },
                      { id: 'crimson-elite', name: 'Crimson Elite', bg: 'bg-[#1F0A0A]', accent: 'bg-[#EF4444]' },
                      { id: 'light-professional', name: 'Light Professional', bg: 'bg-white border border-white/10', accent: 'bg-[#4F46E5]' }
                    ].map((thm) => (
                      <button
                        key={thm.id}
                        onClick={() => setTheme(thm.id as any)}
                        className={`flex flex-col p-2.5 rounded-xl text-left border relative transition-all ${
                          theme === thm.id ? 'border-indigo-500 bg-white/[0.03]' : 'border-white/5 hover:border-white/10'
                        }`}
                      >
                        <span className="text-xxs font-bold text-white mb-1.5">{thm.name}</span>
                        <div className="flex gap-1">
                          <span className={`w-4 h-4 rounded-full ${thm.bg}`} />
                          <span className={`w-4 h-4 rounded-full ${thm.accent}`} />
                        </div>
                        {theme === thm.id && <Check size={12} className="absolute right-2.5 bottom-2.5 text-indigo-400" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent Color picker */}
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-muted-text mb-1">Accent Theme Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-10 h-10 border border-white/10 rounded-xl bg-transparent p-0.5 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-muted-text">{accentColor.toUpperCase()}</span>
                  </div>
                </div>

                {/* Font Family selector */}
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-muted-text mb-1">Interface Typography Font</label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full bg-dark-bg border border-white/5 rounded-xl py-2 px-3 text-xs outline-none focus:border-indigo-500"
                  >
                    {['Inter', 'Poppins', 'Montserrat', 'Roboto', 'Open Sans', 'Nunito', 'Outfit', 'Space Grotesk', 'JetBrains Mono', 'Fira Code'].map(f => (
                      <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                    ))}
                  </select>
                </div>

                {/* Font Sizes Sliders */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xxs font-bold uppercase text-muted-text">
                      <span>Chat Font Size</span>
                      <span className="text-white">{fontSizeChat}px</span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="20"
                      value={fontSizeChat}
                      onChange={(e) => setFontSizeChat(Number(e.target.value))}
                      className="w-full accent-indigo-500 bg-white/5 rounded-full"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xxs font-bold uppercase text-muted-text">
                      <span>UI Font Size</span>
                      <span className="text-white">{fontSizeUI}px</span>
                    </div>
                    <input
                      type="range"
                      min="11"
                      max="16"
                      value={fontSizeUI}
                      onChange={(e) => setFontSizeUI(Number(e.target.value))}
                      className="w-full accent-indigo-500 bg-white/5 rounded-full"
                    />
                  </div>
                </div>

                {/* Line Height selection */}
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-muted-text mb-1">Message Line Height</label>
                  <select
                    value={lineHeight}
                    onChange={(e) => setLineHeight(Number(e.target.value))}
                    className="w-full bg-dark-bg border border-white/5 rounded-xl py-2 px-3 text-xs outline-none focus:border-indigo-500"
                  >
                    <option value="1.2">1.2 (Compact)</option>
                    <option value="1.4">1.4 (Standard)</option>
                    <option value="1.5">1.5 (Normal)</option>
                    <option value="1.6">1.6 (Comfortable)</option>
                    <option value="1.8">1.8 (Large)</option>
                  </select>
                </div>

                <button
                  onClick={handleSaveAppearance}
                  className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-xs font-semibold text-white shadow-md shadow-indigo-500/15"
                >
                  Save Appearance Preferences
                </button>
              </div>
            )}

            {activeSubTab === 'security' && (
              /* SECURITY TAB - PASSWORD & LOGIN SESSIONS */
              <div className="space-y-6 max-w-md pb-4">
                
                {/* 1. Change Password Form */}
                <form onSubmit={handleChangePassword} className="space-y-3.5 p-4 bg-dark-bg/25 border border-white/5 rounded-2xl">
                  <h4 className="text-xs font-bold uppercase text-white tracking-wider flex items-center gap-1.5"><Lock size={12} /> Change Password</h4>
                  
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-muted-text mb-0.5">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-dark-bg border border-white/5 rounded-xl py-1.5 px-3 pr-10 text-xs outline-none focus:border-indigo-500"
                      />
                      <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-text">
                        {showCurrentPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-muted-text mb-0.5">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-dark-bg border border-white/5 rounded-xl py-1.5 px-3 pr-10 text-xs outline-none focus:border-indigo-500"
                      />
                      <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-text">
                        {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-muted-text mb-0.5">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full bg-dark-bg border border-white/5 rounded-xl py-1.5 px-3 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  {securityError && (
                    <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xxs rounded-lg">
                      <AlertCircle size={12} />
                      <span>{securityError}</span>
                    </div>
                  )}

                  {securityMessage && (
                    <div className="flex items-center gap-2 p-2.5 bg-green-500/10 border border-green-500/20 text-success-color text-xxs rounded-lg animate-pulse">
                      <Check size={12} />
                      <span>{securityMessage}</span>
                    </div>
                  )}

                  <button type="submit" className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-xs font-semibold text-white shadow-md shadow-indigo-500/15">
                    Save New Password
                  </button>
                </form>

                {/* 2. Login History & Active Sessions */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-white tracking-wider flex items-center gap-1.5"><Laptop size={12} /> Active Login Sessions</h4>
                  <p className="text-xxs text-muted-text leading-normal">These devices are currently logged in to your account. You can revoke any session to instantly force log out that device.</p>
                  
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {sessions.map((sess) => (
                      <div key={sess._id} className="flex items-center justify-between p-3 bg-dark-bg/20 border border-white/5 rounded-xl text-xxs">
                        <div className="flex items-center gap-3">
                          <Laptop size={18} className="text-indigo-400 shrink-0" />
                          <div className="flex flex-col text-left">
                            <span className="font-semibold text-white truncate max-w-[200px]" title={sess.userAgent}>{sess.userAgent}</span>
                            <span className="text-muted-text/80 mt-0.5">IP Address: {sess.ipAddress} • Active: {new Date(sess.lastActive).toLocaleTimeString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRevokeSession(sess._id)}
                          className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-muted-text transition-colors shrink-0"
                          title="Revoke session"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

      </motion.div>
    </div>
  );
};
