import os
import logging
import aiohttp
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, ReplyKeyboardRemove
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Bot configuration
BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:3000/api')

# Initialize bot and dispatcher
bot = Bot(token=BOT_TOKEN)
storage = MemoryStorage()
dp = Dispatcher(storage=storage)

# FSM States
class UserStates(StatesGroup):
    waiting_for_group = State()
    main_menu = State()
    changing_group = State()
    settings = State()

# Keyboards
def get_main_keyboard():
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📅 Мои пары"), KeyboardButton(text="🔜 Завтра")],
            [KeyboardButton(text="📆 На неделю"), KeyboardButton(text="⚙️ Настройки")],
            [KeyboardButton(text="🔄 Сменить группу")]
        ],
        resize_keyboard=True
    )
    return keyboard

def get_settings_keyboard():
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="🔔 Уведомления")],
            [KeyboardButton(text="👤 Профиль")],
            [KeyboardButton(text="◀️ Назад")]
        ],
        resize_keyboard=True
    )
    return keyboard

# API Helper Functions
async def init_user(telegram_id: int, group_number: str, name: str = None):
    """Initialize or update user via backend API"""
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(
                f'{BACKEND_URL}/auth/telegram-init',
                json={
                    'telegramId': str(telegram_id),
                    'groupNumber': group_number,
                    'name': name
                }
            ) as response:
                if response.status == 201:
                    data = await response.json()
                    return data.get('token'), data.get('user')
                else:
                    logger.error(f"Failed to init user: {response.status}")
                    return None, None
        except Exception as e:
            logger.error(f"Error initializing user: {e}")
            return None, None

async def get_schedule(token: str, group_number: str, period: str):
    """Get schedule from backend"""
    async with aiohttp.ClientSession() as session:
        try:
            headers = {'Authorization': f'Bearer {token}'}
            async with session.get(
                f'{BACKEND_URL}/schedule/group/{group_number}/{period}',
                headers=headers
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('sessions', []) if period != 'week' else data.get('schedule', {})
                return None
        except Exception as e:
            logger.error(f"Error getting schedule: {e}")
            return None

def format_session(session):
    """Format session for display"""
    from datetime import datetime
    
    course_name = session['course']['name']
    course_code = session['course']['code']
    teacher = session['teacher']['name']
    room = f"{session['room']['building']} {session['room']['number']}"
    
    start = datetime.fromisoformat(session['startAt'].replace('Z', '+00:00'))
    end = datetime.fromisoformat(session['endAt'].replace('Z', '+00:00'))
    
    time_str = f"{start.strftime('%H:%M')} - {end.strftime('%H:%M')}"
    
    type_emoji = {
        'lecture': '📖',
        'practice': '✏️',
        'lab': '🔬',
        'seminar': '💬',
        'exam': '📝'
    }.get(session.get('type', 'lecture'), '📚')
    
    return (
        f"{type_emoji} {course_name} ({course_code})\n"
        f"🕐 {time_str}\n"
        f"🏛 {room}\n"
        f"👨‍🏫 {teacher}"
    )

# Command Handlers
@dp.message(Command('start'))
async def cmd_start(message: types.Message, state: FSMContext):
    """Handle /start command"""
    await message.answer(
        "👋 Привет! Я бот для управления расписанием.\n\n"
        "Пожалуйста, укажите номер вашей группы (например, ИС-21-1):",
        reply_markup=ReplyKeyboardRemove()
    )
    await state.set_state(UserStates.waiting_for_group)

@dp.message(UserStates.waiting_for_group)
async def process_group_number(message: types.Message, state: FSMContext):
    """Process group number input"""
    group_number = message.text.strip()
    telegram_id = message.from_user.id
    name = message.from_user.full_name
    
    # Initialize user in backend
    token, user = await init_user(telegram_id, group_number, name)
    
    if token:
        # Save token in state
        await state.update_data(token=token, group_number=group_number)
        await state.set_state(UserStates.main_menu)
        
        await message.answer(
            f"✅ Отлично! Группа {group_number} сохранена.\n\n"
            f"Используйте меню для просмотра расписания:",
            reply_markup=get_main_keyboard()
        )
    else:
        await message.answer(
            "❌ Произошла ошибка. Попробуйте еще раз или обратитесь к администратору."
        )

@dp.message(lambda message: message.text == "📅 Мои пары")
async def show_today_schedule(message: types.Message, state: FSMContext):
    """Show today's schedule"""
    data = await state.get_data()
    token = data.get('token')
    group_number = data.get('group_number')
    
    if not token:
        await message.answer("❌ Сначала укажите группу с помощью /start")
        return
    
    sessions = await get_schedule(token, group_number, 'today')
    
    if sessions is None:
        await message.answer("❌ Ошибка при получении расписания")
        return
    
    if not sessions:
        await message.answer("📅 На сегодня пар нет")
        return
    
    response = "📅 *Расписание на сегодня:*\n\n"
    for i, session in enumerate(sessions, 1):
        response += f"{i}. {format_session(session)}\n\n"
    
    await message.answer(response, parse_mode='Markdown')

@dp.message(lambda message: message.text == "🔜 Завтра")
async def show_tomorrow_schedule(message: types.Message, state: FSMContext):
    """Show tomorrow's schedule"""
    data = await state.get_data()
    token = data.get('token')
    group_number = data.get('group_number')
    
    if not token:
        await message.answer("❌ Сначала укажите группу с помощью /start")
        return
    
    sessions = await get_schedule(token, group_number, 'tomorrow')
    
    if sessions is None:
        await message.answer("❌ Ошибка при получении расписания")
        return
    
    if not sessions:
        await message.answer("📅 На завтра пар нет")
        return
    
    response = "🔜 *Расписание на завтра:*\n\n"
    for i, session in enumerate(sessions, 1):
        response += f"{i}. {format_session(session)}\n\n"
    
    await message.answer(response, parse_mode='Markdown')

@dp.message(lambda message: message.text == "📆 На неделю")
async def show_week_schedule(message: types.Message, state: FSMContext):
    """Show week's schedule"""
    data = await state.get_data()
    token = data.get('token')
    group_number = data.get('group_number')
    
    if not token:
        await message.answer("❌ Сначала укажите группу с помощью /start")
        return
    
    schedule = await get_schedule(token, group_number, 'week')
    
    if schedule is None:
        await message.answer("❌ Ошибка при получении расписания")
        return
    
    if not schedule:
        await message.answer("📅 На эту неделю пар нет")
        return
    
    response = "📆 *Расписание на неделю:*\n\n"
    
    for date, sessions in sorted(schedule.items()):
        from datetime import datetime
        day = datetime.fromisoformat(date)
        day_name = day.strftime('%A, %d.%m')
        
        response += f"*{day_name}:*\n"
        for session in sessions:
            response += f"• {format_session(session)}\n\n"
        response += "\n"
    
    await message.answer(response, parse_mode='Markdown')

@dp.message(lambda message: message.text == "🔄 Сменить группу")
async def change_group(message: types.Message, state: FSMContext):
    """Initiate group change"""
    await message.answer(
        "Введите новый номер группы:",
        reply_markup=ReplyKeyboardRemove()
    )
    await state.set_state(UserStates.changing_group)

@dp.message(UserStates.changing_group)
async def process_new_group(message: types.Message, state: FSMContext):
    """Process new group number"""
    group_number = message.text.strip()
    telegram_id = message.from_user.id
    name = message.from_user.full_name
    
    token, user = await init_user(telegram_id, group_number, name)
    
    if token:
        await state.update_data(token=token, group_number=group_number)
        await state.set_state(UserStates.main_menu)
        
        await message.answer(
            f"✅ Группа изменена на {group_number}",
            reply_markup=get_main_keyboard()
        )
    else:
        await message.answer(
            "❌ Ошибка при смене группы",
            reply_markup=get_main_keyboard()
        )
        await state.set_state(UserStates.main_menu)

@dp.message(lambda message: message.text == "⚙️ Настройки")
async def show_settings(message: types.Message, state: FSMContext):
    """Show settings menu"""
    await message.answer(
        "⚙️ Настройки:",
        reply_markup=get_settings_keyboard()
    )
    await state.set_state(UserStates.settings)

@dp.message(lambda message: message.text == "◀️ Назад")
async def go_back(message: types.Message, state: FSMContext):
    """Go back to main menu"""
    await message.answer(
        "Главное меню:",
        reply_markup=get_main_keyboard()
    )
    await state.set_state(UserStates.main_menu)

# Webhook handler for receiving alerts from backend
async def handle_alert(telegram_ids: list, message_text: str):
    """Send alert to users"""
    for telegram_id in telegram_ids:
        try:
            await bot.send_message(telegram_id, message_text, parse_mode='Markdown')
        except Exception as e:
            logger.error(f"Error sending message to {telegram_id}: {e}")

# Main function
async def main():
    """Start bot"""
    logger.info("Starting bot...")
    await dp.start_polling(bot)

if __name__ == '__main__':
    import asyncio
    asyncio.run(main())
