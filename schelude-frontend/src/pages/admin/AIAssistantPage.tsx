import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Paper,
  Box,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { Send, SmartToy, Person } from '@mui/icons-material';
import { aiService } from '../../services/aiService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await aiService.chat(inputMessage);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Ошибка при отправке сообщения');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const exampleQueries = [
    'Препод заболел, куда перенести пару?',
    'Аудитория закрыта из-за аварии, куда переставить?',
    'Какие аудитории свободны сегодня на 3 паре?',
    'Покажи расписание на завтра',
  ];

  return (
    <Container maxWidth="lg" sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          AI Ассистент
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Задавайте вопросы по управлению расписанием. AI предложит решения, но не будет вносить изменения автоматически.
        </Typography>
      </Box>

      {messages.length === 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Примеры запросов:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {exampleQueries.map((query, index) => (
              <Chip
                key={index}
                label={query}
                onClick={() => setInputMessage(query)}
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
        </Box>
      )}

      <Paper
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          mb: 2,
        }}
      >
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                gap: 1,
                alignItems: 'flex-start',
                flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
              }}
            >
              <Box
                sx={{
                  bgcolor: message.role === 'user' ? 'primary.main' : 'grey.300',
                  color: message.role === 'user' ? 'white' : 'inherit',
                  borderRadius: '50%',
                  p: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 40,
                  height: 40,
                }}
              >
                {message.role === 'user' ? <Person /> : <SmartToy />}
              </Box>
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  maxWidth: '70%',
                  bgcolor: message.role === 'user' ? 'primary.light' : 'background.paper',
                  color: message.role === 'user' ? 'white' : 'inherit',
                }}
              >
                <Typography
                  variant="body1"
                  sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                >
                  {message.content}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 1,
                    opacity: 0.7,
                  }}
                >
                  {message.timestamp.toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Typography>
              </Paper>
            </Box>
          ))}

          {isLoading && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Box
                sx={{
                  bgcolor: 'grey.300',
                  borderRadius: '50%',
                  p: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 40,
                  height: 40,
                }}
              >
                <SmartToy />
              </Box>
              <Paper elevation={1} sx={{ p: 2 }}>
                <CircularProgress size={20} />
              </Paper>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Напишите ваш вопрос..."
              disabled={isLoading}
            />
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              sx={{ alignSelf: 'flex-end' }}
            >
              <Send />
            </IconButton>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default AIAssistantPage;
