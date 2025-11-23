export type UserRole = 'guest' | 'student' | 'teacher' | 'admin' | 'superadmin';

export type SessionStatus = 'planned' | 'confirmed' | 'moved' | 'cancelled' | 'online';

export type SessionType = 'lecture' | 'practice' | 'lab' | 'seminar' | 'exam' | 'consultation';

export type RoomType = 'lecture' | 'lab' | 'seminar' | 'computer_lab' | 'auditorium';

export type EquipmentType = 'projector' | 'computer' | 'whiteboard' | 'smartboard' | 'video_conference' | 'lab_equipment';

export interface User {
  _id: string;
  name: string;
  email?: string;
  role: UserRole;
  telegramId?: string;
  groupNumber?: string;
  contacts?: {
    phone?: string;
    telegram?: string;
    email?: string;
  };
  notificationSettings?: {
    telegram: boolean;
    email: boolean;
    sessionChanges: boolean;
    sessionCancellations: boolean;
    sessionMoves: boolean;
    newSessions: boolean;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  _id: string;
  name: string;
  code: string;
  department: string;
  direction: string;
  credits: number;
  semester: number;
  maxStudents?: number;
  teachers: string[] | User[];
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  _id: string;
  number: string;
  building: string;
  capacity: number;
  floor?: number;
  equipment?: EquipmentType[];
  type: RoomType;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionHistory {
  changedAt: string;
  changedBy: string | User;
  changeType: 'created' | 'updated' | 'moved' | 'cancelled' | 'restored' | 'confirmed';
  changes: Record<string, any>;
  comment?: string;
}

export type WeekParity = 'both' | 'odd' | 'even';

export interface Session {
  _id: string;
  course: string | Course;
  pairNumber?: number;
  startAt: string;
  endAt: string;
  room: string | Room;
  teacher: string | User;
  groups: string[];
  subgroup?: 'all' | 'subgroup-1' | 'subgroup-2';
  weekParity?: WeekParity;
  cycleType?: 'regular' | 'cyclic';
  cycleStartDate?: string;
  cycleEndDate?: string;
  cycleName?: string;
  type: SessionType;
  status: SessionStatus;
  notes?: string;
  cancellationReason?: string;
  onlineLink?: string;
  history: SessionHistory[];
  createdBy?: string | User;
  createdAt: string;
  updatedAt: string;
  duration?: number;
}

export interface Registration {
  _id: string;
  user: string | User;
  session: string | Session;
  status: 'registered' | 'attended' | 'absent';
  registeredAt: string;
}

export interface Notification {
  _id: string;
  type: 'session_created' | 'session_cancelled' | 'session_moved' | 'time_changed' | 'room_changed' | 'teacher_changed' | 'status_changed';
  session: string | Session;
  affectedGroups: string[];
  message: string;
  changes?: Record<string, any>;
  comment?: string;
  sentAt: string;
  createdBy?: string | User;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    name: string;
    email?: string;
    role: UserRole;
    groupNumber?: string;
    telegramId?: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export interface ConflictDetails {
  hasConflict: boolean;
  roomConflict?: boolean;
  teacherConflict?: boolean;
  groupConflicts?: string[];
  conflictingSessions?: Session[];
}

export interface ScheduleResponse {
  success: boolean;
  sessions: Session[];
  date?: string;
  schedule?: Record<string, Session[]>;
  weekStart?: string;
  weekEnd?: string;
}