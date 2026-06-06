const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Channel = require('../models/Channel');
const auth = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

// Helper to generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
};

// Password Complexity Checker
const isStrongPassword = (password) => {
  const minLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return minLength && hasUppercase && hasLowercase && hasDigit && hasSpecial;
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword, displayName, avatarUrl } = req.body;

    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        error: 'Password does not meet complexity rules: Minimum 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special symbol.'
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check unique username
    const existingUser = await User.findOne({ username: cleanUsername });
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    // Check unique email
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create User
    const newUser = new User({
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      displayName: displayName ? displayName.trim() : username.trim(),
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanUsername)}`,
      status: 'online'
    });

    // Save
    await newUser.save();

    // Automatically link new registrant to Aether AI bot DM channel
    try {
      const botUser = await User.findOne({ username: 'aetherai' });
      if (botUser) {
        const aiChannel = new Channel({
          name: '',
          type: 'private',
          creator: botUser._id,
          members: [
            { user: newUser._id, role: 'owner' },
            { user: botUser._id, role: 'member' }
          ],
          isDirectMessage: true
        });
        await aiChannel.save();
      }
    } catch (dmErr) {
      console.error('Failed to create Aether AI DM during registration:', dmErr);
    }

    const token = generateToken(newUser._id);
    
    // Add current session details
    newUser.sessions.push({
      token: token,
      userAgent: req.headers['user-agent'] || 'Unknown Device',
      ipAddress: req.ip || '127.0.0.1',
      lastActive: Date.now()
    });
    
    await newUser.save();

    return res.status(201).json({
      token,
      user: newUser
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Server error during registration.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required.' });
    }

    const cleanInput = usernameOrEmail.trim().toLowerCase();

    // Find User by username or email
    const user = await User.findOne({
      $or: [{ username: cleanInput }, { email: cleanInput }]
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingMs = user.lockUntil.getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      return res.status(403).json({
        error: `Account is temporarily locked due to multiple failed login attempts. Try again in ${remainingMin} minutes.`,
        lockUntil: user.lockUntil
      });
    }

    // Check Password match
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!isMatch) {
      // Increment failed attempts
      user.failedLoginAttempts += 1;
      
      let responsePayload = { error: 'Invalid credentials.' };

      if (user.failedLoginAttempts >= 8) {
        // Account lock trigger
        user.lockHistoryCount += 1;
        
        let lockDurationMs = 15 * 60 * 1000; // 1st lock: 15 mins
        if (user.lockHistoryCount === 2) {
          lockDurationMs = 30 * 60 * 1000; // 2nd lock: 30 mins
        } else if (user.lockHistoryCount >= 3) {
          lockDurationMs = 60 * 60 * 1000; // 3rd lock+: 1 hour
        }

        user.lockUntil = new Date(Date.now() + lockDurationMs);
        user.failedLoginAttempts = 0; // reset attempts for next cycle
        await user.save();

        const durationMin = lockDurationMs / (60 * 1000);
        return res.status(403).json({
          error: `Too many failed attempts. Your account has been temporarily locked for ${durationMin} minutes.`,
          lockUntil: user.lockUntil
        });
      } else if (user.failedLoginAttempts >= 5) {
        // Warning trigger
        await user.save();
        responsePayload.warning = `Warning: ${8 - user.failedLoginAttempts} login attempts remaining before your account is locked.`;
        return res.status(400).json(responsePayload);
      }

      await user.save();
      return res.status(400).json(responsePayload);
    }

    // RESET SECURITY COUNTERS ON SUCCESSFUL LOGIN
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.lockHistoryCount = 0;
    user.status = 'online';

    const token = generateToken(user._id);

    // Save active session
    user.sessions.push({
      token: token,
      userAgent: req.headers['user-agent'] || 'Unknown Device',
      ipAddress: req.ip || '127.0.0.1',
      lastActive: Date.now()
    });

    // Keep only last 10 sessions to prevent document bloat
    if (user.sessions.length > 10) {
      user.sessions.shift();
    }

    await user.save();

    return res.json({
      token,
      user
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login.' });
  }
});

// Get Session User
router.get('/me', auth, async (req, res) => {
  // Update last active session timestamp
  const token = req.headers.authorization.split(' ')[1];
  const user = req.user;
  
  const currentSession = user.sessions.find(s => s.token === token);
  if (currentSession) {
    currentSession.lastActive = Date.now();
    await user.save();
  }

  return res.json(user);
});

// Update Profile Preference settings
router.put('/profile', auth, async (req, res) => {
  try {
    const {
      displayName, avatarUrl, statusText,
      theme, fontFamily, fontSizeUI, fontSizeChat, lineHeight, accentColor
    } = req.body;
    const user = req.user;

    // Standard profile updates
    if (displayName !== undefined) user.displayName = displayName.trim() || user.username;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (statusText !== undefined) user.statusText = statusText.trim();

    // UI Customization Preference updates
    if (theme !== undefined) user.theme = theme;
    if (fontFamily !== undefined) user.fontFamily = fontFamily;
    if (fontSizeUI !== undefined) user.fontSizeUI = Number(fontSizeUI);
    if (fontSizeChat !== undefined) user.fontSizeChat = Number(fontSizeChat);
    if (lineHeight !== undefined) user.lineHeight = Number(lineHeight);
    if (accentColor !== undefined) user.accentColor = accentColor;

    await user.save();
    return res.json(user);
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ error: 'Server error updating profile settings.' });
  }
});

// Change Password API
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current password and new password are required.' });
    }

    // Verify current password match
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    // Verify complexity
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        error: 'Password does not meet complexity rules: Minimum 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special symbol.'
      });
    }

    // Hash & Save
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);

    // Invalidate all other sessions (wipe other entries from array except the current active session)
    const activeToken = req.headers.authorization.split(' ')[1];
    user.sessions = user.sessions.filter(s => s.token === activeToken);

    await user.save();

    return res.json({ message: 'Password changed successfully. Other sessions logged out.' });
  } catch (err) {
    console.error('Password change error:', err);
    return res.status(500).json({ error: 'Server error changing password.' });
  }
});

// Fetch Active Sessions list
router.get('/sessions', auth, async (req, res) => {
  // Returns sessions list (without secure token details, handled by toJSON schema)
  return res.json(req.user.sessions);
});

// Invalidate/Logout a specific Session
router.delete('/sessions/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const user = req.user;

    const sessionIndex = user.sessions.findIndex(s => s._id.toString() === sessionId);
    if (sessionIndex === -1) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    // Check if user is deleting their current active session
    const currentToken = req.headers.authorization.split(' ')[1];
    const isCurrentSession = user.sessions[sessionIndex].token === currentToken;

    user.sessions.splice(sessionIndex, 1);
    await user.save();

    return res.json({
      message: 'Session revoked successfully.',
      isCurrentSession // let frontend know if they need to force logout
    });
  } catch (err) {
    console.error('Delete session error:', err);
    return res.status(500).json({ error: 'Server error invalidating session.' });
  }
});

// Search Users Directory
router.get('/users', auth, async (req, res) => {
  try {
    const query = req.query.q || '';
    const userId = req.user._id;

    // Search by username or displayName containing query, excluding current user
    const searchFilter = {
      _id: { $ne: userId }
    };

    if (query) {
      searchFilter.$or = [
        { username: { $regex: query, $options: 'i' } },
        { displayName: { $regex: query, $options: 'i' } }
      ];
    }

    const users = await User.find(searchFilter)
      .select('username displayName avatarUrl status statusText')
      .limit(20);

    return res.json(users);
  } catch (err) {
    console.error('Search users error:', err);
    return res.status(500).json({ error: 'Server error searching users.' });
  }
});

module.exports = router;
