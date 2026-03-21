/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Home, RotateCcw, Send } from "lucide-react";
import {
  AssessmentAnswer,
  AssessmentAnswers,
  AssessmentPhase,
  AssessmentTask,
  AssessmentTaskId,
  FlowStage,
  LogEntry,
  PendingAction,
  PromptingMethod,
  Technique,
  Level,
  UserBackground,
  FeedbackScore,
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
import {
  createSession,
  fetchAdminData,
  fetchAdminExport,
  gradeLearning,
  logEvent,
  runAdminGrading,
  saveAttempt,
  submitAssessment,
  updateSession,
} from "./lib/apiClient";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
  "1 - Almost none (first time)",
  "2 - A little (a few times)",
  "3 - Sometimes (monthly)",
  "4 - Often (weekly)",
  "5 - Very experienced",
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
  const [isAdminRoute] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    const normalized = window.location.pathname.replace(/^\/+|\/+$/g, "");
    return normalized.toLowerCase() === "admin";
  });
  const [flowStage, setFlowStage] = useState<FlowStage>(() => {
    if (typeof window === "undefined") {
      return "pretest";
    }
    const normalized = window.location.pathname.replace(/^\/+|\/+$/g, "");
    if (normalized.toLowerCase() === "admin") {
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
  const [studentUsername, setStudentUsername] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [courseStartedAt, setCourseStartedAt] = useState<number | null>(null);
  const [pretestStartedAt, setPretestStartedAt] = useState<number | null>(null);
  const [posttestStartedAt, setPosttestStartedAt] = useState<number | null>(
    null,
  );
  const [questionStartedAt, setQuestionStartedAt] = useState<
    Record<string, number>
  >({});
  const [usernameError, setUsernameError] = useState("");
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState("");
  const [adminAuthorized, setAdminAuthorized] = useState(false);
  const [adminData, setAdminData] = useState<any | null>(null);
  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminEnvFilter, setAdminEnvFilter] = useState<
    "all" | "local" | "production"
  >("all");
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
    const questionKey = `${phase}-${taskId}`;
    setQuestionStartedAt((prev) =>
      prev[questionKey] ? prev : { ...prev, [questionKey]: Date.now() },
    );
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

  const durationSeconds = (startMs: number, endMs = Date.now()) =>
    Math.max(0, Math.round((endMs - startMs) / 1000));

  const usernamePattern = /^[a-z0-9]{2,16}$/;

  const handleUsernameSubmit = async () => {
    const normalized = usernameInput.trim().toLowerCase();
    if (!usernamePattern.test(normalized)) {
      setUsernameError(
        "Please enter a valid Andrew ID (lowercase letters and numbers).",
      );
      return;
    }
    setIsCreatingSession(true);
    setUsernameError("");
    try {
      const now = Date.now();
      const session = await createSession({
        username: normalized,
        startedAt: now,
      });
      setStudentUsername(normalized);
      setSessionId(session.sessionId);
      setCourseStartedAt(now);
      setPretestStartedAt(now);
      setQuestionStartedAt({});
      await logEvent({
        sessionId: session.sessionId,
        eventType: "session_started",
        payload: { studentUsername: normalized },
        timestamp: now,
      });
    } catch (error) {
      setUsernameError("Failed to create session. Please try again.");
      console.error(error);
    } finally {
      setIsCreatingSession(false);
    }
  };

  const saveEvent = async (
    eventType: string,
    payload: Record<string, unknown> = {},
    technique?: Technique,
    level?: Level,
  ) => {
    if (!sessionId) return;
    try {
      await logEvent({
        sessionId,
        eventType,
        technique,
        level,
        payload,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Failed to save event", error);
    }
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
    void saveEvent("module_started", { technique }, technique);
  };

  const handleBackgroundSelect = (selectedBackground: UserBackground) => {
    setFlowStage("learning");
    setBackground(selectedBackground);
    setCompletedLevels(EMPTY_PROGRESS);
    setExpandedResults({});
    setPendingAction(null);
    startModule(deepLinkedTechnique ?? "Zero-shot", selectedBackground);
    if (sessionId) {
      void updateSession({
        sessionId,
        background: selectedBackground,
        flowStage: "learning",
      }).catch((error) =>
        console.error("Failed to update session background", error),
      );
      void saveEvent("background_selected", { background: selectedBackground });
    }
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
    setStudentUsername("");
    setUsernameInput("");
    setSessionId(null);
    setCourseStartedAt(null);
    setPretestStartedAt(null);
    setPosttestStartedAt(null);
    setQuestionStartedAt({});
    setUsernameError("");
    setIsCreatingSession(false);
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
    setQuestionStartedAt((prev) => ({
      ...prev,
      [`learning-${currentTechnique}-${level}`]: Date.now(),
    }));
    void saveEvent("level_started", { level }, currentTechnique, level);
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
    const now = Date.now();
    setPosttestStartedAt(now);
    setFlowStage("posttest");
    if (sessionId) {
      void updateSession({
        sessionId,
        flowStage: "posttest",
        posttestStartedAt: now,
      }).catch((error) =>
        console.error("Failed to update session to posttest", error),
      );
      void saveEvent("posttest_started", {});
    }
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

    const questionKey = `learning-${currentTechnique}-${currentLevel}`;
    const startedAt = questionStartedAt[questionKey];
    const durationSec = startedAt ? durationSeconds(startedAt) : undefined;
    if (sessionId) {
      void saveAttempt({
        sessionId,
        phase: "learning",
        technique: currentTechnique,
        level: currentLevel,
        questionKey,
        questionTitle: `Level ${currentLevel}`,
        selectedChoice: choice.text,
        isCorrect: choice.isCorrect,
        feedbackText: choice.explanation,
        gradingStatus: "graded",
        scoreTotal: choice.isCorrect ? 4 : 0,
        scoreMax: 4,
        durationSec,
        submittedAt: Date.now(),
      }).catch((error) =>
        console.error("Failed to save learning choice attempt", error),
      );
      void saveEvent(
        "learning_choice_submitted",
        { isCorrect: choice.isCorrect, durationSec },
        currentTechnique,
        currentLevel,
      );
    }

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
      const levelData = moduleContent.levels[activeLevel];
      const selectedMethod = targetLog?.selectedMethod;
      const rubric =
        activeTechnique === "Technique Selection" && selectedMethod
          ? getRubricForMethod(selectedMethod)
          : levelData.rubric || getRubricForTechnique(activeTechnique);
      const gradingResult = await gradeLearning({
        mode: "prompt",
        learnerPrompt: prompt,
        task: levelTask,
        referencePrompt: levelData.referencePrompt || "",
        rubric,
        selectedMethod: selectedMethod,
        selectedRationale: targetLog?.selectedRationale,
      });
      const resultText = gradingResult.generatedResponse || "";
      const feedbackScore = gradingResult.feedbackScore;
      const feedbackText = gradingResult.feedbackText;

      const reviewLogId = addLog({
        type: "review",
        content: feedbackText,
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
      const questionKey = `learning-${activeTechnique}-${activeLevel}`;
      const startedAt = questionStartedAt[questionKey];
      const durationSec = startedAt ? durationSeconds(startedAt) : undefined;
      if (sessionId) {
        void saveAttempt({
          sessionId,
          phase: "learning",
          technique: activeTechnique,
          level: activeLevel,
          questionKey,
          questionTitle: `Level ${activeLevel}`,
          promptRaw: prompt,
          aiResponse: resultText,
          feedbackText,
          gradingStatus: "graded",
          scoreTotal: feedbackScore?.totalScore,
          scoreMax: feedbackScore?.maxScore,
          durationSec,
          submittedAt: Date.now(),
          gradedAt: Date.now(),
          selectedMethod: selectedMethod,
          selectedRationale: targetLog?.selectedRationale,
          criteriaScores: feedbackScore?.criteriaScores,
        }).catch((error) =>
          console.error("Failed to save learning prompt attempt", error),
        );
        void saveEvent(
          "learning_prompt_submitted",
          {
            durationSec,
            totalScore: feedbackScore?.totalScore,
            maxScore: feedbackScore?.maxScore,
          },
          activeTechnique,
          activeLevel,
        );
      }

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

    setMethodReviewingLogId(logId);
    try {
      const result = await gradeLearning({
        mode: "method",
        task: levelData.task,
        referenceMethod: levelData.referenceMethod,
        referenceRationale: levelData.referenceRationale,
        selectedMethod: targetLog.selectedMethod,
        selectedRationale: targetLog.selectedRationale,
        rubric: METHOD_RATIONALE_RUBRIC,
      });
      const methodFeedbackScore = result.feedbackScore;
      const feedbackText = result.feedbackText;

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
      void saveEvent(
        "technique_selection_method_reviewed",
        {
          selectedMethod: targetLog.selectedMethod,
          totalScore: methodFeedbackScore.totalScore,
          maxScore: methodFeedbackScore.maxScore,
        },
        targetLog.technique,
        targetLog.level,
      );
    } finally {
      setMethodReviewingLogId(null);
    }
  };

  const handlePretestSubmit = async () => {
    if (
      !sessionId ||
      !isAssessmentComplete(PRE_TEST_TASKS, pretestAnswers) ||
      !isSurveyComplete("pre")
    ) {
      return;
    }

    const submittedAt = Date.now();
    const preDuration = pretestStartedAt
      ? durationSeconds(pretestStartedAt, submittedAt)
      : undefined;

    const questionDurationsSec: Record<string, number> = {};
    PRE_TEST_TASKS.forEach((task) => {
      const key = `pre-${task.id}`;
      const startedAt = questionStartedAt[key];
      questionDurationsSec[String(task.id)] = startedAt
        ? durationSeconds(startedAt, submittedAt)
        : 0;
    });

    setIsSubmittingAssessment(true);
    try {
      await submitAssessment({
        sessionId,
        phase: "pre",
        answers: pretestAnswers,
        survey: {
          skillLevel: preSkillLevel,
          confidence: preConfidence,
        },
        durationSec: preDuration,
        submittedAt,
        questionDurationsSec,
      });
      await updateSession({
        sessionId,
        flowStage: "learning",
        pretestCompletedAt: submittedAt,
        pretestDurationSec: preDuration || null,
        pretestExperienceLevel: preSkillLevel,
        pretestConfidence: preConfidence,
        learningStartedAt: submittedAt,
      });
      await saveEvent("pretest_submitted", {
        preDuration,
        questionDurationsSec,
        preSkillLevel,
        preConfidence,
      });
      setFlowStage("learning");
    } catch (error) {
      console.error("Failed to submit pretest", error);
      setUsernameError("Failed to submit pre-test. Please try again.");
    } finally {
      setIsSubmittingAssessment(false);
    }
  };

  const handlePosttestSubmit = async () => {
    if (
      !sessionId ||
      !background ||
      !isAssessmentComplete(POST_TEST_TASKS, posttestAnswers) ||
      !isSurveyComplete("post")
    ) {
      return;
    }

    setIsSubmittingAssessment(true);
    try {
      const submittedAt = Date.now();
      const postDuration = posttestStartedAt
        ? durationSeconds(posttestStartedAt, submittedAt)
        : undefined;
      const courseDuration = courseStartedAt
        ? durationSeconds(courseStartedAt, submittedAt)
        : undefined;

      const questionDurationsSec: Record<string, number> = {};
      POST_TEST_TASKS.forEach((task) => {
        const key = `post-${task.id}`;
        const startedAt = questionStartedAt[key];
        questionDurationsSec[String(task.id)] = startedAt
          ? durationSeconds(startedAt, submittedAt)
          : 0;
      });

      await submitAssessment({
        sessionId,
        phase: "post",
        answers: posttestAnswers,
        survey: { confidence: postConfidence },
        durationSec: postDuration,
        submittedAt,
        questionDurationsSec,
      });
      await updateSession({
        sessionId,
        flowStage: "done",
        posttestCompletedAt: submittedAt,
        posttestDurationSec: postDuration || null,
        completedAt: submittedAt,
        courseDurationSec: courseDuration || null,
        posttestConfidence: postConfidence,
      });
      await saveEvent("posttest_submitted", {
        postDuration,
        courseDuration,
        questionDurationsSec,
        postConfidence,
      });
      setFlowStage("done");
    } catch (error) {
      console.error("Assessment submit error:", error);
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
    if (phase === "pre" && !sessionId) {
      return (
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-lg w-full p-8 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-5">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-pink">
              Student Login
            </p>
            <h1 className="text-3xl font-serif font-light text-slate-900">
              Enter your Username
            </h1>
            <p className="text-slate-600 leading-relaxed">
              Use your CMU Andrew ID.
            </p>
            <input
              value={usernameInput}
              onChange={(event) => {
                setUsernameInput(event.target.value);
                if (usernameError) setUsernameError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !isCreatingSession) {
                  void handleUsernameSubmit();
                }
              }}
              placeholder="e.g. andrewid"
              className="w-full bg-white border border-slate-200 rounded-xl py-4 px-5 focus:outline-none focus:border-brand-pink shadow-sm transition-all text-base"
            />
            {usernameError ? (
              <p className="text-sm text-red-600">{usernameError}</p>
            ) : null}
            <button
              type="button"
              onClick={() => void handleUsernameSubmit()}
              disabled={isCreatingSession}
              className={cn(
                "w-full py-4 rounded-xl font-bold text-sm uppercase tracking-[0.14em] shadow-lg transition-all",
                isCreatingSession
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed shadow-none"
                  : "gradient-bg text-white shadow-brand-pink/20 hover:scale-[1.01]",
              )}
            >
              {isCreatingSession ? "Starting..." : "Start Pre-Test"}
            </button>
          </div>
        </main>
      );
    }

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

  const refreshAdminData = async () => {
    if (!adminPasscode) {
      return;
    }
    setAdminLoading(true);
    setAdminError("");
    try {
      const data = await fetchAdminData(adminPasscode, 200);
      setAdminData(data);
      setAdminAuthorized(true);
    } catch (error) {
      setAdminError("Failed to load admin data. Check your passcode.");
      console.error(error);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleRunAdminGrading = async () => {
    if (!adminPasscode) return;
    setAdminLoading(true);
    setAdminError("");
    try {
      await runAdminGrading(adminPasscode, 50);
      await refreshAdminData();
    } catch (error) {
      setAdminError("Failed to run grading.");
      console.error(error);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleExport = async (format: "json" | "csv") => {
    if (!adminPasscode) return;
    try {
      const response = await fetchAdminExport(adminPasscode, format);
      if (format === "json") {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `prompt-mentor-export-${Date.now()}.json`;
        anchor.click();
        URL.revokeObjectURL(url);
      } else {
        const csvText = await response.text();
        const blob = new Blob([csvText], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `prompt-mentor-attempts-${Date.now()}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      setAdminError("Failed to export data.");
      console.error(error);
    }
  };

  const renderAdminDashboard = () => {
    const sessions = adminData?.sessions || [];
    const pendingAttempts = adminData?.pendingAttempts || [];
    const attempts = adminData?.attempts || [];
    const matchesEnvFilter = (row: { app_env?: string }) => {
      if (adminEnvFilter === "all") {
        return true;
      }
      return (row.app_env || "unknown").toLowerCase() === adminEnvFilter;
    };
    const filteredSessions = sessions.filter(matchesEnvFilter);
    const filteredPendingAttempts = pendingAttempts.filter(matchesEnvFilter);
    const filteredAttempts = attempts.filter(matchesEnvFilter);

    if (!adminAuthorized) {
      return (
        <main className="flex-1 flex items-center justify-center p-6 bg-[#fcfcfc]">
          <div className="max-w-lg w-full p-8 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-5">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-pink">
              Admin Access Required
            </p>
            <h1 className="text-3xl font-serif font-light text-slate-900">
              Enter Admin Passcode
            </h1>
            <p className="text-slate-600 leading-relaxed">
              This dashboard includes grading tools and raw logs. Enter the
              admin passcode to continue.
            </p>
            <input
              type="password"
              value={adminPasscode}
              onChange={(event) => setAdminPasscode(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !adminLoading) {
                  void refreshAdminData();
                }
              }}
              placeholder="Admin passcode"
              className="w-full bg-white border border-slate-200 rounded-xl py-4 px-5 focus:outline-none focus:border-brand-pink shadow-sm transition-all text-base"
            />
            {adminError ? (
              <p className="text-sm text-red-600">{adminError}</p>
            ) : null}
            <button
              type="button"
              onClick={() => void refreshAdminData()}
              disabled={adminLoading}
              className={cn(
                "w-full py-4 rounded-xl font-bold text-sm uppercase tracking-[0.14em] shadow-lg transition-all",
                adminLoading
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed shadow-none"
                  : "gradient-bg text-white shadow-brand-pink/20 hover:scale-[1.01]",
              )}
            >
              {adminLoading ? "Verifying..." : "Unlock Dashboard"}
            </button>
          </div>
        </main>
      );
    }

    return (
      <main className="flex-1 overflow-y-auto p-6 lg:p-10 bg-[#fcfcfc]">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-pink">
              Admin Dashboard
            </p>
            <p className="text-slate-600">
              Review sessions, run post-hoc grading for pre/post attempts, and
              export logs.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={adminEnvFilter}
                onChange={(event) =>
                  setAdminEnvFilter(
                    event.target.value as "all" | "local" | "production",
                  )
                }
                className="bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-700 focus:outline-none focus:border-brand-pink"
              >
                <option value="all">All environments</option>
                <option value="local">local</option>
                <option value="production">production</option>
              </select>
              <button
                type="button"
                onClick={() => void refreshAdminData()}
                disabled={adminLoading}
                className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold"
              >
                {adminLoading ? "Loading..." : "Load Data"}
              </button>
              <button
                type="button"
                onClick={() => void handleRunAdminGrading()}
                disabled={adminLoading || !adminAuthorized}
                className="px-4 py-3 rounded-xl gradient-bg text-white font-semibold disabled:opacity-50"
              >
                Grade Pending
              </button>
              <button
                type="button"
                onClick={() => void handleExport("csv")}
                disabled={!adminAuthorized}
                className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold disabled:opacity-50"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => void handleExport("json")}
                disabled={!adminAuthorized}
                className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold disabled:opacity-50"
              >
                Export JSON
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdminAuthorized(false);
                  setAdminData(null);
                  setAdminError("");
                }}
                className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold"
              >
                Lock
              </button>
            </div>
            {adminError ? (
              <p className="text-sm text-red-600">{adminError}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl border border-slate-200 bg-white">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                Sessions
              </p>
              <p className="text-2xl font-semibold text-slate-900">
                {filteredSessions.length}
              </p>
            </div>
            <div className="p-5 rounded-xl border border-slate-200 bg-white">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                Pending Pre/Post
              </p>
              <p className="text-2xl font-semibold text-slate-900">
                {filteredPendingAttempts.length}
              </p>
            </div>
            <div className="p-5 rounded-xl border border-slate-200 bg-white">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                Total Attempts
              </p>
              <p className="text-2xl font-semibold text-slate-900">
                {filteredAttempts.length}
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-orange">
              Pending Attempts
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-2 pr-4">Env</th>
                    <th className="py-2 pr-4">Session</th>
                    <th className="py-2 pr-4">Phase</th>
                    <th className="py-2 pr-4">Question</th>
                    <th className="py-2 pr-4">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPendingAttempts.map((attempt: any) => (
                    <tr key={attempt.id} className="border-t border-slate-100">
                      <td className="py-2 pr-4">
                        <span
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-semibold",
                            (attempt.app_env || "").toLowerCase() ===
                              "production"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-700",
                          )}
                        >
                          {(attempt.app_env || "unknown").toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs">
                        {attempt.session_id}
                      </td>
                      <td className="py-2 pr-4">{attempt.phase}</td>
                      <td className="py-2 pr-4">{attempt.question_key}</td>
                      <td className="py-2 pr-4">
                        {new Date(attempt.submitted_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    );
  };

  const headerStageLabel = isAdminRoute
    ? "Admin"
    : flowStage === "pretest"
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
          {studentUsername ? (
            <div className="h-8 px-4 rounded-full border border-slate-100 bg-slate-50/50 flex items-center">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                {studentUsername}
              </span>
            </div>
          ) : null}
          {background && flowStage !== "pretest" ? (
            <div className="h-8 px-4 rounded-full border border-slate-100 bg-slate-50/50 flex items-center">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                {background}
              </span>
            </div>
          ) : null}
        </div>
      </header>

      {isAdminRoute ? (
        renderAdminDashboard()
      ) : flowStage === "pretest" ? (
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
