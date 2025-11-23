const validateEnv = () => {
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'ADMIN_PASSWORD',
    'WEBHOOK_API_KEY'
  ];

  const missing = [];
  const weak = [];

  // Check for missing variables
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please set these in your .env file or environment configuration.'
    );
  }

  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET.length < 32) {
    weak.push('JWT_SECRET (must be at least 32 characters)');
  }

  // Validate ADMIN_PASSWORD strength
  const password = process.env.ADMIN_PASSWORD;
  if (password.length < 8) {
    weak.push('ADMIN_PASSWORD (must be at least 8 characters)');
  } else if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    weak.push('ADMIN_PASSWORD (must contain uppercase, lowercase, and numbers)');
  }

  // Validate WEBHOOK_API_KEY strength
  if (process.env.WEBHOOK_API_KEY.length < 32) {
    weak.push('WEBHOOK_API_KEY (must be at least 32 characters)');
  }

  if (weak.length > 0) {
    throw new Error(
      `Weak security configuration detected:\n${weak.map(w => `  - ${w}`).join('\n')}\n` +
      'Please strengthen these values for production use.'
    );
  }

  console.log('✓ Environment variables validated successfully');
};

module.exports = { validateEnv };
