import React from 'react';
import { useChatStore } from '../../stores/useChatStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { Shield, Users, FileText, Calendar, X } from 'lucide-react';

export const SidebarRight: React.FC = () => {
  const { user } = useAuthStore();
  const { activeChannelId, channels, activeChannelMessages, isDetailsOpen, toggleDetails } = useChatStore();

  const currentChannel = channels.find(c => c._id === activeChannelId);

  if (!isDetailsOpen || !currentChannel) return null;

  const isDM = currentChannel.isDirectMessage;
  let title = currentChannel.name;
  let description = 'Public workspace room';

  if (isDM) {
    const otherMember = currentChannel.members.find(m => m.user._id !== user?._id);
    if (otherMember) {
      title = otherMember.user.displayName;
      description = `Direct message conversation with @${otherMember.user.username}`;
    }
  } else {
    title = `# ${currentChannel.name}`;
    description = currentChannel.type === 'public'
      ? 'Public room accessible by anyone'
      : 'Private invite-only room';
  }

  // Extract shared files from messages
  const sharedFiles = activeChannelMessages.filter(m => m.attachment);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-success-color shadow-[0_0_8px_#10B981]';
      case 'idle': return 'bg-warning-color shadow-[0_0_8px_#F59E0B]';
      case 'dnd': return 'bg-danger-color shadow-[0_0_8px_#EF4444]';
      default: return 'bg-gray-500';
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1 py-0.5 rounded uppercase border border-amber-400/20 flex items-center gap-0.5"><Shield size={8} /> Owner</span>;
      case 'moderator':
        return <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded uppercase border border-indigo-500/20 flex items-center gap-0.5"><Shield size={8} /> Mod</span>;
      default:
        return null;
    }
  };

  return (
    <div className="w-[280px] h-full bg-dark-surface/60 border-l border-white/5 flex flex-col shrink-0 overflow-y-auto select-none p-4 space-y-6">
      {/* Drawer Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">Room Details</h3>
        <button
          onClick={toggleDetails}
          className="p-1 hover:bg-white/5 rounded-full text-muted-text hover:text-white transition-colors"
          title="Close Panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* 1. Header Information */}
      <div className="space-y-2">
        <h3 className="text-xxs font-bold text-muted-text uppercase tracking-wider">About</h3>
        <div className="p-3 bg-dark-bg/40 border border-white/5 rounded-xl space-y-2">
          <h4 className="text-sm font-bold truncate">{title}</h4>
          <p className="text-xs text-muted-text leading-normal">{description}</p>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-text/80 pt-1 border-t border-white/5">
            <Calendar size={12} />
            <span>Created {new Date(currentChannel.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* 2. Members List */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xxs font-bold text-muted-text uppercase tracking-wider">
          <Users size={12} />
          <span>Members ({currentChannel.members.length})</span>
        </div>
        
        <div className="space-y-2.5">
          {currentChannel.members.map((member) => (
            <div key={member.user._id} className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative w-7 h-7 rounded-md overflow-hidden bg-dark-bg shrink-0">
                  <img src={member.user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-dark-surface ${getStatusColor(member.user.status)}`} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold truncate text-white leading-tight">{member.user.displayName}</span>
                  {member.user.statusText && (
                    <span className="text-[10px] text-muted-text truncate italic leading-tight">"{member.user.statusText}"</span>
                  )}
                </div>
              </div>
              <div className="shrink-0">{getRoleBadge(member.role)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Shared Media Files */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xxs font-bold text-muted-text uppercase tracking-wider">
          <FileText size={12} />
          <span>Shared Files ({sharedFiles.length})</span>
        </div>

        {sharedFiles.length === 0 ? (
          <p className="text-xs text-muted-text/60 italic p-1">No shared files yet</p>
        ) : (
          <div className="space-y-2">
            {sharedFiles.map((msg) => {
              const att = msg.attachment;
              if (!att) return null;
              return (
                <a
                  key={msg._id}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 p-2 bg-dark-bg/40 border border-white/5 rounded-xl hover:bg-white/[0.02] transition-colors text-xs"
                >
                  <FileText size={16} className="text-indigo-400 shrink-0" />
                  <span className="truncate flex-1 text-white font-medium" title={att.name}>{att.name}</span>
                </a>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
