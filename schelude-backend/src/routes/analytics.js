const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const analyticsService = require('../services/analyticsService');

// Helper to get date range
const getDateRange = (req) => {
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate ? new Date(endDate) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
  return { start, end };
};

// @route   GET /api/analytics/room-utilization
// @desc    Get room utilization statistics
// @access  Private (admin only)
router.get('/room-utilization', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { start, end } = getDateRange(req);
    const data = await analyticsService.getRoomUtilization(start, end);
    res.json({ success: true, data, startDate: start, endDate: end });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/analytics/teacher-load
// @desc    Get teacher workload statistics
// @access  Private (admin only)
router.get('/teacher-load', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { start, end } = getDateRange(req);
    const data = await analyticsService.getTeacherLoad(start, end);
    res.json({ success: true, data, startDate: start, endDate: end });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/analytics/session-types
// @desc    Get session type distribution
// @access  Private (admin only)
router.get('/session-types', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { start, end } = getDateRange(req);
    const data = await analyticsService.getSessionTypeStats(start, end);
    res.json({ success: true, data, startDate: start, endDate: end });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/analytics/conflicts
// @desc    Find scheduling conflicts
// @access  Private (admin only)
router.get('/conflicts', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { start, end } = getDateRange(req);
    const data = await analyticsService.findConflicts(start, end);
    res.json({ success: true, conflicts: data, count: data.length, startDate: start, endDate: end });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
