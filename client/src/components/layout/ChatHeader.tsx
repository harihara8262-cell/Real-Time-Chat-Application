import React from 'react';
import { useChatStore } from '../../stores/useChatStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { Hash, Phone, Video, Pin, Search, Users } from 'lucide-react';

interface ChatHeaderProps {
  onTogglePins: () => void;
  onToggleSearch: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onTogglePins,
  onToggleSearch
}) => {
  const { user } = useAuthStore();
  const { activeChannelId, channels, toggleDetails, isDetailsOpen } = useChatStore();

  const currentChannel = channels.find(c => c._id === activeChannelId);

  if (!currentChannel) return null;

  const isDM = currentChannel.isDirectMessage;
  let title = currentChannel.name;
  let subtitle = 'Group Channel';

  if (isDM) {
    const otherMember = currentChannel.members.find(m => m.user._id !== user?._id);
    if (otherMember) {
      title = otherMember.user.displayName;
      subtitle = otherMember.user.statusText 
        ? `"${otherMember.user.statusText}"` 
        : `${otherMember.user.status.toUpperCase()}`;
    }
  } else {
    title = `# ${currentChannel.name}`;
    subtitle = `${currentChannel.type === 'public' ? 'Public' : 'Private'} Group Channel`;
  }

  return (
    <header className="h-[64px] flex items-center justify-between px-6 bg-dark-surface/30 border-b border-white/5 shrink-0 select-none">
      {/* Left channel metadata */}
      <div className="flex items-center gap-2 min-w-0">
        {!isDM ? (
          <Hash className="text-muted-text shrink-0" size={20} />
        ) : (
          <div className="relative w-6 h-6 rounded-md overflow-hidden bg-dark-bg shrink-0">
            <img 
              src={currentChannel.members.find(m => m.user._id !== user?._id)?.user.avatarUrl} 
              alt="avatar" 
              className="w-full h-full object-cover" 
            />
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <h2 className="text-sm font-bold truncate leading-tight">{title}</h2>
          <p className="text-xxs text-muted-text truncate leading-tight">{subtitle}</p>
        </div>
      </div>

      {/* Right control buttons */}
      <div className="flex items-center gap-1.5 text-muted-text">
        <button
          onClick={() => alert('Mocking Audio Call: Establishing WebRTC Handshake...')}
          className="p-2 hover:bg-white/5 hover:text-white rounded-lg transition-all"
          title="Start Voice Call"
        >
          <Phone size={16} />
        </button>

        <button
          onClick={() => alert('Mocking Video Call: Launching Camera Stream...')}
          className="p-2 hover:bg-white/5 hover:text-white rounded-lg transition-all"
          title="Start Video Call"
        >
          <Video size={16} />
        </button>

        <button
          onClick={onTogglePins}
          className="p-2 hover:bg-white/5 hover:text-white rounded-lg transition-all"
          title="Pinned Messages"
        >
          <Pin size={16} />
        </button>

        <button
          onClick={onToggleSearch}
          className="p-2 hover:bg-white/5 hover:text-white rounded-lg transition-all"
          title="Search Messages"
        >
          <Search size={16} />
        </button>

        <div className="w-[1px] h-4 bg-white/10 mx-1" />

        <button
          onClick={toggleDetails}
          className={`p-2 rounded-lg transition-all ${
            isDetailsOpen ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-white/5 hover:text-white'
          }`}
          title="Toggle Details Drawer"
        >
          <Users size={16} />
        </button>
      </div>
    </header>
  );
};
