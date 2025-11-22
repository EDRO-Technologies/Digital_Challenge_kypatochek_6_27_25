const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/notifications
// @desc    Get notifications (for admin)
// @access  Private/Admin
router.get('/', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { type, status, session, page = 1, limit = 50 } = req.query;

    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (session) query.session = session;

    const notifications = await Notification.find(query)
      .populate('session')
      .populate('recipients.users', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Notification.countDocuments(query);

    res.json({
      success: true,
      notifications,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/notifications/my
// @desc    Get user's notifications
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const notifications = await Notification.find({
      'recipients.users': req.user.id
    })
      .populate('session', 'startAt endAt status')
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/notifications/:id
// @desc    Get notification by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('session')
      .populate('recipients.users', 'name email');

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
