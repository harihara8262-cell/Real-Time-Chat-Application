import React, { useEffect, useState } from 'react';
import { useAuthStore } from './stores/useAuthStore';
import { useChatStore } from './stores/useChatStore';
import { initSocket, disconnectSocket } from './socket';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { SidebarLeft } from './components/layout/SidebarLeft';
import { SidebarChannels } from './components/layout/SidebarChannels';
import { ChatHeader } from './components/layout/ChatHeader';
import { ChatFeed } from './components/layout/ChatFeed';
import { ChatInput } from './components/layout/ChatInput';
import { SidebarRight } from './components/layout/SidebarRight';
import { CreateRoomModal, SettingsModal } from './components/common/Modals';
import { MessageSquare, Loader2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const App: React.FC = () => {
  const { token, isAuthenticated, isLoading, checkSession } = useAuthStore();
  const {
    activeChannelId,
    setActiveChannelId,
    fetchChannels,
    fetchMessages,
    addChannel,
    clearUnread
  } = useChatStore();

  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  
  // Modal toggles
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Filter & Pins headers
  const [isPinsOnly, setIsPinsOnly] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Validate session on boot
  useEffect(() => {
    checkSession();
  }, []);

  // Sync Socket.IO and REST API on successful auth
  useEffect(() => {
    if (isAuthenticated && token) {
      initSocket(token);
      fetchChannels();
    } else {
      disconnectSocket();
    }
    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, token]);

  // Load message history when active room changes
  useEffect(() => {
    if (activeChannelId) {
      fetchMessages(activeChannelId);
      clearUnread(activeChannelId);
      setIsPinsOnly(false);
    }
  }, [activeChannelId]);

  // Upload handler REST call bridging Multer on backend
  const handleUploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed.');
    return data;
  };

  const handleStartDM = async (targetUserId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          isDirectMessage: true,
          invitedUsers: [targetUserId]
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Add to list and select
      addChannel(data);
      setActiveChannelId(data._id);
      setIsCreateOpen(false);
    } catch (err) {
      alert('Error starting direct conversation: ' + err);
    }
  };

  const handleCreateChannel = async (name: string, type: 'public' | 'private', invitedUsers: string[]) => {
    try {
      const res = await fetch(`${API_URL}/api/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, type, invitedUsers })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Add to list and select
      addChannel(data);
      setActiveChannelId(data._id);
      setIsCreateOpen(false);
    } catch (err) {
      alert('Error creating channel: ' + err);
    }
  };

  // 1. Loading Splash Screen
  if (isLoading && !isAuthenticated) {
    return (
      <div className="w-screen h-screen bg-dark-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 animate-pulse shadow-[0_0_20px_#6366F1]" />
          <Loader2 className="animate-spin text-indigo-400 mt-2" size={24} />
          <span className="text-xs text-muted-text">Connecting to Aether...</span>
        </div>
      </div>
    );
  }

  // 2. Authentication Screen
  if (!isAuthenticated) {
    return (
      <div className="w-screen h-screen flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {authView === 'login' ? (
            <Login key="login" onSwitchToRegister={() => setAuthView('register')} />
          ) : (
            <Register key="register" onSwitchToLogin={() => setAuthView('login')} />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // 3. Authenticated 4-Panel Workspace
  return (
    <div className="w-screen h-screen flex overflow-hidden select-none bg-dark-bg">
      {/* Panel 1: Left Navigation Rail (72px) */}
      <SidebarLeft
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCreateChannel={() => setIsCreateOpen(true)}
      />

      {/* Panel 2: Channel Sidebar (240px) */}
      <SidebarChannels
        onOpenCreateChannel={() => setIsCreateOpen(true)}
        onOpenStartDM={() => setIsCreateOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onJoinChannel={(id) => setActiveChannelId(id)}
      />

      {/* Main Panel wrapper containing Panel 3 & 4 */}
      <div className="flex-1 flex min-w-0">
        
        {/* Panel 3: Center Chat Feed */}
        <div className="flex-grow h-full flex flex-col min-w-0">
          {activeChannelId ? (
            <>
              <ChatHeader
                onTogglePins={() => setIsPinsOnly(!isPinsOnly)}
                onToggleSearch={() => {
                  setIsSearchOpen(!isSearchOpen);
                  if (isSearchOpen) setSearchFilter('');
                }}
              />
              
              {/* Optional Search bar in title header */}
              {isSearchOpen && (
                <div className="px-6 py-2 bg-dark-surface/10 border-b border-white/5 flex items-center">
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search messages in this channel..."
                    className="w-full max-w-sm bg-dark-bg border border-white/5 rounded-lg py-1 px-3 text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <ChatFeed searchFilter={searchFilter} isPinsOnly={isPinsOnly} />
              
              <ChatInput onUploadFile={handleUploadFile} />
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-6 text-muted-text">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25 mb-4" />
              <h2 className="text-xl font-bold font-display text-white">Welcome to Aether Chat</h2>
              <p className="text-xs opacity-65 mt-1 max-w-[320px]">Choose a chat channel or direct message from the sidebar to start collaborating.</p>
            </div>
          )}
        </div>

        {/* Panel 4: Right Sidebar Details (280px, toggleable) */}
        <SidebarRight />

      </div>

      {/* MODALS */}
      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onStartDM={handleStartDM}
        onCreateChannel={handleCreateChannel}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

    </div>
  );
};

export default App;
