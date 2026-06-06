import React, { useState, useRef } from 'react';
import { useChatStore } from '../../stores/useChatStore';
import { socket } from '../../socket';
import { Paperclip, Smile, Send, X, CornerDownRight, FileText } from 'lucide-react';

interface ChatInputProps {
  onUploadFile: (file: File) => Promise<any>;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onUploadFile }) => {
  const { activeChannelId, replyingToMessage, setReplyingToMessage, channels } = useChatStore();
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isTyping, setIsTyping] = useState(false);
  const typingTimerRef = useRef<any>(null);

  const currentChannel = channels.find(c => c._id === activeChannelId);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);

    // Send typing start indicator
    if (!isTyping && socket) {
      setIsTyping(true);
      socket.emit('typing_start', { channelId: activeChannelId });
    }

    // Reset typing timeout indicator
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socket) {
        socket.emit('typing_stop', { channelId: activeChannelId });
      }
    }, 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !selectedFile) return;

    setIsSending(true);
    let attachmentPayload = null;

    try {
      // 1. Upload file first if selected
      if (selectedFile) {
        attachmentPayload = await onUploadFile(selectedFile);
      }

      // 2. Transmit message via Socket.IO
      if (socket) {
        socket.emit('message_send', {
          channelId: activeChannelId,
          content: text.trim(),
          attachment: attachmentPayload,
          replyTo: replyingToMessage?._id || null
        });

        // Trigger typing stop
        socket.emit('typing_stop', { channelId: activeChannelId });
        setIsTyping(false);
      }

      // 3. Clear State
      setText('');
      setSelectedFile(null);
      setReplyingToMessage(null);
    } catch (err) {
      alert('Failed to send message: ' + err);
    } finally {
      setIsSending(false);
    }
  };

  const cancelFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleQuickEmoji = (emoji: string) => {
    setText(prev => prev + emoji);
    setShowEmojis(false);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="p-4 bg-dark-surface/40 border-t border-white/5 shrink-0 flex flex-col gap-2 relative z-20">
      
      {/* 1. Reply Banner */}
      {replyingToMessage && (
        <div className="flex items-center justify-between px-3 py-2 bg-indigo-500/10 border border-indigo-500/25 rounded-xl text-xs text-indigo-400">
          <div className="flex items-center gap-2 min-w-0">
            <CornerDownRight size={14} className="shrink-0" />
            <span>Replying to <span className="font-semibold text-white/70">{replyingToMessage.sender.displayName}</span></span>
            <span className="truncate italic opacity-75 max-w-[300px]">"{replyingToMessage.content}"</span>
          </div>
          <button onClick={() => setReplyingToMessage(null)} className="p-1 hover:bg-white/5 rounded-full transition-colors text-muted-text">
            <X size={12} />
          </button>
        </div>
      )}

      {/* 2. File Attachment Preview Banner */}
      {selectedFile && (
        <div className="flex items-center justify-between px-3 py-2 bg-dark-surface border border-white/10 rounded-xl text-xs">
          <div className="flex items-center gap-3 min-w-0">
            <FileText size={18} className="text-indigo-400 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-semibold truncate text-white">{selectedFile.name}</span>
              <span className="text-[10px] text-muted-text">{formatBytes(selectedFile.size)}</span>
            </div>
          </div>
          <button onClick={cancelFile} className="p-1 hover:bg-white/5 rounded-full transition-colors text-red-400">
            <X size={12} />
          </button>
        </div>
      )}

      {/* 3. Text Input form */}
      <form onSubmit={handleSend} className="flex items-center gap-2 bg-dark-bg/80 border border-white/5 rounded-2xl p-1.5 focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/85 transition-all">
        {/* Hidden File Upload Element */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
          className="p-2.5 hover:bg-white/5 hover:text-white rounded-xl text-muted-text transition-all shrink-0"
          title="Attach files"
        >
          <Paperclip size={18} />
        </button>

        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          disabled={isSending}
          placeholder={currentChannel ? `Message ${currentChannel.isDirectMessage ? '' : '#'}${currentChannel.name || 'Conversation'}` : 'Type a message...'}
          className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-white/20 py-2 px-1"
        />

        {/* Emoji Button Wrapper */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowEmojis(!showEmojis)}
            disabled={isSending}
            className="p-2.5 hover:bg-white/5 hover:text-white rounded-xl text-muted-text transition-all"
            title="Insert emoji"
          >
            <Smile size={18} />
          </button>
          
          {showEmojis && (
            <div className="absolute bottom-12 right-0 bg-dark-surface border border-white/15 p-2 rounded-2xl shadow-xl grid grid-cols-5 gap-1.5 z-40 w-[180px]">
              {['👍', '❤️', '😂', '🔥', '🙌', '✨', '🎉', '💡', '😢', '👀'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleQuickEmoji(emoji)}
                  className="w-7 h-7 flex items-center justify-center text-base hover:bg-white/5 rounded-lg transition-all"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSending || (!text.trim() && !selectedFile)}
          className="p-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 rounded-xl text-white transition-all shrink-0 flex items-center justify-center shadow-md shadow-indigo-500/15"
          title="Send message"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
