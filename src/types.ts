export type UserBackground = 'Student' | 'Teacher' | 'Working Professional';

export type Technique = 'Zero-shot' | 'Few-shot' | 'Chain-of-Thought';

export type Level = 1 | 2 | 3;

export interface LogEntry {
  id: string;
  type: 'intro' | 'build' | 'predict' | 'result' | 'review';
  content: string;
  prediction?: string;
  prompt?: string;
  selectedChoice?: string;
  isCorrect?: boolean;
  explanation?: string;
  technique?: Technique;
  level?: Level;
  submittedPrompt?: string;
  timestamp: number;
}

export interface ModuleLevel {
  title: string;
  task: string;
  options?: string[];
  choices?: { text: string; isCorrect: boolean; explanation: string }[];
  blanks?: string[];
  template?: string;
}

export interface ModuleContent {
  badExample: string;
  goodExample: string;
  instruction: string;
  levels: { [key in Level]: ModuleLevel };
}

export interface Module {
  id: Technique;
  title: string;
  description: string;
  byPersona: Record<UserBackground, ModuleContent>;
}
