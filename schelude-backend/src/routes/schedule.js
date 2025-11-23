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
// @access  Public
router.get('/group/:groupNumber/today', async (req, res) => {
  try {
    const { groupNumber } = req.params;
    const { subgroup } = req.query;
    const { start, end } = getDateRange('today');

    const query = {
      groups: groupNumber,
      status: { $ne: 'cancelled' },
      startAt: { $gte: start, $lt: end }
    };

    if (subgroup && subgroup !== 'all') {
      query.$or = [
        { subgroup: subgroup },
        { subgroup: 'all' }
      ];
    }

    const sessions = await Session.find(query)
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
// @access  Public
router.get('/group/:groupNumber/tomorrow', async (req, res) => {
  try {
    const { groupNumber } = req.params;
    const { subgroup } = req.query;
    const { start, end } = getDateRange('tomorrow');

    const query = {
      groups: groupNumber,
      status: { $ne: 'cancelled' },
      startAt: { $gte: start, $lt: end }
    };

    if (subgroup && subgroup !== 'all') {
      query.$or = [
        { subgroup: subgroup },
        { subgroup: 'all' }
      ];
    }

    const sessions = await Session.find(query)
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
// @access  Public
router.get('/group/:groupNumber/week', async (req, res) => {
  try {
    const { groupNumber } = req.params;
    const { subgroup } = req.query;
    const { start, end } = getDateRange('week');

    const query = {
      groups: groupNumber,
      status: { $ne: 'cancelled' },
      startAt: { $gte: start, $lt: end }
    };

    if (subgroup && subgroup !== 'all') {
      query.$or = [
        { subgroup: subgroup },
        { subgroup: 'all' }
      ];
    }

    const sessions = await Session.find(query)
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
// @access  Public
router.get('/group/:groupNumber/range', async (req, res) => {
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

// @route   GET /api/schedule/teacher/:teacherId/today
// @desc    Get today's schedule for a teacher
// @access  Public
router.get('/teacher/:teacherId/today', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { start, end } = getDateRange('today');

    const sessions = await Session.find({
      teacher: teacherId,
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

// @route   GET /api/schedule/teacher/:teacherId/tomorrow
// @desc    Get tomorrow's schedule for a teacher
// @access  Public
router.get('/teacher/:teacherId/tomorrow', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { start, end } = getDateRange('tomorrow');

    const sessions = await Session.find({
      teacher: teacherId,
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

// @route   GET /api/schedule/teacher/:teacherId/week
// @desc    Get week's schedule for a teacher
// @access  Public
router.get('/teacher/:teacherId/week', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { start, end } = getDateRange('week');

    const sessions = await Session.find({
      teacher: teacherId,
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

// @route   GET /api/schedule/groups
// @desc    Get list of all unique groups
// @access  Public
router.get('/groups', async (req, res) => {
  try {
    const groups = await Session.distinct('groups');
    res.json({ success: true, groups: groups.sort() });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/schedule/teachers
// @desc    Get list of all teachers who have sessions
// @access  Public
router.get('/teachers', async (req, res) => {
  try {
    const User = require('../models/User');
    const teachers = await User.find({ 
      role: 'teacher',
      isActive: true 
    }).select('_id name').sort({ name: 1 });
    
    res.json({ success: true, teachers });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/schedule/group/:groupNumber/cyclic
// @desc    Get cyclic schedule for a group
// @access  Public
router.get('/group/:groupNumber/cyclic', async (req, res) => {
  try {
    const { groupNumber } = req.params;
    const now = new Date();

    const cycles = await Session.aggregate([
      {
        $match: {
          groups: groupNumber,
          cycleType: 'cyclic',
          cycleEndDate: { $gte: now }
        }
      },
      {
        $group: {
          _id: {
            cycleName: '$cycleName',
            cycleStartDate: '$cycleStartDate',
            cycleEndDate: '$cycleEndDate'
          },
          sessions: { $push: '$$ROOT' }
        }
      },
      {
        $project: {
          _id: 0,
          cycleName: '$_id.cycleName',
          cycleStartDate: '$_id.cycleStartDate',
          cycleEndDate: '$_id.cycleEndDate',
          sessionCount: { $size: '$sessions' }
        }
      },
      { $sort: { cycleStartDate: 1 } }
    ]);

    // Populate full session details for each cycle
    for (let cycle of cycles) {
      const sessions = await Session.find({
        groups: groupNumber,
        cycleType: 'cyclic',
        cycleName: cycle.cycleName,
        cycleStartDate: cycle.cycleStartDate
      })
        .populate('course', 'name code')
        .populate('teacher', 'name')
        .populate('room', 'number building')
        .sort({ startAt: 1 });
      
      cycle.sessions = sessions;
    }

    res.json({ success: true, cycles });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/schedule/teacher/:teacherId/cyclic
// @desc    Get cyclic schedule for a teacher
// @access  Public
router.get('/teacher/:teacherId/cyclic', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const now = new Date();

    const cycles = await Session.aggregate([
      {
        $match: {
          teacher: new require('mongoose').Types.ObjectId(teacherId),
          cycleType: 'cyclic',
          cycleEndDate: { $gte: now }
        }
      },
      {
        $group: {
          _id: {
            cycleName: '$cycleName',
            cycleStartDate: '$cycleStartDate',
            cycleEndDate: '$cycleEndDate'
          },
          sessions: { $push: '$$ROOT' }
        }
      },
      {
        $project: {
          _id: 0,
          cycleName: '$_id.cycleName',
          cycleStartDate: '$_id.cycleStartDate',
          cycleEndDate: '$_id.cycleEndDate',
          sessionCount: { $size: '$sessions' }
        }
      },
      { $sort: { cycleStartDate: 1 } }
    ]);

    for (let cycle of cycles) {
      const sessions = await Session.find({
        teacher: teacherId,
        cycleType: 'cyclic',
        cycleName: cycle.cycleName,
        cycleStartDate: cycle.cycleStartDate
      })
        .populate('course', 'name code')
        .populate('teacher', 'name')
        .populate('room', 'number building')
        .sort({ startAt: 1 });
      
      cycle.sessions = sessions;
    }

    res.json({ success: true, cycles });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
