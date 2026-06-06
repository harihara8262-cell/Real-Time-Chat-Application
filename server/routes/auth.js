const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

// Helper to generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
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

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
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
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanUsername)}`,
      status: 'online' // start online upon successful signup
    });

    await newUser.save();
    const token = generateToken(newUser._id);

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

    // Check Password match
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    // Set online status in database
    user.status = 'online';
    await user.save();

    const token = generateToken(user._id);

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
  return res.json(req.user);
});

// Update Profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { displayName, avatarUrl, statusText } = req.body;
    const user = req.user;

    if (displayName !== undefined) {
      user.displayName = displayName.trim() || user.username;
    }
    if (avatarUrl !== undefined) {
      user.avatarUrl = avatarUrl;
    }
    if (statusText !== undefined) {
      user.statusText = statusText.trim();
    }

    await user.save();
    return res.json(user);
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ error: 'Server error updating profile.' });
  }
});

// User Directory Directory Search
router.get('/users', auth, async (req, res) => {
  try {
    const { q } = req.query;
    let query = { _id: { $ne: req.user._id } }; // Exclude self

    if (q) {
      const regex = new RegExp(q, 'i');
      query.$and = [
        { _id: { $ne: req.user._id } },
        {
          $or: [
            { username: regex },
            { displayName: regex }
          ]
        }
      ];
    }

    const users = await User.find(query).limit(30);
    return res.json(users);
  } catch (err) {
    console.error('Fetch users error:', err);
    return res.status(500).json({ error: 'Server error retrieving users.' });
  }
});

module.exports = router;
