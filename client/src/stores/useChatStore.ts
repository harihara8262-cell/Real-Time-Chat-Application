import { create } from 'zustand';
import { Channel, Message, User } from '../types/types';
import { useAuthStore } from './useAuthStore';

interface ChatState {
  channels: Channel[];
  activeChannelId: string | null;
  activeChannelMessages: Message[];
  pinnedMessages: Message[];
  unreadCounts: Record<string, number>;
  typingUsers: Record<string, string[]>; // channelId -> Array of displayNames
  usersList: User[];
  replyingToMessage: Message | null;
  isDetailsOpen: boolean;

  setChannels: (channels: Channel[]) => void;
  addChannel: (channel: Channel) => void;
  setActiveChannelId: (channelId: string | null) => void;
  setActiveChannelMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  removeMessage: (messageId: string) => void;
  setPinnedMessages: (messages: Message[]) => void;
  updatePinnedMessage: (messageId: string, isPinned: boolean, message?: Message | null) => void;
  incrementUnread: (channelId: string) => void;
  clearUnread: (channelId: string) => void;
  setTyping: (channelId: string, userId: string, displayName: string, isTyping: boolean) => void;
  setUsersList: (usersList: User[]) => void;
  updateUserStatus: (userId: string, status: 'online' | 'idle' | 'dnd' | 'offline', statusText?: string) => void;
  setReplyingToMessage: (message: Message | null) => void;
  toggleDetails: () => void;

  fetchChannels: () => Promise<void>;
  fetchMessages: (channelId: string, before?: string) => Promise<void>;
  fetchPinnedMessages: (channelId: string) => Promise<void>;
  fetchUsers: (query?: string) => Promise<void>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useChatStore = create<ChatState>((set) => ({
  channels: [],
  activeChannelId: null,
  activeChannelMessages: [],
  pinnedMessages: [],
  unreadCounts: {},
  typingUsers: {},
  usersList: [],
  replyingToMessage: null,
  isDetailsOpen: false,

  setChannels: (channels) => set({ channels }),
  addChannel: (channel) => set((state) => {
    if (state.channels.find((c) => c._id === channel._id)) return state;
    return { channels: [...state.channels, channel] };
  }),
  setActiveChannelId: (activeChannelId) => set({ activeChannelId, replyingToMessage: null }),
  setActiveChannelMessages: (activeChannelMessages) => set({ activeChannelMessages }),
  
  addMessage: (message) => set((state) => {
    // Check if message already in feed to prevent duplicate appends
    const exists = state.activeChannelMessages.some((m) => m._id === message._id);
    const newMessages = exists
      ? state.activeChannelMessages
      : [...state.activeChannelMessages, message];

    // Update lastMessage preview for relevant channel
    const updatedChannels = state.channels.map((ch) => {
      if (ch._id === message.channel) {
        return { ...ch, lastMessage: message };
      }
      return ch;
    });

    return {
      activeChannelMessages: newMessages,
      channels: updatedChannels
    };
  }),

  updateMessage: (message) => set((state) => ({
    activeChannelMessages: state.activeChannelMessages.map((m) =>
      m._id === message._id ? message : m
    )
  })),

  removeMessage: (messageId) => set((state) => ({
    activeChannelMessages: state.activeChannelMessages.filter((m) => m._id !== messageId),
    pinnedMessages: state.pinnedMessages.filter((m) => m._id !== messageId)
  })),

  setPinnedMessages: (pinnedMessages) => set({ pinnedMessages }),

  updatePinnedMessage: (messageId, isPinned, message) => set((state) => {
    let newPins = [...state.pinnedMessages];
    if (isPinned && message) {
      if (!newPins.some((p) => p._id === messageId)) {
        newPins.push(message);
      }
    } else {
      newPins = newPins.filter((p) => p._id !== messageId);
    }

    const updatedFeed = state.activeChannelMessages.map((msg) =>
      msg._id === messageId ? { ...msg, isPinned } : msg
    );

    return {
      pinnedMessages: newPins,
      activeChannelMessages: updatedFeed
    };
  }),

  incrementUnread: (channelId) => set((state) => {
    if (channelId === state.activeChannelId) return state;
    const currentCount = state.unreadCounts[channelId] || 0;
    return {
      unreadCounts: {
        ...state.unreadCounts,
        [channelId]: currentCount + 1
      }
    };
  }),

  clearUnread: (channelId) => set((state) => ({
    unreadCounts: {
      ...state.unreadCounts,
      [channelId]: 0
    }
  })),

  setTyping: (channelId, _userId, displayName, isTyping) => set((state) => {
    const list = state.typingUsers[channelId] || [];
    let newList;
    if (isTyping) {
      newList = list.includes(displayName) ? list : [...list, displayName];
    } else {
      newList = list.filter((name) => name !== displayName);
    }
    return {
      typingUsers: {
        ...state.typingUsers,
        [channelId]: newList
      }
    };
  }),

  setUsersList: (usersList) => set({ usersList }),

  updateUserStatus: (userId, status, statusText) => set((state) => {
    // 1. Update status in general users directory list
    const updatedUsers = state.usersList.map((usr) => {
      if (usr._id === userId) {
        return { ...usr, status, statusText: statusText !== undefined ? statusText : usr.statusText } as User;
      }
      return usr;
    });

    // 2. Update status in channel members lists
    const updatedChannels = state.channels.map((ch) => {
      const updatedMembers = ch.members.map((mb) => {
        if (mb.user._id === userId) {
          return {
            ...mb,
            user: { ...mb.user, status, statusText: statusText !== undefined ? statusText : mb.user.statusText }
          };
        }
        return mb;
      });
      return { ...ch, members: updatedMembers };
    });

    return {
      usersList: updatedUsers,
      channels: updatedChannels
    };
  }),

  setReplyingToMessage: (replyingToMessage) => set({ replyingToMessage }),
  toggleDetails: () => set((state) => ({ isDetailsOpen: !state.isDetailsOpen })),

  // REST integrations
  fetchChannels: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/channels`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) set({ channels: data });
    } catch (err) {
      console.error('Error fetching channels:', err);
    }
  },

  fetchMessages: async (channelId, before) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    try {
      let url = `${API_URL}/api/channels/${channelId}/messages?limit=50`;
      if (before) {
        url += `&before=${before}`;
      }
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        if (before) {
          // Prepend older paginated messages for infinite scroll
          set((state) => ({
            activeChannelMessages: [...data, ...state.activeChannelMessages]
          }));
        } else {
          // Initial channel load
          set({ activeChannelMessages: data });
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  },

  fetchPinnedMessages: async (channelId) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/channels/${channelId}/pins`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) set({ pinnedMessages: data });
    } catch (err) {
      console.error('Error fetching pinned messages:', err);
    }
  },

  fetchUsers: async (query) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    try {
      let url = `${API_URL}/api/auth/users`;
      if (query) {
        url += `?q=${encodeURIComponent(query)}`;
      }
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) set({ usersList: data });
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }
}));
