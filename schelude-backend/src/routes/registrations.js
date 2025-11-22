const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Session = require('../models/Session');
const Course = require('../models/Course');
const { protect } = require('../middleware/auth');

// @route   POST /api/sessions/:id/register
// @desc    Register for a session
// @access  Private
router.post('/:id/register', protect, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const { guestName, guestGroup } = req.body;

    // Check if session exists
    const session = await Session.findById(sessionId).populate('course');
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if session is cancelled
    if (session.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot register for cancelled session' });
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({
      session: sessionId,
      user: req.user.id
    });

    if (existingRegistration) {
      return res.status(400).json({ message: 'Already registered for this session' });
    }

    // Check quota if exists
    if (session.course.maxStudents) {
      const registrationCount = await Registration.countDocuments({
        session: sessionId,
        status: { $ne: 'cancelled' }
      });

      if (registrationCount >= session.course.maxStudents) {
        return res.status(400).json({ message: 'Session is full' });
      }
    }

    // Create registration
    const registration = await Registration.create({
      session: sessionId,
      user: req.user.id,
      guestName,
      guestGroup,
      registrationType: guestName ? 'guest' : 'user',
      status: 'registered'
    });

    await registration.populate('session user');

    res.status(201).json({ success: true, registration });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/sessions/:id/register
// @desc    Unregister from a session
// @access  Private
router.delete('/:id/register', protect, async (req, res) => {
  try {
    const sessionId = req.params.id;

    const registration = await Registration.findOneAndDelete({
      session: sessionId,
      user: req.user.id
    });

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    res.json({ success: true, message: 'Unregistered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/sessions/:id/participants
// @desc    Get session participants
// @access  Private
router.get('/:id/participants', protect, async (req, res) => {
  try {
    const sessionId = req.params.id;

    const registrations = await Registration.find({ session: sessionId })
      .populate('user', 'name email groupNumber')
      .sort({ registeredAt: 1 });

    res.json({ success: true, registrations, count: registrations.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/registrations/my
// @desc    Get current user's registrations
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    const { status, upcoming } = req.query;

    const query = { user: req.user.id };
    if (status) query.status = status;

    const registrations = await Registration.find(query)
      .populate({
        path: 'session',
        populate: [
          { path: 'course', select: 'name code' },
          { path: 'teacher', select: 'name' },
          { path: 'room', select: 'number building' }
        ]
      })
      .sort({ 'session.startAt': 1 });

    // Filter upcoming if requested
    let filteredRegistrations = registrations;
    if (upcoming === 'true') {
      const now = new Date();
      filteredRegistrations = registrations.filter(r => 
        r.session && new Date(r.session.startAt) > now
      );
    }

    res.json({ success: true, registrations: filteredRegistrations });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
