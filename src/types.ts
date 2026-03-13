export type UserBackground = 'Student' | 'Teacher' | 'Professional';

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

export interface Module {
  id: Technique;
  title: string;
  description: string;
  goodExample: string;
  badExample: string;
  instruction: string;
  levels: {
    [key in Level]: {
      title: string;
      task: string;
      options?: string[]; // For Level 1 (original)
      choices?: { text: string; isCorrect: boolean; explanation: string }[]; // For Level 1 (new)
      blanks?: string[]; // For Level 2
      template?: string; // For Level 3
    }
  };
}
