const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const { webhookAuth } = require('../middleware/auth');
const { validateWebhookAlert } = require('../middleware/validateRequest');
const { webhookLimiter } = require('../middleware/rateLimiter');

// @route   POST /api/webhooks/telegram/notification-status
// @desc    Webhook endpoint for Telegram bot to update notification delivery status
// @access  Protected (requires API key)
router.post('/telegram/notification-status', webhookLimiter, webhookAuth, async (req, res) => {
  try {
    const { notificationId, status, error } = req.body;

    if (!notificationId || !status) {
      return res.status(400).json({ message: 'notificationId and status are required' });
    }

    const updateData = {
      status,
      sentAt: status === 'sent' || status === 'delivered' ? new Date() : undefined,
      deliveredAt: status === 'delivered' ? new Date() : undefined
    };

    if (error) {
      updateData.error = error;
    }

    await Notification.findByIdAndUpdate(notificationId, updateData);

    res.json({ 
      success: true,
      message: 'Notification status updated'
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/webhooks/telegram/pending-notifications
// @desc    Get pending notifications for Telegram bot to process
// @access  Protected (requires API key)
router.get('/telegram/pending-notifications', webhookLimiter, webhookAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    const notifications = await Notification.find({
      channel: 'telegram',
      status: 'pending'
    })
    .limit(limit)
    .sort({ createdAt: 1 })
    .populate('recipients.users', 'telegramChatId telegramId name')
    .populate('session');

    res.json({ 
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/webhooks/telegram/register
// @desc    Register telegram chat ID for a user
// @access  Public
router.post('/telegram/register', async (req, res) => {
  try {
    const { telegramId, chatId, role, group, teacherId, name } = req.body;

    if (!telegramId || !chatId) {
      return res.status(400).json({ message: 'telegramId and chatId are required' });
    }

    // Find or create user
    let user = await User.findOne({ telegramId });

    if (!user) {
      // Create new user
      const userData = {
        name: name || 'Telegram User',
        telegramId,
        telegramChatId: chatId,
        role: role || 'guest',
        isActive: true
      };

      if (role === 'student') {
        if (req.body.groupNumber) {
          userData.groupNumber = req.body.groupNumber;
        } else if (group) {
          userData.groupNumber = group;
        }
      }

      user = await User.create(userData);
    } else {
      // Update existing user
      user.telegramChatId = chatId;
      if (role === 'student') {
        if (req.body.groupNumber) {
          user.groupNumber = req.body.groupNumber;
        } else if (group) {
          user.groupNumber = group;
        }
      }
      if (name) {
        user.name = name;
      }
      await user.save();
    }

    res.json({ 
      success: true, 
      message: 'Chat ID registered successfully',
      userId: user._id
    });
  } catch (error) {
    console.error('Registration error:', error);
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

// @route   DELETE /api/webhooks/telegram/user/:telegramId
// @desc    Delete user data by telegram ID (for role change)
// @access  Public (bot only)
router.delete('/telegram/user/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    
    const result = await User.deleteOne({ telegramId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   GET /api/webhooks/telegram/user/:telegramId
// @desc    Get user data by telegram ID
// @access  Public (bot only)
router.get('/telegram/user/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    
    const user = await User.findOne({ telegramId });
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Return user data for bot
    const userData = {
      success: true,
      user: {
        telegramId: user.telegramId,
        telegramChatId: user.telegramChatId,
        name: user.name,
        email: user.email,
        role: user.role,
        groupNumber: user.groupNumber,
        isActive: user.isActive
      }
    };
    
    res.json(userData);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

module.exports = router;
