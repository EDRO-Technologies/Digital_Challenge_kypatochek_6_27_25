const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// @route   POST /api/webhooks/telegram/send-alert
// @desc    Webhook endpoint for sending Telegram alerts (called by notification service)
// @access  Public (should be protected by API key in production)
router.post('/telegram/send-alert', async (req, res) => {
  try {
    const { telegramIds, message, notificationId } = req.body;

    if (!telegramIds || !message) {
      return res.status(400).json({ message: 'telegramIds and message are required' });
    }

    // In production, this would forward to your Telegram bot service
    // For now, we'll just log and return success
    console.log('Telegram Alert:');
    console.log('Recipients:', telegramIds);
    console.log('Message:', message);

    // Update notification status if provided
    if (notificationId) {
      await Notification.findByIdAndUpdate(notificationId, {
        status: 'delivered',
        deliveredAt: new Date()
      });
    }

    // Return success
    // The actual Telegram bot will handle sending messages
    res.json({ 
      success: true, 
      sent: telegramIds.length,
      message: 'Alert queued for delivery'
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/webhooks/telegram/status
// @desc    Check webhook status
// @access  Public
router.get('/telegram/status', (req, res) => {
  res.json({ 
    success: true, 
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
