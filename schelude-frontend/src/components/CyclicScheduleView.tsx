import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from '@mui/material';
import { ExpandMore, DateRange } from '@mui/icons-material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import SessionCard from './SessionCard';
import { Session } from '../types';

interface Cycle {
  cycleName: string;
  cycleStartDate: string;
  cycleEndDate: string;
  sessionCount: number;
  sessions: Session[];
}

interface CyclicScheduleViewProps {
  cycles: Cycle[];
}

const CyclicScheduleView: React.FC<CyclicScheduleViewProps> = ({ cycles }) => {
  if (!cycles || cycles.length === 0) {
    return (
      <Alert severity="info">
        Нет активных циклов расписания
      </Alert>
    );
  }

  const isCurrentCycle = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return now >= start && now <= end;
  }

  return (
    <Stack spacing={2}>
      {cycles.map((cycle, index) => {
        const isCurrent = isCurrentCycle(cycle.cycleStartDate, cycle.cycleEndDate);
        
        return (
          <Accordion
            key={index}
            defaultExpanded={isCurrent}
            sx={{
              border: isCurrent ? '2px solid' : '1px solid',
              borderColor: isCurrent ? 'primary.main' : 'divider',
              bgcolor: isCurrent ? 'primary.50' : 'background.paper',
            }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ width: '100%', pr: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6">
                    {cycle.cycleName}
                  </Typography>
                  {isCurrent && (
                    <Chip label="Текущий" color="primary" size="small" />
                  )}
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <DateRange fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {format(new Date(cycle.cycleStartDate), 'd MMMM', { locale: ru })} -{' '}
                    {format(new Date(cycle.cycleEndDate), 'd MMMM yyyy', { locale: ru })}
                  </Typography>
                  <Chip
                    label={`${cycle.sessionCount} занятий`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                {cycle.sessions.map((session) => (
                  <SessionCard key={session._id} session={session} showDate />
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Stack>
  );
};

export default CyclicScheduleView;
