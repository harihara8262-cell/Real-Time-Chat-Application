import React, { useState } from 'react';
import { useChatStore } from '../../stores/useChatStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { Search, Plus, Hash, ChevronDown, ChevronRight, Mic, MicOff, Volume2 } from 'lucide-react';
import { Channel } from '../../types/types';

interface SidebarChannelsProps {
  onOpenCreateChannel: () => void;
  onOpenStartDM: () => void;
  onOpenSettings: () => void;
  onJoinChannel: (id: string) => void;
}

export const SidebarChannels: React.FC<SidebarChannelsProps> = ({
  onOpenCreateChannel,
  onOpenStartDM,
  onOpenSettings,
  onJoinChannel
}) => {
  const { user } = useAuthStore();
  const { channels, activeChannelId, unreadCounts } = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [channelsExpanded, setChannelsExpanded] = useState(true);
  const [dmsExpanded, setDmsExpanded] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // Group channels by DM vs Group Channel
  const groupChannels = channels.filter(c => !c.isDirectMessage);
  const dmChannels = channels.filter(c => c.isDirectMessage);

  const filterChannelList = (list: Channel[]) => {
    return list.filter(c => {
      if (c.isDirectMessage) {
        const otherUser = getDMOtherUser(c);
        return (
          otherUser?.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          otherUser?.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return c.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  };

  const getDMOtherUser = (channel: Channel) => {
    const otherMember = channel.members.find(m => m.user._id !== user?._id);
    return otherMember?.user || null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-success-color';
      case 'idle': return 'bg-warning-color';
      case 'dnd': return 'bg-danger-color';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="w-[240px] h-full flex flex-col bg-dark-surface/60 border-r border-white/5 flex-shrink-0 select-none">
      {/* Header Search bar */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="relative w-full">
          <Search size={14} className="absolute left-2.5 top-2.5 text-muted-text" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search channels..."
            className="w-full bg-dark-bg/60 border border-white/5 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white placeholder-white/20 outline-none focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Main Channel Scroll view */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* GROUP CHANNELS SECTION */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 text-xxs font-bold text-muted-text uppercase tracking-wider hover:text-white transition-colors cursor-pointer group">
            <button
              onClick={() => setChannelsExpanded(!channelsExpanded)}
              className="flex items-center gap-1 outline-none text-left"
            >
              {channelsExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span>Group Channels</span>
            </button>
            <button
              onClick={onOpenCreateChannel}
              className="opacity-0 group-hover:opacity-100 hover:text-white p-0.5 rounded transition-all outline-none"
              title="Create Channel"
            >
              <Plus size={14} />
            </button>
          </div>

          {channelsExpanded && (
            <div className="space-y-0.5">
              {filterChannelList(groupChannels).map((ch) => {
                const isActive = ch._id === activeChannelId;
                const unread = unreadCounts[ch._id] || 0;

                return (
                  <button
                    key={ch._id}
                    onClick={() => onJoinChannel(ch._id)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm text-left transition-all ${
                      isActive
                        ? 'bg-indigo-500/15 text-white font-medium border border-indigo-500/10'
                        : 'text-muted-text hover:bg-white/[0.03] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Hash size={16} className="shrink-0 text-white/40" />
                      <span className="truncate">{ch.name}</span>
                    </div>
                    {unread > 0 && (
                      <span className="bg-indigo-500 text-white text-xxs font-bold px-1.5 py-0.5 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.4)] shrink-0">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* DIRECT MESSAGES SECTION */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 text-xxs font-bold text-muted-text uppercase tracking-wider hover:text-white transition-colors cursor-pointer group">
            <button
              onClick={() => setDmsExpanded(!dmsExpanded)}
              className="flex items-center gap-1 outline-none text-left"
            >
              {dmsExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span>Direct Messages</span>
            </button>
            <button
              onClick={onOpenStartDM}
              className="opacity-0 group-hover:opacity-100 hover:text-white p-0.5 rounded transition-all outline-none"
              title="Start DM"
            >
              <Plus size={14} />
            </button>
          </div>

          {dmsExpanded && (
            <div className="space-y-0.5">
              {filterChannelList(dmChannels).map((ch) => {
                const isActive = ch._id === activeChannelId;
                const unread = unreadCounts[ch._id] || 0;
                const otherUser = getDMOtherUser(ch);

                if (!otherUser) return null;

                return (
                  <button
                    key={ch._id}
                    onClick={() => onJoinChannel(ch._id)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm text-left transition-all ${
                      isActive
                        ? 'bg-indigo-500/15 text-white font-medium border border-indigo-500/10'
                        : 'text-muted-text hover:bg-white/[0.03] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative w-5 h-5 rounded-md overflow-hidden bg-dark-bg shrink-0">
                        <img src={otherUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        <span className={`absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full border border-dark-surface ${getStatusColor(otherUser.status)}`} />
                      </div>
                      <span className="truncate">{otherUser.displayName}</span>
                    </div>
                    {unread > 0 && (
                      <span className="bg-success-color text-dark-bg text-xxs font-black px-1.5 py-0.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)] shrink-0">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* User Footer Panel */}
      <div className="p-3 bg-dark-surface/80 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0 cursor-pointer hover:bg-white/5 p-1 rounded-lg transition-colors" onClick={onOpenSettings}>
          <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-dark-bg shrink-0">
            <img src={user?.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-dark-surface ${getStatusColor(user?.status || 'offline')}`} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold truncate leading-tight text-white">{user?.displayName}</span>
            <span className="text-xxs text-muted-text truncate leading-tight">@{user?.username}</span>
          </div>
        </div>

        <div className="flex items-center gap-0.5 text-muted-text">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 hover:bg-white/5 hover:text-white rounded-lg transition-all"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff size={14} className="text-danger-color" /> : <Mic size={14} />}
          </button>
          <button
            onClick={onOpenSettings}
            className="p-1.5 hover:bg-white/5 hover:text-white rounded-lg transition-all"
            title="User Profile Settings"
          >
            <Volume2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
