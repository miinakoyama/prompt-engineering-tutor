export type UserBackground = 'Academic Setting' | 'Working Professional';

export type Technique = 'Zero-shot' | 'Few-shot' | 'Chain-of-Thought' | 'Technique Selection';

export type PromptingMethod = 'Zero-shot' | 'Few-shot' | 'Chain-of-Thought';

export type Level = 1 | 2;

export type FlowStage = 'pretest' | 'learning' | 'posttest' | 'done';

export type AssessmentPhase = 'pre' | 'post';

export type AssessmentTaskId = 1 | 2 | 3 | 4;

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
  selectedMethod?: PromptingMethod;
  selectedRationale?: string;
  methodStepCompleted?: boolean;
  /** Technique Selection L2 step 1: number of method submissions (max 2). */
  methodSelectionAttempts?: number;
  methodFeedback?: string;
  /** Shown in bold below method feedback when another Step 1 attempt is allowed. */
  methodFeedbackRetryHint?: string;
  methodFeedbackScore?: FeedbackScore;
  isCorrect?: boolean;
  explanation?: string;
  technique?: Technique;
  level?: Level;
  submittedPrompt?: string;
  title?: string;
  task?: string;
  reviewType?: 'choice' | 'feedback';
  comparisonBad?: string;
  comparisonGood?: string;
  feedbackScore?: FeedbackScore;
  referencePrompt?: string;
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
  /** Methodology hint only—must not restate the reference answer. */
  hint?: string;
  options?: string[];
  choices?: { text: string; isCorrect: boolean; explanation: string }[];
  blanks?: string[];
  template?: string;
  referencePrompt?: string;
  referenceMethod?: PromptingMethod;
  referenceRationale?: string;
  /** For Technique Selection L2: why each non-reference method is a poor fit for this task. */
  incorrectMethodFeedback?: Partial<Record<PromptingMethod, string>>;
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

export interface AssessmentTaskBase {
  id: AssessmentTaskId;
  title: string;
  technique: Technique | 'Method Selection';
  scenario: string;
  requirement: string;
  referencePrompt: string;
  rubric: Rubric;
}

export interface AssessmentTaskChoice {
  id: string;
  text: string;
}

export type AssessmentMcqTask = AssessmentTaskBase & {
  choices: AssessmentTaskChoice[];
  correctChoiceId: string;
  requiresMethodSelection?: false;
  referenceMethod?: never;
  referenceRationale?: never;
};

export type AssessmentFreeResponseTask = AssessmentTaskBase & {
  choices?: undefined;
  correctChoiceId?: undefined;
  requiresMethodSelection?: boolean;
  referenceMethod?: PromptingMethod;
  referenceRationale?: string;
};

export type AssessmentTask = AssessmentMcqTask | AssessmentFreeResponseTask;

export interface AssessmentAnswer {
  prompt: string;
  selectedChoice?: string;
  method?: PromptingMethod;
  rationale?: string;
}

export type AssessmentAnswers = Record<AssessmentTaskId, AssessmentAnswer>;

export interface AssessmentTaskScore {
  taskId: AssessmentTaskId;
  promptScore: FeedbackScore;
  methodRationaleScore?: FeedbackScore;
}

export interface AssessmentScoreSet {
  phase: AssessmentPhase;
  taskScores: AssessmentTaskScore[];
  totalScore: number;
  maxScore: number;
}

export interface AssessmentSubmission {
  phase: AssessmentPhase;
  answers: AssessmentAnswers;
}

export interface AssessmentRecordPayload {
  studentUsername: string;
  background: UserBackground;
  sessionId?: string;
  durations: {
    pretestSec: number;
    posttestSec: number;
    courseSec: number;
  };
  preSurvey: {
    skillLevel: string;
    confidence: string;
  };
  postSurvey: {
    confidence: string;
  };
  pretest: AssessmentSubmission;
  posttest: AssessmentSubmission;
  scores: {
    pretest: AssessmentScoreSet;
    posttest: AssessmentScoreSet;
  };
  submittedAt: number;
}
