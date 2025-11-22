const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const Room = require('../models/Room');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/rooms
// @desc    Get all rooms
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { building, type, isActive, search } = req.query;

    const query = {};
    if (building) query.building = building;
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { number: { $regex: search, $options: 'i' } },
        { building: { $regex: search, $options: 'i' } }
      ];
    }

    const rooms = await Room.find(query).sort({ building: 1, number: 1 });

    res.json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/rooms/:id
// @desc    Get room by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json({ success: true, room });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/rooms
// @desc    Create new room
// @access  Private/Admin
router.post('/', protect, authorize('admin', 'superadmin'), [
  body('number').notEmpty().withMessage('Room number is required'),
  body('building').notEmpty().withMessage('Building is required'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1')
], async (req, res) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json({ success: true, room });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Room with this number already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/rooms/:id
// @desc    Update room
// @access  Private/Admin
router.put('/:id', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json({ success: true, room });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/rooms/:id
// @desc    Delete room
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
