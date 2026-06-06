import React, { useRef, useEffect, useState } from 'react';
import { useChatStore } from '../../stores/useChatStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { socket } from '../../socket';
import { Hash, MessageSquare, CornerUpRight, Trash2, Edit3, Pin, Smile, FileText, Download, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message } from '../../types/types';

interface ChatFeedProps {
  searchFilter: string;
  isPinsOnly: boolean;
}

export const ChatFeed: React.FC<ChatFeedProps> = ({ searchFilter, isPinsOnly }) => {
  const { user } = useAuthStore();
  const {
    activeChannelId,
    activeChannelMessages,
    pinnedMessages,
    typingUsers,
    fetchMessages,
    setReplyingToMessage,
    removeMessage,
    updatePinnedMessage
  } = useChatStore();

  const feedRef = useRef<HTMLDivElement>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showEmojiPickerForId, setShowEmojiPickerForId] = useState<string | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Group messages list
  let messages = isPinsOnly ? pinnedMessages : activeChannelMessages;
  
  if (searchFilter) {
    messages = messages.filter(m => m.content.toLowerCase().includes(searchFilter.toLowerCase()));
  }

  // Scroll to bottom on initial channel load
  useEffect(() => {
    if (feedRef.current && !isFetchingMore) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [activeChannelId, activeChannelMessages.length, isPinsOnly]);

  // Infinite Scroll Trigger
  const handleScroll = async () => {
    const feed = feedRef.current;
    if (!feed || isPinsOnly || isFetchingMore) return;

    if (feed.scrollTop === 0 && activeChannelMessages.length >= 50) {
      setIsFetchingMore(true);
      const oldestMsg = activeChannelMessages[0];
      const scrollHeightBefore = feed.scrollHeight;

      // Fetch messages older than the oldest message in state
      await fetchMessages(activeChannelId!, oldestMsg.createdAt);

      // Restore scroll height offset so view doesn't jump
      setTimeout(() => {
        if (feed) {
          feed.scrollTop = feed.scrollHeight - scrollHeightBefore;
        }
        setIsFetchingMore(false);
      }, 50);
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    if (socket) {
      socket.emit('message_react', { messageId, emoji });
    }
    setShowEmojiPickerForId(null);
  };

  const handlePin = (messageId: string) => {
    if (socket) {
      socket.emit('message_pin', { messageId });
    }
  };

  const handleStartEdit = (msg: Message) => {
    setEditingMessageId(msg._id);
    setEditContent(msg.content);
  };

  const handleSaveEdit = (e: React.FormEvent, messageId: string) => {
    e.preventDefault();
    if (!editContent.trim()) return;

    if (socket) {
      socket.emit('message_edit', { messageId, content: editContent.trim() });
    }
    setEditingMessageId(null);
  };

  const handleDelete = (messageId: string) => {
    if (confirm('Are you sure you want to delete this message?')) {
      if (socket) {
        socket.emit('message_delete', { messageId });
      }
    }
  };

  // Check if consecutive messages should group together
  const shouldGroup = (current: Message, prev: Message | null) => {
    if (!prev) return false;
    if (current.sender._id !== prev.sender._id) return false;
    if (current.replyTo) return false;
    
    // Group if within 3 minutes (180000 ms)
    const currentDiff = new Date(current.createdAt).getTime();
    const prevDiff = new Date(prev.createdAt).getTime();
    return currentDiff - prevDiff < 180000;
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateDivider = (iso: string) => {
    const date = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const activeTyping = typingUsers[activeChannelId || ''] || [];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-dark-bg/40 relative">
      {/* Scroll View */}
      <div
        ref={feedRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
      >
        {isFetchingMore && (
          <div className="text-center py-2 text-xs text-muted-text">Loading older messages...</div>
        )}

        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-text">
            <MessageSquare size={48} className="mb-2 opacity-20" />
            <p className="text-sm font-semibold">No messages in this workspace</p>
            <p className="text-xs opacity-65">Type something below to send a message</p>
          </div>
        ) : (
          (() => {
            let lastDateStr = '';
            return messages.map((msg, index) => {
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const dateStr = formatDateDivider(msg.createdAt);
              const isGrouped = shouldGroup(msg, prevMsg);
              const showDivider = dateStr !== lastDateStr;
              
              if (showDivider) {
                lastDateStr = dateStr;
              }

              const isSelf = msg.sender._id === user?._id;
              
              return (
                <div key={msg._id} className="w-full">
                  {showDivider && (
                    <div className="flex items-center justify-center my-4 relative">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
                      <span className="relative px-3 py-1 bg-dark-bg border border-white/5 rounded-full text-xxs font-semibold text-muted-text tracking-wide uppercase">
                        {dateStr}
                      </span>
                    </div>
                  )}

                  <div className={`group flex flex-col w-full relative pl-1 hover:bg-white/[0.01] transition-all rounded-lg ${
                    isGrouped ? 'mt-1 py-0.5' : 'mt-4 py-1.5'
                  }`}>
                    
                    {/* Reply reference header */}
                    {msg.replyTo && (
                      <div className="flex items-center gap-1.5 ml-11 text-xxs text-muted-text/80 mb-1">
                        <CornerUpRight size={10} />
                        <span className="font-semibold text-white/50">{msg.replyTo.sender.displayName}</span>
                        <span className="truncate italic max-w-[200px]">"{msg.replyTo.content}"</span>
                      </div>
                    )}

                    {/* Main Bubble row */}
                    <div className="flex gap-3 w-full">
                      {/* Avatar */}
                      {!isGrouped ? (
                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-dark-surface border border-white/5 shrink-0">
                          <img src={msg.sender.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        // Hover timestamp spacer
                        <span className="w-9 text-[10px] text-muted-text/45 text-right font-medium pr-1 select-none opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end h-6">
                          {formatTime(msg.createdAt)}
                        </span>
                      )}

                      {/* Contents */}
                      <div className="flex-1 min-w-0">
                        {/* Name and time */}
                        {!isGrouped && (
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="text-sm font-semibold hover:underline cursor-pointer">{msg.sender.displayName}</span>
                            <span className="text-xxs text-muted-text font-medium">{formatTime(msg.createdAt)}</span>
                            {msg.isPinned && <Pin size={10} className="text-amber-500 fill-amber-500" />}
                          </div>
                        )}

                        {/* Text Content */}
                        {editingMessageId === msg._id ? (
                          <form onSubmit={(e) => handleSaveEdit(e, msg._id)} className="mt-1">
                            <input
                              type="text"
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full bg-dark-bg/80 border border-indigo-500 rounded-lg p-2 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <div className="flex gap-2 text-xxs mt-1 text-muted-text">
                              <span>Press Enter to save,</span>
                              <button type="button" onClick={() => setEditingMessageId(null)} className="text-red-400 hover:underline outline-none">Cancel</button>
                            </div>
                          </form>
                        ) : (
                          <p className="text-sm font-normal leading-relaxed text-white/95 break-words">
                            {msg.content}
                            {msg.isEdited && <span className="text-xxs text-muted-text/50 ml-1.5">(edited)</span>}
                          </p>
                        )}

                        {/* File Attachment Card */}
                        {msg.attachment && (
                          <div className="mt-2 max-w-[320px]">
                            {msg.attachment.fileType.startsWith('image/') ? (
                              <div className="rounded-xl overflow-hidden border border-white/5 bg-dark-surface/50 shadow-md">
                                <img src={msg.attachment.url} alt={msg.attachment.name} className="max-h-[220px] w-full object-cover cursor-pointer hover:brightness-95 transition-all" onClick={() => window.open(msg.attachment!.url)} />
                              </div>
                            ) : msg.attachment.fileType.startsWith('video/') ? (
                              <div className="rounded-xl overflow-hidden border border-white/5 bg-dark-surface/50">
                                <video src={msg.attachment.url} controls className="max-h-[220px] w-full object-cover" />
                              </div>
                            ) : (
                              <a href={msg.attachment.url} target="_blank" download={msg.attachment.name} className="flex items-center gap-3 p-3 bg-dark-surface/75 border border-white/5 rounded-xl hover:bg-white/[0.03] transition-all">
                                <FileText className="text-indigo-400 shrink-0" size={24} />
                                <div className="flex-1 min-w-0 flex flex-col">
                                  <span className="text-xs font-semibold truncate text-white">{msg.attachment.name}</span>
                                  <span className="text-[10px] text-muted-text">{formatBytes(msg.attachment.size)}</span>
                                </div>
                                <Download size={14} className="text-muted-text shrink-0" />
                              </a>
                            )}
                          </div>
                        )}

                        {/* Reactions Grid */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {msg.reactions.map((rx, rIdx) => {
                              const hasReacted = rx.users.includes(user?._id || '');
                              return (
                                <button
                                  key={rIdx}
                                  onClick={() => handleReaction(msg._id, rx.emoji)}
                                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xxs transition-all border ${
                                    hasReacted
                                      ? 'bg-indigo-500/10 border-indigo-500/35 text-indigo-400 font-semibold'
                                      : 'bg-white/5 border-transparent text-muted-text hover:border-white/10'
                                  }`}
                                >
                                  <span>{rx.emoji}</span>
                                  <span>{rx.users.length}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* HOVER ACTIONS MENU */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-dark-surface border border-white/10 rounded-lg shadow-lg flex items-center p-1 gap-0.5 z-10">
                      <button onClick={() => setReplyingToMessage(msg)} className="p-1.5 hover:bg-white/5 hover:text-white rounded text-muted-text transition-colors" title="Reply">
                        <CornerUpRight size={14} />
                      </button>
                      <button onClick={() => setShowEmojiPickerForId(showEmojiPickerForId === msg._id ? null : msg._id)} className="p-1.5 hover:bg-white/5 hover:text-white rounded text-muted-text transition-colors" title="Add Reaction">
                        <Smile size={14} />
                      </button>
                      <button onClick={() => handlePin(msg._id)} className={`p-1.5 hover:bg-white/5 rounded transition-colors ${msg.isPinned ? 'text-amber-500' : 'text-muted-text'}`} title={msg.isPinned ? 'Unpin message' : 'Pin message'}>
                        <Pin size={14} />
                      </button>
                      {isSelf && (
                        <button onClick={() => handleStartEdit(msg)} className="p-1.5 hover:bg-white/5 hover:text-white rounded text-muted-text transition-colors" title="Edit message">
                          <Edit3 size={14} />
                        </button>
                      )}
                      {(isSelf || user?.username === 'owner') && (
                        <button onClick={() => handleDelete(msg._id)} className="p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded text-muted-text transition-colors" title="Delete message">
                          <Trash2 size={14} />
                        </button>
                      )}
                      
                      {/* Floating Emoji Quick picker overlay */}
                      <AnimatePresence>
                        {showEmojiPickerForId === msg._id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 5 }}
                            className="absolute bottom-9 right-0 bg-dark-surface border border-white/10 p-1.5 rounded-lg shadow-xl grid grid-cols-5 gap-1 z-30"
                          >
                            {['👍', '❤️', '😂', '🔥', '🙌'].map((emoji) => (
                              <button key={emoji} onClick={() => handleReaction(msg._id, emoji)} className="w-6 h-6 flex items-center justify-center text-sm hover:bg-white/5 rounded transition-colors">
                                {emoji}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                  </div>
                </div>
              );
            });
          })()
        )}
      </div>

      {/* TYPING DOTS AREA */}
      {activeTyping.length > 0 && (
        <div className="absolute bottom-2 left-6 right-6 flex items-center gap-2 text-xxs text-muted-text bg-dark-surface/40 py-1.5 px-3 rounded-lg border border-white/5 shrink-0 select-none animate-pulse">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-text animate-typing-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-muted-text animate-typing-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-muted-text animate-typing-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span>
            {activeTyping.length === 1
              ? `${activeTyping[0]} is typing...`
              : activeTyping.length === 2
              ? `${activeTyping[0]} and ${activeTyping[1]} are typing...`
              : 'Several people are typing...'}
          </span>
        </div>
      )}
    </div>
  );
};
