const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const Session = require('../models/Session');
const Course = require('../models/Course');
const conflictService = require('../services/conflictService');
const { notifyScheduleChange } = require('../services/notificationService');
const { protect, authorize } = require('../middleware/auth');
const { pairToDateTime, getPairTime, getAllPairs } = require('../utils/pairSchedule');

// @route   GET /api/sessions
// @desc    Get sessions with filters
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { 
      course, 
      teacher, 
      room, 
      group, 
      status, 
      startDate, 
      endDate,
      page = 1,
      limit = 100
    } = req.query;

    const query = {};
    if (course) query.course = course;
    if (teacher) query.teacher = teacher;
    if (room) query.room = room;
    if (group) query.groups = group;
    if (status) query.status = status;
    
    if (startDate || endDate) {
      query.startAt = {};
      if (startDate) query.startAt.$gte = new Date(startDate);
      if (endDate) query.startAt.$lte = new Date(endDate);
    }

    const sessions = await Session.find(query)
      .populate('course', 'name code')
      .populate('teacher', 'name')
      .populate('room', 'number building')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ startAt: 1 });

    const count = await Session.countDocuments(query);

    res.json({
      success: true,
      sessions,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/sessions/:id
// @desc    Get session by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('course')
      .populate('teacher', 'name email contacts')
      .populate('room')
      .populate('createdBy', 'name')
      .populate('history.changedBy', 'name');
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/sessions/pairs
// @desc    Get all pair times
// @access  Public
router.get('/pairs', (req, res) => {
  res.json({ success: true, pairs: getAllPairs() });
});

// @route   POST /api/sessions
// @desc    Create new session
// @access  Private/Admin
router.post('/', protect, authorize('admin', 'superadmin'), [
  body('course').notEmpty().withMessage('Course is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('pairNumber').isInt({ min: 1, max: 8 }).withMessage('Pair number must be between 1 and 8'),
  body('room').notEmpty().withMessage('Room is required'),
  body('teacher').notEmpty().withMessage('Teacher is required'),
  body('groups').isArray({ min: 1 }).withMessage('At least one group is required')
], async (req, res) => {
  try {
    const { course, date, pairNumber, room, teacher, groups, type, notes } = req.body;
    
    // Convert pair number to actual times
    const { startAt, endAt } = pairToDateTime(new Date(date), pairNumber);

    // Validate time constraints
    const timeValidation = conflictService.validateTimeConstraints(startAt, endAt);
    if (!timeValidation.isValid) {
      return res.status(400).json({ 
        message: 'Invalid time constraints', 
        errors: timeValidation.errors 
      });
    }

    // Check for conflicts
    const conflicts = await conflictService.checkConflicts({
      room,
      teacher,
      groups,
      startAt,
      endAt
    });

    if (conflicts.hasConflict) {
      return res.status(409).json({ 
        message: 'Scheduling conflict detected', 
        conflicts 
      });
    }

    // Verify course exists
    const courseExists = await Course.findById(course);
    if (!courseExists) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Create session
    const session = await Session.create({
      course,
      pairNumber,
      startAt,
      endAt,
      room,
      teacher,
      groups,
      type: type || 'lecture',
      notes,
      createdBy: req.user.id,
      history: [{
        changeType: 'created',
        changedBy: req.user.id,
        changes: { created: true },
        comment: notes
      }]
    });

    // Populate session
    await session.populate('course teacher room');

    // Send notifications
    try {
      await notifyScheduleChange('session_created', session);
    } catch (notifError) {
      console.error('Notification error:', notifError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/sessions/:id
// @desc    Update session
// @access  Private/Admin
router.put('/:id', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('course teacher room');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check 5-hour rule
    const editCheck = conflictService.canEditSession(session, req.user.role);
    if (!editCheck.canEdit) {
      return res.status(403).json({ message: editCheck.reason });
    }

    const { startAt, endAt, room, teacher, groups, type, notes, status } = req.body;

    // If time is being changed, validate
    if (startAt || endAt) {
      const newStartAt = startAt || session.startAt;
      const newEndAt = endAt || session.endAt;

      const timeValidation = conflictService.validateTimeConstraints(newStartAt, newEndAt);
      if (!timeValidation.isValid) {
        return res.status(400).json({ 
          message: 'Invalid time constraints', 
          errors: timeValidation.errors 
        });
      }

      // Check for conflicts
      const conflicts = await conflictService.checkConflicts({
        room: room || session.room._id,
        teacher: teacher || session.teacher._id,
        groups: groups || session.groups,
        startAt: newStartAt,
        endAt: newEndAt
      }, session._id);

      if (conflicts.hasConflict) {
        return res.status(409).json({ 
          message: 'Scheduling conflict detected', 
          conflicts 
        });
      }
    }

    // Track changes for notifications
    const changes = {};
    let changeType = 'session_updated';

    if (startAt && startAt !== session.startAt.toISOString()) {
      changes.oldStartAt = session.startAt;
      changes.newStartAt = startAt;
      changeType = 'time_changed';
    }

    if (room && room !== session.room._id.toString()) {
      const oldRoom = session.room;
      const newRoom = await require('../models/Room').findById(room);
      changes.oldRoom = `${oldRoom.building} ${oldRoom.number}`;
      changes.newRoom = `${newRoom.building} ${newRoom.number}`;
      if (changeType === 'session_updated') changeType = 'room_changed';
    }

    if (teacher && teacher !== session.teacher._id.toString()) {
      const oldTeacher = session.teacher;
      const newTeacher = await require('../models/User').findById(teacher);
      changes.oldTeacher = oldTeacher.name;
      changes.newTeacher = newTeacher.name;
      if (changeType === 'session_updated') changeType = 'teacher_changed';
    }

    // Update session
    const updateData = {};
    if (startAt) updateData.startAt = startAt;
    if (endAt) updateData.endAt = endAt;
    if (room) updateData.room = room;
    if (teacher) updateData.teacher = teacher;
    if (groups) updateData.groups = groups;
    if (type) updateData.type = type;
    if (notes !== undefined) updateData.notes = notes;
    if (status) updateData.status = status;

    // Add to history
    session.addHistory(changeType, req.user.id, changes, notes);
    updateData.history = session.history;

    const updatedSession = await Session.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('course teacher room');

    // Send notifications
    try {
      await notifyScheduleChange(changeType, updatedSession, changes);
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    res.json({ success: true, session: updatedSession });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/sessions/:id/status
// @desc    Update session status (cancel, confirm, etc.)
// @access  Private/Admin
router.patch('/:id/status', protect, authorize('admin', 'superadmin'), [
  body('status').isIn(['planned', 'confirmed', 'moved', 'cancelled', 'online']).withMessage('Invalid status'),
  body('comment').if(body('status').equals('cancelled')).notEmpty().withMessage('Comment is required for cancellation')
], async (req, res) => {
  try {
    const { status, comment, onlineLink } = req.body;

    const session = await Session.findById(req.params.id)
      .populate('course teacher room');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check 5-hour rule
    const editCheck = conflictService.canEditSession(session, req.user.role);
    if (!editCheck.canEdit) {
      return res.status(403).json({ message: editCheck.reason });
    }

    const oldStatus = session.status;
    session.status = status;

    if (status === 'cancelled') {
      session.cancellationReason = comment;
    }

    if (status === 'online' && onlineLink) {
      session.onlineLink = onlineLink;
    }

    // Add to history
    session.addHistory(
      status === 'cancelled' ? 'session_cancelled' : 'status_changed',
      req.user.id,
      { oldStatus, newStatus: status },
      comment
    );

    await session.save();

    // Send notifications
    try {
      const changeType = status === 'cancelled' ? 'session_cancelled' : 'status_changed';
      await notifyScheduleChange(changeType, session, { oldStatus, newStatus: status });
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/sessions/:id
// @desc    Delete session
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('course teacher room');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check 5-hour rule
    const editCheck = conflictService.canEditSession(session, req.user.role);
    if (!editCheck.canEdit) {
      return res.status(403).json({ message: editCheck.reason });
    }

    // Send cancellation notifications before deletion
    try {
      await notifyScheduleChange('session_cancelled', session);
    } catch (notifError) {
      console.error('Notification error (non-critical):', notifError.message);
      // Continue with deletion even if notification fails
    }

    await Session.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
