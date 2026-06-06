const express = require('express');
const Channel = require('../models/Channel');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

// Get channels list for the active user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Retrieve channels:
    // - Type is 'public' OR
    // - User is a member of the channel
    const channels = await Channel.find({
      $or: [
        { type: 'public' },
        { 'members.user': userId }
      ]
    }).populate('members.user', 'username displayName avatarUrl status');

    return res.json(channels);
  } catch (err) {
    console.error('Fetch channels error:', err);
    return res.status(500).json({ error: 'Server error retrieving channels.' });
  }
});

// Create a Channel / DM
router.post('/', auth, async (req, res) => {
  try {
    const { name, type, invitedUsers, isDirectMessage } = req.body;
    const userId = req.user._id;

    if (!isDirectMessage && (!name || name.trim().length === 0)) {
      return res.status(400).json({ error: 'Channel name is required.' });
    }

    // Set up members list (creator is owner)
    const membersList = [{ user: userId, role: 'owner' }];

    // If there are invited users
    if (invitedUsers && Array.isArray(invitedUsers)) {
      invitedUsers.forEach(uId => {
        if (uId !== userId.toString()) {
          membersList.push({ user: uId, role: 'member' });
        }
      });
    }

    // If it's a DM, check if one already exists between these members
    if (isDirectMessage) {
      if (membersList.length < 2) {
        return res.status(400).json({ error: 'At least one other user is required to initiate a DM.' });
      }

      const otherUserId = invitedUsers[0];
      const existingDM = await Channel.findOne({
        isDirectMessage: true,
        'members.user': { $all: [userId, otherUserId] }
      }).populate('members.user', 'username displayName avatarUrl status');

      if (existingDM) {
        return res.json(existingDM);
      }
    }

    const newChannel = new Channel({
      name: isDirectMessage ? '' : name.trim(),
      type: isDirectMessage ? 'private' : (type || 'public'),
      creator: userId,
      members: membersList,
      isDirectMessage: !!isDirectMessage
    });

    await newChannel.save();
    
    // Populate member details before returning
    const populatedChannel = await Channel.findById(newChannel._id)
      .populate('members.user', 'username displayName avatarUrl status');

    return res.status(201).json(populatedChannel);
  } catch (err) {
    console.error('Create channel error:', err);
    return res.status(500).json({ error: 'Server error creating channel.' });
  }
});

// Retrieve message history for a channel (supporting cursor pagination for Infinite Scroll)
router.get('/:channelId/messages', auth, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { limit = 50, before } = req.query;
    const userId = req.user._id;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found.' });
    }

    // Verify access for private rooms
    if (channel.type === 'private' && !channel.members.some(m => m.user.toString() === userId.toString())) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Build query
    const messageQuery = { channel: channelId };
    if (before) {
      messageQuery.createdAt = { $lt: new Date(before) };
    }

    // Retrieve and sort chronologically
    const messages = await Message.find(messageQuery)
      .sort({ createdAt: -1 }) // get newest first
      .limit(parseInt(limit))
      .populate('sender', 'username displayName avatarUrl status')
      .populate('replyTo')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'username displayName' }
      });

    // Reverse to return in chronological order
    return res.json(messages.reverse());
  } catch (err) {
    console.error('Fetch messages error:', err);
    return res.status(500).json({ error: 'Server error retrieving messages.' });
  }
});

// Get pinned messages in a channel
router.get('/:channelId/pins', auth, async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user._id;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found.' });
    }

    if (channel.type === 'private' && !channel.members.some(m => m.user.toString() === userId.toString())) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const pins = await Message.find({ channel: channelId, isPinned: true })
      .populate('sender', 'username displayName avatarUrl status');

    return res.json(pins);
  } catch (err) {
    console.error('Fetch pins error:', err);
    return res.status(500).json({ error: 'Server error retrieving pinned messages.' });
  }
});

module.exports = router;
