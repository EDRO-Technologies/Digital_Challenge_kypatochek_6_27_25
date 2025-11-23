#!/usr/bin/env python3
"""Smart University Schedule Telegram Bot"""

import os
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional

import aiohttp
from dotenv import load_dotenv
from telegram import (
    Update,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
)
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    ConversationHandler,
    filters,
    ContextTypes,
)

# Load environment variables
load_dotenv()

# Enable logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Configuration
TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:3000')
WEBHOOK_API_KEY = os.getenv('WEBHOOK_API_KEY', '')
ADMIN_IDS = [int(uid) for uid in os.getenv('ADMIN_USER_IDS', '').split(',') if uid]
NOTIFICATION_CHECK_INTERVAL = int(os.getenv('NOTIFICATION_CHECK_INTERVAL', '30'))

# Conversation states
CHOOSE_ROLE, STUDENT_GROUP, STUDENT_SUBGROUP, STUDENT_NAME = range(4)
TEACHER_SELECT = range(1)

# User data storage (in production, use a database)
user_data_store: Dict[int, dict] = {}


class ScheduleAPI:
    """API client for backend communication"""
    
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def ensure_session(self):
        """Ensure aiohttp session exists"""
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession()
    
    async def close(self):
        """Close the session"""
        if self.session and not self.session.closed:
            await self.session.close()
    
    async def get_schedule(self, group: str, period: str = 'today', subgroup: str = 'all') -> dict:
        """Get schedule for a group"""
        await self.ensure_session()
        try:
            url = f"{self.base_url}/api/schedule/group/{group}/{period}"
            params = {'subgroup': subgroup} if subgroup != 'all' else {}
            
            async with self.session.get(url, params=params, timeout=10) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    logger.error(f"API error: {response.status}")
                    return {'success': False, 'sessions': []}
        except asyncio.TimeoutError:
            logger.error("API timeout")
            return {'success': False, 'sessions': []}
        except Exception as e:
            logger.error(f"API error: {e}")
            return {'success': False, 'sessions': []}
    
    async def get_teacher_schedule(self, teacher_id: str, period: str = 'today') -> dict:
        """Get schedule for a teacher"""
        await self.ensure_session()
        try:
            url = f"{self.base_url}/api/schedule/teacher/{teacher_id}/{period}"
            async with self.session.get(url, timeout=10) as response:
                if response.status == 200:
                    return await response.json()
                return {'success': False, 'sessions': []}
        except Exception as e:
            logger.error(f"API error: {e}")
            return {'success': False, 'sessions': []}
    
    async def get_teachers(self) -> List[dict]:
        """Get list of all teachers"""
        await self.ensure_session()
        try:
            url = f"{self.base_url}/api/schedule/teachers"
            async with self.session.get(url, timeout=10) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('teachers', [])
                return []
        except Exception as e:
            logger.error(f"API error: {e}")
            return []
    
    async def get_groups(self) -> List[str]:
        """Get list of all groups"""
        await self.ensure_session()
        try:
            url = f"{self.base_url}/api/schedule/groups"
            async with self.session.get(url, timeout=10) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('groups', [])
                return []
        except Exception as e:
            logger.error(f"API error: {e}")
            return []
    
    async def register_telegram_user(self, user_data: dict) -> bool:
        """Register telegram user on backend"""
        await self.ensure_session()
        try:
            url = f"{self.base_url}/api/webhooks/telegram/register"
            async with self.session.post(url, json=user_data, timeout=10) as response:
                if response.status == 200:
                    logger.info(f"Successfully registered telegram user {user_data.get('telegramId')}")
                    return True
                else:
                    logger.error(f"Failed to register: {response.status}")
                    return False
        except Exception as e:
            logger.error(f"Registration API error: {e}")
            return False
    
    async def get_pending_notifications(self, limit: int = 50) -> List[dict]:
        """Get pending notifications from backend"""
        await self.ensure_session()
        try:
            url = f"{self.base_url}/api/webhooks/telegram/pending-notifications"
            params = {'limit': limit}
            headers = {'x-api-key': WEBHOOK_API_KEY} if WEBHOOK_API_KEY else {}
            async with self.session.get(url, params=params, headers=headers, timeout=10) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('notifications', [])
                else:
                    logger.error(f"Failed to fetch notifications: {response.status}")
                    return []
        except Exception as e:
            logger.error(f"Error fetching notifications: {e}")
            return []
    
    async def get_user_by_telegram_id(self, telegram_id: str) -> Optional[dict]:
        """Get user data by telegram ID"""
        await self.ensure_session()
        try:
            url = f"{self.base_url}/api/webhooks/telegram/user/{telegram_id}"
            async with self.session.get(url, timeout=10) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('user') if data.get('success') else None
                elif response.status == 404:
                    return None
                else:
                    logger.error(f"Failed to fetch user: {response.status}")
                    return None
        except Exception as e:
            logger.error(f"Error fetching user: {e}")
            return None
    
    async def delete_user_by_telegram_id(self, telegram_id: str) -> bool:
        """Delete user data by telegram ID"""
        await self.ensure_session()
        try:
            url = f"{self.base_url}/api/webhooks/telegram/user/{telegram_id}"
            async with self.session.delete(url, timeout=10) as response:
                if response.status == 200:
                    logger.info(f"Deleted user {telegram_id} from backend")
                    return True
                else:
                    logger.error(f"Failed to delete user: {response.status}")
                    return False
        except Exception as e:
            logger.error(f"Error deleting user: {e}")
            return False
    
    async def update_notification_status(self, notification_id: str, status: str, error: str = None) -> bool:
        """Update notification delivery status"""
        await self.ensure_session()
        try:
            url = f"{self.base_url}/api/webhooks/telegram/notification-status"
            payload = {
                'notificationId': notification_id,
                'status': status
            }
            if error:
                payload['error'] = error
            
            headers = {'x-api-key': WEBHOOK_API_KEY} if WEBHOOK_API_KEY else {}
            async with self.session.post(url, json=payload, headers=headers, timeout=10) as response:
                if response.status == 200:
                    logger.info(f"Updated notification {notification_id} status to {status}")
                    return True
                else:
                    logger.error(f"Failed to update notification status: {response.status}")
                    return False
        except Exception as e:
            logger.error(f"Error updating notification status: {e}")
            return False


# Initialize API client
api = ScheduleAPI(BACKEND_URL)


def format_session(session: dict) -> str:
    """Format a session for display"""
    # Convert UTC to local time (Asia/Yekaterinburg UTC+5)
    start_time = datetime.fromisoformat(session['startAt'].replace('Z', '+00:00'))
    end_time = datetime.fromisoformat(session['endAt'].replace('Z', '+00:00'))
    
    # Add 5 hours for Yekaterinburg timezone
    start_time = start_time + timedelta(hours=5)
    end_time = end_time + timedelta(hours=5)
    
    course_name = session.get('course', {}).get('name', 'N/A')
    teacher = session.get('teacher')
    teacher_name = teacher.get('name', 'N/A') if teacher else 'Преподаватель не назначен'
    room_info = session.get('room', {})
    room_str = f"{room_info.get('building', '')} {room_info.get('number', 'N/A')}"
    
    # Get pair number if available
    pair_number = session.get('pairNumber')
    pair_str = f"{pair_number} пара" if pair_number else "Занятие"
    
    session_type = session.get('type', 'lecture')
    type_emoji = {
        'lecture': '📚',
        'seminar': '💬',
        'lab': '🔬',
        'practice': '✏️',
        'exam': '📝',
        'test': '📋'
    }.get(session_type, '📖')
    
    return (
        f"{type_emoji} <b>{course_name}</b>\n"
        f"🔢 {pair_str} ({start_time.strftime('%H:%M')} - {end_time.strftime('%H:%M')})\n"
        f"👤 {teacher_name}\n"
        f"🏛 {room_str.strip()}\n"
    )


def get_student_keyboard() -> ReplyKeyboardMarkup:
    """Get student menu keyboard"""
    keyboard = [
        ['📅 Сегодня', '📅 Завтра'],
        ['📆 Неделя', '👤 Профиль'],
        ['ℹ️ Помощь']
    ]
    return ReplyKeyboardMarkup(keyboard, resize_keyboard=True)


def get_teacher_keyboard() -> ReplyKeyboardMarkup:
    """Get teacher menu keyboard"""
    keyboard = [
        ['📅 Моё расписание сегодня'],
        ['📅 Моё расписание завтра'],
        ['📆 Моё расписание на неделю'],
        ['👤 Профиль', 'ℹ️ Помощь']
    ]
    return ReplyKeyboardMarkup(keyboard, resize_keyboard=True)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Start command handler"""
    user = update.effective_user
    user_id = user.id
    chat_id = update.effective_chat.id
    
    # Check if user is in local store
    if user_id not in user_data_store:
        # Try to load from backend
        user_data = await api.get_user_by_telegram_id(str(user_id))
        if user_data:
            # Restore user data from backend
            role = user_data.get('role', 'guest')
            user_data_store[user_id] = {
                'role': role,
                'name': user_data.get('name'),
                'telegram_id': user_id,
                'chat_id': chat_id,
                'username': user.username,
                'registered_at': datetime.now().isoformat()
            }
            
            if role == 'student':
                user_data_store[user_id]['group'] = user_data.get('groupNumber')
                user_data_store[user_id]['subgroup'] = 'all'  # Default
            elif role == 'teacher':
                # For teachers, we need to find their ID from the name
                # This is a limitation - we should store teacher_id in User model
                user_data_store[user_id]['teacher_id'] = None
            
            # Update chatId in backend if changed
            if user_data.get('telegramChatId') != str(chat_id):
                await api.register_telegram_user({
                    'telegramId': str(user_id),
                    'chatId': str(chat_id),
                    'role': role,
                    'name': user_data.get('name')
                })
            
            logger.info(f"Restored user {user_id} from backend")
    
    # Check if user is registered
    if user_id in user_data_store:
        user_role = user_data_store[user_id].get('role')
        user_name = user_data_store[user_id].get('name', user.first_name)
        keyboard = get_teacher_keyboard() if user_role == 'teacher' else get_student_keyboard()
        
        # Add option to change role
        role_text = "👨‍🎓 Студент" if user_role == 'student' else "👨‍🏫 Преподаватель"
        
        change_role_keyboard = [
            [InlineKeyboardButton("🔄 Сменить роль", callback_data="change_role")]
        ]
        reply_markup_inline = InlineKeyboardMarkup(change_role_keyboard)
        
        await update.message.reply_text(
            f"Привет, {user_name}! 👋\n\n"
            f"Вы вошли как: {role_text}\n\n"
            f"Используй меню для просмотра расписания.",
            reply_markup=keyboard
        )
        
        await update.message.reply_text(
            "Хотите сменить роль?",
            reply_markup=reply_markup_inline
        )
        
        return ConversationHandler.END
    else:
        # Ask to choose role
        keyboard = [
            [InlineKeyboardButton("👨‍🎓 Студент", callback_data="role_student")],
            [InlineKeyboardButton("👨‍🏫 Преподаватель", callback_data="role_teacher")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            f"Привет, {user.first_name}! 👋\n\n"
            f"Добро пожаловать в бота расписания университета!\n\n"
            f"Кто вы?",
            reply_markup=reply_markup
        )
        return CHOOSE_ROLE


async def choose_role(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle role selection"""
    query = update.callback_query
    await query.answer()
    
    role = query.data.replace('role_', '')
    context.user_data['role'] = role
    
    if role == 'student':
        # Get available groups
        groups = await api.get_groups()
        
        if not groups:
            await query.edit_message_text(
                "Извините, не удалось загрузить список групп.\n"
                "Попробуйте позже."
            )
            return ConversationHandler.END
        
        # Create keyboard with groups
        keyboard = []
        for i in range(0, len(groups), 2):
            row = groups[i:i+2]
            keyboard.append(row)
        keyboard.append(['❌ Отмена'])
        
        reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=True)
        
        await query.edit_message_text("Вы выбрали: Студент")
        await query.message.reply_text(
            "Выберите вашу группу:",
            reply_markup=reply_markup
        )
        
        context.user_data['available_groups'] = groups
        return STUDENT_GROUP
    
    else:  # teacher
        loading_msg = await query.edit_message_text("⏳ Загружаю список преподавателей...")
        
        teachers = await api.get_teachers()
        
        if not teachers:
            await loading_msg.edit_text("❌ Не удалось загрузить список преподавателей.")
            return ConversationHandler.END
        
        # Create inline keyboard with teachers
        keyboard = []
        for teacher in teachers:
            keyboard.append([InlineKeyboardButton(
                teacher['name'],
                callback_data=f"teacher_select_{teacher['_id']}"
            )])
        keyboard.append([InlineKeyboardButton("❌ Отмена", callback_data="cancel")])
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await loading_msg.edit_text(
            "Вы выбрали: Преподаватель\n\n"
            "Выберите себя из списка:",
            reply_markup=reply_markup
        )
        
        context.user_data['teachers'] = {t['_id']: t['name'] for t in teachers}
        return TEACHER_SELECT


async def teacher_selected(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle teacher selection"""
    query = update.callback_query
    await query.answer()
    
    if query.data == "cancel":
        await query.edit_message_text("Регистрация отменена.")
        return ConversationHandler.END
    
    teacher_id = query.data.replace('teacher_select_', '')
    teacher_name = context.user_data.get('teachers', {}).get(teacher_id, 'Преподаватель')
    
    user_id = update.effective_user.id
    chat_id = update.effective_chat.id
    
    # Save teacher data
    user_data_store[user_id] = {
        'role': 'teacher',
        'teacher_id': teacher_id,
        'name': teacher_name,
        'telegram_id': user_id,
        'chat_id': chat_id,
        'username': update.effective_user.username,
        'registered_at': datetime.now().isoformat()
    }
    
    # Register on backend
    await api.register_telegram_user({
        'telegramId': str(user_id),
        'chatId': str(chat_id),
        'role': 'teacher',
        'teacherId': teacher_id,
        'name': teacher_name
    })
    
    await query.edit_message_text(
        f"✅ Регистрация завершена!\n\n"
        f"<b>Ваши данные:</b>\n"
        f"Роль: Преподаватель\n"
        f"Имя: {teacher_name}\n\n"
        f"Используйте меню для просмотра расписания!\n"
        f"📢 Вы будете получать уведомления об изменениях в расписании.",
        parse_mode='HTML'
    )
    
    await query.message.reply_text(
        "Главное меню:",
        reply_markup=get_teacher_keyboard()
    )
    
    return ConversationHandler.END


async def student_group(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle group selection for student"""
    group = update.message.text
    
    if group == '❌ Отмена':
        await update.message.reply_text(
            "Регистрация отменена.",
            reply_markup=ReplyKeyboardRemove()
        )
        return ConversationHandler.END
    
    # Validate group
    available_groups = context.user_data.get('available_groups', [])
    if group not in available_groups:
        await update.message.reply_text("Пожалуйста, выберите группу из списка.")
        return STUDENT_GROUP
    
    context.user_data['group'] = group
    
    # Ask for subgroup
    keyboard = [['1', '2'], ['Вся группа'], ['❌ Отмена']]
    reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=True)
    
    await update.message.reply_text(
        "Отлично! Выберите подгруппу:",
        reply_markup=reply_markup
    )
    
    return STUDENT_SUBGROUP


async def student_subgroup(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle subgroup selection for student"""
    subgroup_text = update.message.text
    
    if subgroup_text == '❌ Отмена':
        await update.message.reply_text(
            "Регистрация отменена.",
            reply_markup=ReplyKeyboardRemove()
        )
        return ConversationHandler.END
    
    # Map subgroup
    if subgroup_text == 'Вся группа':
        subgroup = 'all'
    elif subgroup_text in ['1', '2']:
        subgroup = subgroup_text
    else:
        await update.message.reply_text("Пожалуйста, выберите подгруппу из списка.")
        return STUDENT_SUBGROUP
    
    context.user_data['subgroup'] = subgroup
    
    await update.message.reply_text(
        "Введите ваше имя:",
        reply_markup=ReplyKeyboardRemove()
    )
    
    return STUDENT_NAME


async def student_name(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Complete student registration"""
    name = update.message.text.strip()
    
    if not name or len(name) < 2:
        await update.message.reply_text("Пожалуйста, введите корректное имя (минимум 2 символа).")
        return STUDENT_NAME
    
    user_id = update.effective_user.id
    chat_id = update.effective_chat.id
    group = context.user_data['group']
    subgroup = context.user_data['subgroup']
    
    # Save student data
    user_data_store[user_id] = {
        'role': 'student',
        'name': name,
        'group': group,
        'subgroup': subgroup,
        'telegram_id': user_id,
        'chat_id': chat_id,
        'username': update.effective_user.username,
        'registered_at': datetime.now().isoformat()
    }
    
    # Register on backend with group number
    await api.register_telegram_user({
        'telegramId': str(user_id),
        'chatId': str(chat_id),
        'role': 'student',
        'groupNumber': group,  # Changed from 'group' to 'groupNumber'
        'name': name
    })
    
    await update.message.reply_text(
        f"✅ Регистрация завершена!\n\n"
        f"<b>Ваши данные:</b>\n"
        f"Роль: Студент\n"
        f"Имя: {name}\n"
        f"Группа: {group}\n"
        f"Подгруппа: {subgroup if subgroup != 'all' else 'Вся группа'}\n\n"
        f"Теперь вы можете просматривать расписание!\n"
        f"📢 Вы будете получать уведомления об изменениях в расписании.",
        parse_mode='HTML',
        reply_markup=get_student_keyboard()
    )
    
    return ConversationHandler.END


async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Cancel conversation"""
    user_id = update.effective_user.id
    if user_id in user_data_store:
        role = user_data_store[user_id].get('role')
        keyboard = get_teacher_keyboard() if role == 'teacher' else get_student_keyboard()
    else:
        keyboard = ReplyKeyboardRemove()
    
    await update.message.reply_text(
        "Действие отменено.",
        reply_markup=keyboard
    )
    return ConversationHandler.END


async def show_schedule(update: Update, context: ContextTypes.DEFAULT_TYPE, period: str = 'today') -> None:
    """Show schedule for a period"""
    user_id = update.effective_user.id
    
    if user_id not in user_data_store:
        await update.message.reply_text(
            "Вы не зарегистрированы! Используйте /start для регистрации."
        )
        return
    
    user_data = user_data_store[user_id]
    role = user_data.get('role')
    
    # Show loading message
    loading_msg = await update.message.reply_text("⏳ Загружаю расписание...")
    
    if role == 'student':
        group = user_data['group']
        subgroup = user_data.get('subgroup', 'all')
        
        # Get schedule
        schedule_data = await api.get_schedule(group, period, subgroup)
        
        if not schedule_data.get('success'):
            await loading_msg.edit_text("❌ Не удалось загрузить расписание. Попробуйте позже.")
            return
        
        sessions = schedule_data.get('sessions', [])
        
        if not sessions:
            period_names = {'today': 'сегодня', 'tomorrow': 'завтра', 'week': 'на эту неделю'}
            await loading_msg.edit_text(
                f"📭 Занятий {period_names.get(period, period)} нет.\n\n"
                f"Отдыхайте! 😊"
            )
            return
        
        # Format schedule
        if period == 'week':
            schedule_dict = schedule_data.get('schedule', {})
            message = f"📆 <b>Расписание на неделю</b>\n"
            message += f"Группа: {group}" + (f" (подгруппа {subgroup})" if subgroup != 'all' else '') + "\n\n"
            
            for date_str, day_sessions in sorted(schedule_dict.items()):
                date_obj = datetime.fromisoformat(date_str)
                day_name = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][date_obj.weekday()]
                message += f"<b>{day_name}, {date_obj.strftime('%d.%m')}:</b>\n"
                
                for session in day_sessions:
                    message += format_session(session)
                message += "\n"
        else:
            period_names = {'today': 'Сегодня', 'tomorrow': 'Завтра'}
            message = f"📅 <b>Расписание на {period_names.get(period, period).lower()}</b>\n"
            message += f"Группа: {group}" + (f" (подгруппа {subgroup})" if subgroup != 'all' else '') + "\n\n"
            
            for i, session in enumerate(sessions, 1):
                message += f"<b>{i}.</b> "
                message += format_session(session)
    
    else:  # teacher
        teacher_id = user_data['teacher_id']
        teacher_name = user_data['name']
        
        schedule_data = await api.get_teacher_schedule(teacher_id, period)
        
        if not schedule_data.get('success'):
            await loading_msg.edit_text("❌ Не удалось загрузить расписание. Попробуйте позже.")
            return
        
        sessions = schedule_data.get('sessions', [])
        
        if not sessions:
            period_names = {'today': 'сегодня', 'tomorrow': 'завтра', 'week': 'на эту неделю'}
            await loading_msg.edit_text(
                f"📭 У вас нет занятий {period_names.get(period, period)}.\n\n"
                f"Отдыхайте! 😊"
            )
            return
        
        # Format schedule
        if period == 'week':
            schedule_dict = schedule_data.get('schedule', {})
            message = f"📆 <b>Ваше расписание на неделю</b>\n\n"
            
            for date_str, day_sessions in sorted(schedule_dict.items()):
                date_obj = datetime.fromisoformat(date_str)
                day_name = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][date_obj.weekday()]
                message += f"<b>{day_name}, {date_obj.strftime('%d.%m')}:</b>\n"
                
                for session in day_sessions:
                    message += format_session(session)
                    message += f"Группы: {', '.join(session.get('groups', []))}\n\n"
        else:
            period_names = {'today': 'Сегодня', 'tomorrow': 'Завтра'}
            message = f"📅 <b>Ваше расписание на {period_names.get(period, period).lower()}</b>\n\n"
            
            for i, session in enumerate(sessions, 1):
                message += f"<b>{i}.</b> "
                message += format_session(session)
                message += f"Группы: {', '.join(session.get('groups', []))}\n\n"
    
    # Split message if too long
    if len(message) > 4000:
        parts = [message[i:i+4000] for i in range(0, len(message), 4000)]
        await loading_msg.delete()
        for part in parts:
            await update.message.reply_text(part, parse_mode='HTML')
    else:
        await loading_msg.edit_text(message, parse_mode='HTML')


async def today_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show today's schedule"""
    await show_schedule(update, context, 'today')


async def tomorrow_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show tomorrow's schedule"""
    await show_schedule(update, context, 'tomorrow')


async def week_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show week's schedule"""
    await show_schedule(update, context, 'week')


async def profile_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show user profile"""
    user_id = update.effective_user.id
    
    if user_id not in user_data_store:
        await update.message.reply_text(
            "Вы не зарегистрированы! Используйте /start для регистрации."
        )
        return
    
    user_data = user_data_store[user_id]
    role = user_data.get('role')
    
    if role == 'student':
        message = (
            f"👤 <b>Ваш профиль</b>\n\n"
            f"Роль: Студент\n"
            f"Имя: {user_data['name']}\n"
            f"Группа: {user_data['group']}\n"
            f"Подгруппа: {user_data['subgroup'] if user_data['subgroup'] != 'all' else 'Вся группа'}\n"
            f"Telegram ID: {user_id}\n"
        )
    else:
        message = (
            f"👤 <b>Ваш профиль</b>\n\n"
            f"Роль: Преподаватель\n"
            f"Имя: {user_data['name']}\n"
            f"Telegram ID: {user_id}\n"
        )
    
    keyboard = [
        [InlineKeyboardButton("🔄 Сменить роль", callback_data="change_role")],
        [InlineKeyboardButton("🚪 Выйти из сессии", callback_data="logout")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(message, parse_mode='HTML', reply_markup=reply_markup)


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Help command handler"""
    user_id = update.effective_user.id
    
    if user_id in user_data_store:
        role = user_data_store[user_id].get('role')
        
        if role == 'teacher':
            help_text = (
                "<b>Доступные команды для преподавателя:</b>\n\n"
                "/start - Главное меню\n"
                "/today - Расписание на сегодня\n"
                "/tomorrow - Расписание на завтра\n"
                "/week - Расписание на неделю\n"
                "/profile - Мой профиль\n"
                "/help - Справка\n\n"
                "<b>Также можно использовать кнопки меню!</b>"
            )
        else:
            help_text = (
                "<b>Доступные команды для студента:</b>\n\n"
                "/start - Главное меню\n"
                "/today - Расписание на сегодня\n"
                "/tomorrow - Расписание на завтра\n"
                "/week - Расписание на неделю\n"
                "/profile - Мой профиль\n"
                "/help - Справка\n\n"
                "<b>Также можно использовать кнопки меню!</b>"
            )
    else:
        help_text = (
            "<b>Добро пожаловать!</b>\n\n"
            "Для начала работы используйте /start для регистрации."
        )
    
    await update.message.reply_text(help_text, parse_mode='HTML')


async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle inline keyboard callbacks"""
    query = update.callback_query
    await query.answer()
    
    if query.data == "logout":
        user_id = update.effective_user.id
        if user_id in user_data_store:
            del user_data_store[user_id]
            await query.edit_message_text(
                "✅ Вы вышли из сессии.\n\n"
                "Используйте /start для новой авторизации."
            )
        else:
            await query.edit_message_text("Сессия не найдена.")
    
    elif query.data == "change_role":
        user_id = update.effective_user.id
        if user_id in user_data_store:
            # Delete from backend first
            await api.delete_user_by_telegram_id(str(user_id))
            
            # Delete local data to force re-registration
            del user_data_store[user_id]
            
            await query.edit_message_text(
                "✅ Ваша роль сброшена.\n\n"
                "Используйте /start для выбора новой роли."
            )
        else:
            await query.edit_message_text("Сессия не найдена.")


async def handle_keyboard_buttons(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle reply keyboard buttons"""
    text = update.message.text
    user_id = update.effective_user.id
    
    if user_id not in user_data_store:
        await update.message.reply_text(
            "Вы не зарегистрированы! Используйте /start для регистрации."
        )
        return
    
    role = user_data_store[user_id].get('role')
    
    # Common buttons
    if text == '👤 Профиль':
        await profile_command(update, context)
    elif text == 'ℹ️ Помощь':
        await help_command(update, context)
    
    # Student buttons
    elif role == 'student':
        if text == '📅 Сегодня':
            await today_command(update, context)
        elif text == '📅 Завтра':
            await tomorrow_command(update, context)
        elif text == '📆 Неделя':
            await week_command(update, context)
        else:
            await update.message.reply_text(
                "Используйте кнопки меню или команды.",
                reply_markup=get_student_keyboard()
            )
    
    # Teacher buttons
    elif role == 'teacher':
        if text == '📅 Моё расписание сегодня':
            await today_command(update, context)
        elif text == '📅 Моё расписание завтра':
            await tomorrow_command(update, context)
        elif text == '📆 Моё расписание на неделю':
            await week_command(update, context)
        else:
            await update.message.reply_text(
                "Используйте кнопки меню или команды.",
                reply_markup=get_teacher_keyboard()
            )


async def process_notifications(context: ContextTypes.DEFAULT_TYPE) -> None:
    """Background task to process pending notifications"""
    try:
        # Fetch pending notifications
        notifications = await api.get_pending_notifications(limit=50)
        
        if not notifications:
            return
        
        logger.info(f"Processing {len(notifications)} pending notifications")
        
        for notification in notifications:
            try:
                notification_id = str(notification['_id'])
                payload = notification.get('payload') or {}
                message = payload.get('message', '')
                data = payload.get('data') or {}
                chat_id = data.get('chatId')
                
                if not chat_id or not message:
                    logger.warning(f"Notification {notification_id} missing chatId or message")
                    await api.update_notification_status(notification_id, 'failed', 'Missing chatId or message')
                    continue
                
                # Send message to user
                try:
                    await context.bot.send_message(
                        chat_id=chat_id,
                        text=message,
                        parse_mode='HTML'
                    )
                    
                    # Update status to sent
                    await api.update_notification_status(notification_id, 'sent')
                    logger.info(f"Successfully sent notification {notification_id} to chat {chat_id}")
                    
                except Exception as send_error:
                    error_msg = str(send_error)
                    logger.error(f"Failed to send notification {notification_id}: {error_msg}")
                    
                    # Check if user blocked the bot
                    if 'bot was blocked by the user' in error_msg.lower() or 'chat not found' in error_msg.lower():
                        await api.update_notification_status(notification_id, 'failed', 'User blocked bot or chat not found')
                    else:
                        await api.update_notification_status(notification_id, 'failed', error_msg)
                
            except Exception as notif_error:
                logger.error(f"Error processing notification: {notif_error}")
                continue
        
    except Exception as e:
        logger.error(f"Error in notification processing task: {e}")


async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle errors"""
    logger.error(f"Update {update} caused error {context.error}")
    
    if update and update.effective_message:
        await update.effective_message.reply_text(
            "❌ Произошла ошибка. Попробуйте позже."
        )


async def shutdown(application: Application) -> None:
    """Cleanup on shutdown"""
    await api.close()
    logger.info("Bot shutdown complete")


def main() -> None:
    """Start the bot"""
    if not TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN not found in environment!")
        return
    
    # Create application
    application = Application.builder().token(TOKEN).build()
    
    # Register conversation handler for registration
    register_conv = ConversationHandler(
        entry_points=[CommandHandler('start', start)],
        states={
            CHOOSE_ROLE: [CallbackQueryHandler(choose_role, pattern='^role_')],
            STUDENT_GROUP: [MessageHandler(filters.TEXT & ~filters.COMMAND, student_group)],
            STUDENT_SUBGROUP: [MessageHandler(filters.TEXT & ~filters.COMMAND, student_subgroup)],
            STUDENT_NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, student_name)],
            TEACHER_SELECT: [CallbackQueryHandler(teacher_selected)],
        },
        fallbacks=[CommandHandler('cancel', cancel)],
    )
    
    # Add handlers
    application.add_handler(register_conv)
    application.add_handler(CommandHandler('help', help_command))
    application.add_handler(CommandHandler('today', today_command))
    application.add_handler(CommandHandler('tomorrow', tomorrow_command))
    application.add_handler(CommandHandler('week', week_command))
    application.add_handler(CommandHandler('profile', profile_command))
    application.add_handler(CallbackQueryHandler(button_callback))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_keyboard_buttons))
    
    # Add error handler
    application.add_error_handler(error_handler)
    
    # Set up notification processing job
    job_queue = application.job_queue
    job_queue.run_repeating(
        process_notifications,
        interval=NOTIFICATION_CHECK_INTERVAL,
        first=10  # Start after 10 seconds
    )
    logger.info(f"Notification processor started (checking every {NOTIFICATION_CHECK_INTERVAL} seconds)")
    
    # Run cleanup on shutdown
    application.post_shutdown = shutdown
    
    logger.info("Bot started successfully!")
    
    # Start polling
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == '__main__':
    main()