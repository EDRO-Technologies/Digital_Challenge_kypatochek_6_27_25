# Security & Notification Update

This update includes comprehensive security fixes and Telegram bot notification improvements.

## Security Fixes Applied

### 1. Authentication & Authorization
- ✅ Removed hardcoded admin password (`P@ssw0rd`)
- ✅ Admin password now uses `ADMIN_PASSWORD` environment variable
- ✅ Added password strength validation (min 8 chars, uppercase, lowercase, numbers)
- ✅ Added webhook API key authentication (`WEBHOOK_API_KEY`)
- ✅ Enhanced JWT secret validation (min 32 characters)

### 2. Security Middleware
- ✅ Added Helmet.js for security headers (XSS, clickjacking protection)
- ✅ Added express-rate-limit for DoS protection:
  - 100 requests per 15 min for general API
  - 5 login attempts per 15 min
  - 30 webhook requests per minute
- ✅ Added express-validator for input sanitization

### 3. Dependency Updates
- ✅ Updated `node-telegram-bot-api` to v0.66.0
- ✅ Added security packages: helmet, express-rate-limit, express-validator

### 4. Error Handling
- ✅ Stack traces hidden in production (`NODE_ENV=production`)
- ✅ Sanitized error messages to prevent information leakage

### 5. Database Security
- ✅ Added MongoDB URI validation
- ✅ Enhanced connection options for security

## Telegram Notification Improvements

### Automatic Notifications
The system now automatically sends Telegram notifications for:
- 📅 New sessions created
- ❌ Sessions cancelled
- 🚪 Room changes
- 👨‍🏫 Teacher changes
- 🕐 Time/schedule changes
- ℹ️ Status changes

### Features
- ✅ Retry logic with exponential backoff (3 attempts)
- ✅ Notification queue to prevent API rate limits
- ✅ Rich HTML formatting with emojis
- ✅ Delivery status tracking
- ✅ Respects user notification preferences

## Setup Instructions

### 1. Update Environment Variables

Create or update your `.env` file with these **required** variables:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/schedule-db

# JWT (minimum 32 characters)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_EXPIRES_IN=7d

# Admin Password (min 8 chars, must have uppercase, lowercase, numbers)
ADMIN_PASSWORD=YourSecureP@ssw0rd123

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-from-botfather

# Webhook API Key (minimum 32 characters)
WEBHOOK_API_KEY=generate-a-random-32-char-string-here-use-openssl

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 2. Generate Secure Keys

Use these commands to generate secure random keys:

```bash
# Generate JWT_SECRET (64 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate WEBHOOK_API_KEY (64 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Install Dependencies

```bash
cd schelude-backend
npm install
```

### 4. Start the Server

```bash
npm run dev
```

The server will:
- Validate all environment variables on startup
- Refuse to start if any are missing or weak
- Display validation errors with specific requirements

## API Changes

### Login Endpoint

**Before:**
```json
{
  "email": "admin",
  "password": "P@ssw0rd"
}
```

**After:**
```json
{
  "username": "admin",
  "password": "<value-from-ADMIN_PASSWORD-env>"
}
```

### Webhook Endpoint

**Before:** Public endpoint, no authentication

**After:** Requires API key in header

```bash
curl -X POST http://localhost:5000/api/webhooks/telegram/send-alert \
  -H "X-API-Key: your-webhook-api-key" \
  -H "Content-Type: application/json" \
  -d '{"message": "Test", "telegramId": "123456"}'
```

Or use Bearer token:
```bash
curl -X POST http://localhost:5000/api/webhooks/telegram/send-alert \
  -H "Authorization: Bearer your-webhook-api-key" \
  -H "Content-Type: application/json" \
  -d '{"message": "Test", "telegramId": "123456"}'
```

## Security Notes

### Environment Variable Requirements

- `JWT_SECRET`: Must be ≥32 characters
- `ADMIN_PASSWORD`: Must be ≥8 characters with uppercase, lowercase, and numbers
- `WEBHOOK_API_KEY`: Must be ≥32 characters

### Rate Limits

- **General API**: 100 requests per 15 minutes per IP
- **Login**: 5 attempts per 15 minutes per IP
- **Webhooks**: 30 requests per minute per IP

### Production Checklist

- [ ] Set `NODE_ENV=production` to hide stack traces
- [ ] Use strong, randomly generated secrets (see commands above)
- [ ] Configure MongoDB with authentication
- [ ] Use HTTPS in production
- [ ] Set proper `FRONTEND_URL` for CORS
- [ ] Keep the `WEBHOOK_API_KEY` secret and secure

## Known Issues

### npm audit Vulnerabilities

The project currently has 6 vulnerabilities (2 critical, 4 moderate) in the `node-telegram-bot-api` dependency chain:

- **form-data** <2.5.4 - Uses unsafe random function
- **tough-cookie** <4.1.3 - Prototype pollution

These are transitive dependencies from `node-telegram-bot-api@0.66.0`. Running `npm audit fix --force` would downgrade to v0.63.0 (breaking change).

**Mitigation**: These vulnerabilities are in the request library used by the Telegram bot API, which is only used server-side for outgoing requests. The risk is minimal in this context.

## Testing

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "YourSecureP@ssw0rd123"}'
```

### Test Webhook
```bash
curl -X POST http://localhost:5000/api/webhooks/telegram/send-alert \
  -H "X-API-Key: your-webhook-api-key" \
  -H "Content-Type: application/json" \
  -d '{"message": "<b>Test</b> message", "telegramId": "123456"}'
```

### Test Notification Trigger

Create, update, or cancel a session through the admin panel - affected users should receive Telegram notifications automatically.

## Support

For issues or questions, please check:
- `.env.example` for environment variable examples
- Server logs for validation errors on startup
- `npm run dev` output for detailed error messages
