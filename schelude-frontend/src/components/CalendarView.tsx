import React, { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { Box } from '@mui/material';
import { Session, Course, User, Room as RoomType } from '../types';
import { getTypeColor } from '../utils/sessionUtils';

interface CalendarViewProps {
  sessions: Session[];
  onEventClick?: (session: Session) => void;
  editable?: boolean;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  sessions, 
  onEventClick,
  editable = false 
}) => {
  const calendarRef = useRef<FullCalendar>(null);

  // Конвертируем sessions в события FullCalendar
  const events = sessions.map(session => {
    const course = session.course as Course;
    const teacher = session.teacher as User;
    const room = session.room as RoomType;

    return {
      id: session._id,
      title: course?.name || 'Без названия',
      start: session.startAt,
      end: session.endAt,
      backgroundColor: getTypeColor(session.type),
      borderColor: getTypeColor(session.type),
      extendedProps: {
        session,
        courseCode: course?.code || '',
        teacherName: teacher?.name || 'Не назначен',
        roomNumber: room ? `${room.building} ${room.number}` : 'Не указана',
        type: session.type,
        groups: session.groups,
      }
    };
  });

  const handleEventClick = (info: any) => {
    if (onEventClick) {
      onEventClick(info.event.extendedProps.session);
    }
  };

  return (
    <Box sx={{ 
      '& .fc': {
        fontFamily: 'inherit',
      },
      '& .fc-toolbar-title': {
        fontSize: '1.5rem',
        fontWeight: 600,
      },
      '& .fc-button': {
        textTransform: 'capitalize',
        backgroundColor: 'primary.main',
        borderColor: 'primary.main',
        '&:hover': {
          backgroundColor: 'primary.dark',
        },
      },
      '& .fc-button-active': {
        backgroundColor: 'primary.dark !important',
      },
      '& .fc-event': {
        cursor: 'pointer',
        borderRadius: '4px',
        padding: '2px 4px',
      },
      '& .fc-daygrid-event': {
        fontSize: '0.85rem',
      },
      '& .fc-timegrid-event': {
        fontSize: '0.9rem',
      },
    }}>
      <FullCalendar
        ref={calendarRef}
        plugins={[
          dayGridPlugin,
          timeGridPlugin,
          listPlugin,
          interactionPlugin,
        ]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        }}
        buttonText={{
          today: 'Сегодня',
          month: 'Месяц',
          week: 'Неделя',
          day: 'День',
          list: 'Список'
        }}
        locale="ru"
        firstDay={1}
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        allDaySlot={false}
        height="auto"
        events={events}
        eventClick={handleEventClick}
        editable={editable}
        eventContent={(arg) => {
          const { courseCode, teacherName, roomNumber } = arg.event.extendedProps;
          return (
            <Box sx={{ p: 0.5, overflow: 'hidden' }}>
              <Box sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {arg.event.title}
              </Box>
              <Box sx={{ fontSize: '0.75rem', opacity: 0.9 }}>
                {courseCode}
              </Box>
              <Box sx={{ fontSize: '0.75rem', opacity: 0.8 }}>
                {roomNumber}
              </Box>
              <Box sx={{ fontSize: '0.7rem', opacity: 0.7 }}>
                {teacherName}
              </Box>
            </Box>
          );
        }}
        dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
        slotLabelFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }}
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }}
      />
    </Box>
  );
};

export default CalendarView;
