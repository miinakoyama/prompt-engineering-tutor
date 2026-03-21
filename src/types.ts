export type UserBackground = 'Student' | 'Teacher' | 'Working Professional';

export type Technique = 'Zero-shot' | 'Few-shot' | 'Chain-of-Thought';

export type Level = 1 | 2 | 3;

export type PendingAction =
  | { kind: 'level'; level: Level }
  | { kind: 'module'; technique: Technique }
  | { kind: 'complete' };

export interface CriterionScore {
  id: string;
  label: string;
  score: 0 | 1;
  reason: string;
}

export interface FeedbackScore {
  totalScore: number;
  maxScore: number;
  grade: 'green' | 'yellow' | 'red';
  criteriaScores: CriterionScore[];
}

export interface LogEntry {
  id: string;
  type: 'intro' | 'build' | 'predict' | 'result' | 'review' | 'completion';
  content: string;
  prediction?: string;
  prompt?: string;
  generatedResponse?: string;
  selectedChoice?: string;
  isCorrect?: boolean;
  explanation?: string;
  technique?: Technique;
  level?: Level;
  submittedPrompt?: string;
  title?: string;
  task?: string;
  previousPrompt?: string;
  reviewType?: 'choice' | 'feedback';
  comparisonBad?: string;
  comparisonGood?: string;
  feedbackScore?: FeedbackScore;
  timestamp: number;
}

export interface RubricCriterion {
  id: string;
  label: string;
  description: string;
}

export interface Rubric {
  criteria: RubricCriterion[];
  thresholds: {
    green: number;
    yellow: number;
  };
}

export interface ModuleLevel {
  title: string;
  task: string;
  options?: string[];
  choices?: { text: string; isCorrect: boolean; explanation: string }[];
  blanks?: string[];
  template?: string;
  referencePrompt?: string;
  rubric?: Rubric;
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
