const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const User = require('../models/User');
const { generateToken } = require('../utils/tokenUtils');
const { protect } = require('../middleware/auth');
const { validateLogin } = require('../middleware/validateRequest');
const bcrypt = require('bcryptjs');

// @route   POST /api/auth/login
// @desc    Login admin user only
// @access  Public
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token with user ID
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



module.exports = router;
