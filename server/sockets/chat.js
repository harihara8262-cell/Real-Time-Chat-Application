const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const Channel = require('../models/Channel');
const Message = require('../models/Message');
const aiService = require('../services/ai');

// Store mappings of active users -> socket IDs (to check multi-tab online presence)
const activeUsers = new Map(); // userId -> Set of socketIds

module.exports = (io) => {
  // Socket.IO Authentication Middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers['x-auth-token'];
    
    if (!token) {
      return next(new Error('Authentication error. Token missing.'));
    }

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) {
        return next(new Error('User session invalid. Account not found.'));
      }
      
      socket.user = user;
      next();
    } catch (err) {
      console.error('Socket Auth Error:', err.message);
      return next(new Error('Authentication error. Token invalid.'));
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.user;
    const userId = user._id.toString();
    
    console.log(`Socket connected: ${user.username} (${socket.id})`);

    // 1. Maintain active connection registry
    if (!activeUsers.has(userId)) {
      activeUsers.set(userId, new Set());
    }
    activeUsers.get(userId).add(socket.id);

    // Update status to online
    user.status = 'online';
    await user.save();

    // Broadcast status change to everyone
    io.emit('status_update', {
      userId: userId,
      status: 'online',
      statusText: user.statusText
    });

    // 2. Room Switch Event
    socket.on('join_channel', async ({ channelId }) => {
      try {
        const channel = await Channel.findById(channelId);
        if (!channel) return;

        // Verify private room access
        if (channel.type === 'private' && !channel.members.some(m => m.user.toString() === userId)) {
          socket.emit('error_msg', { message: 'Access to channel denied.' });
          return;
        }

        // Leave previous rooms
        const currentRooms = Array.from(socket.rooms).filter(r => r !== socket.id);
        currentRooms.forEach(room => socket.leave(room));

        // Join channel room
        socket.join(channelId);
        console.log(`User ${user.username} joined room: ${channelId}`);
      } catch (err) {
        console.error('Socket join_channel error:', err);
      }
    });

    // 3. Message Events
    socket.on('message_send', async ({ channelId, content, attachment, replyTo }) => {
      try {
        const channel = await Channel.findById(channelId);
        if (!channel) return;

        // Verify access
        if (channel.type === 'private' && !channel.members.some(m => m.user.toString() === userId)) {
          socket.emit('error_msg', { message: 'Access denied.' });
          return;
        }

        // Create Message
        const newMessage = new Message({
          channel: channelId,
          sender: userId,
          content: content || '',
          attachment: attachment || null,
          replyTo: replyTo || null
        });

        await newMessage.save();

        // Populate sender & reply references
        const populatedMessage = await Message.findById(newMessage._id)
          .populate('sender', 'username displayName avatarUrl status')
          .populate('replyTo')
          .populate({
            path: 'replyTo',
            populate: { path: 'sender', select: 'username displayName' }
          });

        // Broadcast to channel room
        io.to(channelId).emit('message_recv', populatedMessage);
        
        // Unread Notifications logic:
        // Find other members of the channel
        const notifyPayload = {
          channelId: channelId,
          message: populatedMessage
        };

        if (channel.type === 'public') {
          // Send unread notifications to all online users who are NOT currently in this room
          socket.broadcast.emit('unread_notification', notifyPayload);
        } else {
          // Send unread notifications only to room members not currently focused on the channel
          channel.members.forEach(member => {
            const memberIdStr = member.user.toString();
            if (memberIdStr !== userId) {
              const sockets = activeUsers.get(memberIdStr);
              if (sockets) {
                sockets.forEach(socketId => {
                  io.to(socketId).emit('unread_notification', notifyPayload);
                });
              }
            }
          });
        }

        // --- AETHER AI CHATBOT HANDLER ---
        if (channel.isDirectMessage) {
          try {
            const botUser = await User.findOne({ username: 'aetherai' });
            if (botUser && channel.members.some(m => m.user.toString() === botUser._id.toString())) {
              // Trigger typing indicator immediately
              io.to(channelId).emit('typing_update', {
                channelId,
                userId: botUser._id.toString(),
                displayName: botUser.displayName,
                isTyping: true
              });

              // Fetch history context (excluding the current user message)
              const history = await Message.find({ channel: channelId, _id: { $ne: newMessage._id } })
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('sender', 'username');
              history.reverse();

              // Run response generation asynchronously so socket doesn't block
              (async () => {
                try {
                  const startTime = Date.now();
                  let botResponse;
                  try {
                    botResponse = await aiService.generateAIResponse(content, history);
                  } catch (aiErr) {
                    console.error('AI Generation error:', aiErr);
                    botResponse = "I'm sorry, I'm having trouble processing that right now. Please try again in a bit!";
                  }

                  const duration = Date.now() - startTime;
                  const minDelay = 1500;
                  if (duration < minDelay) {
                    await new Promise(resolve => setTimeout(resolve, minDelay - duration));
                  }

                  const aiMessage = new Message({
                    channel: channelId,
                    sender: botUser._id,
                    content: botResponse,
                    attachment: null,
                    replyTo: newMessage._id
                  });
                  await aiMessage.save();

                  const populatedAiMessage = await Message.findById(aiMessage._id)
                    .populate('sender', 'username displayName avatarUrl status')
                    .populate('replyTo')
                    .populate({
                      path: 'replyTo',
                      populate: { path: 'sender', select: 'username displayName' }
                    });

                  // Turn off typing indicator
                  io.to(channelId).emit('typing_update', {
                    channelId,
                    userId: botUser._id.toString(),
                    displayName: botUser.displayName,
                    isTyping: false
                  });

                  // Broadcast message
                  io.to(channelId).emit('message_recv', populatedAiMessage);
                } catch (innerErr) {
                  console.error('Asynchronous AI response execution error:', innerErr);
                  // Ensure typing indicator turns off even on failure
                  io.to(channelId).emit('typing_update', {
                    channelId,
                    userId: botUser._id.toString(),
                    displayName: botUser.displayName,
                    isTyping: false
                  });
                }
              })();
            }
          } catch (botErr) {
            console.error('Error initiating AI response:', botErr);
          }
        }
      } catch (err) {
        console.error('Socket message_send error:', err);
      }
    });

    socket.on('message_edit', async ({ messageId, content }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        // Only sender can edit
        if (message.sender.toString() !== userId) {
          socket.emit('error_msg', { message: 'Unauthorized action.' });
          return;
        }

        message.content = content;
        message.isEdited = true;
        await message.save();

        const populated = await Message.findById(messageId)
          .populate('sender', 'username displayName avatarUrl status')
          .populate('replyTo')
          .populate({
            path: 'replyTo',
            populate: { path: 'sender', select: 'username displayName' }
          });

        io.to(message.channel.toString()).emit('message_edited', populated);
      } catch (err) {
        console.error('Socket message_edit error:', err);
      }
    });

    socket.on('message_delete', async ({ messageId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        // Sender or channel creator/owner can delete
        const channel = await Channel.findById(message.channel);
        const isSender = message.sender.toString() === userId;
        const isOwner = channel && channel.members.some(m => m.user.toString() === userId && m.role === 'owner');

        if (!isSender && !isOwner) {
          socket.emit('error_msg', { message: 'Unauthorized action.' });
          return;
        }

        await Message.findByIdAndDelete(messageId);
        
        io.to(message.channel.toString()).emit('message_deleted', { messageId });
      } catch (err) {
        console.error('Socket message_delete error:', err);
      }
    });

    // 4. Pin message events
    socket.on('message_pin', async ({ messageId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        // Toggle pinned status
        message.isPinned = !message.isPinned;
        await message.save();

        io.to(message.channel.toString()).emit('message_pinned_update', {
          messageId: message._id,
          isPinned: message.isPinned,
          pinnedMessage: message.isPinned ? message : null
        });
      } catch (err) {
        console.error('Socket message_pin error:', err);
      }
    });

    // 5. Message Reactions
    socket.on('message_react', async ({ messageId, emoji }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        // Find existing reaction array
        let rxIndex = message.reactions.findIndex(r => r.emoji === emoji);

        if (rxIndex === -1) {
          // New reaction emoji
          message.reactions.push({ emoji, users: [userId] });
        } else {
          // Reaction exists, check if user already reacted
          const userIdx = message.reactions[rxIndex].users.indexOf(userId);
          if (userIdx === -1) {
            message.reactions[rxIndex].users.push(userId);
          } else {
            // Remove user's reaction
            message.reactions[rxIndex].users.splice(userIdx, 1);
            // If zero users left, delete this emoji entry
            if (message.reactions[rxIndex].users.length === 0) {
              message.reactions.splice(rxIndex, 1);
            }
          }
        }

        await message.save();

        const updatedMsg = await Message.findById(messageId)
          .populate('sender', 'username displayName avatarUrl status')
          .populate('replyTo')
          .populate({
            path: 'replyTo',
            populate: { path: 'sender', select: 'username displayName' }
          });

        io.to(message.channel.toString()).emit('message_reacted', updatedMsg);
      } catch (err) {
        console.error('Socket message_react error:', err);
      }
    });

    // 6. Typing Indicators
    socket.on('typing_start', ({ channelId }) => {
      socket.to(channelId).emit('typing_update', {
        channelId,
        userId: userId,
        displayName: user.displayName,
        isTyping: true
      });
    });

    socket.on('typing_stop', ({ channelId }) => {
      socket.to(channelId).emit('typing_update', {
        channelId,
        userId: userId,
        displayName: user.displayName,
        isTyping: false
      });
    });

    // 7. Presence Status Change
    socket.on('status_change', async ({ status, statusText }) => {
      if (['online', 'idle', 'dnd', 'offline'].includes(status)) {
        user.status = status;
        if (statusText !== undefined) {
          user.statusText = statusText.trim();
        }
        await user.save();

        io.emit('status_update', {
          userId: userId,
          status,
          statusText: user.statusText
        });
      }
    });

    // 8. Disconnect
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${user.username} (${socket.id})`);
      
      const sockets = activeUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        
        // If user has closed all browser tabs (no active sockets left)
        if (sockets.size === 0) {
          activeUsers.delete(userId);
          
          user.status = 'offline';
          user.lastSeen = Date.now();
          await user.save();

          io.emit('status_update', {
            userId: userId,
            status: 'offline',
            statusText: user.statusText
          });
          
          console.log(`User ${user.username} went offline.`);
        }
      }
    });
  });
};
