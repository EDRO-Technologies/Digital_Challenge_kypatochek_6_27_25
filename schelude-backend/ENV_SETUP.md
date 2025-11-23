# Environment Setup Guide

## MongoDB Configuration

### Required Environment Variables

```bash
# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/schedule

# For production with authentication and replica set:
# MONGODB_URI=mongodb://user:password@host1:27017,host2:27017,host3:27017/schedule?replicaSet=rs0&retryWrites=true&w=majority&maxPoolSize=10
```

### Optional MongoDB Settings

```bash
# IP Family: 4 for IPv4, 6 for IPv6 (default: 4)
MONGODB_IP_FAMILY=4

# Enable detailed database logging
DEBUG_DB=false
```

### Production Connection String Example

**For MongoDB Atlas:**
```
mongodb+srv://username:password@cluster.mongodb.net/schedule?retryWrites=true&w=majority
```

**For self-hosted with replica set:**
```
mongodb://user:pass@host1:27017,host2:27017,host3:27017/schedule?replicaSet=rs0&retryWrites=true&w=majority&maxPoolSize=10&authSource=admin
```

**Important parameters:**
- `retryWrites=true` - Automatic retry for write operations
- `w=majority` - Write concern for durability
- `maxPoolSize=10` - Limit connection pool size
- `authSource=admin` - Authentication database (if different from app database)

## Server Configuration

```bash
# Server Port
PORT=5000

# Node Environment
NODE_ENV=production

# Frontend URL for CORS
FRONTEND_URL=https://your-frontend-domain.com
```

## Authentication

```bash
# JWT Secret (generate a secure random string!)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# JWT Expiration (optional, default: 24h)
JWT_EXPIRES_IN=24h
```

## Telegram Bot

```bash
# Telegram Bot Token from @BotFather
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# Webhook URL (for production)
TELEGRAM_BOT_WEBHOOK_URL=https://your-backend-domain.com/api/webhooks/telegram
```

## AI Assistant (LM Studio)

```bash
# LM Studio API URL
LM_STUDIO_URL=http://localhost:1234/v1/chat/completions

# AI Model name
AI_MODEL=qwen/qwen3-vl-4b
```

## Complete `.env` Template

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/schedule
MONGODB_IP_FAMILY=4

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Authentication
JWT_SECRET=change-this-to-a-secure-random-string-minimum-32-characters
JWT_EXPIRES_IN=24h

# Telegram
TELEGRAM_BOT_TOKEN=your-bot-token-here
TELEGRAM_BOT_WEBHOOK_URL=https://your-domain.com/api/webhooks/telegram

# AI Assistant
LM_STUDIO_URL=http://localhost:1234/v1/chat/completions
AI_MODEL=qwen/qwen3-vl-4b

# Debug
DEBUG_DB=false
DEBUG_NOTIFICATIONS=false
```

## Security Best Practices

1. **Never commit `.env` file to version control**
2. **Use strong, randomly generated JWT_SECRET** (minimum 32 characters)
3. **Enable MongoDB authentication in production**
4. **Use HTTPS for production deployments**
5. **Restrict CORS to specific domains in production**
6. **Use MongoDB Atlas or replica sets for high availability**
7. **Enable MongoDB audit logging for production**
8. **Regularly rotate credentials**

## Troubleshooting MongoDB Connection

### Connection keeps dropping:
1. Check if MongoDB server is running
2. Verify network connectivity
3. Check MongoDB logs for errors
4. Ensure firewall allows connections
5. Verify connection string format
6. Check MongoDB server version compatibility (requires 4.0+)

### High connection count:
1. Check `maxPoolSize` setting (default: 10)
2. Monitor slow queries with MongoDB profiler
3. Add database indexes for frequently queried fields
4. Consider connection pooling at application level

### Authentication errors:
1. Verify username/password in connection string
2. Check `authSource` parameter
3. Ensure user has proper roles (readWrite minimum)
4. URL-encode special characters in password
