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
} from '@mui/material';
import {
  AccessTime,
  Room,
  Person,
  Group,
  Link as LinkIcon,
  Info,
} from '@mui/icons-material';
import { Session, Course, User, Room as RoomType } from '../types';
import { formatTime, getSessionDuration } from '../utils/dateUtils';
import { getStatusColor, getStatusLabel, getTypeLabel, getTypeColor } from '../utils/sessionUtils';

interface SessionCardProps {
  session: Session;
  onClick?: () => void;
  showDate?: boolean;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, onClick, showDate = false }) => {
  const course = session.course as Course;
  const teacher = session.teacher as User;
  const room = session.room as RoomType;
  const duration = getSessionDuration(session.startAt, session.endAt);

  return (
    <Card
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        } : {},
        borderLeft: `4px solid ${getTypeColor(session.type)}`,
      }}
      onClick={onClick}
    >
      <CardContent>
        <Stack spacing={2}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box flex={1}>
              <Typography variant="h6" component="div" gutterBottom>
                {course.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {course.code}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Chip
                label={getTypeLabel(session.type)}
                size="small"
                sx={{ bgcolor: getTypeColor(session.type), color: 'white' }}
              />
              <Chip
                label={getStatusLabel(session.status)}
                size="small"
                color={getStatusColor(session.status)}
              />
            </Stack>
          </Box>

          <Stack spacing={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <AccessTime fontSize="small" color="action" />
              <Typography variant="body2">
                {formatTime(session.startAt)} - {formatTime(session.endAt)} ({duration} мин)
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              <Room fontSize="small" color="action" />
              <Typography variant="body2">
                {room.building} {room.number}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              <Person fontSize="small" color="action" />
              <Typography variant="body2">
                {teacher.name}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              <Group fontSize="small" color="action" />
              <Typography variant="body2">
                {session.groups.join(', ')}
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
        </Stack>
      </CardContent>
    </Card>
  );
};

export default SessionCard;