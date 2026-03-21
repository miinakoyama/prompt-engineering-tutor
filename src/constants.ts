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
      'Academic Setting': {
        badExample: 'Explain photosynthesis.',
        goodExample: 'Explain photosynthesis in 3 short paragraphs for an introductory biology class: one on the inputs, one on the chloroplast process, and one on the outputs. Use clear language and include one classroom-friendly analogy.',
        instruction: '### How to write a good Zero-shot prompt:\n1. **Be Specific:** Clearly define the topic, length, and format.\n2. **Set the Tone:** Specify if you want it to be professional, witty, or poetic.\n3. **Define the Audience:** Tell the AI who the content is for.\n4. **Add Constraints:** Mention what to include or exclude.',
        levels: {
          1: {
            title: 'The Choice',
            task: 'Select from given prompt examples. Which zero-shot prompt is more likely to give a high-quality, specific result for a class or lesson task?',
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
            task: 'Task: Write a prompt to explain "Photosynthesis" for an academic audience (students and instructors). Ensure your prompt is specific, sets a tone, defines the audience, and adds constraints (e.g., length or format).',
            referencePrompt: 'Explain the concept of photosynthesis for an introductory biology class handout that can be used by both students and instructors. Use a clear and educational tone. Structure the explanation in 3-4 short paragraphs covering: what photosynthesis is, where it happens, and why it matters. Keep the total length under 200 words.',
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
        },
      },
    },
  },
  {
    id: 'Few-shot',
    title: 'Few-shot Prompting',
    description: 'Providing a few examples to guide the AI\'s output format or style.',
    byPersona: {
      'Academic Setting': {
        badExample: 'These are easy: "2+2". These are hard: "Solve the system of equations." Now classify: "Write an essay on symbolism."',
        goodExample: 'Item: "Summarize chapter 1" Category: Reading Task. Item: "Solve problem 5" Category: Quantitative Task. Item: "Write an essay on symbolism" Category:',
        instruction: '### How to write a good Few-shot prompt:\n1. **Consistency is Key:** Use the exact same format for every example.\n2. **Label Clearly:** Use labels like "Input:" and "Output:" or "Q:" and "A:".\n3. **Diverse Examples:** Provide a range of examples (e.g., positive, negative, and neutral).\n4. **End with a Trigger:** Finish with a trailing label (like "Output:") to signal the AI to start.',
        levels: {
          1: {
            title: 'The Choice',
            task: 'Select from given prompt examples. Which few-shot prompt better helps the AI classify academic tasks in a consistent format?',
            choices: [
              {
                text: 'These are easy: "2+2". These are hard: "Solve the system of equations." Now classify: "Write an essay on symbolism."',
                isCorrect: false,
                explanation: 'The format is inconsistent and doesn\'t clearly separate each example for the AI to copy.',
              },
              {
                text: 'Task: "Summarize chapter 1" Type: Reading\nTask: "Solve problem 5" Type: Quantitative\nTask: "Write an essay on symbolism" Type:',
                isCorrect: true,
                explanation: 'Uses a clear, consistent "Task:" and "Type:" pattern so the AI can classify the last item the same way.',
              },
            ],
          },
          2: {
            title: 'Application',
            task: 'Task: Create a few-shot prompt to classify academic support tips as "Time Management", "Learning Strategy", or "Assessment Prep". Provide at least 3 examples in a consistent format (e.g., Tip: ... Category: ...).',
            referencePrompt: 'Tip: "Break your study session into 25-minute blocks with 5-minute breaks."\nCategory: Time Management\n\nTip: "Use concept maps to connect key ideas from each lecture."\nCategory: Learning Strategy\n\nTip: "Practice with past exams under timed conditions."\nCategory: Assessment Prep\n\nTip: "Review your notes within 24 hours of class."\nCategory:',
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
        },
      },
    },
  },
  {
    id: 'Chain-of-Thought',
    title: 'Chain-of-Thought (CoT)',
    description: 'Encouraging the AI to "think out loud" or show its reasoning steps.',
    byPersona: {
      'Academic Setting': {
        badExample: 'What is 15 * 12?',
        goodExample: 'To find 15 * 12, first multiply 15 * 10 = 150. Then multiply 15 * 2 = 30. Finally, add 150 + 30 = 180. Now, what is 24 * 11?',
        instruction: '### How to write a good Chain-of-Thought prompt:\n1. **Use Triggers:** Phrases like "Let\'s think step by step" or "Show your reasoning" are powerful.\n2. **Decompose Tasks:** Break complex problems into smaller, logical sub-tasks.\n3. **Provide a Path:** Sometimes showing one example of the reasoning process helps the AI follow suit.\n4. **Verify Steps:** Ask the AI to double-check its own logic at the end.',
        levels: {
          1: {
            title: 'The Choice',
            task: 'Select from given prompt examples. Which prompt effectively uses Chain-of-Thought for an academic planning or problem-solving task?',
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
            task: 'Task: Write a prompt so the AI solves a logic puzzle about planning an academic schedule (e.g., 3 sessions in 3 time slots with constraints). Ensure the AI shows its reasoning steps so you can check the logic.',
            referencePrompt: 'I need to schedule 3 class sessions (Math review, Writing workshop, Science lab prep) into 3 time slots (9am, 11am, 2pm). Constraints: Science lab prep cannot be at 2pm, and Writing workshop must come before Science lab prep. Think step by step: First, list what we know. Second, try placing each session. Third, check if all constraints are satisfied. Show your reasoning for each step.',
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
        },
      },
    },
  },
];
