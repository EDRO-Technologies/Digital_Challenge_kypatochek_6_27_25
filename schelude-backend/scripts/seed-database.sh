#!/bin/bash

# Скрипт для наполнения базы данных тестовыми данными
# Запускайте после того как MongoDB и backend уже запущены

BASE_URL="http://localhost:3000/api"

echo "🌱 Начинаем наполнение базы данных..."

# Шаг 1: Создать администратора
echo "\n1️⃣ Создание администратора..."
ADMIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Администратор Системы",
    "email": "admin@surgu.ru",
    "password": "admin123",
    "role": "admin"
  }')

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "✅ Администратор создан. Токен: ${ADMIN_TOKEN:0:20}..."

# Шаг 2: Создать преподавателя
echo "\n2️⃣ Создание преподавателя..."
TEACHER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Петров Петр Петрович",
    "email": "petrov@surgu.ru",
    "password": "teacher123",
    "role": "teacher"
  }')

TEACHER_ID=$(echo $TEACHER_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "✅ Преподаватель создан. ID: $TEACHER_ID"

# Шаг 3: Создать студента через Telegram
echo "\n3️⃣ Создание студента (симуляция Telegram)..."
STUDENT_RESPONSE=$(curl -s -X POST $BASE_URL/auth/telegram-init \
  -H "Content-Type: application/json" \
  -d '{
    "telegramId": "999888777",
    "groupNumber": "ИС-21-1",
    "name": "Иванов Иван"
  }')

echo "✅ Студент создан для группы ИС-21-1"

# Шаг 4: Создать аудитории
echo "\n4️⃣ Создание аудиторий..."
ROOM1_RESPONSE=$(curl -s -X POST $BASE_URL/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "number": "401",
    "building": "Корпус А",
    "capacity": 50,
    "floor": 4,
    "type": "lecture",
    "equipment": ["projector", "whiteboard"]
  }')

ROOM1_ID=$(echo $ROOM1_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

ROOM2_RESPONSE=$(curl -s -X POST $BASE_URL/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "number": "305",
    "building": "Корпус Б",
    "capacity": 30,
    "floor": 3,
    "type": "lab",
    "equipment": ["computer", "projector"]
  }')

ROOM2_ID=$(echo $ROOM2_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

echo "✅ Создано 2 аудитории: А-401, Б-305"

# Шаг 5: Создать курс
echo "\n5️⃣ Создание курса..."
COURSE_RESPONSE=$(curl -s -X POST $BASE_URL/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"name\": \"Базы данных\",
    \"code\": \"BD-301\",
    \"department\": \"ИВТ\",
    \"direction\": \"Информационные системы\",
    \"credits\": 4,
    \"semester\": 5,
    \"maxStudents\": 30,
    \"teachers\": [\"$TEACHER_ID\"],
    \"description\": \"Курс по проектированию и разработке баз данных\"
  }")

COURSE_ID=$(echo $COURSE_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "✅ Курс создан. ID: $COURSE_ID"

# Шаг 6: Создать занятия (на следующую неделю)
echo "\n6️⃣ Создание занятий..."

# Получаем дату через неделю в формате ISO
NEXT_WEEK=$(date -u -d '+7 days 09:00' +"%Y-%m-%dT%H:%M:%S.000Z")
NEXT_WEEK_END=$(date -u -d '+7 days 10:30' +"%Y-%m-%dT%H:%M:%S.000Z")

SESSION1_RESPONSE=$(curl -s -X POST $BASE_URL/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"course\": \"$COURSE_ID\",
    \"startAt\": \"$NEXT_WEEK\",
    \"endAt\": \"$NEXT_WEEK_END\",
    \"room\": \"$ROOM1_ID\",
    \"teacher\": \"$TEACHER_ID\",
    \"groups\": [\"ИС-21-1\", \"ИС-21-2\"],
    \"type\": \"lecture\",
    \"notes\": \"Первая лекция по нормализации БД\"
  }")

SESSION1_ID=$(echo $SESSION1_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "✅ Занятие 1 создано. ID: $SESSION1_ID"

# Занятие 2 (через 8 дней)
NEXT_WEEK2=$(date -u -d '+8 days 14:00' +"%Y-%m-%dT%H:%M:%S.000Z")
NEXT_WEEK2_END=$(date -u -d '+8 days 15:30' +"%Y-%m-%dT%H:%M:%S.000Z")

SESSION2_RESPONSE=$(curl -s -X POST $BASE_URL/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"course\": \"$COURSE_ID\",
    \"startAt\": \"$NEXT_WEEK2\",
    \"endAt\": \"$NEXT_WEEK2_END\",
    \"room\": \"$ROOM2_ID\",
    \"teacher\": \"$TEACHER_ID\",
    \"groups\": [\"ИС-21-1\"],
    \"type\": \"lab\",
    \"notes\": \"Лабораторная работа по SQL\"
  }")

SESSION2_ID=$(echo $SESSION2_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "✅ Занятие 2 создано. ID: $SESSION2_ID"

echo "\n✨ База данных успешно наполнена!\n"
echo "📊 Создано:"
echo "  - 1 администратор (admin@surgu.ru / admin123)"
echo "  - 1 преподаватель (petrov@surgu.ru / teacher123)"
echo "  - 1 студент через Telegram (группа ИС-21-1)"
echo "  - 2 аудитории (А-401, Б-305)"
echo "  - 1 курс (Базы данных)"
echo "  - 2 занятия (лекция и лабораторная)"
echo "\n🔑 Токен администратора:"
echo "$ADMIN_TOKEN"
echo "\n💡 Теперь можете тестировать Telegram бота!"
echo "   Отправьте /start боту и укажите группу: ИС-21-1"
