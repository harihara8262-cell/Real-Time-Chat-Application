import React from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useChatStore } from '../../stores/useChatStore';
import { Settings, LogOut, MessageSquare, Compass, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarLeftProps {
  onOpenSettings: () => void;
  onOpenCreateChannel: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const SidebarLeft: React.FC<SidebarLeftProps> = ({
  onOpenSettings,
  onOpenCreateChannel
}) => {
  const { user, logout } = useAuthStore();
  const { channels, setActiveChannelId, fetchChannels } = useChatStore();

  const handleOpenAIChat = async () => {
    // 1. Search locally
    let aiChannel = channels.find(c => 
      c.isDirectMessage && 
      c.members.some(m => m.user && typeof m.user === 'object' && m.user.username === 'aetherai')
    );

    if (aiChannel) {
      setActiveChannelId(aiChannel._id);
      return;
    }

    console.log('Aether AI DM channel not found locally, refreshing channels list...');
    
    // 2. Fetch channels list from server
    await fetchChannels();

    // 3. Search updated list
    const updatedChannels = useChatStore.getState().channels;
    aiChannel = updatedChannels.find(c => 
      c.isDirectMessage && 
      c.members.some(m => m.user && typeof m.user === 'object' && m.user.username === 'aetherai')
    );

    if (aiChannel) {
      setActiveChannelId(aiChannel._id);
      return;
    }

    // 4. Create on-the-fly fallback
    console.log('DM still not found. Fetching Aether AI user details to initialize DM...');
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`${API_URL}/api/auth/users?q=aetherai`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const users = await res.json();
      const botUser = users.find((u: any) => u.username === 'aetherai');
      
      if (botUser) {
        const createRes = await fetch(`${API_URL}/api/channels`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            isDirectMessage: true,
            invitedUsers: [botUser._id]
          })
        });
        const newDM = await createRes.json();
        if (createRes.ok) {
          useChatStore.getState().addChannel(newDM);
          setActiveChannelId(newDM._id);
        } else {
          console.error('Failed to create Aether AI DM channel:', newDM.error);
        }
      } else {
        console.warn('Aether AI bot user not found in search directory.');
      }
    } catch (err) {
      console.error('Error auto-creating Aether AI DM channel:', err);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out?')) {
      logout();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-success-color shadow-[0_0_8px_#10B981]';
      case 'idle': return 'bg-warning-color shadow-[0_0_8px_#F59E0B]';
      case 'dnd': return 'bg-danger-color shadow-[0_0_8px_#EF4444]';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="w-[72px] h-full flex flex-col items-center py-4 bg-dark-surface border-r border-white/5 flex-shrink-0 justify-between">
      {/* Top Section */}
      <div className="flex flex-col items-center space-y-4 w-full">
        {/* Brand Orb */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center cursor-pointer shadow-[0_4px_15px_rgba(99,102,241,0.3)]"
          title="Aether Chat Workspace"
        >
          <span className="font-display font-black text-xl text-white">Ae</span>
        </motion.div>

        <div className="w-8 h-[1px] bg-white/10" />

        {/* Home Chat Selector */}
        <button
          className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-pure-white flex items-center justify-center transition-all cursor-pointer"
          title="Direct Messages & Group Chats"
        >
          <MessageSquare size={20} />
        </button>

        {/* Explore Selector */}
        <button
          onClick={onOpenCreateChannel}
          className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-indigo-500 hover:text-pure-white text-muted-text flex items-center justify-center transition-all cursor-pointer"
          title="Create New Channels"
        >
          <Compass size={20} />
        </button>

        {/* Aether AI Sparkles Orb */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleOpenAIChat}
          className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-teal-500/20 to-indigo-500/20 hover:from-cyan-500 hover:via-teal-500 hover:to-indigo-500 text-cyan-400 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-cyan-500/20 hover:border-transparent shadow-[0_0_10px_rgba(6,182,212,0.15)] hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]"
          title="Chat with Aether AI"
        >
          <Sparkles size={20} className="animate-pulse" />
        </motion.button>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col items-center space-y-4 w-full">
        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-muted-text hover:text-white flex items-center justify-center transition-all cursor-pointer"
          title="Profile Settings"
        >
          <Settings size={20} />
        </button>

        {/* Sign Out */}
        <button
          onClick={handleLogout}
          className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-muted-text flex items-center justify-center transition-all cursor-pointer"
          title="Log Out"
        >
          <LogOut size={20} />
        </button>

        {/* User Profile Trigger */}
        <div className="relative cursor-pointer group mt-2" onClick={onOpenSettings}>
          <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 bg-dark-bg">
            <img src={user?.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[3px] border-dark-surface ${getStatusColor(user?.status || 'offline')}`} />
        </div>
      </div>
    </div>
  );
};
