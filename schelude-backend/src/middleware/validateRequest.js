const { body, validationResult } = require('express-validator');

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: errors.array() 
    });
  }
  next();
};

// Validation rules for webhook alert
const validateWebhookAlert = [
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ max: 4000 }).withMessage('Message too long'),
    // Note: Don't escape HTML as Telegram uses HTML formatting
  body('chatId')
    .optional()
    .trim()
    .matches(/^-?\d+$/).withMessage('Invalid chat ID format'),
  body('telegramId')
    .optional()
    .trim()
    .matches(/^\d+$/).withMessage('Invalid telegram ID format'),
  validate
];

// Validation rules for login
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isLength({ max: 100 }).withMessage('Email too long'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ max: 100 }).withMessage('Password too long'),
  validate
];

// Validation rules for user registration
const validateUserRegistration = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name too long'),
  validate
];

module.exports = {
  validate,
  validateWebhookAlert,
  validateLogin,
  validateUserRegistration
};
