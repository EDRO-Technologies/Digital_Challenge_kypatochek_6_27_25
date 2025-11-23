import React from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { Session } from '../types';
import { PAIR_SCHEDULE } from '../utils/pairUtils';
import { getTypeColor } from '../utils/sessionUtils';
import { getWeekParityShortLabel } from '../utils/weekUtils';
import { format, addDays, startOfWeek } from 'date-fns';
import { ru } from 'date-fns/locale';

interface WeeklyScheduleGridProps {
  sessions: Session[];
  startDate?: Date;
  editable?: boolean;
  onAddSession?: (dayIndex: number, pairNumber: number) => void;
  onSessionClick?: (session: Session) => void;
}

const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const DAY_ABBR = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];

const WeeklyScheduleGrid: React.FC<WeeklyScheduleGridProps> = ({
  sessions,
  startDate = startOfWeek(new Date(), { weekStartsOn: 1 }),
  editable = false,
  onAddSession,
  onSessionClick,
}) => {
  const theme = useTheme();

  // Группировка занятий по дням и парам
  const getSessionsForDayAndPair = (dayIndex: number, pairNumber: number) => {
    const targetDate = addDays(startDate, dayIndex);
    const targetDateStr = format(targetDate, 'yyyy-MM-dd');

    return sessions.filter((session) => {
      const sessionDate = format(new Date(session.startAt), 'yyyy-MM-dd');
      return sessionDate === targetDateStr && session.pairNumber === pairNumber;
    });
  };

  const renderSessionCell = (session: Session) => {
    const course = typeof session.course === 'object' ? session.course : null;
    const room = typeof session.room === 'object' ? session.room : null;
    const typeColor = getTypeColor(session.type);

    return (
      <Box
        key={session._id}
        onClick={() => onSessionClick?.(session)}
        sx={{
          p: 1,
          mb: 0.5,
          borderRadius: 1,
          borderLeft: `4px solid ${typeColor}`,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
          cursor: onSessionClick ? 'pointer' : 'default',
          '&:hover': onSessionClick ? {
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
          } : {},
          transition: 'background-color 0.2s',
        }}
      >
        <Typography variant="caption" fontWeight="bold" display="block" noWrap>
          {course?.name || 'N/A'}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" noWrap>
          {room ? `${room.building} ${room.number}` : 'N/A'}
        </Typography>
        {session.weekParity && session.weekParity !== 'both' && (
          <Chip
            label={getWeekParityShortLabel(session.weekParity)}
            size="small"
            sx={{
              height: 16,
              fontSize: '0.65rem',
              mt: 0.5,
            }}
          />
        )}
      </Box>
    );
  };

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 800 }} size="small">
        <TableHead>
          <TableRow>
            <TableCell
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                fontWeight: 'bold',
                width: 80,
                position: 'sticky',
                left: 0,
                zIndex: 2,
              }}
            >
              Пара
            </TableCell>
            {DAYS.map((day, index) => (
              <TableCell
                key={day}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 'bold',
                  minWidth: 180,
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {DAY_ABBR[index]}
                  </Typography>
                  <Typography variant="caption">
                    {format(addDays(startDate, index), 'dd.MM', { locale: ru })}
                  </Typography>
                </Box>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.entries(PAIR_SCHEDULE).map(([pairNum, time]) => {
            const pairNumber = parseInt(pairNum);
            return (
              <TableRow key={pairNumber} hover>
                <TableCell
                  sx={{
                    bgcolor: 'background.paper',
                    fontWeight: 'bold',
                    position: 'sticky',
                    left: 0,
                    zIndex: 1,
                    borderRight: 2,
                    borderColor: 'divider',
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '2px 0 4px rgba(0,0,0,0.3)' 
                      : '2px 0 4px rgba(0,0,0,0.1)',
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {pairNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {time.start}
                    </Typography>
                  </Box>
                </TableCell>
                {DAYS.map((_, dayIndex) => {
                  const daySessions = getSessionsForDayAndPair(dayIndex, pairNumber);
                  return (
                    <TableCell
                      key={dayIndex}
                      sx={{
                        verticalAlign: 'top',
                        minHeight: 80,
                        p: 1,
                        position: 'relative',
                      }}
                    >
                      {daySessions.length > 0 ? (
                        daySessions.map(renderSessionCell)
                      ) : editable ? (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            minHeight: 60,
                          }}
                        >
                          <Tooltip title="Добавить занятие">
                            <IconButton
                              size="small"
                              onClick={() => onAddSession?.(dayIndex, pairNumber)}
                              sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}
                              aria-label="Добавить занятие"
                            >
                              <Add fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ) : (
                        <Box sx={{ minHeight: 60 }} />
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default WeeklyScheduleGrid;
