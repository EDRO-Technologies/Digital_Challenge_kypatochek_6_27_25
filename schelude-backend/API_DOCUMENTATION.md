# API Documentation - Smart University Schedule System

Complete API reference for the backend system.

## Base URL
```
http://localhost:3000/api
```

## Authentication
Include JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints Summary

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/telegram-init` - Initialize from Telegram
- `POST /auth/guest` - Create guest user

### Users
- `GET /users/me` - Get current user
- `PATCH /users/me` - Update profile
- `PATCH /users/group` - Change group
- `GET /users` - List users (admin)

### Rooms
- `GET /rooms` - List rooms
- `POST /rooms` - Create room (admin)
- `PUT /rooms/:id` - Update room (admin)
- `DELETE /rooms/:id` - Delete room (admin)

### Courses
- `GET /courses` - List courses
- `POST /courses` - Create course (admin)
- `PUT /courses/:id` - Update course (admin)
- `DELETE /courses/:id` - Delete course (admin)

### Sessions
- `GET /sessions` - List sessions
- `POST /sessions` - Create session (admin)
- `PUT /sessions/:id` - Update session (admin)
- `PATCH /sessions/:id/status` - Update status (admin)
- `DELETE /sessions/:id` - Delete session (admin)

### Schedule
- `GET /schedule/group/:groupNumber/today` - Today's schedule
- `GET /schedule/group/:groupNumber/tomorrow` - Tomorrow's schedule
- `GET /schedule/group/:groupNumber/week` - Week's schedule
- `GET /schedule/my/upcoming` - My upcoming sessions

### Registrations
- `POST /sessions/:id/register` - Register for session
- `DELETE /sessions/:id/register` - Unregister
- `GET /sessions/:id/participants` - Get participants
- `GET /registrations/my` - My registrations

### Notifications
- `GET /notifications` - List notifications (admin)
- `GET /notifications/my` - My notifications

### Webhooks
- `POST /webhooks/telegram/send-alert` - Send Telegram alert

See full examples in the route files.