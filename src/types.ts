export type AppScreen = 'home' | 'chat' | 'history' | 'profile' | 'settings';

export type ResponseStyle = 'standard' | 'concise' | 'step_by_step' | 'socratic';

export interface UserProfile {
  userId: string;
  displayName: string;
  name?: string;
  email: string;
  photoURL?: string;
  studentGrade: StudentGrade;
  preferredSubject: SubjectFocus;
  learningGoals?: string;
  customInstructions?: string;
  avatarSeed?: string;
  authProvider?: 'password' | 'google' | 'email';
  createdAt?: number;
  lastLoginAt?: number;
}

export interface AuthSessionData {
  token: string;
  user: UserProfile;
}

export interface AppSettings {
  defaultGrade: StudentGrade;
  defaultSubject: SubjectFocus;
  responseStyle: ResponseStyle;
  speechRate: number;
  autoScroll: boolean;
  modelIdentifier: string;
}

export type StudentGrade = 
  | 'general'
  | 'elementary'
  | 'middle'
  | 'high_school'
  | 'college';

export type SubjectFocus = 
  | 'all'
  | 'mathematics'
  | 'science'
  | 'english_writing'
  | 'social_studies'
  | 'coding_computer_science';

export interface MessageImage {
  id: string;
  mimeType: string;
  data: string; // base64 string
  name?: string;
  size?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  images?: MessageImage[];
  isError?: boolean;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  studentGrade: StudentGrade;
  subjectFocus: SubjectFocus;
}

export interface PresetPrompt {
  id: string;
  label: string;
  prompt: string;
  icon: string;
  category: 'math' | 'science' | 'study' | 'writing';
}

