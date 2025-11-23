# Backend Scripts

## create-admin.js

Создает администратора с полными правами.

**Учетные данные:**
- Email: `admin`
- Password: `P@ssw0rd`
- Role: `admin`

**Использование:**

```bash
# Создать нового администратора
node scripts/create-admin.js

# Обновить пароль существующего администратора
node scripts/create-admin.js --force
```

**Примечание:** Скрипт автоматически хеширует пароль перед сохранением.

## enable-notifications.js

Включает уведомления для всех пользователей.

```bash
# Предварительный просмотр (dry-run)
node scripts/enable-notifications.js --dry-run

# Применить изменения
node scripts/enable-notifications.js
```

## test-notifications.js

Диагностика системы уведомлений.

```bash
node scripts/test-notifications.js
```

## seed-database.sh

Наполнение базы данных тестовыми данными.

```bash
bash scripts/seed-database.sh
```

Создает:
- Администратора (admin@surgu.ru / admin123)
- Преподавателя (petrov@surgu.ru / teacher123)
- Студента через Telegram
- 2 аудитории
- 1 курс
- 2 занятия
