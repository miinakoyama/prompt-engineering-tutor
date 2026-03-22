# CSV Export Dictionary

This document explains the columns in the admin CSV export (`format=csv`).
The export is one row per user (`student_username`), based on the user's latest session, plus per-question detail columns.

## Core Columns


| Column                         | Description                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------- |
| `app_env_latest`               | Environment for the latest session (`local`, `production`, etc.).             |
| `student_username`             | Username used as the one-row-per-user key.                                    |
| `session_count`                | Number of sessions found for this user.                                       |
| `latest_session_id`            | Session ID of the most recent session.                                        |
| `latest_started_at`            | Start timestamp of the most recent session.                                   |
| `background_latest`            | Selected background/persona in the latest session.                            |
| `flow_stage_latest`            | Latest recorded flow stage (`pretest`, `learning`, `posttest`, `done`, etc.). |
| `pretest_completed_at_latest`  | Timestamp when pretest was completed in latest session.                       |
| `posttest_completed_at_latest` | Timestamp when posttest was completed in latest session.                      |
| `completed_at_latest`          | Timestamp when the full course was completed in latest session.               |


## Survey and Score Summary Columns


| Column                            | Description                                                      |
| --------------------------------- | ---------------------------------------------------------------- |
| `pretest_experience_level_latest` | Self-reported experience level before pretest.                   |
| `pretest_confidence_latest`       | Self-reported confidence before learning modules.                |
| `posttest_confidence_latest`      | Self-reported confidence after learning modules.                 |
| `pretest_questions_latest`        | Number of pretest questions included in latest-session summary.  |
| `pretest_score_total_latest`      | Sum of earned points across latest pretest attempts.             |
| `pretest_score_max_latest`        | Sum of max points across latest pretest attempts.                |
| `pretest_score_pct_latest`        | Pretest percentage score for latest session.                     |
| `pretest_graded_count_latest`     | Number of graded latest pretest attempts.                        |
| `pretest_pending_count_latest`    | Number of pending latest pretest attempts.                       |
| `pretest_failed_count_latest`     | Number of failed latest pretest attempts.                        |
| `posttest_questions_latest`       | Number of posttest questions included in latest-session summary. |
| `posttest_score_total_latest`     | Sum of earned points across latest posttest attempts.            |
| `posttest_score_max_latest`       | Sum of max points across latest posttest attempts.               |
| `posttest_score_pct_latest`       | Posttest percentage score for latest session.                    |
| `posttest_graded_count_latest`    | Number of graded latest posttest attempts.                       |
| `posttest_pending_count_latest`   | Number of pending latest posttest attempts.                      |
| `posttest_failed_count_latest`    | Number of failed latest posttest attempts.                       |


## Progress and Duration Columns


| Column                            | Description                                                  |
| --------------------------------- | ------------------------------------------------------------ |
| `learning_steps_completed_latest` | Number of unique learning steps completed in latest session. |
| `attempts_total_all_sessions`     | Total number of attempts across all sessions for this user.  |
| `pretest_duration_sec_latest`     | Total pretest duration in seconds (latest session).          |
| `posttest_duration_sec_latest`    | Total posttest duration in seconds (latest session).         |
| `course_duration_sec_latest`      | Total course duration in seconds (latest session).           |


## Per-Question Dynamic Columns

For each question in the latest session, a prefix is created:

- `q_<question_key>_...`  
Example: `q_pre_task_1_prompt`, `q_post_task_4_score_total`, `q_learning_chain_of_thought_2_duration_sec`

Available per-question fields:


| Column Pattern                        | Description                                                |
| ------------------------------------- | ---------------------------------------------------------- |
| `q_<question_key>_phase`              | Phase for the attempt (`pretest`, `learning`, `posttest`). |
| `q_<question_key>_title`              | Question title.                                            |
| `q_<question_key>_submitted_at`       | Submission timestamp.                                      |
| `q_<question_key>_graded_at`          | Grading timestamp.                                         |
| `q_<question_key>_duration_sec`       | Time spent on that question in seconds.                    |
| `q_<question_key>_grading_status`     | Grading status (`graded`, `pending`, `failed`).            |
| `q_<question_key>_prompt`             | User-written prompt text.                                  |
| `q_<question_key>_submitted_answer`   | Raw submitted answer text (when used).                     |
| `q_<question_key>_selected_choice`    | Selected option text (for choice tasks).                   |
| `q_<question_key>_selected_method`    | Selected prompting method (when applicable).               |
| `q_<question_key>_selected_rationale` | User rationale for selected method (when applicable).      |
| `q_<question_key>_score_total`        | Earned score for that attempt.                             |
| `q_<question_key>_score_max`          | Maximum score for that attempt.                            |
| `q_<question_key>_score_out_of_4`     | Human-readable score format, usually like `3/4`.           |
| `q_<question_key>_feedback`           | Evaluator feedback text.                                   |


## Per-Criterion Dynamic Columns

For each rubric criterion linked to a question attempt:


| Column Pattern                                       | Description                            |
| ---------------------------------------------------- | -------------------------------------- |
| `q_<question_key>_criterion_<criterion_name>_score`  | Criterion-level numeric score.         |
| `q_<question_key>_criterion_<criterion_name>_reason` | Criterion-level evaluator reason text. |


