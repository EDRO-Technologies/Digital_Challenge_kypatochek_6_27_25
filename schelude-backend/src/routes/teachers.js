const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Session = require('../models/Session');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/teachers
// @desc    Create new teacher
// @access  Private/Admin
router.post('/', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const teacherData = {
      ...req.body,
      role: 'teacher',
      isActive: true
    };
    
    const teacher = await User.create(teacherData);
    res.status(201).json({ success: true, teacher });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Teacher with this email/telegram already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/teachers/:id
// @desc    Update teacher
// @access  Private/Admin
router.put('/:id', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const teacher = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json({ success: true, teacher });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/teachers/:id/activate
// @desc    Activate teacher
// @access  Private/Admin
router.patch('/:id/activate', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const teacher = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json({ success: true, message: 'Teacher activated', teacher });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/teachers/:id
// @desc    Deactivate teacher
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const teacher = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json({ success: true, message: 'Teacher deactivated', teacher });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/teachers/:id/schedule
// @desc    Get teacher's schedule with filters
// @access  Private
router.get('/:id/schedule', protect, async (req, res) => {
  try {
    const { startDate, endDate, courseId, type, status } = req.query;
    
    const query = {
      teacher: req.params.id,
      status: status || { $ne: 'cancelled' }
    };

    if (startDate && endDate) {
      query.startAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (courseId) query.course = courseId;
    if (type) query.type = type;

    const sessions = await Session.find(query)
      .populate('course', 'name code')
      .populate('room', 'number building')
      .sort({ startAt: 1 });

    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/teachers/:id/schedule/bulk
// @desc    Bulk create sessions for teacher
// @access  Private/Admin
router.post('/:id/schedule/bulk', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { sessions } = req.body;
    
    if (!Array.isArray(sessions) || sessions.length === 0) {
      return res.status(400).json({ message: 'Sessions array is required' });
    }

    // Добавляем teacherId ко всем сессиям
    const sessionsWithTeacher = sessions.map(s => ({
      ...s,
      teacher: req.params.id,
      createdBy: req.user._id
    }));

    const createdSessions = await Session.insertMany(sessionsWithTeacher);
    res.status(201).json({ success: true, count: createdSessions.length, sessions: createdSessions });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
