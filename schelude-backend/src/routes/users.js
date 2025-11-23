const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/users/me
// @desc    Update current user profile
// @access  Private
router.patch('/me', protect, async (req, res) => {
  try {
    const allowedUpdates = ['name', 'contacts', 'notificationSettings'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/users/group
// @desc    Change user group
// @access  Private
router.patch('/group', protect, [
  body('groupNumber').notEmpty().withMessage('Group number is required')
], async (req, res) => {
  try {
    const { groupNumber } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { groupNumber },
      { new: true }
    );

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { role, groupNumber, search, page = 1, limit = 50 } = req.query;

    const query = {};
    if (role) query.role = role;
    if (groupNumber) query.groupNumber = groupNumber;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (admin only)
// @access  Private/Admin
router.get('/:id', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/users/:id
// @desc    Update user (admin only)
// @access  Private/Admin
router.patch('/:id', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const allowedUpdates = ['name', 'email', 'role', 'groupNumber', 'isActive', 'contacts'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
