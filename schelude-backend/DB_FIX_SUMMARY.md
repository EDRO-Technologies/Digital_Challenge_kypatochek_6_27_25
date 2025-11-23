# Database Connection Fixes - Summary

## Проблема
База данных отваливалась через некоторое время работы сервера.

## Причины
1. ❌ Отсутствие автоматического переподключения при разрыве связи
2. ❌ Слишком короткие таймауты (5 секунд)
3. ❌ Отсутствие настроек connection pool
4. ❌ Нет heartbeat мониторинга
5. ❌ Нет graceful shutdown
6. ❌ Неправильная обработка ошибок

## Исправления

### 1. Автоматическое переподключение (`database.js`)
```javascript
// При отключении - автоматический reconnect через 5 секунд
mongoose.connection.on('disconnected', () => {
  if (!isReconnecting) {
    isReconnecting = true;
    setTimeout(() => connectDB(), 5000);
  }
});
```

### 2. Connection Pool
```javascript
maxPoolSize: 10,      // Максимум соединений
minPoolSize: 2,       // Минимум соединений
maxIdleTimeMS: 300000 // Закрывать idle соединения через 5 минут
```

### 3. Увеличенные таймауты
```javascript
serverSelectionTimeoutMS: 30000, // 30 секунд (было 5)
connectTimeoutMS: 30000,          // 30 секунд
socketTimeoutMS: 0                // Отключен (управляется TCP)
```

### 4. Heartbeat мониторинг
```javascript
heartbeatFrequencyMS: 10000 // Проверка каждые 10 секунд
```

### 5. Retry логика
```javascript
retryWrites: true,  // Автоматический повтор записей
retryReads: true    // Автоматический повтор чтений
```

### 6. Graceful Shutdown (`server.js`)
```javascript
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

### 7. Buffering при потере соединения
```javascript
bufferCommands: true,
bufferMaxEntries: 0 // Неограниченная буферизация команд
```

## Новые опциональные переменные окружения

```bash
# IP Family для MongoDB (4 = IPv4, 6 = IPv6)
MONGODB_IP_FAMILY=4

# Детальное логирование БД
DEBUG_DB=false
```

## Production Connection String

**MongoDB Atlas:**
```
mongodb+srv://user:pass@cluster.mongodb.net/schedule?retryWrites=true&w=majority
```

**Self-hosted с replica set:**
```
mongodb://user:pass@host1:27017,host2:27017,host3:27017/schedule?replicaSet=rs0&retryWrites=true&w=majority&maxPoolSize=10&authSource=admin
```

## События подключения

Теперь логируются все события:
- ✅ `connected` - Установлено подключение
- ✅ `disconnected` - Разорвано подключение (запускается reconnect)
- ✅ `reconnected` - Успешное переподключение
- ✅ `error` - Ошибка подключения

## Тестирование

1. **Проверить автоматическое переподключение:**
   - Запустить сервер
   - Остановить MongoDB
   - Проверить логи (должно быть сообщение о reconnect)
   - Запустить MongoDB
   - Убедиться, что соединение восстановлено

2. **Проверить graceful shutdown:**
   ```bash
   npm start
   # Нажать Ctrl+C
   # Должны увидеть: "SIGINT received. Starting graceful shutdown..."
   ```

3. **Проверить heartbeat:**
   - В логах должны появляться периодические проверки соединения

## Файлы изменены

1. ✅ `schelude-backend/src/config/database.js` - Основные исправления
2. ✅ `schelude-backend/src/server.js` - Graceful shutdown
3. ✅ `knowledge.md` - Документация
4. ✅ `schelude-backend/ENV_SETUP.md` - Руководство по настройке (новый файл)

## Мониторинг

Для мониторинга состояния БД в production рекомендуется:

1. Настроить алерты на события `disconnected`
2. Отслеживать количество активных соединений в pool
3. Мониторить время ответа MongoDB
4. Настроить логирование slow queries

## Дополнительные рекомендации

1. ✅ Использовать MongoDB Atlas или replica set для высокой доступности
2. ✅ Включить аутентификацию в production
3. ✅ Регулярно обновлять драйвер mongoose
4. ✅ Настроить индексы для часто используемых запросов
5. ✅ Использовать read preference для распределения нагрузки (при replica set)

## Контрольный список перед деплоем

- [ ] `MONGODB_URI` настроен правильно
- [ ] Включена аутентификация MongoDB
- [ ] Настроен connection string с `retryWrites=true&w=majority`
- [ ] Проверены лимиты соединений на MongoDB сервере
- [ ] Настроен мониторинг и алертинг
- [ ] Протестировано автоматическое переподключение
- [ ] Настроены индексы БД
- [ ] Проверен graceful shutdown
