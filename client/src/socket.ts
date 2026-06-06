import { io, Socket } from 'socket.io-client';
import { useChatStore } from './stores/useChatStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export let socket: Socket | null = null;

export const initSocket = (token: string) => {
  if (socket) {
    socket.disconnect();
  }

  console.log('Initializing Socket.IO connection...');
  socket = io(API_URL, {
    auth: { token },
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('Socket.IO connected. ID:', socket?.id);
    const activeChannelId = useChatStore.getState().activeChannelId;
    if (activeChannelId && socket) {
      socket.emit('join_channel', { channelId: activeChannelId });
    }
  });

  // Listen for presence updates
  socket.on('status_update', ({ userId, status, statusText }) => {
    useChatStore.getState().updateUserStatus(userId, status, statusText);
  });

  // Listen for incoming messages
  socket.on('message_recv', (message) => {
    useChatStore.getState().addMessage(message);
  });

  // Listen for edits
  socket.on('message_edited', (message) => {
    useChatStore.getState().updateMessage(message);
  });

  // Listen for deletes
  socket.on('message_deleted', ({ messageId }) => {
    useChatStore.getState().removeMessage(messageId);
  });

  // Listen for pins
  socket.on('message_pinned_update', ({ messageId, isPinned, pinnedMessage }) => {
    useChatStore.getState().updatePinnedMessage(messageId, isPinned, pinnedMessage);
  });

  // Listen for reaction changes
  socket.on('message_reacted', (message) => {
    useChatStore.getState().updateMessage(message);
  });

  // Listen for typing events
  socket.on('typing_update', ({ channelId, displayName, isTyping }) => {
    // We ignore the typing indicator if it comes from ourselves
    useChatStore.getState().setTyping(channelId, '', displayName, isTyping);
  });

  // Listen for unread notification alerts
  socket.on('unread_notification', ({ channelId }) => {
    useChatStore.getState().incrementUnread(channelId);
  });

  // Error listener
  socket.on('error_msg', ({ message }) => {
    alert(`Socket Error: ${message}`);
  });

  socket.on('disconnect', () => {
    console.log('Socket.IO disconnected.');
  });
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
