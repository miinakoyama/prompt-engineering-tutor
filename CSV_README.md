# CSV Export Dictionary

This document explains the columns in the admin CSV export (`format=csv`).
The export is now one row per session (`session_id`), so the same `student_username` can appear in multiple rows.

## Core Columns

| Column | Description |
| --- | --- |
| `app_env` | Environment for the session (`local`, `production`, etc.). |
| `student_username` | Username entered in that session. |
| `session_count_for_username` | Number of sessions found for the same username. |
| `session_id` | Session ID for this row. |
| `started_at` | Session start timestamp. |
| `background` | Selected background/persona in this session. |
| `flow_stage` | Latest recorded flow stage for this session (`pretest`, `learning`, `posttest`, `done`, etc.). |
| `pretest_completed_at` | Timestamp when pretest was completed in this session. |
| `posttest_completed_at` | Timestamp when posttest was completed in this session. |
| `completed_at` | Timestamp when the full course was completed in this session. |

## Survey and Score Summary Columns

| Column | Description |
| --- | --- |
| `pretest_experience_level` | Self-reported experience level before pretest. |
| `pretest_confidence` | Self-reported confidence before learning modules. |
| `posttest_confidence` | Self-reported confidence after learning modules. |
| `pretest_questions` | Number of pretest questions included in this session summary. |
| `pretest_score_total` | Sum of earned points across pretest attempts in this session. |
| `pretest_score_max` | Sum of max points across pretest attempts in this session. |
| `pretest_score_pct` | Pretest percentage score for this session. |
| `pretest_graded_count` | Number of graded pretest attempts in this session. |
| `pretest_pending_count` | Number of pending pretest attempts in this session. |
| `pretest_failed_count` | Number of failed pretest attempts in this session. |
| `posttest_questions` | Number of posttest questions included in this session summary. |
| `posttest_score_total` | Sum of earned points across posttest attempts in this session. |
| `posttest_score_max` | Sum of max points across posttest attempts in this session. |
| `posttest_score_pct` | Posttest percentage score for this session. |
| `posttest_graded_count` | Number of graded posttest attempts in this session. |
| `posttest_pending_count` | Number of pending posttest attempts in this session. |
| `posttest_failed_count` | Number of failed posttest attempts in this session. |

## Progress and Duration Columns

| Column | Description |
| --- | --- |
| `learning_steps_completed` | Number of unique learning steps completed in this session. |
| `attempts_total_for_session` | Total number of attempts in this session. |
| `attempts_total_all_sessions_for_username` | Total number of attempts across all sessions for this username. |
| `pretest_duration_sec` | Total pretest duration in seconds for this session. |
| `posttest_duration_sec` | Total posttest duration in seconds for this session. |
| `course_duration_sec` | Total course duration in seconds for this session. |

## Per-Question Dynamic Columns

For each question in the session, a prefix is created:

- `q_<question_key>_...`
- Example: `q_pre_task_1_prompt`, `q_post_task_4_score_total`, `q_learning_chain_of_thought_2_duration_sec`

Available per-question fields:

| Column Pattern | Description |
| --- | --- |
| `q_<question_key>_phase` | Phase for the attempt (`pretest`, `learning`, `posttest`). |
| `q_<question_key>_title` | Question title. |
| `q_<question_key>_submitted_at` | Submission timestamp. |
| `q_<question_key>_graded_at` | Grading timestamp. |
| `q_<question_key>_duration_sec` | Time spent on that question in seconds. |
| `q_<question_key>_grading_status` | Grading status (`graded`, `pending`, `failed`). |
| `q_<question_key>_prompt` | User-written prompt text. |
| `q_<question_key>_submitted_answer` | Raw submitted answer text (when used). |
| `q_<question_key>_selected_choice` | Selected option text (for choice tasks). |
| `q_<question_key>_selected_method` | Selected prompting method (when applicable). |
| `q_<question_key>_selected_rationale` | User rationale for selected method (when applicable). |
| `q_<question_key>_score_total` | Earned score for that attempt. |
| `q_<question_key>_score_max` | Maximum score for that attempt. |
| `q_<question_key>_score_out_of_4` | Human-readable score format, usually like `3/4`. |
| `q_<question_key>_feedback` | Evaluator feedback text. |

## Per-Criterion Dynamic Columns

For each rubric criterion linked to a question attempt:

| Column Pattern | Description |
| --- | --- |
| `q_<question_key>_criterion_<criterion_name>_score` | Criterion-level numeric score. |
| `q_<question_key>_criterion_<criterion_name>_reason` | Criterion-level evaluator reason text. |
