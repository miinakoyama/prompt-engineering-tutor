/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Home, RotateCcw, Send } from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import {
  AssessmentAnswer,
  AssessmentAnswers,
  AssessmentPhase,
  AssessmentRecordPayload,
  AssessmentScoreSet,
  AssessmentTask,
  AssessmentTaskScore,
  AssessmentTaskId,
  FlowStage,
  LogEntry,
  PendingAction,
  PromptingMethod,
  Technique,
  Level,
  UserBackground,
  FeedbackScore,
  CriterionScore,
  Rubric,
} from "./types";
import {
  MODULES,
  ZERO_SHOT_RUBRIC,
  FEW_SHOT_RUBRIC,
  COT_RUBRIC,
  TECHNIQUE_SELECTION_RUBRIC,
  METHOD_OPTIONS,
  METHOD_RATIONALE_RUBRIC,
  POST_TEST_TASKS,
  PRE_TEST_TASKS,
} from "./constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import ReactMarkdown from "react-markdown";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = "gemini-3.1-flash-lite-preview";

function getRubricForTechnique(technique: Technique): Rubric {
  switch (technique) {
    case "Zero-shot":
      return ZERO_SHOT_RUBRIC;
    case "Few-shot":
      return FEW_SHOT_RUBRIC;
    case "Chain-of-Thought":
      return COT_RUBRIC;
    case "Technique Selection":
      return TECHNIQUE_SELECTION_RUBRIC;
    default: {
      const _exhaustiveCheck: never = technique;
      throw new Error(`Unsupported technique: ${_exhaustiveCheck}`);
    }
  }
}

function getRubricForMethod(method: PromptingMethod): Rubric {
  switch (method) {
    case "Zero-shot":
      return ZERO_SHOT_RUBRIC;
    case "Few-shot":
      return FEW_SHOT_RUBRIC;
    case "Chain-of-Thought":
      return COT_RUBRIC;
    default: {
      const _exhaustiveCheck: never = method;
      throw new Error(`Unsupported method: ${_exhaustiveCheck}`);
    }
  }
}

function parseGradingResponse(
  response: string,
  rubric: Rubric,
): FeedbackScore | null {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    const criteriaScores: CriterionScore[] = rubric.criteria.map(
      (criterion) => {
        const score = parsed.scores?.[criterion.id];
        return {
          id: criterion.id,
          label: criterion.label,
          score: score?.met ? 1 : 0,
          reason: score?.reason || "",
        };
      },
    );

    const totalScore = criteriaScores.reduce((sum, c) => sum + c.score, 0);
    const maxScore = criteriaScores.length;

    let grade: "green" | "yellow" | "red";
    if (totalScore >= rubric.thresholds.green) {
      grade = "green";
    } else if (totalScore >= rubric.thresholds.yellow) {
      grade = "yellow";
    } else {
      grade = "red";
    }

    return {
      totalScore,
      maxScore,
      grade,
      criteriaScores,
    };
  } catch {
    return null;
  }
}

async function callGeminiWithRetry(
  prompt: string,
  maxRetries = 3,
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });
      return response.text || "No response received.";
    } catch (error) {
      lastError = error as Error;
      const errorMessage = String(error);

      if (
        errorMessage.includes("429") ||
        errorMessage.includes("RESOURCE_EXHAUSTED")
      ) {
        const waitTime = Math.pow(2, attempt + 1) * 1000 + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error("Failed after retries");
}

const TECHNIQUE_SUMMARIES: Record<Technique, string> = {
  "Zero-shot":
    "Write one clear instruction with the right audience, format, and constraints.",
  "Few-shot":
    "Guide the model with consistent examples so it can continue the pattern.",
  "Chain-of-Thought":
    "Ask for step-by-step reasoning when the task needs structured thinking.",
  "Technique Selection":
    "Select the most appropriate prompting technique, then apply it effectively.",
};

const EMPTY_PROGRESS: Record<Technique, Level[]> = {
  "Zero-shot": [],
  "Few-shot": [],
  "Chain-of-Thought": [],
  "Technique Selection": [],
};

const ASSESSMENT_TASK_IDS: AssessmentTaskId[] = [1, 2, 3, 4];
const SKILL_LEVEL_OPTIONS = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
];
const CONFIDENCE_OPTIONS = [
  "Not confident",
  "Slightly confident",
  "Moderately confident",
  "Very confident",
  "Extremely confident",
];

function createEmptyAssessmentAnswers(): AssessmentAnswers {
  return {
    1: { prompt: "" },
    2: { prompt: "" },
    3: { prompt: "" },
    4: { prompt: "", method: undefined, rationale: "" },
  };
}

function getTechniqueFromPath(pathname: string): Technique | null {
  const normalized = pathname.replace(/^\/+|\/+$/g, "").toLowerCase();
  switch (normalized) {
    case "zero":
    case "zero-shot":
      return "Zero-shot";
    case "few":
    case "few-shot":
      return "Few-shot";
    case "cot":
    case "chain-of-thought":
      return "Chain-of-Thought";
    case "selection":
    case "technique-selection":
      return "Technique Selection";
    default:
      return null;
  }
}

function getFlowStageFromPath(pathname: string): FlowStage | null {
  const normalized = pathname.replace(/^\/+|\/+$/g, "").toLowerCase();
  switch (normalized) {
    case "pre":
    case "pretest":
      return "pretest";
    case "post":
    case "posttest":
      return "posttest";
    default:
      return null;
  }
}

export default function App() {
  const [flowStage, setFlowStage] = useState<FlowStage>(() => {
    if (typeof window === "undefined") {
      return "pretest";
    }
    const stageFromPath = getFlowStageFromPath(window.location.pathname);
    if (stageFromPath) {
      return stageFromPath;
    }
    if (getTechniqueFromPath(window.location.pathname)) {
      return "learning";
    }
    return "pretest";
  });
  const [background, setBackground] = useState<UserBackground | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentTechnique, setCurrentTechnique] =
    useState<Technique>("Zero-shot");
  const [currentLevel, setCurrentLevel] = useState<Level>(1);
  const [isWaitingForResult, setIsWaitingForResult] = useState(false);
  const [isModuleIntro, setIsModuleIntro] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [completedLevels, setCompletedLevels] =
    useState<Record<Technique, Level[]>>(EMPTY_PROGRESS);
  const [expandedResults, setExpandedResults] = useState<
    Record<string, boolean>
  >({});
  const [promptDrafts, setPromptDrafts] = useState<Record<string, string>>({});
  const [methodReviewingLogId, setMethodReviewingLogId] = useState<
    string | null
  >(null);
  const [focusLogId, setFocusLogId] = useState<string | null>(null);
  const [pretestAnswers, setPretestAnswers] = useState<AssessmentAnswers>(
    createEmptyAssessmentAnswers(),
  );
  const [posttestAnswers, setPosttestAnswers] = useState<AssessmentAnswers>(
    createEmptyAssessmentAnswers(),
  );
  const [preSkillLevel, setPreSkillLevel] = useState("");
  const [preConfidence, setPreConfidence] = useState("");
  const [postConfidence, setPostConfidence] = useState("");
  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false);
  const [, setAssessmentRecords] = useState<AssessmentRecordPayload[]>([]);
  const [deepLinkedTechnique] = useState<Technique | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return getTechniqueFromPath(window.location.pathname);
  });

  useEffect(() => {
    const stageFromPath = getFlowStageFromPath(window.location.pathname);
    if (stageFromPath === "posttest") {
      // Allow direct access to /post for testing workflows.
      setBackground("Academic Setting");
      return;
    }

    if (deepLinkedTechnique) {
      // Developer shortcut: jump directly into a module route like /few.
      setFlowStage("learning");
      setBackground("Academic Setting");
      setCompletedLevels(EMPTY_PROGRESS);
      setExpandedResults({});
      setPendingAction(null);
      startModule(deepLinkedTechnique, "Academic Setting");
    }
  }, [deepLinkedTechnique]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focusLogId) {
      return;
    }

    const element = document.getElementById(`log-${focusLogId}`);
    if (!element) {
      return;
    }

    requestAnimationFrame(() => {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setFocusLogId(null);
    });
  }, [focusLogId, logs]);

  const isAssessmentComplete = (
    tasks: AssessmentTask[],
    answers: AssessmentAnswers,
  ) => {
    return tasks.every((task) => {
      const answer = answers[task.id];
      if (!answer?.prompt.trim()) {
        return false;
      }
      if (task.requiresMethodSelection) {
        return Boolean(answer.method && answer.rationale?.trim());
      }
      return true;
    });
  };

  const isSurveyComplete = (phase: AssessmentPhase) => {
    if (phase === "pre") {
      return Boolean(preSkillLevel && preConfidence);
    }
    return Boolean(postConfidence);
  };

  const updateAssessmentAnswer = (
    phase: AssessmentPhase,
    taskId: AssessmentTaskId,
    patch: Partial<AssessmentAnswer>,
  ) => {
    const updater = (prev: AssessmentAnswers): AssessmentAnswers => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        ...patch,
      },
    });

    if (phase === "pre") {
      setPretestAnswers(updater);
      return;
    }
    setPosttestAnswers(updater);
  };

  const formatCriteriaList = (rubric: Rubric) =>
    rubric.criteria
      .map((criterion) => `- ${criterion.id}: ${criterion.description}`)
      .join("\n");

  const formatScoreJsonTemplate = (rubric: Rubric) =>
    rubric.criteria
      .map((criterion) => `    "${criterion.id}": { "met": true_or_false }`)
      .join(",\n");

  const createFallbackFeedbackScore = (rubric: Rubric): FeedbackScore => ({
    totalScore: 0,
    maxScore: rubric.criteria.length,
    grade: "red",
    criteriaScores: rubric.criteria.map((criterion) => ({
      id: criterion.id,
      label: criterion.label,
      score: 0,
      reason: "",
    })),
  });

  const parseOrFallbackFeedbackScore = (response: string, rubric: Rubric) =>
    parseGradingResponse(response, rubric) ||
    createFallbackFeedbackScore(rubric);

  const buildPromptScoringRequest = (
    task: AssessmentTask,
    learnerPrompt: string,
    rubric: Rubric,
  ) => {
    const criteriaList = formatCriteriaList(rubric);
    const scoreJsonTemplate = formatScoreJsonTemplate(rubric);

    return `You are a prompt-writing evaluator.

SCENARIO:
${task.scenario}

REQUIREMENT:
${task.requirement}

REFERENCE PROMPT:
"""${task.referencePrompt}"""

LEARNER PROMPT:
"""${learnerPrompt}"""

EVALUATION CRITERIA:
${criteriaList}

For each criterion, return met true/false.

Respond with ONLY valid JSON:
{
  "scores": {
${scoreJsonTemplate}
  },
  "feedback": "1-2 concise evaluator notes."
}`;
  };

  const buildMethodRationaleScoringRequest = (
    task: AssessmentTask,
    selectedMethod: PromptingMethod,
    rationale: string,
  ) => {
    const rubric = METHOD_RATIONALE_RUBRIC;
    const criteriaList = formatCriteriaList(rubric);
    const scoreJsonTemplate = formatScoreJsonTemplate(rubric);

    return `You are evaluating method selection for prompt engineering.

TASK:
${task.requirement}

REFERENCE METHOD:
${task.referenceMethod || "N/A"}

REFERENCE RATIONALE:
${task.referenceRationale || "N/A"}

LEARNER METHOD:
${selectedMethod}

LEARNER RATIONALE:
${rationale}

EVALUATION CRITERIA:
${criteriaList}

Respond with ONLY valid JSON:
{
  "scores": {
${scoreJsonTemplate}
  },
  "feedback": "1-2 concise evaluator notes."
}`;
  };

  const gradeSingleAssessmentTask = async (
    task: AssessmentTask,
    answer: AssessmentAnswer,
  ): Promise<AssessmentTaskScore> => {
    const promptRubric =
      task.requiresMethodSelection && answer.method
        ? getRubricForMethod(answer.method)
        : task.rubric;

    const promptScoreText = await callGeminiWithRetry(
      buildPromptScoringRequest(task, answer.prompt, promptRubric),
    );
    const promptScore = parseOrFallbackFeedbackScore(
      promptScoreText,
      promptRubric,
    );

    let methodRationaleScore: FeedbackScore | undefined;
    if (task.requiresMethodSelection && answer.method) {
      const methodScoreText = await callGeminiWithRetry(
        buildMethodRationaleScoringRequest(
          task,
          answer.method,
          answer.rationale || "",
        ),
      );
      methodRationaleScore = parseOrFallbackFeedbackScore(
        methodScoreText,
        METHOD_RATIONALE_RUBRIC,
      );
    }

    return {
      taskId: task.id,
      promptScore,
      methodRationaleScore,
    };
  };

  const gradeAssessmentPhase = async (
    phase: AssessmentPhase,
    tasks: AssessmentTask[],
    answers: AssessmentAnswers,
  ): Promise<AssessmentScoreSet> => {
    const taskScores = await Promise.all(
      tasks.map((task) => gradeSingleAssessmentTask(task, answers[task.id])),
    );

    const totalScore = taskScores.reduce((sum, taskScore) => {
      return (
        sum +
        taskScore.promptScore.totalScore +
        (taskScore.methodRationaleScore?.totalScore || 0)
      );
    }, 0);

    const maxScore = taskScores.reduce((sum, taskScore) => {
      return (
        sum +
        taskScore.promptScore.maxScore +
        (taskScore.methodRationaleScore?.maxScore || 0)
      );
    }, 0);

    return {
      phase,
      taskScores,
      totalScore,
      maxScore,
    };
  };

  const persistAssessment = (payload: AssessmentRecordPayload) => {
    setAssessmentRecords((prev) => [...prev, payload]);
    console.info("Assessment data captured", payload);
  };

  const addLog = (entry: Omit<LogEntry, "id" | "timestamp">) => {
    const id = Math.random().toString(36).slice(2, 11);
    setLogs((prev) => [
      ...prev,
      {
        ...entry,
        id,
        timestamp: Date.now(),
      },
    ]);
    return id;
  };

  const markLevelComplete = (technique: Technique, level: Level) => {
    setCompletedLevels((prev) => {
      const completed = prev[technique];
      if (completed.includes(level)) {
        return prev;
      }

      return {
        ...prev,
        [technique]: [...completed, level].sort(),
      };
    });
  };

  const startModule = (technique: Technique, persona?: UserBackground) => {
    const activeBackground = persona ?? background;
    if (!activeBackground) {
      return;
    }

    const module = MODULES.find((item) => item.id === technique)!;
    const content = module.byPersona[activeBackground];

    setCurrentTechnique(technique);
    setCurrentLevel(1);
    setPendingAction(null);
    setIsModuleIntro(true);
    setLogs([]);
    setPromptDrafts({});
    setMethodReviewingLogId(null);

    const introLogId = addLog({
      type: "intro",
      content: `### ${module.title}\n${module.description}`,
    });
    addLog({
      type: "intro",
      content: "",
      technique,
      comparisonBad: content.badExample,
      comparisonGood: content.goodExample,
    });
    setFocusLogId(introLogId);
  };

  const handleBackgroundSelect = (selectedBackground: UserBackground) => {
    setFlowStage("learning");
    setBackground(selectedBackground);
    setCompletedLevels(EMPTY_PROGRESS);
    setExpandedResults({});
    setPendingAction(null);
    startModule(deepLinkedTechnique ?? "Zero-shot", selectedBackground);
  };

  const handleReset = () => {
    setFlowStage("pretest");
    setBackground(null);
    setLogs([]);
    setCurrentTechnique("Zero-shot");
    setCurrentLevel(1);
    setIsWaitingForResult(false);
    setIsModuleIntro(false);
    setPendingAction(null);
    setCompletedLevels(EMPTY_PROGRESS);
    setExpandedResults({});
    setFocusLogId(null);
    setPromptDrafts({});
    setMethodReviewingLogId(null);
    setPretestAnswers(createEmptyAssessmentAnswers());
    setPosttestAnswers(createEmptyAssessmentAnswers());
    setPreSkillLevel("");
    setPreConfidence("");
    setPostConfidence("");
    setIsSubmittingAssessment(false);
  };

  const handleRestartTrack = () => {
    if (!background) {
      return;
    }

    setCompletedLevels(EMPTY_PROGRESS);
    setExpandedResults({});
    setPendingAction(null);
    setPromptDrafts({});
    setMethodReviewingLogId(null);
    startModule("Zero-shot", background);
  };

  const proceedToLevel = (level: Level) => {
    if (!background) {
      return;
    }

    const module = MODULES.find((item) => item.id === currentTechnique)!;
    const levelData = module.byPersona[background].levels[level];

    setCurrentLevel(level);
    setPendingAction(null);
    setIsModuleIntro(false);

    const logId = addLog({
      type: "build",
      content: "",
      level,
      technique: currentTechnique,
      title: `Level ${level}: ${levelData.title}`,
      task: levelData.task,
    });

    setFocusLogId(logId);
  };

  const handleContinue = () => {
    if (!pendingAction) {
      return;
    }

    if (pendingAction.kind === "level") {
      proceedToLevel(pendingAction.level);
      return;
    }

    if (pendingAction.kind === "module") {
      startModule(pendingAction.technique);
      return;
    }

    setPendingAction(null);
    setFlowStage("posttest");
  };

  const handleChoiceSelect = (
    choice: { text: string; isCorrect: boolean; explanation: string },
    logId: string,
  ) => {
    setLogs((prev) =>
      prev.map((log) => {
        if (log.id === logId) {
          return {
            ...log,
            selectedChoice: choice.text,
            isCorrect: choice.isCorrect,
            explanation: choice.explanation,
          };
        }
        return log;
      }),
    );

    addLog({
      type: "review",
      content: `**${choice.isCorrect ? "Correct" : "Not quite"}**\n\n${choice.explanation}`,
      isCorrect: choice.isCorrect,
      reviewType: "choice",
    });

    markLevelComplete(currentTechnique, currentLevel);

    if (!background) {
      return;
    }

    const module = MODULES.find((item) => item.id === currentTechnique)!;
    const instructionLogId = addLog({
      type: "intro",
      content: module.byPersona[background].instruction,
    });
    setFocusLogId(instructionLogId);

    const nextLevel = (currentLevel + 1) as Level;
    if (nextLevel <= 2) {
      setPendingAction({ kind: "level", level: nextLevel });
    }
  };

  const handlePromptSubmit = async (prompt: string, logId: string) => {
    if (!background || !prompt.trim()) {
      return;
    }

    const targetLog = logs.find((entry) => entry.id === logId);
    if (
      targetLog?.technique === "Technique Selection" &&
      !targetLog.methodStepCompleted
    ) {
      return;
    }

    const activeTechnique = currentTechnique;
    const activeLevel = currentLevel;
    const module = MODULES.find((item) => item.id === activeTechnique)!;
    const moduleContent = module.byPersona[background];
    const levelTask = moduleContent.levels[activeLevel].task;

    setLogs((prev) =>
      prev.map((log) => {
        if (log.id === logId) {
          return { ...log, submittedPrompt: prompt };
        }
        return log;
      }),
    );

    setPendingAction(null);
    setIsWaitingForResult(true);
    setPromptDrafts((prev) => {
      const next = { ...prev };
      delete next[logId];
      return next;
    });

    try {
      const resultText = await callGeminiWithRetry(prompt);

      const levelData = moduleContent.levels[activeLevel];
      const selectedMethod = targetLog?.selectedMethod;
      const rubric =
        activeTechnique === "Technique Selection" && selectedMethod
          ? getRubricForMethod(selectedMethod)
          : levelData.rubric || getRubricForTechnique(activeTechnique);
      const referencePrompt = levelData.referencePrompt || "";
      const methodContext =
        activeTechnique === "Technique Selection"
          ? `\nSELECTED METHOD:\n${selectedMethod || "Not provided"}\n\nLEARNER RATIONALE:\n"""${targetLog?.selectedRationale || ""}"""\n`
          : "";

      const criteriaList = rubric.criteria
        .map((c) => `- ${c.id}: ${c.description}`)
        .join("\n");

      const gradingPrompt = `You are a warm, encouraging prompt-writing instructor using reference-guided grading.

TASK ASSIGNED TO LEARNER:
${levelTask}

REFERENCE PROMPT (gold standard):
"""${referencePrompt}"""

LEARNER'S PROMPT:
"""${prompt}"""

AI RESPONSE TO LEARNER'S PROMPT:
"""${resultText}"""
${methodContext}

EVALUATION CRITERIA:
${criteriaList}

INSTRUCTIONS:
1. Compare the learner's prompt against the reference prompt
2. For each criterion, determine if the learner's prompt meets it (true/false)
3. Write encouraging, constructive feedback based on how many criteria were met:
   - If 3-4 met: Celebrate their success! Mention what they did well. Optionally suggest a small refinement.
   - If 2 met: Acknowledge what's working, then kindly explain what's missing and how to improve.
   - If 0-1 met: Be encouraging! Find something positive to say, then gently guide them on the most important thing to focus on.

Respond with ONLY valid JSON in this exact format:
{
  "scores": {
${rubric.criteria.map((c) => `    "${c.id}": { "met": true_or_false }`).join(",\n")}
  },
  "feedback": "2-3 sentences of warm, constructive feedback. Be specific about what they did well and what to improve."
}`;

      const gradingResponse = await callGeminiWithRetry(gradingPrompt);
      const feedbackScore = parseGradingResponse(gradingResponse, rubric);

      let feedbackText = "";
      try {
        const jsonMatch = gradingResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          feedbackText = parsed.feedback || "";
        }
      } catch {
        feedbackText = "";
      }

      const reviewLogId = addLog({
        type: "review",
        content:
          feedbackText ||
          "Good effort! Try adding more specific details to make your prompt clearer.",
        reviewType: "feedback",
        feedbackScore: feedbackScore || undefined,
        prompt,
        generatedResponse: resultText,
      });

      setExpandedResults((prev) => ({
        ...prev,
        [reviewLogId]: false,
      }));
      setFocusLogId(reviewLogId);
      setIsWaitingForResult(false);

      markLevelComplete(activeTechnique, activeLevel);

      const nextLevel = (activeLevel + 1) as Level;
      if (nextLevel <= 2) {
        setPendingAction({ kind: "level", level: nextLevel });
        return;
      }

      const nextTechniqueIndex =
        MODULES.findIndex((item) => item.id === activeTechnique) + 1;
      if (nextTechniqueIndex < MODULES.length) {
        setPendingAction({
          kind: "module",
          technique: MODULES[nextTechniqueIndex].id,
        });
        return;
      }

      setPendingAction({ kind: "complete" });
    } catch (error) {
      console.error("ApiError:", error);
      setIsWaitingForResult(false);

      const errorMessage = String(error);
      let userMessage =
        "An error occurred while communicating with the AI. Please try again.";

      if (
        errorMessage.includes("429") ||
        errorMessage.includes("RESOURCE_EXHAUSTED")
      ) {
        userMessage =
          "API rate limit reached. Please wait a moment and try again. If this persists, consider upgrading your API plan.";
      } else if (errorMessage.includes("API_KEY")) {
        userMessage =
          "API key issue detected. Please check your API key configuration.";
      }

      addLog({
        type: "intro",
        content: userMessage,
      });
    }
  };

  const handleTechniqueSelectionMethodSubmit = async (logId: string) => {
    if (!background) {
      return;
    }

    const targetLog = logs.find((entry) => entry.id === logId);
    if (
      !targetLog ||
      targetLog.technique !== "Technique Selection" ||
      !targetLog.selectedMethod ||
      !targetLog.selectedRationale?.trim()
    ) {
      return;
    }

    const module = MODULES.find((item) => item.id === targetLog.technique)!;
    const levelData = module.byPersona[background].levels[targetLog.level || 2];
    const gradingPrompt = `You are evaluating method selection for prompt engineering.

TASK:
${levelData.task}

REFERENCE METHOD:
${levelData.referenceMethod || "N/A"}

REFERENCE RATIONALE:
${levelData.referenceRationale || "N/A"}

LEARNER METHOD:
${targetLog.selectedMethod}

LEARNER RATIONALE:
${targetLog.selectedRationale}

EVALUATION CRITERIA:
${formatCriteriaList(METHOD_RATIONALE_RUBRIC)}

Respond with ONLY valid JSON:
{
  "scores": {
${formatScoreJsonTemplate(METHOD_RATIONALE_RUBRIC)}
  },
  "feedback": "2-3 sentences of concise feedback on method choice quality."
}`;

    setMethodReviewingLogId(logId);
    try {
      const gradingResponse = await callGeminiWithRetry(gradingPrompt);
      const methodFeedbackScore = parseOrFallbackFeedbackScore(
        gradingResponse,
        METHOD_RATIONALE_RUBRIC,
      );

      let feedbackText = "";
      try {
        const jsonMatch = gradingResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          feedbackText = parsed.feedback || "";
        }
      } catch {
        feedbackText = "";
      }

      setLogs((prev) =>
        prev.map((log) =>
          log.id === logId
            ? {
                ...log,
                methodStepCompleted: true,
                methodFeedback:
                  feedbackText ||
                  "Nice start. Refine your method rationale to align with task structure.",
                methodFeedbackScore,
              }
            : log,
        ),
      );
    } finally {
      setMethodReviewingLogId(null);
    }
  };

  const handlePretestSubmit = () => {
    if (
      !isAssessmentComplete(PRE_TEST_TASKS, pretestAnswers) ||
      !isSurveyComplete("pre")
    ) {
      return;
    }
    setFlowStage("learning");
  };

  const handlePosttestSubmit = async () => {
    if (
      !background ||
      !isAssessmentComplete(POST_TEST_TASKS, posttestAnswers) ||
      !isSurveyComplete("post")
    ) {
      return;
    }

    setIsSubmittingAssessment(true);
    try {
      const [preScores, postScores] = await Promise.all([
        gradeAssessmentPhase("pre", PRE_TEST_TASKS, pretestAnswers),
        gradeAssessmentPhase("post", POST_TEST_TASKS, posttestAnswers),
      ]);

      persistAssessment({
        background,
        preSurvey: {
          skillLevel: preSkillLevel,
          confidence: preConfidence,
        },
        postSurvey: {
          confidence: postConfidence,
        },
        pretest: { phase: "pre", answers: pretestAnswers },
        posttest: { phase: "post", answers: posttestAnswers },
        scores: {
          pretest: preScores,
          posttest: postScores,
        },
        submittedAt: Date.now(),
      });
      setFlowStage("done");
    } catch (error) {
      console.error("Assessment scoring error:", error);
      addLog({
        type: "intro",
        content: "Failed to submit assessment data. Please try again.",
      });
    } finally {
      setIsSubmittingAssessment(false);
    }
  };

  const currentTechniqueIndex = MODULES.findIndex(
    (module) => module.id === currentTechnique,
  );
  const completedExerciseCount = Object.values(completedLevels).reduce(
    (sum, levels) => sum + levels.length,
    0,
  );
  const totalExerciseCount = MODULES.length * 2;
  const progressPercent = (completedExerciseCount / totalExerciseCount) * 100;

  const getPendingActionLabel = () => {
    if (!pendingAction) {
      return "";
    }

    if (pendingAction.kind === "level") {
      return `Continue to Level ${pendingAction.level}`;
    }

    if (pendingAction.kind === "module") {
      return `Start ${pendingAction.technique}`;
    }

    return "Go to Post-Test";
  };

  const progressPanel = (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
          Progress
        </p>
        <p className="text-sm font-semibold text-slate-600">
          {completedExerciseCount}/{totalExerciseCount}
        </p>
      </div>

      <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full gradient-bg transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="space-y-2">
        {MODULES.map((module) => {
          const completed = completedLevels[module.id];
          const isCurrentModule = module.id === currentTechnique;

          return (
            <div
              key={module.id}
              className={cn(
                "rounded-lg p-3 transition-all",
                isCurrentModule
                  ? "bg-white shadow-sm border border-slate-100"
                  : "bg-transparent",
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {[1, 2].map((level) => {
                    const typedLevel = level as Level;
                    const isComplete = completed.includes(typedLevel);
                    const isCurrentStep =
                      isCurrentModule && currentLevel === typedLevel;

                    return (
                      <div
                        key={level}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          isComplete
                            ? "bg-emerald-500"
                            : isCurrentStep
                              ? "bg-brand-pink"
                              : "bg-slate-200",
                        )}
                      />
                    );
                  })}
                </div>
                <p
                  className={cn(
                    "text-sm font-medium flex-1",
                    isCurrentModule ? "text-slate-900" : "text-slate-500",
                  )}
                >
                  {module.id}
                </p>
                {completed.length === 2 && (
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-600">
                    ✓
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderAssessmentScreen = (
    phase: AssessmentPhase,
    tasks: AssessmentTask[],
    answers: AssessmentAnswers,
  ) => {
    const isComplete =
      isAssessmentComplete(tasks, answers) && isSurveyComplete(phase);
    const submitLabel = phase === "pre" ? "Start Learning Modules" : "Submit";
    const submitAction =
      phase === "pre" ? handlePretestSubmit : handlePosttestSubmit;

    return (
      <main className="flex-1 overflow-y-auto">
        <div className="w-full px-5 lg:px-10 xl:px-14 2xl:px-20 py-10">
          <div className="max-w-5xl mx-auto space-y-8 pb-24">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-pink">
                {phase === "pre" ? "Pre-Test" : "Post-Test"}
              </p>
              <h1 className="text-4xl font-serif font-light text-slate-900">
                Prompt Engineering {phase === "pre" ? "Pre" : "Post"}-Test
              </h1>
              <p className="text-base text-slate-600 leading-relaxed">
                {phase === "pre"
                  ? "Answer the following tasks to capture your baseline."
                  : "Answer the following tasks to capture your post-learning performance."}
              </p>
            </div>

            <section className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-5">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand-orange">
                Baseline Questions
              </p>

              {phase === "pre" && (
                <>
                  <div className="space-y-3">
                    <p className="text-slate-700 leading-relaxed font-semibold">
                      How would you rate your current prompt engineering skill
                      level?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {SKILL_LEVEL_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setPreSkillLevel(option)}
                          className={cn(
                            "px-4 py-2 rounded-lg border text-sm font-semibold transition-colors",
                            preSkillLevel === option
                              ? "bg-brand-pink/10 border-brand-pink text-brand-pink"
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300",
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-slate-700 leading-relaxed font-semibold">
                      How confident are you in selecting the most appropriate
                      prompting technique for a new task?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {CONFIDENCE_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setPreConfidence(option)}
                          className={cn(
                            "px-4 py-2 rounded-lg border text-sm font-semibold transition-colors",
                            preConfidence === option
                              ? "bg-brand-pink/10 border-brand-pink text-brand-pink"
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300",
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {phase === "post" && (
                <div className="space-y-3">
                  <p className="text-slate-700 leading-relaxed font-semibold">
                    After completing this training, how confident are you in
                    selecting the most appropriate prompting technique for a new
                    task?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CONFIDENCE_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setPostConfidence(option)}
                        className={cn(
                          "px-4 py-2 rounded-lg border text-sm font-semibold transition-colors",
                          postConfidence === option
                            ? "bg-brand-pink/10 border-brand-pink text-brand-pink"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300",
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {tasks.map((task) => (
              <section
                key={task.id}
                className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-5"
              >
                <div className="space-y-2">
                  <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand-orange">
                    {task.title}
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    <span className="font-semibold">Scenario:</span>{" "}
                    {task.scenario}
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    <span className="font-semibold">Requirement:</span>{" "}
                    {task.requirement}
                  </p>
                </div>

                {task.requiresMethodSelection && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Method
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {METHOD_OPTIONS.map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() =>
                            updateAssessmentAnswer(phase, task.id, { method })
                          }
                          className={cn(
                            "px-4 py-2 rounded-lg border text-sm font-semibold transition-colors",
                            answers[task.id].method === method
                              ? "bg-brand-pink/10 border-brand-pink text-brand-pink"
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300",
                          )}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                    <textarea
                      placeholder="Rationale (briefly explain why you chose this method)..."
                      value={answers[task.id].rationale || ""}
                      onChange={(event) =>
                        updateAssessmentAnswer(phase, task.id, {
                          rationale: event.target.value,
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl py-4 px-5 focus:outline-none focus:border-brand-pink shadow-sm transition-all text-base resize-none min-h-[90px]"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Prompt
                  </p>
                  <textarea
                    placeholder="Write your prompt..."
                    value={answers[task.id].prompt}
                    onChange={(event) =>
                      updateAssessmentAnswer(phase, task.id, {
                        prompt: event.target.value,
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl py-4 px-5 focus:outline-none focus:border-brand-pink shadow-sm transition-all text-base resize-none min-h-[120px]"
                  />
                </div>
              </section>
            ))}

            <div className="pt-2">
              <button
                type="button"
                onClick={submitAction}
                disabled={!isComplete || isSubmittingAssessment}
                className={cn(
                  "w-full py-4 rounded-xl font-bold text-sm uppercase tracking-[0.14em] shadow-lg transition-all",
                  !isComplete || isSubmittingAssessment
                    ? "bg-slate-200 text-slate-500 cursor-not-allowed shadow-none"
                    : "gradient-bg text-white shadow-brand-pink/20 hover:scale-[1.01]",
                )}
              >
                {isSubmittingAssessment ? "Submitting..." : submitLabel}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  };

  const headerStageLabel =
    flowStage === "pretest"
      ? "Pre-Test"
      : flowStage === "posttest"
        ? "Post-Test"
        : flowStage === "done"
          ? "Completed"
          : background
            ? `${currentTechnique} | Level ${currentLevel}`
            : "Learning Setup";

  return (
    <div className="h-screen flex flex-col bg-[#fcfcfc] text-slate-800 font-sans">
      <header className="h-16 border-b border-slate-100 flex items-center justify-between px-10 shrink-0 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 cursor-pointer"
            aria-label="Return to the home screen"
          >
            <h2 className="font-serif text-2xl font-light tracking-tight gradient-text">
              Prompt Mentor
            </h2>
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">
            {headerStageLabel}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {background && flowStage !== "pretest" ? (
            <div className="h-8 px-4 rounded-full border border-slate-100 bg-slate-50/50 flex items-center">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                {background}
              </span>
            </div>
          ) : null}
        </div>
      </header>

      {flowStage === "pretest" ? (
        renderAssessmentScreen("pre", PRE_TEST_TASKS, pretestAnswers)
      ) : flowStage === "posttest" ? (
        renderAssessmentScreen("post", POST_TEST_TASKS, posttestAnswers)
      ) : flowStage === "done" ? (
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-xl w-full p-10 text-center rounded-2xl border border-slate-200 bg-white shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-pink mb-4">
              Completed
            </p>
            <h3 className="text-4xl font-serif font-light text-slate-900 mb-3">
              Thank you.
            </h3>
            <p className="text-base text-slate-600 leading-relaxed">
              Your responses have been submitted.
            </p>
          </div>
        </main>
      ) : !background ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl w-full p-8 text-center"
          >
            <div className="mb-12">
              <h1 className="text-5xl sm:text-6xl font-serif font-light mb-3 tracking-tight gradient-text whitespace-nowrap">
                Prompt Mentor
              </h1>
              <p className="text-slate-600 font-bold uppercase tracking-[0.2em] text-sm">
                Learn to Write Better Prompts
              </p>
            </div>

            <div className="max-w-sm mx-auto space-y-4">
              <p className="text-base font-bold text-slate-600 uppercase tracking-[0.16em] mb-6">
                Choose Your Background
              </p>
              {(
                ["Academic Setting", "Working Professional"] as UserBackground[]
              ).map((item) => (
                <button
                  key={item}
                  onClick={() => handleBackgroundSelect(item)}
                  className="w-full py-5 px-8 rounded-xl bg-white border border-slate-100 hover:border-brand-pink shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
                >
                  <span className="text-base font-semibold text-slate-700">
                    {item}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-pink transition-all transform group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      ) : (
        <main className="flex-1 overflow-hidden flex relative">
          <aside className="hidden lg:flex flex-col w-56 xl:w-64 shrink-0 border-r border-slate-100 bg-white/80 backdrop-blur-sm">
            <div className="flex-1 overflow-y-auto p-5">{progressPanel}</div>
          </aside>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto scrollbar-hide"
          >
            <div className="w-full px-5 lg:px-10 xl:px-14 2xl:px-20 py-8">
              <div className="min-w-0 space-y-16 pb-48">
                <section className="lg:hidden">
                  <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                    {progressPanel}
                  </div>
                </section>

                <AnimatePresence mode="popLayout">
                  {logs.map((log) => (
                    <motion.div
                      key={log.id}
                      id={`log-${log.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full scroll-mt-24"
                    >
                      {log.type === "intro" && (
                        <div className="space-y-8">
                          {log.content.startsWith("###") &&
                          !log.content.includes("\n1.") ? (
                            <div className="max-w-none">
                              <div className="w-12 h-1 gradient-bg mb-6" />
                              <h3 className="text-4xl font-serif font-light text-slate-900 mb-4 tracking-tight">
                                {log.content.split("\n")[0].replace("### ", "")}
                              </h3>
                              <p className="text-lg font-serif italic text-slate-500 leading-relaxed">
                                {log.content.split("\n")[1]}
                              </p>
                            </div>
                          ) : log.comparisonBad && log.comparisonGood ? (
                            (() => {
                              const isTechniqueSelectionContrast =
                                log.technique === "Technique Selection";

                              const parseTechniqueSelectionExample = (
                                text: string,
                              ) => {
                                const match = text.match(
                                  /^Task:\s*(.+)\nTechnique:\s*(.+)\nPrompt:\n([\s\S]*)$/,
                                );
                                if (!match) {
                                  return {
                                    task: "",
                                    technique: "",
                                    prompt: text,
                                  };
                                }
                                return {
                                  task: match[1].trim(),
                                  technique: match[2].trim(),
                                  prompt: match[3].trim(),
                                };
                              };

                              const badParsed = isTechniqueSelectionContrast
                                ? parseTechniqueSelectionExample(
                                    log.comparisonBad,
                                  )
                                : {
                                    task: "",
                                    technique: "",
                                    prompt: log.comparisonBad,
                                  };
                              const goodParsed = isTechniqueSelectionContrast
                                ? parseTechniqueSelectionExample(
                                    log.comparisonGood,
                                  )
                                : {
                                    task: "",
                                    technique: "",
                                    prompt: log.comparisonGood,
                                  };
                              const sharedTask =
                                badParsed.task &&
                                badParsed.task === goodParsed.task
                                  ? badParsed.task
                                  : "";

                              return (
                                <div className="space-y-6">
                                  <div className="flex items-center gap-3">
                                    <div className="h-px flex-1 bg-slate-100" />
                                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                                      Contrast Analysis
                                    </span>
                                    <div className="h-px flex-1 bg-slate-100" />
                                  </div>
                                  {isTechniqueSelectionContrast &&
                                    sharedTask && (
                                      <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm">
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">
                                          Task
                                        </p>
                                        <p className="text-slate-700 text-base leading-relaxed font-medium">
                                          {sharedTask}
                                        </p>
                                      </div>
                                    )}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                        Ineffective Prompt
                                      </span>
                                      {isTechniqueSelectionContrast &&
                                        badParsed.technique && (
                                          <p className="text-sm font-semibold text-slate-500">
                                            Technique: {badParsed.technique}
                                          </p>
                                        )}
                                      <p className="text-slate-600 font-mono text-base leading-relaxed whitespace-pre-line">
                                        {badParsed.prompt}
                                      </p>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-white border border-brand-pink/10 shadow-sm space-y-3">
                                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-brand-pink">
                                        Effective Prompt
                                      </span>
                                      {isTechniqueSelectionContrast &&
                                        goodParsed.technique && (
                                          <p className="text-sm font-semibold text-brand-pink">
                                            Technique: {goodParsed.technique}
                                          </p>
                                        )}
                                      <p className="text-slate-800 font-mono text-base leading-relaxed whitespace-pre-line">
                                        {goodParsed.prompt}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            <div className="markdown-content text-slate-600 leading-relaxed font-serif text-xl italic">
                              <ReactMarkdown
                                components={{
                                  p: ({ children }) => (
                                    <p className="mb-4 last:mb-0">{children}</p>
                                  ),
                                  ul: ({ children }) => (
                                    <ul className="space-y-4 my-8">
                                      {children}
                                    </ul>
                                  ),
                                  li: ({ children }) => (
                                    <li className="flex gap-4 items-start font-sans text-base not-italic">
                                      <div className="w-1.5 h-1.5 rounded-full gradient-bg mt-2.5 shrink-0" />
                                      <div className="text-slate-700 leading-relaxed">
                                        {children}
                                      </div>
                                    </li>
                                  ),
                                  strong: ({ children }) => (
                                    <strong className="font-bold text-slate-900">
                                      {children}
                                    </strong>
                                  ),
                                }}
                              >
                                {log.content}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                      )}

                      {log.type === "build" && (
                        <div className="pt-12 border-t border-slate-100">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-pink mb-8">
                            Current Exercise
                          </p>

                          <div className="space-y-6">
                            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-orange">
                              {log.title}
                            </p>
                            <p className="text-2xl font-serif font-light text-slate-900 leading-relaxed whitespace-pre-line">
                              {log.task}
                            </p>
                          </div>

                          {log.level === 1 && (
                            <div className="mt-12 space-y-4">
                              {MODULES.find(
                                (module) => module.id === log.technique,
                              )?.byPersona[background].levels[1].choices?.map(
                                (choice, idx) => {
                                  const isSelected =
                                    log.selectedChoice === choice.text;
                                  const hasSelected = !!log.selectedChoice;

                                  return (
                                    <button
                                      key={idx}
                                      disabled={hasSelected}
                                      onClick={() =>
                                        handleChoiceSelect(choice, log.id)
                                      }
                                      className={cn(
                                        "w-full p-6 rounded-2xl border text-left transition-all group relative overflow-hidden",
                                        !hasSelected
                                          ? "bg-white border-slate-100 hover:border-brand-pink hover:shadow-md"
                                          : isSelected
                                            ? choice.isCorrect
                                              ? "bg-emerald-50 border-emerald-200"
                                              : "bg-red-50 border-red-200"
                                            : "bg-slate-50 border-slate-100 opacity-50",
                                      )}
                                    >
                                      <div className="flex items-start gap-4">
                                        <div
                                          className={cn(
                                            "w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-1",
                                            !hasSelected
                                              ? "border-slate-200 group-hover:border-brand-pink"
                                              : isSelected
                                                ? choice.isCorrect
                                                  ? "border-emerald-500 bg-emerald-500 text-white"
                                                  : "border-red-500 bg-red-500 text-white"
                                                : "border-slate-200",
                                          )}
                                        >
                                          {isSelected
                                            ? choice.isCorrect
                                              ? "✓"
                                              : "×"
                                            : null}
                                        </div>
                                        <p
                                          className={cn(
                                            "text-base leading-relaxed font-mono whitespace-pre-line",
                                            isSelected
                                              ? choice.isCorrect
                                                ? "text-emerald-900"
                                                : "text-red-900"
                                              : "text-slate-700",
                                          )}
                                        >
                                          {choice.text}
                                        </p>
                                      </div>
                                    </button>
                                  );
                                },
                              )}
                            </div>
                          )}

                          {log.level && log.level >= 2 && (
                            <div className="mt-12 space-y-5">
                              {log.technique === "Technique Selection" &&
                                log.level === 2 && (
                                  <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                      Step 1: Select Method and Explain Why
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {METHOD_OPTIONS.map((method) => (
                                        <button
                                          key={method}
                                          type="button"
                                          disabled={!!log.methodStepCompleted}
                                          onClick={() =>
                                            setLogs((prev) =>
                                              prev.map((entry) =>
                                                entry.id === log.id
                                                  ? {
                                                      ...entry,
                                                      selectedMethod: method,
                                                    }
                                                  : entry,
                                              ),
                                            )
                                          }
                                          className={cn(
                                            "px-4 py-2 rounded-lg border text-sm font-semibold transition-colors",
                                            log.selectedMethod === method
                                              ? "bg-brand-pink/10 border-brand-pink text-brand-pink"
                                              : "bg-white border-slate-200 text-slate-600",
                                            log.methodStepCompleted &&
                                              "opacity-70 cursor-not-allowed",
                                          )}
                                        >
                                          {method}
                                        </button>
                                      ))}
                                    </div>
                                    <textarea
                                      placeholder="Why is this method the best fit?"
                                      value={log.selectedRationale || ""}
                                      readOnly={!!log.methodStepCompleted}
                                      onChange={(event) =>
                                        setLogs((prev) =>
                                          prev.map((entry) =>
                                            entry.id === log.id
                                              ? {
                                                  ...entry,
                                                  selectedRationale:
                                                    event.target.value,
                                                }
                                              : entry,
                                          ),
                                        )
                                      }
                                      className={cn(
                                        "w-full bg-white border border-slate-200 rounded-xl py-4 px-5 focus:outline-none focus:border-brand-pink shadow-sm transition-all text-base resize-none min-h-[100px]",
                                        log.methodStepCompleted &&
                                          "bg-slate-100 text-slate-600",
                                      )}
                                    />
                                    {!log.methodStepCompleted && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleTechniqueSelectionMethodSubmit(
                                            log.id,
                                          )
                                        }
                                        disabled={
                                          !log.selectedMethod ||
                                          !log.selectedRationale?.trim() ||
                                          methodReviewingLogId === log.id
                                        }
                                        className={cn(
                                          "w-full py-3 rounded-xl font-bold text-sm uppercase tracking-[0.14em] transition-all",
                                          !log.selectedMethod ||
                                            !log.selectedRationale?.trim() ||
                                            methodReviewingLogId === log.id
                                            ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                                            : "gradient-bg text-white shadow-lg shadow-brand-pink/20 hover:scale-[1.01]",
                                        )}
                                      >
                                        {methodReviewingLogId === log.id
                                          ? "Reviewing..."
                                          : "Submit Method"}
                                      </button>
                                    )}
                                  </div>
                                )}

                              {log.technique === "Technique Selection" &&
                                log.level === 2 &&
                                log.methodStepCompleted && (
                                  <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4">
                                    <div className="flex items-center justify-between gap-3">
                                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                        Method Feedback
                                      </p>
                                      {log.methodFeedbackScore && (
                                        <span
                                          className={cn(
                                            "px-3 py-1 rounded-full text-xs font-semibold",
                                            log.methodFeedbackScore.grade ===
                                              "green"
                                              ? "bg-emerald-100 text-emerald-700"
                                              : log.methodFeedbackScore
                                                    .grade === "yellow"
                                                ? "bg-amber-100 text-amber-700"
                                                : "bg-red-100 text-red-700",
                                          )}
                                        >
                                          {log.methodFeedbackScore.totalScore}/
                                          {log.methodFeedbackScore.maxScore}
                                        </span>
                                      )}
                                    </div>
                                    {log.methodFeedback && (
                                      <p className="text-base text-slate-700 leading-relaxed">
                                        {log.methodFeedback}
                                      </p>
                                    )}
                                  </div>
                                )}

                              {(log.technique !== "Technique Selection" ||
                                log.level !== 2 ||
                                log.methodStepCompleted) && (
                                <div
                                  className={cn(
                                    "space-y-3",
                                    log.technique === "Technique Selection" &&
                                      log.level === 2 &&
                                      log.methodStepCompleted &&
                                      "p-5 rounded-xl border border-slate-200 bg-slate-50/70",
                                  )}
                                >
                                  {log.technique === "Technique Selection" &&
                                    log.level === 2 &&
                                    log.methodStepCompleted && (
                                      <>
                                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                          Step 2: Write Your Prompt
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                          Using the method you selected and the
                                          feedback above, write your full prompt
                                          and submit it.
                                        </p>
                                      </>
                                    )}
                                  <div className="relative">
                                    {log.submittedPrompt ? (
                                      <textarea
                                        readOnly
                                        value={log.submittedPrompt}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-5 pl-8 pr-8 shadow-sm transition-all text-base resize-none min-h-[120px] text-slate-700"
                                      />
                                    ) : (
                                      <>
                                        <textarea
                                          autoFocus
                                          placeholder="Compose your prompt..."
                                          value={promptDrafts[log.id] || ""}
                                          onChange={(event) =>
                                            setPromptDrafts((prev) => ({
                                              ...prev,
                                              [log.id]: event.target.value,
                                            }))
                                          }
                                          className="w-full bg-white border border-slate-200 rounded-xl py-5 pl-8 pr-20 focus:outline-none focus:border-brand-pink shadow-sm transition-all text-base resize-none min-h-[120px]"
                                          onKeyDown={(event) => {
                                            if (
                                              event.key === "Enter" &&
                                              (event.metaKey || event.ctrlKey)
                                            ) {
                                              event.preventDefault();
                                              handlePromptSubmit(
                                                promptDrafts[log.id] || "",
                                                log.id,
                                              );
                                            }
                                          }}
                                        />
                                        <p className="mt-2 text-xs text-slate-500">
                                          Press Cmd/Ctrl + Enter to submit
                                        </p>
                                        <button
                                          onClick={() => {
                                            handlePromptSubmit(
                                              promptDrafts[log.id] || "",
                                              log.id,
                                            );
                                          }}
                                          className="absolute right-3 bottom-3 p-4 gradient-text"
                                          aria-label="Submit prompt"
                                        >
                                          <Send className="w-6 h-6" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {log.type === "review" && log.reviewType === "choice" && (
                        <div
                          className={cn(
                            "p-8 border rounded-xl markdown-content",
                            log.isCorrect === false
                              ? "bg-red-50/30 border-red-100"
                              : "bg-emerald-50/30 border-emerald-100",
                          )}
                        >
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => (
                                <p
                                  className={cn(
                                    "text-base leading-relaxed italic font-serif",
                                    log.isCorrect === false
                                      ? "text-red-900"
                                      : "text-emerald-900",
                                  )}
                                >
                                  {children}
                                </p>
                              ),
                              strong: ({ children }) => (
                                <strong
                                  className={cn(
                                    "font-bold",
                                    log.isCorrect === false
                                      ? "text-red-950"
                                      : "text-emerald-950",
                                  )}
                                >
                                  {children}
                                </strong>
                              ),
                            }}
                          >
                            {log.content}
                          </ReactMarkdown>
                        </div>
                      )}

                      {log.type === "review" &&
                        log.reviewType === "feedback" && (
                          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <div className="p-6 space-y-5">
                              {log.generatedResponse && (
                                <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                                  <div className="flex items-center justify-between gap-4 mb-3">
                                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-pink">
                                      Here is the response generated from your
                                      prompt:
                                    </p>
                                    {log.generatedResponse.length > 700 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setExpandedResults((prev) => ({
                                            ...prev,
                                            [log.id]: !prev[log.id],
                                          }))
                                        }
                                        className="text-sm font-semibold text-slate-500 hover:text-slate-700"
                                      >
                                        {expandedResults[log.id]
                                          ? "Collapse"
                                          : "Expand"}
                                      </button>
                                    )}
                                  </div>

                                  <div className="relative">
                                    <div
                                      className={cn(
                                        "leading-relaxed text-slate-700 text-base markdown-content",
                                        !expandedResults[log.id] &&
                                          log.generatedResponse.length > 700 &&
                                          "max-h-64 overflow-hidden",
                                      )}
                                    >
                                      <ReactMarkdown
                                        components={{
                                          p: ({ children }) => (
                                            <p className="mb-3 last:mb-0">
                                              {children}
                                            </p>
                                          ),
                                          ul: ({ children }) => (
                                            <ul className="space-y-2 my-4 list-disc pl-5">
                                              {children}
                                            </ul>
                                          ),
                                          ol: ({ children }) => (
                                            <ol className="space-y-2 my-4 list-decimal pl-5">
                                              {children}
                                            </ol>
                                          ),
                                          li: ({ children }) => (
                                            <li className="text-slate-700">
                                              {children}
                                            </li>
                                          ),
                                          strong: ({ children }) => (
                                            <strong className="font-semibold text-slate-900">
                                              {children}
                                            </strong>
                                          ),
                                        }}
                                      >
                                        {log.generatedResponse}
                                      </ReactMarkdown>
                                    </div>

                                    {!expandedResults[log.id] &&
                                      log.generatedResponse.length > 700 && (
                                        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
                                      )}
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center justify-between gap-4">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                                  Feedback
                                </p>
                                {log.feedbackScore && (
                                  <span
                                    className={cn(
                                      "px-3 py-1 rounded-full text-xs font-semibold",
                                      log.feedbackScore.grade === "green"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : log.feedbackScore.grade === "yellow"
                                          ? "bg-amber-100 text-amber-700"
                                          : "bg-red-100 text-red-700",
                                    )}
                                  >
                                    {log.feedbackScore.grade === "green"
                                      ? "Great job!"
                                      : log.feedbackScore.grade === "yellow"
                                        ? "Getting there!"
                                        : "Keep practicing!"}
                                  </span>
                                )}
                              </div>

                              {log.feedbackScore && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  {log.feedbackScore.criteriaScores.map(
                                    (criterion) => (
                                      <div
                                        key={criterion.id}
                                        className={cn(
                                          "px-3 py-2 rounded-lg flex items-center gap-2",
                                          criterion.score === 1
                                            ? "bg-emerald-50"
                                            : "bg-red-50",
                                        )}
                                      >
                                        <span
                                          className={cn(
                                            "text-sm font-bold",
                                            criterion.score === 1
                                              ? "text-emerald-600"
                                              : "text-red-500",
                                          )}
                                        >
                                          {criterion.score === 1 ? "✓" : "✗"}
                                        </span>
                                        <span
                                          className={cn(
                                            "text-sm font-medium",
                                            criterion.score === 1
                                              ? "text-emerald-700"
                                              : "text-red-700",
                                          )}
                                        >
                                          {criterion.label}
                                        </span>
                                      </div>
                                    ),
                                  )}
                                </div>
                              )}

                              {log.content && (
                                <p className="text-base text-slate-700 leading-relaxed">
                                  {log.content}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                      {log.type === "completion" && (
                        <div className="p-10 rounded-3xl border border-brand-pink/15 bg-white shadow-sm space-y-8">
                          <div className="space-y-3">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-pink">
                              Course Complete
                            </p>
                            <h3 className="text-4xl font-serif font-light text-slate-900">
                              You completed Prompt Mentor
                            </h3>
                            <p className="text-lg text-slate-600 leading-relaxed">
                              You practiced the core techniques and technique
                              selection in this tutor and completed all 8
                              exercises.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            {MODULES.map((module) => (
                              <div
                                key={module.id}
                                className="p-5 rounded-2xl border border-slate-100 bg-slate-50/60"
                              >
                                <p className="text-base font-semibold text-slate-900">
                                  {module.id}
                                </p>
                                <p className="text-base text-slate-600 mt-1">
                                  {TECHNIQUE_SUMMARIES[module.id]}
                                </p>
                              </div>
                            ))}
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3">
                            <button
                              type="button"
                              onClick={handleReset}
                              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:border-slate-300 transition-colors"
                            >
                              <Home className="w-4 h-4" />
                              Go Back Home
                            </button>
                            <button
                              type="button"
                              onClick={handleRestartTrack}
                              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl gradient-bg text-white font-semibold"
                            >
                              <RotateCcw className="w-4 h-4" />
                              Practice Again
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isWaitingForResult && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-4 text-slate-400"
                  >
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-pink animate-bounce" />
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-bounce delay-100" />
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-pink animate-bounce delay-200" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.14em]">
                      Reviewing your prompt
                    </span>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 lg:left-56 xl:left-64 right-0 p-6 lg:p-8 bg-gradient-to-t from-[#fcfcfc] via-[#fcfcfc] to-transparent pointer-events-none">
            <div className="max-w-md mx-auto pointer-events-auto">
              {isModuleIntro && (
                <button
                  onClick={() => proceedToLevel(1)}
                  className="w-full py-4 gradient-bg text-white rounded-xl font-bold text-sm uppercase tracking-[0.14em] shadow-lg shadow-brand-pink/20 hover:scale-[1.01] transition-all"
                >
                  Begin Practice
                </button>
              )}

              {!isModuleIntro && pendingAction && !isWaitingForResult && (
                <button
                  onClick={handleContinue}
                  className="w-full py-4 gradient-bg text-white rounded-xl font-bold text-sm uppercase tracking-[0.14em] shadow-lg shadow-brand-pink/20 hover:scale-[1.01] transition-all"
                >
                  {getPendingActionLabel()}
                </button>
              )}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
