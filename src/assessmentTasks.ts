import type { AssessmentMcqTask, AssessmentTask } from "./types";

export function isMcqAssessmentTask(
  task: AssessmentTask,
): task is AssessmentMcqTask {
  return (
    Array.isArray((task as AssessmentMcqTask).choices) &&
    (task as AssessmentMcqTask).choices.length > 0 &&
    typeof (task as AssessmentMcqTask).correctChoiceId === "string" &&
    (task as AssessmentMcqTask).correctChoiceId.length > 0
  );
}

