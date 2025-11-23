import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Stack,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material';
import {
  AccessTime,
  Room,
  Person,
  Group,
  Link as LinkIcon,
  Info,
  MenuBook,
  Build,
  Science,
  Groups,
  Assignment,
  Help,
  Cancel,
} from '@mui/icons-material';
import { Session, Course, User, Room as RoomType } from '../types';
import { formatTime, getSessionDuration } from '../utils/dateUtils';
import { formatPairTime } from '../utils/pairUtils';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { getStatusColor, getStatusLabel, getTypeLabel, getTypeColor } from '../utils/sessionUtils';
import { getWeekParityShortLabel } from '../utils/weekUtils';

interface SessionCardProps {
  session: Session;
  onClick?: () => void;
  showDate?: boolean;
  onCancel?: (sessionId: string) => void;
  showCancelButton?: boolean;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'lecture': return <MenuBook />;
    case 'practice': return <Build />;
    case 'lab': return <Science />;
    case 'seminar': return <Groups />;
    case 'exam': return <Assignment />;
    case 'consultation': return <Help />;
    default: return <MenuBook />;
  }
};

const getBuildingName = (roomNumber: string) => {
  const prefix = roomNumber.charAt(0).toUpperCase();
  switch (prefix) {
    case 'А': return 'Главный корпус';
    case 'У': return 'Учебный корпус';
    case 'С': return 'Спортивный комплекс';
    default: return '';
  }
};

const getColorFromCourse = (courseName: string) => {
  let hash = 0;
  for (let i = 0; i < courseName.length; i++) {
    hash = courseName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 50%)`;
};

const getTimeUntilStart = (startAt: string) => {
  const now = new Date();
  const start = new Date(startAt);
  const diff = start.getTime() - now.getTime();
  
  if (diff < 0) {
    const end = new Date(startAt);
    end.setMinutes(end.getMinutes() + 90);
    if (now < end) return 'Сейчас';
    return 'Завершено';
  }
  
  return formatDistanceToNow(start, { addSuffix: true, locale: ru });
};

const SessionCard: React.FC<SessionCardProps> = ({ session, onClick, showDate = false, onCancel, showCancelButton = false }) => {
  const course = session.course as Course;
  const teacher = session.teacher as User;
  const room = session.room as RoomType;
  const duration = getSessionDuration(session.startAt, session.endAt);
  const buildingName = room ? getBuildingName(room.number) : '';
  const timeUntil = getTimeUntilStart(session.startAt);
  const courseColor = getColorFromCourse(course.name);

  return (
    <Card
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        } : {},
        borderLeft: `6px solid ${courseColor}`,
        borderTop: `2px solid ${courseColor}`,
        background: `linear-gradient(to right, ${courseColor}08, transparent)`,
      }}
      onClick={onClick}
    >
      <CardContent>
        <Stack spacing={2}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <Box sx={{ color: courseColor }}>
                  {getTypeIcon(session.type)}
                </Box>
                <Typography variant="h6" component="div">
                  {course.name}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {course.code}
              </Typography>
              <Chip
                label={timeUntil}
                size="small"
                color={timeUntil === 'Сейчас' ? 'success' : timeUntil === 'Завершено' ? 'default' : 'primary'}
                sx={{ mt: 0.5 }}
              />
            </Box>
            <Stack direction="row" spacing={1}>
              <Chip
                label={getTypeLabel(session.type)}
                size="small"
                sx={{ 
                  bgcolor: getTypeColor(session.type), 
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
              <Chip
                label={getStatusLabel(session.status)}
                size="small"
                color={getStatusColor(session.status)}
              />
              {session.weekParity && session.weekParity !== 'both' && (
                <Chip
                  label={getWeekParityShortLabel(session.weekParity)}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 'bold' }}
                />
              )}
            </Stack>
          </Box>

          <Stack spacing={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <AccessTime fontSize="small" color="action" />
              <Typography variant="body2">
                {session.pairNumber ? (
                  <>
                    <strong>{session.pairNumber} пара</strong> ({formatPairTime(session.pairNumber)})
                  </>
                ) : (
                  `${formatTime(session.startAt)} - ${formatTime(session.endAt)} (${duration} мин)`
                )}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              <Room fontSize="small" color="action" />
              <Typography variant="body2">
                {room ? (
                  <>
                    {room.building} {room.number}
                    {buildingName && (
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        ({buildingName})
                      </Typography>
                    )}
                  </>
                ) : (
                  'Аудитория не назначена'
                )}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              <Person fontSize="small" color="action" />
              <Typography variant="body2">
                {teacher?.name || 'Преподаватель не назначен'}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              <Group fontSize="small" color="action" />
              <Typography variant="body2">
                {session.groups.join(', ')}
                {session.subgroup && session.subgroup !== 'all' && (
                  <Chip
                    label={session.subgroup === 'subgroup-1' ? 'п/г 1' : 'п/г 2'}
                    size="small"
                    sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                  />
                )}
              </Typography>
            </Box>
          </Stack>

          {session.status === 'online' && session.onlineLink && (
            <Box>
              <Chip
                icon={<LinkIcon />}
                label="Ссылка на занятие"
                size="small"
                color="info"
                clickable
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(session.onlineLink, '_blank');
                }}
              />
            </Box>
          )}

          {session.notes && (
            <Box display="flex" alignItems="flex-start" gap={1}>
              <Info fontSize="small" color="action" sx={{ mt: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                {session.notes}
              </Typography>
            </Box>
          )}

          {session.status === 'cancelled' && session.cancellationReason && (
            <Box
              sx={{
                bgcolor: 'error.light',
                color: 'error.contrastText',
                p: 1,
                borderRadius: 1,
              }}
            >
              <Typography variant="body2">
                Причина отмены: {session.cancellationReason}
              </Typography>
            </Box>
          )}

          {showCancelButton && session.status !== 'cancelled' && onCancel && (
            <Box display="flex" justifyContent="flex-end" mt={1}>
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<Cancel />}
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel(session._id);
                }}
              >
                Отменить пару
              </Button>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default SessionCard;