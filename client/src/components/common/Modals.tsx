import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useChatStore } from '../../stores/useChatStore';
import { X, Search, Hash, Shield, Lock, Compass, Check, Settings, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '../../socket';

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


// --- PROFILE SETTINGS MODAL ---
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [avatarSeed, setAvatarSeed] = useState('');
  const [statusText, setStatusText] = useState(user?.statusText || '');
  const [presence, setPresence] = useState(user?.status || 'online');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setDisplayName(user.displayName);
      setAvatarUrl(user.avatarUrl);
      setStatusText(user.statusText || '');
      setPresence(user.status);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleAvatarSeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setAvatarSeed(val);
    if (val) {
      setAvatarUrl(`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(val)}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 1. Save to database via API
      await updateProfile(displayName, avatarUrl, statusText);

      // 2. Broadcast availability changes to Socket.IO if they changed
      if (socket) {
        socket.emit('status_change', {
          status: presence,
          statusText: statusText
        });
      }
      
      onClose();
    } catch (err) {
      alert('Error saving settings: ' + err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-dark-bg/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-dark-surface border border-white/10 rounded-2xl overflow-hidden shadow-glass"
      >
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-base font-bold font-display text-white">Profile Settings</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-full text-muted-text hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="flex items-center justify-center gap-4 py-2">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-dark-bg border border-white/10 shrink-0">
              <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 space-y-1">
              <label className="block text-xxs font-bold text-muted-text uppercase">Modify Avatar Seed</label>
              <input
                type="text"
                value={avatarSeed}
                onChange={handleAvatarSeedChange}
                placeholder="Type phrase to generate avatar..."
                className="w-full bg-dark-bg border border-white/5 rounded-xl py-1.5 px-3 text-xs text-white placeholder-white/20 outline-none focus:border-indigo-500"
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
              className="w-full bg-dark-bg border border-white/5 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xxs font-bold uppercase tracking-wider text-muted-text mb-1">Custom Status Text</label>
            <input
              type="text"
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              placeholder="What's your status today?"
              className="w-full bg-dark-bg border border-white/5 rounded-xl py-2 px-3 text-xs text-white placeholder-white/20 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xxs font-bold uppercase tracking-wider text-muted-text mb-1">Availability Status</label>
            <select
              value={presence}
              onChange={(e) => setPresence(e.target.value as any)}
              className="w-full bg-dark-bg border border-white/5 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-indigo-500"
            >
              <option value="online">🟢 Online</option>
              <option value="idle">🟡 Idle / Away</option>
              <option value="dnd">🔴 Do Not Disturb</option>
              <option value="offline">⚪ Offline / Invisible</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:brightness-110 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-indigo-500/15"
          >
            Save Changes
          </button>
        </form>
      </motion.div>
    </div>
  );
};
