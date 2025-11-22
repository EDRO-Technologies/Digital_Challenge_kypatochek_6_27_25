const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const User = require('../models/User');
const { generateToken } = require('../utils/tokenUtils');
const { protect } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['student', 'teacher']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const { name, email, password, role, groupNumber } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      groupNumber
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        groupNumber: user.groupNumber
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        groupNumber: user.groupNumber
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/telegram-init
// @desc    Initialize user from Telegram
// @access  Public
router.post('/telegram-init', [
  body('telegramId').notEmpty().withMessage('Telegram ID is required'),
  body('groupNumber').notEmpty().withMessage('Group number is required')
], async (req, res) => {
  try {
    const { telegramId, groupNumber, name } = req.body;

    // Check if user exists
    let user = await User.findOne({ telegramId });

    if (user) {
      // Update group if changed
      if (user.groupNumber !== groupNumber) {
        user.groupNumber = groupNumber;
        await user.save();
      }
    } else {
      // Create new guest user
      user = await User.create({
        name: name || `Telegram User ${telegramId}`,
        telegramId,
        groupNumber,
        role: 'guest'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        groupNumber: user.groupNumber,
        telegramId: user.telegramId
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/guest
// @desc    Create guest user
// @access  Public
router.post('/guest', [
  body('groupNumber').notEmpty().withMessage('Group number is required')
], async (req, res) => {
  try {
    const { groupNumber, name } = req.body;

    // Create guest user
    const user = await User.create({
      name: name || `Guest ${Date.now()}`,
      groupNumber,
      role: 'guest'
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        groupNumber: user.groupNumber
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
