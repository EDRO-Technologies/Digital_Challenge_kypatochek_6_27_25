# Smart University Schedule Management System

**Умное расписание** - система управления расписанием университета с автоматическими уведомлениями через Telegram.

## 🚀 Features

- ✅ Управление пользователями, аудиториями, курсами и занятиями
- ✅ Проверка конфликтов расписания (аудитория, преподаватель, группа)
- ✅ Правило 5 часов - запрет редактирования за 5 часов до начала
- ✅ История изменений занятий
- ✅ Автоматические уведомления в Telegram
- ✅ Telegram бот для просмотра расписания
- ✅ REST API с JWT авторизацией
- ✅ Роли: guest, student, teacher, admin, superadmin

## 🛠 Tech Stack

**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs для хеширования паролей

**Telegram Bot:**
- Python 3.11+
- Aiogram 3.x
- FSM для управления состояниями

## 📋 Prerequisites

- Node.js 18+ LTS
- MongoDB 6+
- Python 3.11+ (для Telegram бота)
- Telegram Bot Token (от @BotFather)

## 🔧 Installation

### 1. Clone Repository

```bash
git clone https://github.com/SurGU-schelude/schelude-backend.git
cd schelude-backend
```

### 2. Backend Setup

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your settings
nano .env
```

**Configure `.env`:**

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/schedule-db
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=7d
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_WEBHOOK_URL=http://localhost:3000/api/webhooks/telegram
FRONTEND_URL=http://localhost:5173
```

### 3. Start MongoDB

**Вариант 1: Docker (если установлен):**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Вариант 2: Локальная установка:**

**Linux (Ubuntu/Debian):**
```bash
# Установка
sudo apt-get update
sudo apt-get install -y mongodb-org

# Запуск
sudo systemctl start mongod
sudo systemctl enable mongod  # Автозапуск при перезагрузке

# Проверка статуса
sudo systemctl status mongod
```

**macOS:**
```bash
# Установка через Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Запуск
brew services start mongodb-community

# Проверка
brew services list
```

**Windows:**
1. Скачайте установщик: https://www.mongodb.com/try/download/community
2. Установите MongoDB как Windows Service
3. Запустите из Services (services.msc) или:
```cmd
net start MongoDB
```

**Проверка подключения:**
```bash
mongosh --eval "db.version()" || mongo --eval "db.version()"
```

### 4. Run Backend

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Backend will run on `http://localhost:3000`

### 5. Telegram Bot Setup

```bash
cd telegram_bot

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
nano .env
```

**Configure `telegram_bot/.env`:**

```env
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
BACKEND_URL=http://localhost:3000/api
```

### 6. Run Telegram Bot

```bash
python bot.py
```

## 📚 API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

### Quick Start

**1. Register Admin User:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@university.edu",
    "password": "securePassword123",
    "role": "admin",
    "groupNumber": "ADMIN"
  }'
```

**2. Login:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@university.edu",
    "password": "securePassword123"
  }'
```

Save the token from response.

**3. Create a Room:**

```bash
curl -X POST http://localhost:3000/api/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "number": "401",
    "building": "A",
    "capacity": 50,
    "floor": 4,
    "type": "lecture"
  }'
```

## 🏗 Project Structure

```
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── models/
│   │   ├── User.js              # User model
│   │   ├── Room.js              # Room model
│   │   ├── Course.js            # Course model
│   │   ├── Session.js           # Session model
│   │   ├── Registration.js      # Registration model
│   │   └── Notification.js      # Notification model
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   └── errorHandler.js      # Error handling
│   ├── services/
│   │   ├── conflictService.js   # Conflict detection
│   │   └── notificationService.js # Notifications
│   ├── routes/
│   │   ├── auth.js              # Auth routes
│   │   ├── users.js             # User routes
│   │   ├── rooms.js             # Room routes
│   │   ├── courses.js           # Course routes
│   │   ├── sessions.js          # Session routes
│   │   ├── registrations.js     # Registration routes
│   │   ├── schedule.js          # Schedule routes
│   │   ├── webhooks.js          # Webhook routes
│   │   └── notifications.js     # Notification routes
│   ├── utils/
│   │   └── tokenUtils.js        # JWT utilities
│   └── server.js                # Express app
├── telegram_bot/
│   ├── bot.py                   # Telegram bot (Aiogram)
│   ├── requirements.txt         # Python dependencies
│   └── .env.example             # Bot env template
├── .env.example
├── .gitignore
├── package.json
├── API_DOCUMENTATION.md
└── README.md
```

## 🔐 User Roles

- **guest** - Пользователь из Telegram без регистрации
- **student** - Зарегистрированный студент
- **teacher** - Преподаватель
- **admin** - Администратор (может создавать занятия)
- **superadmin** - Суперадмин (может игнорировать правило 5 часов)

## 📱 Telegram Bot Commands

- `/start` - Начать работу с ботом
- **📅 Мои пары** - Расписание на сегодня
- **🔜 Завтра** - Расписание на завтра
- **📆 На неделю** - Расписание на неделю
- **🔄 Сменить группу** - Изменить номер группы
- **⚙️ Настройки** - Настройки уведомлений

## ⚡ Business Rules

### 5-Hour Rule
Администратор **не может** редактировать или удалять занятие за 5 часов до начала.
- ✅ Superadmin может игнорировать это правило
- ❌ При попытке редактирования возвращается `403 Forbidden`

### Conflict Detection
При создании/изменении занятия система проверяет:
1. **Аудитория не занята** в это время
2. **Преподаватель свободен**
3. **У группы нет другого занятия**

Возвращается `409 Conflict` с деталями конфликта.

### Mandatory Cancellation Comment
При отмене занятия **обязательно** указать причину:
```json
{
  "status": "cancelled",
  "comment": "Преподаватель заболел"  // Required!
}
```

### Change History
Все изменения занятий сохраняются в истории:
- Кто изменил
- Когда изменил
- Что изменилось
- Комментарий

## 🔔 Notifications

### Trigger Events:
- Занятие создано
- Занятие перенесено
- Занятие отменено
- Изменена аудитория
- Изменен преподаватель
- Изменено время

### Notification Flow:
1. Backend определяет затронутые группы
2. Находит всех студентов этих групп
3. Фильтрует по настройкам уведомлений
4. Отправляет webhook боту
5. Бот рассылает уведомления

## 🧪 Testing

```bash
# Health check
curl http://localhost:3000/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "uptime": 123.45
}
```

## 🚀 Deployment

### Production Checklist

- [ ] Change `JWT_SECRET` to strong random string
- [ ] Set `NODE_ENV=production`
- [ ] Use production MongoDB (MongoDB Atlas)
- [ ] Configure CORS for your frontend domain
- [ ] Set up HTTPS
- [ ] Configure webhook URL for Telegram
- [ ] Set up monitoring (PM2, logs)
- [ ] Configure backup for MongoDB

### Example with PM2

```bash
npm install -g pm2

# Start backend
pm2 start src/server.js --name schedule-backend

# Start telegram bot
cd telegram_bot
pm2 start bot.py --name schedule-bot --interpreter python3

# Monitor
pm2 monit

# Logs
pm2 logs schedule-backend
```

## 📝 License

ISC

## 👥 Contributors

SurGU Schedule Team

## 📞 Support

For issues and questions:
- GitHub Issues: https://github.com/SurGU-schelude/schelude-backend/issues
- Email: support@university.edu
