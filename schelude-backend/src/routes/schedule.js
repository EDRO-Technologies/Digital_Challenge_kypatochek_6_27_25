const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const { protect } = require('../middleware/auth');

// Helper function to get date range
const getDateRange = (type) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let end;

  switch (type) {
    case 'today':
      end = new Date(start);
      end.setDate(end.getDate() + 1);
      break;
    case 'tomorrow':
      start.setDate(start.getDate() + 1);
      end = new Date(start);
      end.setDate(end.getDate() + 1);
      break;
    case 'week':
      // Get Monday of current week
      const dayOfWeek = start.getDay();
      const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
      start.setDate(start.getDate() + diffToMonday);
      end = new Date(start);
      end.setDate(end.getDate() + 7);
      break;
    default:
      end = new Date(start);
      end.setDate(end.getDate() + 1);
  }

  return { start, end };
};

// @route   GET /api/schedule/group/:groupNumber/today
// @desc    Get today's schedule for a group
// @access  Private
router.get('/group/:groupNumber/today', protect, async (req, res) => {
  try {
    const { groupNumber } = req.params;
    const { start, end } = getDateRange('today');

    const sessions = await Session.find({
      groups: groupNumber,
      status: { $ne: 'cancelled' },
      startAt: { $gte: start, $lt: end }
    })
      .populate('course', 'name code')
      .populate('teacher', 'name')
      .populate('room', 'number building')
      .sort({ startAt: 1 });

    res.json({ success: true, sessions, date: start.toISOString().split('T')[0] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/schedule/group/:groupNumber/tomorrow
// @desc    Get tomorrow's schedule for a group
// @access  Private
router.get('/group/:groupNumber/tomorrow', protect, async (req, res) => {
  try {
    const { groupNumber } = req.params;
    const { start, end } = getDateRange('tomorrow');

    const sessions = await Session.find({
      groups: groupNumber,
      status: { $ne: 'cancelled' },
      startAt: { $gte: start, $lt: end }
    })
      .populate('course', 'name code')
      .populate('teacher', 'name')
      .populate('room', 'number building')
      .sort({ startAt: 1 });

    res.json({ success: true, sessions, date: start.toISOString().split('T')[0] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/schedule/group/:groupNumber/week
// @desc    Get week's schedule for a group
// @access  Private
router.get('/group/:groupNumber/week', protect, async (req, res) => {
  try {
    const { groupNumber } = req.params;
    const { start, end } = getDateRange('week');

    const sessions = await Session.find({
      groups: groupNumber,
      status: { $ne: 'cancelled' },
      startAt: { $gte: start, $lt: end }
    })
      .populate('course', 'name code')
      .populate('teacher', 'name')
      .populate('room', 'number building')
      .sort({ startAt: 1 });

    // Group by day
    const schedule = {};
    sessions.forEach(session => {
      const date = new Date(session.startAt).toISOString().split('T')[0];
      if (!schedule[date]) {
        schedule[date] = [];
      }
      schedule[date].push(session);
    });

    res.json({ 
      success: true, 
      schedule,
      weekStart: start.toISOString().split('T')[0],
      weekEnd: end.toISOString().split('T')[0]
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/schedule/group/:groupNumber/range
// @desc    Get schedule for a custom date range
// @access  Private
router.get('/group/:groupNumber/range', protect, async (req, res) => {
  try {
    const { groupNumber } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }

    const sessions = await Session.find({
      groups: groupNumber,
      status: { $ne: 'cancelled' },
      startAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
    })
      .populate('course', 'name code')
      .populate('teacher', 'name')
      .populate('room', 'number building')
      .sort({ startAt: 1 });

    res.json({ success: true, sessions, startDate, endDate });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/schedule/my/upcoming
// @desc    Get user's upcoming sessions
// @access  Private
router.get('/my/upcoming', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const now = new Date();

    // Get user's group
    if (!req.user.groupNumber) {
      return res.status(400).json({ message: 'User has no group assigned' });
    }

    const sessions = await Session.find({
      groups: req.user.groupNumber,
      status: { $ne: 'cancelled' },
      startAt: { $gte: now }
    })
      .populate('course', 'name code')
      .populate('teacher', 'name')
      .populate('room', 'number building')
      .limit(parseInt(limit))
      .sort({ startAt: 1 });

    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
