const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const aiService = require('../services/aiService');

// @route   POST /api/ai/chat
// @desc    Chat with AI assistant (admin only)
// @access  Private (admin)
router.post('/chat', protect, authorize('admin'), async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'Сообщение обязательно' });
    }

    const response = await aiService.processAdminQuery(message);

    res.json({
      success: true,
      response
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ 
      message: 'Ошибка при обработке запроса к AI',
      error: error.message 
    });
  }
});

// @route   GET /api/ai/context
// @desc    Get schedule context (admin only)
// @access  Private (admin)
router.get('/context', protect, authorize('admin'), async (req, res) => {
  try {
    const { date, groupNumber, teacherId, roomId } = req.query;

    const sessions = await aiService.getScheduleContext({
      date: date ? new Date(date) : undefined,
      groupNumber,
      teacherId,
      roomId
    });

    res.json({
      success: true,
      sessions,
      formatted: aiService.formatScheduleForAI(sessions)
    });
  } catch (error) {
    console.error('Get context error:', error);
    res.status(500).json({ message: 'Ошибка при получении контекста' });
  }
});

// @route   GET /api/ai/available-rooms
// @desc    Get available rooms for specific time (admin only)
// @access  Private (admin)
router.get('/available-rooms', protect, authorize('admin'), async (req, res) => {
  try {
    const { date, pairNumber } = req.query;

    if (!date || !pairNumber) {
      return res.status(400).json({ message: 'Дата и номер пары обязательны' });
    }

    const rooms = await aiService.getAvailableRooms(date, parseInt(pairNumber));

    res.json({
      success: true,
      rooms
    });
  } catch (error) {
    console.error('Get available rooms error:', error);
    res.status(500).json({ message: 'Ошибка при получении свободных аудиторий' });
  }
});

module.exports = router;
