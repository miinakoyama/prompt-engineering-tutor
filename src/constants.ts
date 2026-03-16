import { Module, Rubric } from './types';

export const ZERO_SHOT_RUBRIC: Rubric = {
  criteria: [
    { id: 'specificity', label: 'Specificity', description: 'The task is clearly and precisely defined' },
    { id: 'audience', label: 'Audience', description: 'The target audience or context is specified' },
    { id: 'format', label: 'Format', description: 'The desired output format is indicated' },
    { id: 'constraints', label: 'Constraints', description: 'Length, exclusions, or other boundaries are set' },
  ],
  thresholds: { green: 3, yellow: 2 },
};

export const FEW_SHOT_RUBRIC: Rubric = {
  criteria: [
    { id: 'consistency', label: 'Consistency', description: 'All examples follow the exact same format' },
    { id: 'labeling', label: 'Clear Labels', description: 'Input/output pairs are clearly labeled' },
    { id: 'diversity', label: 'Diversity', description: 'Examples cover different cases or categories' },
    { id: 'trigger', label: 'Trailing Trigger', description: 'Ends with a label to prompt the AI to continue' },
  ],
  thresholds: { green: 3, yellow: 2 },
};

export const COT_RUBRIC: Rubric = {
  criteria: [
    { id: 'stepbystep', label: 'Step-by-Step', description: 'Explicitly asks for reasoning steps' },
    { id: 'decomposition', label: 'Decomposition', description: 'Breaks the problem into smaller sub-tasks' },
    { id: 'verification', label: 'Verification', description: 'Asks the AI to check or verify its reasoning' },
    { id: 'clarity', label: 'Clarity', description: 'The problem and constraints are clearly stated' },
  ],
  thresholds: { green: 3, yellow: 2 },
};

export const MODULES: Module[] = [
  {
    id: 'Zero-shot',
    title: 'Zero-shot Prompting',
    description: 'Providing an AI model with a task or instruction without any previous examples of the desired output.',
    byPersona: {
      Student: {
        badExample: 'Explain photosynthesis.',
        goodExample: 'Explain photosynthesis in 3 short paragraphs for a 10th-grade biology report: one on the inputs, one on the process in the chloroplast, and one on the outputs. Use simple language and include one example from everyday life.',
        instruction: '### How to write a good Zero-shot prompt:\n1. **Be Specific:** Clearly define the topic, length, and format.\n2. **Set the Tone:** Specify if you want it to be professional, witty, or poetic.\n3. **Define the Audience:** Tell the AI who the content is for.\n4. **Add Constraints:** Mention what to include or exclude.',
        levels: {
          1: {
            title: 'The Choice',
            task: 'Select from given prompt examples. Which of these zero-shot prompts is more likely to give a high-quality, specific result for a school assignment?',
            choices: [
              {
                text: 'Summarize the causes of World War I.',
                isCorrect: false,
                explanation: 'This is too vague. The AI doesn\'t know the required length, format (essay vs bullet points), or grade level.',
              },
              {
                text: 'Summarize the main causes of World War I in 4 bullet points for a high school history essay draft. Keep each point under 2 sentences.',
                isCorrect: true,
                explanation: 'This prompt gives a clear format (bullet points), length (4 points, under 2 sentences each), and context (high school essay).',
              },
            ],
          },
          2: {
            title: 'Application',
            task: 'Task: Write a prompt to explain the concept of "Photosynthesis" for a class presentation. Ensure your prompt is specific, sets a tone, defines the audience (e.g., your classmates), and adds constraints (e.g., length or format).',
            referencePrompt: 'Explain the concept of photosynthesis for a 10th-grade biology class presentation. Use a friendly and educational tone suitable for classmates. Structure the explanation in 3-4 short paragraphs covering: what photosynthesis is, where it happens, and why it matters. Keep the total length under 200 words.',
            rubric: ZERO_SHOT_RUBRIC,
          },
          3: {
            title: 'Refinement',
            task: 'Task: Refine your previous prompt. Add constraints so the explanation fits on a single presentation slide, uses exactly 3 bullet points, and stays accessible to classmates who are new to the topic.',
            referencePrompt: 'Explain photosynthesis for a single presentation slide aimed at 10th-grade classmates who are new to biology. Use exactly 3 bullet points. Each bullet should be one sentence maximum. Avoid technical jargon and use everyday language. Include one simple analogy to help understanding.',
            rubric: ZERO_SHOT_RUBRIC,
          },
        },
      },
      Teacher: {
        badExample: 'Write a lesson plan.',
        goodExample: 'Write a 45-minute lesson plan for introducing "fractions" to 3rd graders. Include: one clear learning objective, a 5-minute warm-up, a 20-minute main activity with differentiation for struggling and advanced students, and an exit ticket question. Use a direct-instruction structure.',
        instruction: '### How to write a good Zero-shot prompt:\n1. **Be Specific:** Clearly define the topic, length, and format.\n2. **Set the Tone:** Specify if you want it to be professional, witty, or poetic.\n3. **Define the Audience:** Tell the AI who the content is for.\n4. **Add Constraints:** Mention what to include or exclude.',
        levels: {
          1: {
            title: 'The Choice',
            task: 'Select from given prompt examples. Which zero-shot prompt is more likely to produce a useful resource for instructional design or course organization?',
            choices: [
              {
                text: 'Create discussion questions for a unit.',
                isCorrect: false,
                explanation: 'Too vague. The AI doesn\'t know the subject, grade level, learning goals, or how many questions you need.',
              },
              {
                text: 'Create 5 discussion questions for a 10th-grade English unit on "To Kill a Mockingbird" that assess understanding of theme and character. Include one question suitable for a Socratic seminar and specify Bloom\'s level for each.',
                isCorrect: true,
                explanation: 'This specifies subject, grade, text, number of questions, purpose (theme/character), and a format constraint (Socratic + Bloom\'s), making it easy to drop into a lesson plan.',
              },
            ],
          },
          2: {
            title: 'Application',
            task: 'Task: Write a prompt to generate a rubric for evaluating student essays (e.g., argumentative or analytical). Ensure your prompt defines the criteria, performance levels, and how the rubric will be used (e.g., peer review vs. summative grade).',
            referencePrompt: 'Create a 4-point rubric for evaluating 9th-grade argumentative essays. Include these criteria: thesis clarity, use of evidence, logical organization, and counterargument handling. For each criterion, provide descriptors for Excellent (4), Proficient (3), Developing (2), and Beginning (1). This rubric will be used for summative grading. Format as a table.',
            rubric: ZERO_SHOT_RUBRIC,
          },
          3: {
            title: 'Refinement',
            task: 'Task: Refine your rubric prompt. Add a constraint so the rubric explicitly excludes "grammar and spelling" from the main criteria but includes a separate section for "clarity and organization."',
            referencePrompt: 'Create a 4-point rubric for evaluating 9th-grade argumentative essays. Main criteria: thesis clarity, use of evidence, and counterargument handling. Explicitly exclude grammar and spelling from the main scoring. Add a separate section titled "Clarity and Organization" with its own 4-point scale. For each criterion, provide descriptors for Excellent (4), Proficient (3), Developing (2), and Beginning (1). Format as a table with clear section headers.',
            rubric: ZERO_SHOT_RUBRIC,
          },
        },
      },
      'Working Professional': {
        badExample: 'Write a report.',
        goodExample: 'Write a 1-page executive summary of our Q3 sales results for the board. Include: top 3 wins, top 2 risks, and one recommended action. Use a formal tone and avoid jargon. End with a single bullet list of key metrics.',
        instruction: '### How to write a good Zero-shot prompt:\n1. **Be Specific:** Clearly define the topic, length, and format.\n2. **Set the Tone:** Specify if you want it to be professional, witty, or poetic.\n3. **Define the Audience:** Tell the AI who the content is for.\n4. **Add Constraints:** Mention what to include or exclude.',
        levels: {
          1: {
            title: 'The Choice',
            task: 'Select from given prompt examples. Which zero-shot prompt is more likely to give a high-quality, actionable result for a workplace task?',
            choices: [
              {
                text: 'Write a blog post about healthy eating.',
                isCorrect: false,
                explanation: 'This is too vague. The AI doesn\'t know the target audience, tone, or specific focus area.',
              },
              {
                text: 'Write a 500-word blog post about the benefits of a Mediterranean diet for office workers, using a professional yet encouraging tone.',
                isCorrect: true,
                explanation: 'This prompt provides clear constraints (length), a specific topic (Mediterranean diet), a target audience (office workers), and a desired tone.',
              },
            ],
          },
          2: {
            title: 'Application',
            task: 'Task: Write a prompt to draft a short project update email for your manager. Ensure your prompt is specific (project name, timeframe), sets the tone, defines what to include (e.g., progress, blockers, next steps), and any constraints (length, no attachments).',
            referencePrompt: 'Draft a project update email to my manager about the Q1 Marketing Dashboard project for the week of March 10-14. Use a professional but concise tone. Include: current progress percentage, one key accomplishment this week, any blockers, and next steps for the coming week. Keep the email under 150 words. No attachments needed.',
            rubric: ZERO_SHOT_RUBRIC,
          },
          3: {
            title: 'Refinement',
            task: 'Task: Refine your previous prompt. Add a constraint so the update must be readable in under 60 seconds and must highlight exactly one ask or decision needed from your manager.',
            referencePrompt: 'Draft a project update email to my manager about the Q1 Marketing Dashboard project for the week of March 10-14. Use a professional but concise tone. Structure for 60-second readability: start with a one-sentence status summary, then 3 bullet points (progress, blocker, next step). End with exactly one clear ask or decision needed from my manager, highlighted in bold. Maximum 100 words total.',
            rubric: ZERO_SHOT_RUBRIC,
          },
        },
      },
    },
  },
  {
    id: 'Few-shot',
    title: 'Few-shot Prompting',
    description: 'Providing a few examples to guide the AI\'s output format or style.',
    byPersona: {
      Student: {
        badExample: 'These are easy: "2+2". These are hard: "Solve the system of equations." Now classify: "Write an essay on symbolism."',
        goodExample: 'Task: "Summarize chapter 1" Type: Reading. Task: "Solve problem 5" Type: Math. Task: "Write an essay on symbolism" Type:',
        instruction: '### How to write a good Few-shot prompt:\n1. **Consistency is Key:** Use the exact same format for every example.\n2. **Label Clearly:** Use labels like "Input:" and "Output:" or "Q:" and "A:".\n3. **Diverse Examples:** Provide a range of examples (e.g., positive, negative, and neutral).\n4. **End with a Trigger:** Finish with a trailing label (like "Output:") to signal the AI to start.',
        levels: {
          1: {
            title: 'The Choice',
            task: 'Select from given prompt examples. Which few-shot prompt better helps the AI classify homework problem types in a consistent format?',
            choices: [
              {
                text: 'These are easy: "2+2". These are hard: "Solve the system of equations." Now classify: "Write an essay on symbolism."',
                isCorrect: false,
                explanation: 'The format is inconsistent and doesn\'t clearly separate each example for the AI to copy.',
              },
              {
                text: 'Task: "Summarize chapter 1" Type: Reading\nTask: "Solve problem 5" Type: Math\nTask: "Write an essay on symbolism" Type:',
                isCorrect: true,
                explanation: 'Uses a clear, consistent "Task:" and "Type:" pattern so the AI can classify the last item the same way.',
              },
            ],
          },
          2: {
            title: 'Application',
            task: 'Task: Create a few-shot prompt to classify study tips as "Time Management", "Note-taking", or "Test Prep". Provide at least 3 examples in a consistent format (e.g., Tip: ... Category: ...).',
            referencePrompt: 'Tip: "Break your study session into 25-minute blocks with 5-minute breaks."\nCategory: Time Management\n\nTip: "Use different colored highlighters for main ideas vs. supporting details."\nCategory: Note-taking\n\nTip: "Practice with past exams under timed conditions."\nCategory: Test Prep\n\nTip: "Review your notes within 24 hours of class."\nCategory:',
            rubric: FEW_SHOT_RUBRIC,
          },
          3: {
            title: 'Refinement',
            task: 'Task: Refine your few-shot prompt to also handle "Group Study" as a category. Add at least one example for this new category while keeping the same format.',
            referencePrompt: 'Tip: "Break your study session into 25-minute blocks with 5-minute breaks."\nCategory: Time Management\n\nTip: "Use different colored highlighters for main ideas vs. supporting details."\nCategory: Note-taking\n\nTip: "Practice with past exams under timed conditions."\nCategory: Test Prep\n\nTip: "Assign each group member a section to teach the others."\nCategory: Group Study\n\nTip: "Create a shared study guide with your classmates."\nCategory:',
            rubric: FEW_SHOT_RUBRIC,
          },
        },
      },
      Teacher: {
        badExample: 'Is this feedback positive? "The student showed improvement."',
        goodExample: 'Feedback: "Needs to show work." Category: Constructive. Feedback: "Excellent use of evidence." Category: Praise. Feedback: "The student showed improvement." Category:',
        instruction: '### How to write a good Few-shot prompt:\n1. **Consistency is Key:** Use the exact same format for every example.\n2. **Label Clearly:** Use labels like "Input:" and "Output:" or "Q:" and "A:".\n3. **Diverse Examples:** Provide a range of examples (e.g., positive, negative, and neutral).\n4. **End with a Trigger:** Finish with a trailing label (like "Output:") to signal the AI to start.',
        levels: {
          1: {
            title: 'The Choice',
            task: 'Select from given prompt examples. Which few-shot prompt better guides the AI to classify student feedback or assignment types in a format you can use for course organization?',
            choices: [
              {
                text: 'Some feedback is about content, some about format. "Add more citations" is content. "Use 12pt font" is format. Now: "Expand your conclusion."',
                isCorrect: false,
                explanation: 'Examples are there but the structure is uneven and not easy for the AI to replicate for grading or reporting.',
              },
              {
                text: 'Assignment: "Write a 5-paragraph essay" Type: Summative\nAssignment: "Complete the reading guide" Type: Formative\nAssignment: "Submit draft for peer review" Type:',
                isCorrect: true,
                explanation: 'Clear "Assignment:" and "Type:" labels with consistent formatting make it easy to extend to new assignment types for your syllabus or LMS.',
              },
            ],
          },
          2: {
            title: 'Application',
            task: 'Task: Create a few-shot prompt to classify student feedback comments as "Content", "Organization", or "Mechanics". Provide at least 3 examples in a consistent format for use in evaluation or comment banks.',
            referencePrompt: 'Feedback: "Your thesis statement needs more specificity about your main argument."\nCategory: Content\n\nFeedback: "The transition between paragraphs 2 and 3 is unclear."\nCategory: Organization\n\nFeedback: "Watch your subject-verb agreement in the conclusion."\nCategory: Mechanics\n\nFeedback: "Your supporting evidence doesn\'t directly connect to your claim."\nCategory:',
            rubric: FEW_SHOT_RUBRIC,
          },
          3: {
            title: 'Refinement',
            task: 'Task: Refine your few-shot prompt to also handle "Citation" as a category. Add an example for this new category so you can use it in rubric or feedback automation.',
            referencePrompt: 'Feedback: "Your thesis statement needs more specificity about your main argument."\nCategory: Content\n\nFeedback: "The transition between paragraphs 2 and 3 is unclear."\nCategory: Organization\n\nFeedback: "Watch your subject-verb agreement in the conclusion."\nCategory: Mechanics\n\nFeedback: "You need to include page numbers in your in-text citations."\nCategory: Citation\n\nFeedback: "The quote on page 2 is missing its source attribution."\nCategory:',
            rubric: FEW_SHOT_RUBRIC,
          },
        },
      },
      'Working Professional': {
        badExample: 'Classify this movie as good or bad: "The acting was superb."',
        goodExample: 'Input: "I loved it!" Output: Positive. Input: "It was okay." Output: Neutral. Input: "The acting was superb." Output:',
        instruction: '### How to write a good Few-shot prompt:\n1. **Consistency is Key:** Use the exact same format for every example.\n2. **Label Clearly:** Use labels like "Input:" and "Output:" or "Q:" and "A:".\n3. **Diverse Examples:** Provide a range of examples (e.g., positive, negative, and neutral).\n4. **End with a Trigger:** Finish with a trailing label (like "Output:") to signal the AI to start.',
        levels: {
          1: {
            title: 'The Choice',
            task: 'Select from given prompt examples. Which few-shot prompt better guides the AI to follow a specific format for classifying workplace items (e.g., emails, tickets)?',
            choices: [
              {
                text: 'Classify these: "I love it" (Positive), "It is bad" (Negative). Now classify: "The food was okay."',
                isCorrect: false,
                explanation: 'While it gives examples, the format is a bit cluttered and doesn\'t clearly separate input from output for the AI to follow.',
              },
              {
                text: 'Input: "I love it" \nOutput: Positive\n\nInput: "It is bad"\nOutput: Negative\n\nInput: "The food was okay."\nOutput:',
                isCorrect: true,
                explanation: 'This uses a clear, consistent pattern that the AI can easily replicate. The use of "Input:" and "Output:" labels makes the structure explicit.',
              },
            ],
          },
          2: {
            title: 'Application',
            task: 'Task: Create a few-shot prompt to classify support tickets or customer emails as "Billing", "Technical", or "General". Provide at least 3 examples in a consistent format.',
            referencePrompt: 'Ticket: "I was charged twice for my subscription this month."\nCategory: Billing\n\nTicket: "The app crashes whenever I try to upload a file larger than 10MB."\nCategory: Technical\n\nTicket: "What are your business hours?"\nCategory: General\n\nTicket: "My payment method was declined but I have sufficient funds."\nCategory:',
            rubric: FEW_SHOT_RUBRIC,
          },
          3: {
            title: 'Refinement',
            task: 'Task: Refine your few-shot prompt to also handle "Shipping" issues. Add an example for this new category.',
            referencePrompt: 'Ticket: "I was charged twice for my subscription this month."\nCategory: Billing\n\nTicket: "The app crashes whenever I try to upload a file larger than 10MB."\nCategory: Technical\n\nTicket: "What are your business hours?"\nCategory: General\n\nTicket: "My package shows delivered but I never received it."\nCategory: Shipping\n\nTicket: "Can I change the delivery address for my pending order?"\nCategory:',
            rubric: FEW_SHOT_RUBRIC,
          },
        },
      },
    },
  },
  {
    id: 'Chain-of-Thought',
    title: 'Chain-of-Thought (CoT)',
    description: 'Encouraging the AI to "think out loud" or show its reasoning steps.',
    byPersona: {
      Student: {
        badExample: 'What is 15 * 12?',
        goodExample: 'To find 15 * 12, first multiply 15 * 10 = 150. Then multiply 15 * 2 = 30. Finally, add 150 + 30 = 180. Now, what is 24 * 11?',
        instruction: '### How to write a good Chain-of-Thought prompt:\n1. **Use Triggers:** Phrases like "Let\'s think step by step" or "Show your reasoning" are powerful.\n2. **Decompose Tasks:** Break complex problems into smaller, logical sub-tasks.\n3. **Provide a Path:** Sometimes showing one example of the reasoning process helps the AI follow suit.\n4. **Verify Steps:** Ask the AI to double-check its own logic at the end.',
        levels: {
          1: {
            title: 'The Choice',
            task: 'Select from given prompt examples. Which prompt effectively uses Chain-of-Thought for a subject-related or problem-solving task?',
            choices: [
              {
                text: 'What is 25 * 4 + 10? Think step by step.',
                isCorrect: true,
                explanation: 'Adding "Think step by step" is a simple yet powerful CoT trigger that encourages the AI to decompose the problem.',
              },
              {
                text: 'Calculate 25 * 4 + 10 and give me the final answer immediately.',
                isCorrect: false,
                explanation: 'Asking for the answer "immediately" discourages the AI from using internal reasoning steps, which can lead to errors in complex tasks.',
              },
            ],
          },
          2: {
            title: 'Application',
            task: 'Task: Write a prompt so the AI solves a logic puzzle about planning a study schedule (e.g., 3 subjects in 3 time slots with constraints). Ensure the AI shows its reasoning steps so you can check the logic.',
            referencePrompt: 'I need to schedule 3 subjects (Math, English, Science) into 3 time slots (9am, 11am, 2pm). Constraints: Math cannot be at 2pm, and English must come before Science. Think step by step: First, list what we know. Second, try placing each subject. Third, check if all constraints are satisfied. Show your reasoning for each step.',
            rubric: COT_RUBRIC,
          },
          3: {
            title: 'Refinement',
            task: 'Task: Refine your CoT prompt for a harder version: 5 subjects, one must be in the morning, and one subject cannot be right after another. Ask the AI to show each step and then verify no constraint is broken.',
            referencePrompt: 'Schedule 5 subjects (Math, English, Science, History, Art) into 5 time slots (8am, 9am, 11am, 1pm, 3pm). Constraints: (1) Math must be in the morning (8am or 9am), (2) History cannot be immediately after Science, (3) Art must be in the afternoon. Think step by step: First, identify fixed placements from constraints. Second, place remaining subjects one by one. Third, verify each constraint is satisfied. Finally, double-check by listing the final schedule and confirming no rules are broken.',
            rubric: COT_RUBRIC,
          },
        },
      },
      Teacher: {
        badExample: 'What rubric should I use for essays?',
        goodExample: 'To design a rubric, first list the learning objectives (e.g., thesis, evidence, organization). Then decide performance levels (e.g., Exceeds/Meets/Approaching/Below). For each level, write one concrete descriptor. Now, design a rubric for "argumentative essay" using this process step by step.',
        instruction: '### How to write a good Chain-of-Thought prompt:\n1. **Use Triggers:** Phrases like "Let\'s think step by step" or "Show your reasoning" are powerful.\n2. **Decompose Tasks:** Break complex problems into smaller, logical sub-tasks.\n3. **Provide a Path:** Sometimes showing one example of the reasoning process helps the AI follow suit.\n4. **Verify Steps:** Ask the AI to double-check its own logic at the end.',
        levels: {
          1: {
            title: 'The Choice',
            task: 'Select from given prompt examples. Which prompt effectively uses Chain-of-Thought for instructional design or evaluation (e.g., building rubrics or aligning objectives)?',
            choices: [
              {
                text: 'Design a rubric for lab reports. Think step by step: what skills are you assessing, then what levels, then what descriptors.',
                isCorrect: true,
                explanation: 'The prompt asks for explicit reasoning steps (skills → levels → descriptors), which helps the AI produce a coherent rubric you can adapt.',
              },
              {
                text: 'Give me a rubric for lab reports that I can use tomorrow.',
                isCorrect: false,
                explanation: 'Asking for a ready-made output without reasoning doesn\'t help you see how criteria were chosen or how to adjust them for your course.',
              },
            ],
          },
          2: {
            title: 'Application',
            task: 'Task: Write a prompt so the AI designs an assessment plan for a unit (e.g., what to assess, when, and how). Ensure the AI shows its reasoning step by step (e.g., learning goals first, then evidence, then task type).',
            referencePrompt: 'Design an assessment plan for a 2-week unit on the American Revolution for 8th graders. Think step by step: First, identify 3 key learning objectives for this unit. Second, for each objective, determine what evidence would show mastery. Third, choose appropriate assessment types (formative or summative) for each. Fourth, create a timeline showing when each assessment occurs. Show your reasoning at each step.',
            rubric: COT_RUBRIC,
          },
          3: {
            title: 'Refinement',
            task: 'Task: Refine your CoT prompt so the AI also explains how to differentiate the same assessment for struggling vs. advanced students, showing each step of the reasoning.',
            referencePrompt: 'Design an assessment plan for a 2-week unit on the American Revolution for 8th graders with differentiation. Think step by step: First, identify 3 key learning objectives. Second, determine evidence of mastery for each. Third, choose assessment types and create a timeline. Fourth, for each assessment, explain modifications for struggling learners (scaffolds, reduced complexity) and extensions for advanced learners (deeper analysis, additional challenges). Finally, verify that all versions still measure the same core objectives. Show reasoning at each step.',
            rubric: COT_RUBRIC,
          },
        },
      },
      'Working Professional': {
        badExample: 'What is 15 * 12?',
        goodExample: 'To find 15 * 12, first multiply 15 * 10 = 150. Then multiply 15 * 2 = 30. Finally, add 150 + 30 = 180. Now, what is 24 * 11?',
        instruction: '### How to write a good Chain-of-Thought prompt:\n1. **Use Triggers:** Phrases like "Let\'s think step by step" or "Show your reasoning" are powerful.\n2. **Decompose Tasks:** Break complex problems into smaller, logical sub-tasks.\n3. **Provide a Path:** Sometimes showing one example of the reasoning process helps the AI follow suit.\n4. **Verify Steps:** Ask the AI to double-check its own logic at the end.',
        levels: {
          1: {
            title: 'The Choice',
            task: 'Select from given prompt examples. Which prompt effectively uses Chain-of-Thought to solve a workplace or logic problem?',
            choices: [
              {
                text: 'What is 25 * 4 + 10? Think step by step.',
                isCorrect: true,
                explanation: 'Adding "Think step by step" is a simple yet powerful CoT trigger that encourages the AI to decompose the problem.',
              },
              {
                text: 'Calculate 25 * 4 + 10 and give me the final answer immediately.',
                isCorrect: false,
                explanation: 'Asking for the answer "immediately" discourages the AI from using internal reasoning steps, which can lead to errors in complex tasks.',
              },
            ],
          },
          2: {
            title: 'Application',
            task: 'Task: Write a prompt to solve a workplace logic puzzle (e.g., scheduling 3 people across 3 projects with constraints, or prioritizing tasks given deadlines and dependencies). Ensure the AI shows its reasoning steps.',
            referencePrompt: 'Assign 3 team members (Alice, Bob, Carol) to 3 projects (Website, Mobile App, API). Constraints: Alice has frontend expertise so she must work on Website or Mobile App. Bob cannot work on the same project type as last quarter (he did API). Carol is the only one with backend certification required for API. Think step by step: First, identify any forced assignments from constraints. Second, assign remaining people. Third, verify all constraints are satisfied.',
            rubric: COT_RUBRIC,
          },
          3: {
            title: 'Refinement',
            task: 'Task: Refine your CoT prompt to solve a more complex version: 5 people in a race, and one person finished twice as fast as another. Ask the AI to show each step and then verify the answer.',
            referencePrompt: '5 runners (A, B, C, D, E) finished a race. Clues: (1) A finished twice as fast as D, (2) B finished immediately after C, (3) E did not finish first or last, (4) C finished before A. Think step by step: First, establish what "twice as fast" means for relative positions. Second, map out the constraints as relationships. Third, try possible orderings that satisfy all clues. Fourth, verify the final order against each clue. Show your work and explain any dead ends you encounter.',
            rubric: COT_RUBRIC,
          },
        },
      },
    },
  },
];
