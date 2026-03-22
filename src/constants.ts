import { AssessmentTask, Module, PromptingMethod, Rubric } from "./types";

export const ZERO_SHOT_RUBRIC: Rubric = {
  criteria: [
    {
      id: "specificity",
      label: "Specificity",
      description: "The task is clearly and precisely defined",
    },
    {
      id: "audience",
      label: "Audience",
      description: "The target audience or context is specified",
    },
    {
      id: "format",
      label: "Format",
      description: "The desired output format is indicated",
    },
    {
      id: "constraints",
      label: "Constraints",
      description: "Length, exclusions, or other boundaries are set",
    },
  ],
  thresholds: { green: 3, yellow: 2 },
};

export const FEW_SHOT_RUBRIC: Rubric = {
  criteria: [
    {
      id: "pattern_consistency",
      label: "Pattern Consistency",
      description:
        "Input/output format is highly uniform and easy for the model to follow",
    },
    {
      id: "representational_logic",
      label: "Representational Logic",
      description:
        "Examples demonstrate the transformation rule across different variations",
    },
    {
      id: "completion_trigger",
      label: "Completion Trigger",
      description:
        "Prompt ends with the final label so the model continues correctly",
    },
    {
      id: "constraints",
      label: "Constraints",
      description:
        "Prompt includes useful response constraints and avoids unnecessary extra text",
    },
  ],
  thresholds: { green: 3, yellow: 2 },
};

export const COT_RUBRIC: Rubric = {
  criteria: [
    {
      id: "reasoning_trigger",
      label: "Reasoning Trigger",
      description: "Explicitly asks the model to show reasoning step by step",
    },
    {
      id: "logic_sequencing",
      label: "Logic Sequencing",
      description:
        "Includes all relevant chronological facts and relationships",
    },
    {
      id: "specificity",
      label: "Specificity",
      description: "Goal and scenario details are clearly defined",
    },
    {
      id: "format",
      label: "Format",
      description:
        "Prompt is structured for multi-step reasoning instead of a one-line answer",
    },
  ],
  thresholds: { green: 3, yellow: 2 },
};

export const TECHNIQUE_SELECTION_RUBRIC: Rubric = {
  criteria: [
    {
      id: "technique_fit",
      label: "Technique Fit",
      description:
        "Selects the most appropriate technique for the task and model behavior needed",
    },
    {
      id: "technique_signal",
      label: "Technique Signal",
      description: "Prompt structure clearly reflects the chosen technique",
    },
    {
      id: "execution_quality",
      label: "Execution Quality",
      description:
        "Applies the selected technique correctly in the prompt structure",
    },
    {
      id: "output_control",
      label: "Output Control",
      description:
        "Includes clear constraints for output quality, format, or completeness",
    },
  ],
  thresholds: { green: 3, yellow: 2 },
};

export const METHOD_RATIONALE_RUBRIC: Rubric = {
  criteria: [
    {
      id: "method_correctness",
      label: "Method Correctness",
      description:
        "Selected method is appropriate for the scenario complexity and ambiguity",
    },
    {
      id: "rationale_quality",
      label: "Rationale Quality",
      description:
        "Rationale clearly explains why the selected method fits better than alternatives",
    },
  ],
  thresholds: { green: 2, yellow: 1 },
};

export const PRE_TEST_TASKS: AssessmentTask[] = [
  {
    id: 1,
    title: "Task 1",
    technique: "Zero-shot",
    scenario:
      'You have customer reviews for a new cafe. You want the AI to label each review as "Happy," "Neutral," or "Angry."',
    requirement:
      'Write a one-sentence prompt that asks the AI to classify the sentiment of this review: "The coffee was lukewarm, but the staff was incredibly friendly and offered a refund."',
    referencePrompt:
      'Classify the sentiment of the following customer review as "Happy," "Neutral," or "Angry," and respond with only one of these labels and no additional explanation: "The coffee was lukewarm, but the staff was incredibly friendly and offered a refund."',
    rubric: ZERO_SHOT_RUBRIC,
  },
  {
    id: 2,
    title: "Task 2",
    technique: "Few-shot",
    scenario:
      'You want the AI to change project names into a code-friendly format by replacing spaces with underscores (e.g., "Project Delta" -> "Project_Delta").',
    requirement:
      'Write a prompt that includes two examples to show the AI how this formatting works, and then asks it to format this new input: "Upgrade Server Alpha".',
    referencePrompt:
      "Convert the following project names into a code-friendly format by replacing all spaces with underscores. Do not include any additional text or explanation.\nInput: Project Delta\nOutput: Project_Delta\nInput: Client Report Summary\nOutput: Client_Report_Summary\nInput: Upgrade Server Alpha\nOutput:",
    rubric: FEW_SHOT_RUBRIC,
  },
  {
    id: 3,
    title: "Task 3",
    technique: "Chain-of-Thought",
    scenario:
      "A library starts with 500 books. On Monday, 50 books are checked out. On Tuesday, 20 books are returned, but 10 books are lost. On Wednesday, the library gets 30 new books as a donation.",
    requirement:
      "Write a prompt that tells the AI to figure out the final number of books and explain the calculation step by step.",
    referencePrompt:
      "A library starts with 500 books. On Monday, 50 books are checked out. On Tuesday, 20 books are returned, but 10 books are lost. On Wednesday, the library receives 30 new books as a donation. Please calculate the final number of books and explain your reasoning step by step.",
    rubric: COT_RUBRIC,
  },
  {
    id: 4,
    title: "Task 4",
    technique: "Method Selection",
    scenario:
      'You are building a system that classifies customer support emails into categories so they can be routed to the correct team. Each email should be labeled as one of: "Billing Issue," "Technical Problem," or "Account Access." Some emails mention multiple issues or include extra details.',
    requirement:
      'Decide which prompting method (Zero-shot, Few-shot, or Chain-of-Thought) is most appropriate. Briefly explain why. Then write a prompt that correctly classifies this email: "Hi, I was charged twice for my subscription this month, and I cannot seem to find the refund option in my account settings. Can you help?"',
    referenceMethod: "Few-shot",
    referenceRationale:
      "Few-shot prompting is most appropriate because the task involves classifying complex, multi-issue text where the correct label may not be obvious. Examples reduce ambiguity while preserving consistent labels, and full chain-of-thought is unnecessary.",
    referencePrompt:
      'Classify each customer support email into one of the following categories: "Billing Issue," "Technical Problem," or "Account Access." Do not include any explanation.\nInput: I cannot log into my account even after resetting my password.\nOutput: Account Access\nInput: The app keeps crashing whenever I try to upload a file.\nOutput: Technical Problem\nInput: Hi, I was charged twice for my subscription this month, and I cannot seem to find the refund option in my account settings. Can you help?\nOutput:',
    rubric: FEW_SHOT_RUBRIC,
    requiresMethodSelection: true,
  },
];

export const POST_TEST_TASKS: AssessmentTask[] = [
  {
    id: 1,
    title: "Task 1",
    technique: "Zero-shot",
    scenario:
      'You are a social media manager. You need to turn a technical 3-page research paper about "Solar Flare Impact on GPS" into a catchy tweet for teenagers.',
    requirement:
      "Write a zero-shot prompt that defines a specific persona and audience to generate this tweet.",
    referencePrompt:
      "Act as a Social Media Manager for a tech news outlet. Your goal is to summarize the 'Solar Flare Impact on GPS' paper for an audience of teenagers (Ages 13-19). Use an energetic and relatable tone. Format the output as a single tweet. Constraints: Do not use words with more than 4 syllables, use exactly 2 hashtags, and include a reference to how this affects their phone's navigation apps (like Google Maps).",
    rubric: ZERO_SHOT_RUBRIC,
  },
  {
    id: 2,
    title: "Task 2",
    technique: "Few-shot",
    scenario:
      "You are building an app that requires AI responses to be in valid JSON format.",
    requirement:
      'Write a prompt using two examples that ensures the AI always returns data with the keys "summary" and "word_count". The target input is a paragraph about the Great Wall of China.',
    referencePrompt:
      'Convert the following text into a JSON object with the keys "summary" and "word_count". Only return valid JSON and no conversational text.\nInput: The Eiffel Tower is a famous landmark in Paris.\nOutput: {"summary": "A famous landmark in Paris.", "word_count": 7}\nInput: The Amazon Rainforest is the world\'s largest tropical rainforest.\nOutput: {"summary": "The world\'s largest tropical rainforest.", "word_count": 6}\nInput: The Great Wall of China is a series of fortifications that were built across the historical northern borders of ancient Chinese states.\nOutput:',
    rubric: FEW_SHOT_RUBRIC,
  },
  {
    id: 3,
    title: "Task 3",
    technique: "Chain-of-Thought",
    scenario:
      "A self-driving car must choose between two actions: hitting a stray dog, or swerving into a ditch, which may damage the car's expensive sensors. No humans are at risk, but both options have negative consequences.",
    requirement:
      "Write a prompt that instructs the AI to analyze both options step by step using a safety-first approach, compare the risks of each option, and make a final decision.",
    referencePrompt:
      "A self-driving car must choose between hitting a stray dog or swerving into a ditch, which may damage its sensors. No humans are at risk. Using a safety-first framework, think step by step and show your reasoning before giving a final answer. First, consider the harm to the dog. Second, analyze the risks and long-term safety consequences of damaging the sensors. Third, compare both options based on a safety-first approach. Finally, state the best course of action and explain your reasoning.",
    rubric: COT_RUBRIC,
  },
  {
    id: 4,
    title: "Task 4",
    technique: "Method Selection",
    scenario:
      "You are analyzing customer complaints to help a company respond appropriately. For each complaint, determine the main issue (Billing, Technical, or Shipping), identify the customer's emotion, and write a one-sentence apology tailored to the situation. Some complaints include multiple issues or mixed signals.",
    requirement:
      "Decide which prompting method (Zero-shot, Few-shot, or Chain-of-Thought) is most appropriate. Briefly explain why. Then write a prompt that instructs the AI to think step by step to determine the primary issue, identify emotion, and generate a one-sentence apology for this complaint: \"I've contacted support three times about my delayed order and still haven't received any updates. This is extremely frustrating.\"",
    referenceMethod: "Chain-of-Thought",
    referenceRationale:
      "Chain-of-Thought is most appropriate because this task requires sequential reasoning: identify issue, infer emotion, and craft a tailored apology. Step-by-step structure reduces ambiguity in multi-signal complaints.",
    referencePrompt:
      "You are analyzing a customer complaint from a dataset of customer complaints. Think step by step before giving your final answer.\nFirst, determine the primary department this complaint belongs to: Billing, Technical, or Shipping.\nSecond, identify the customer's emotion based on the language in the complaint.\nThird, write a single-sentence apology that is appropriate for this specific situation.\nComplaint: \"I've contacted support three times about my delayed order and still haven't received any updates. This is extremely frustrating.\"",
    rubric: COT_RUBRIC,
    requiresMethodSelection: true,
  },
];

export const METHOD_OPTIONS: PromptingMethod[] = [
  "Zero-shot",
  "Few-shot",
  "Chain-of-Thought",
];

export const MODULES: Module[] = [
  {
    id: "Zero-shot",
    title: "Zero-shot Prompting",
    description:
      "Providing an AI model with a task or instruction without any previous examples of the desired output.",
    byPersona: {
      "Academic Setting": {
        badExample: "Explain photosynthesis.",
        goodExample:
          "Explain photosynthesis in 3 short paragraphs for an introductory biology class: one on the inputs, one on the chloroplast process, and one on the outputs. Use clear language and include one classroom-friendly analogy.",
        instruction:
          "### How to write a good Zero-shot prompt:\n1. **Be Specific:** Clearly define the topic, length, and format.\n2. **Set the Tone:** Specify if you want it to be professional, witty, or poetic.\n3. **Define the Audience:** Tell the AI who the content is for.\n4. **Add Constraints:** Mention what to include or exclude.",
        levels: {
          1: {
            title: "The Choice",
            task: "Select from given prompt examples. Which zero-shot prompt is more likely to give a high-quality, specific result for a class or lesson task?",
            choices: [
              {
                text: "Summarize the causes of World War I.",
                isCorrect: false,
                explanation:
                  "This is too vague. The AI doesn't know the required length, format (essay vs bullet points), or grade level.",
              },
              {
                text: "Summarize the main causes of World War I in 4 bullet points for a high school history essay draft. Keep each point under 2 sentences.",
                isCorrect: true,
                explanation:
                  "This prompt gives a clear format (bullet points), length (4 points, under 2 sentences each), and context (high school essay).",
              },
            ],
          },
          2: {
            title: "Application",
            task: 'Task: Write a prompt to explain "Photosynthesis" for an academic audience (students and instructors). Ensure your prompt is specific, sets a tone, defines the audience, and adds constraints (e.g., length or format).',
            referencePrompt:
              "Explain the concept of photosynthesis for an introductory biology class handout that can be used by both students and instructors. Use a clear and educational tone. Structure the explanation in 3-4 short paragraphs covering: what photosynthesis is, where it happens, and why it matters. Keep the total length under 200 words.",
            rubric: ZERO_SHOT_RUBRIC,
          },
        },
      },
      "Working Professional": {
        badExample: "Write a report.",
        goodExample:
          "Write a 1-page executive summary of our Q3 sales results for the board. Include: top 3 wins, top 2 risks, and one recommended action. Use a formal tone and avoid jargon. End with a single bullet list of key metrics.",
        instruction:
          "### How to write a good Zero-shot prompt:\n1. **Be Specific:** Clearly define the topic, length, and format.\n2. **Set the Tone:** Specify if you want it to be professional, witty, or poetic.\n3. **Define the Audience:** Tell the AI who the content is for.\n4. **Add Constraints:** Mention what to include or exclude.",
        levels: {
          1: {
            title: "The Choice",
            task: "Select from given prompt examples. Which zero-shot prompt is more likely to give a high-quality, actionable result for a workplace task?",
            choices: [
              {
                text: "Write a blog post about healthy eating.",
                isCorrect: false,
                explanation:
                  "This is too vague. The AI doesn't know the target audience, tone, or specific focus area.",
              },
              {
                text: "Write a 500-word blog post about the benefits of a Mediterranean diet for office workers, using a professional yet encouraging tone.",
                isCorrect: true,
                explanation:
                  "This prompt provides clear constraints (length), a specific topic (Mediterranean diet), a target audience (office workers), and a desired tone.",
              },
            ],
          },
          2: {
            title: "Application",
            task: "Task: Write a prompt to draft a short project update email for your manager. Ensure your prompt is specific (project name, timeframe), sets the tone, defines what to include (e.g., progress, blockers, next steps), and any constraints (length, no attachments).",
            referencePrompt:
              "Draft a project update email to my manager about the Q1 Marketing Dashboard project for the week of March 10-14. Use a professional but concise tone. Include: current progress percentage, one key accomplishment this week, any blockers, and next steps for the coming week. Keep the email under 150 words. No attachments needed.",
            rubric: ZERO_SHOT_RUBRIC,
          },
        },
      },
    },
  },
  {
    id: "Few-shot",
    title: "Few-shot Prompting",
    description:
      "Providing a few examples to guide the AI's output format or style.",
    byPersona: {
      "Academic Setting": {
        badExample:
          'These are easy: "2+2". These are hard: "Solve the system of equations." Now classify: "Write an essay on symbolism."',
        goodExample:
          'Item: "Summarize chapter 1" Category: Reading Task. Item: "Solve problem 5" Category: Quantitative Task. Item: "Write an essay on symbolism" Category:',
        instruction:
          '### How to write a good Few-shot prompt:\n1. **Consistency is Key:** Use the exact same format for every example.\n2. **Label Clearly:** Use labels like "Input:" and "Output:" or "Q:" and "A:".\n3. **Diverse Examples:** Provide a range of examples (e.g., positive, negative, and neutral).\n4. **End with a Trigger:** Finish with a trailing label (like "Output:") to signal the AI to start.',
        levels: {
          1: {
            title: "The Choice",
            task: "Select from given prompt examples. Which few-shot prompt better helps the AI classify academic tasks in a consistent format?",
            choices: [
              {
                text: 'These are easy: "2+2". These are hard: "Solve the system of equations." Now classify: "Write an essay on symbolism."',
                isCorrect: false,
                explanation:
                  "The format is inconsistent and doesn't clearly separate each example for the AI to copy.",
              },
              {
                text: 'Task: "Summarize chapter 1" Type: Reading\nTask: "Solve problem 5" Type: Quantitative\nTask: "Write an essay on symbolism" Type:',
                isCorrect: true,
                explanation:
                  'Uses a clear, consistent "Task:" and "Type:" pattern so the AI can classify the last item the same way.',
              },
            ],
          },
          2: {
            title: "Application",
            task: 'Task: Create a few-shot prompt to classify academic support tips as "Time Management", "Learning Strategy", or "Assessment Prep". Provide at least 3 examples in a consistent format (e.g., Tip: ... Category: ...).',
            referencePrompt:
              'Tip: "Break your study session into 25-minute blocks with 5-minute breaks."\nCategory: Time Management\n\nTip: "Use concept maps to connect key ideas from each lecture."\nCategory: Learning Strategy\n\nTip: "Practice with past exams under timed conditions."\nCategory: Assessment Prep\n\nTip: "Review your notes within 24 hours of class."\nCategory:',
            rubric: FEW_SHOT_RUBRIC,
          },
        },
      },
      "Working Professional": {
        badExample:
          'Classify this movie as good or bad: "The acting was superb."',
        goodExample:
          'Input: "I loved it!" Output: Positive. Input: "It was okay." Output: Neutral. Input: "The acting was superb." Output:',
        instruction:
          '### How to write a good Few-shot prompt:\n1. **Consistency is Key:** Use the exact same format for every example.\n2. **Label Clearly:** Use labels like "Input:" and "Output:" or "Q:" and "A:".\n3. **Diverse Examples:** Provide a range of examples (e.g., positive, negative, and neutral).\n4. **End with a Trigger:** Finish with a trailing label (like "Output:") to signal the AI to start.',
        levels: {
          1: {
            title: "The Choice",
            task: "Select from given prompt examples. Which few-shot prompt better guides the AI to follow a specific format for classifying workplace items (e.g., emails, tickets)?",
            choices: [
              {
                text: 'Classify these: "I love it" (Positive), "It is bad" (Negative). Now classify: "The food was okay."',
                isCorrect: false,
                explanation:
                  "While it gives examples, the format is a bit cluttered and doesn't clearly separate input from output for the AI to follow.",
              },
              {
                text: 'Input: "I love it" \nOutput: Positive\n\nInput: "It is bad"\nOutput: Negative\n\nInput: "The food was okay."\nOutput:',
                isCorrect: true,
                explanation:
                  'This uses a clear, consistent pattern that the AI can easily replicate. The use of "Input:" and "Output:" labels makes the structure explicit.',
              },
            ],
          },
          2: {
            title: "Application",
            task: 'Task: Create a few-shot prompt to classify support tickets or customer emails as "Billing", "Technical", or "General". Provide at least 3 examples in a consistent format.',
            referencePrompt:
              'Ticket: "I was charged twice for my subscription this month."\nCategory: Billing\n\nTicket: "The app crashes whenever I try to upload a file larger than 10MB."\nCategory: Technical\n\nTicket: "What are your business hours?"\nCategory: General\n\nTicket: "My payment method was declined but I have sufficient funds."\nCategory:',
            rubric: FEW_SHOT_RUBRIC,
          },
        },
      },
    },
  },
  {
    id: "Chain-of-Thought",
    title: "Chain-of-Thought (CoT)",
    description:
      'Encouraging the AI to "think out loud" or show its reasoning steps.',
    byPersona: {
      "Academic Setting": {
        badExample:
          "Choose the fastest route from City A to City D for a fragile chemistry package.",
        goodExample:
          "A school must deliver a fragile chemistry apparatus from City A to City D. Think step by step: compare total cost after insurance, risk of damage, and time for each route, then choose the best route under the $40 budget.",
        instruction:
          '### How to write a good Chain-of-Thought prompt:\n1. **Use Triggers:** Phrases like "Let\'s think step by step" or "Show your reasoning" are powerful.\n2. **Decompose Tasks:** Break complex problems into smaller, logical sub-tasks.\n3. **Provide a Path:** Sometimes showing one example of the reasoning process helps the AI follow suit.\n4. **Verify Steps:** Ask the AI to double-check its own logic at the end.',
        levels: {
          1: {
            title: "The Choice",
            task: "Select from given prompt examples. Scenario: Your school needs to deliver a fragile chemistry apparatus from City A to City D. Route 1 costs $40 with 5% damage risk and takes 4 hours. Route 2 costs $30 with 20% risk and takes 3 hours. If risk is over 15%, insurance adds $15. Which prompt best uses Chain-of-Thought?",
            choices: [
              {
                text: "Choose the best route for the school package.",
                isCorrect: false,
                explanation:
                  "This asks for an answer but gives no reasoning structure, so the model may skip key trade-offs.",
              },
              {
                text: "Think step by step: calculate total cost for each route including insurance when applicable, compare risk and delivery time, check the $40 budget constraint, then recommend the best route with a brief justification.",
                isCorrect: true,
                explanation:
                  "This explicitly sequences the reasoning steps and forces constraint checking before a final recommendation.",
              },
              {
                text: "Pick Route 1 unless Route 2 is cheaper.",
                isCorrect: false,
                explanation:
                  "This is an oversimplified rule and does not instruct the model to reason through risk penalties and constraints.",
              },
            ],
          },
          2: {
            title: "Application",
            task: 'Write a Chain-of-Thought prompt for the "Green Logistics" puzzle.\n\nThe school must deliver a fragile chemistry apparatus from City A to City D.\nRoute 1: A-B-D, cost $40, risk 5%, time 4h.\nRoute 2: A-C-D, cost $30, risk 20%, time 3h.\n\nConstraint: budget is $40, and if risk is over 15%, insurance adds $15.\nYour prompt should make the AI reason step by step and choose the best route.',
            referencePrompt:
              "A school needs to deliver a fragile chemistry apparatus from City A to City D. Route 1 (A-B-D): cost $40, risk 5%, time 4 hours. Route 2 (A-C-D): cost $30, risk 20%, time 3 hours. If risk is over 15%, insurance adds $15. Budget limit is $40. Think step by step: (1) compute total cost for each route including insurance when needed, (2) compare risk and delivery time, (3) verify budget compliance, and (4) recommend the best route with a short justification.",
            rubric: COT_RUBRIC,
          },
        },
      },
      "Working Professional": {
        badExample:
          "Choose the best route from City A to City D for a fragile medical package.",
        goodExample:
          "A company must deliver a fragile medical package from City A to City D. Think step by step: calculate each route's final cost after insurance, compare risk and time, validate the $40 budget, then recommend the best route.",
        instruction:
          '### How to write a good Chain-of-Thought prompt:\n1. **Use Triggers:** Phrases like "Let\'s think step by step" or "Show your reasoning" are powerful.\n2. **Decompose Tasks:** Break complex problems into smaller, logical sub-tasks.\n3. **Provide a Path:** Sometimes showing one example of the reasoning process helps the AI follow suit.\n4. **Verify Steps:** Ask the AI to double-check its own logic at the end.',
        levels: {
          1: {
            title: "The Choice",
            task: "Select from given prompt examples. Scenario: A company must deliver a fragile medical package from City A to City D. Route 1 costs $40 with 5% risk and 4h. Route 2 costs $30 with 20% risk and 3h. If risk exceeds 15%, insurance adds $15. Which prompt best uses Chain-of-Thought?",
            choices: [
              {
                text: "Pick the faster route and return only the route name.",
                isCorrect: false,
                explanation:
                  "This ignores cost-risk trade-offs and provides no reasoning structure.",
              },
              {
                text: "Think step by step: compute final cost per route with insurance, compare risk and delivery time, check budget fit, then recommend the best route and explain why.",
                isCorrect: true,
                explanation:
                  "This requires explicit multi-step reasoning and a justified decision.",
              },
              {
                text: "Use whichever route has lower base cost.",
                isCorrect: false,
                explanation:
                  "Base cost alone is insufficient because insurance changes the total cost for high-risk routes.",
              },
            ],
          },
          2: {
            title: "Application",
            task: 'Write a Chain-of-Thought prompt for the "Green Logistics" puzzle. A company needs to deliver a fragile medical package from City A to City D.\nRoute 1: A-B-D, cost $40, risk 5%, time 4h.\nRoute 2: A-C-D, cost $30, risk 20%, time 3h.\nConstraint: budget is $40, and if risk is over 15%, insurance adds $15.\nYour prompt should force step-by-step reasoning and a final recommendation.',
            referencePrompt:
              "A company needs to deliver a fragile medical package from City A to City D. Route 1 (A-B-D): cost $40, risk 5%, time 4 hours. Route 2 (A-C-D): cost $30, risk 20%, time 3 hours. If risk is over 15%, insurance adds $15. Budget is $40. Think step by step: First compute each route's final cost including insurance. Second compare risk and delivery time. Third verify whether each route stays within budget. Finally choose the best route and explain the decision clearly.",
            rubric: COT_RUBRIC,
          },
        },
      },
    },
  },
  {
    id: "Technique Selection",
    title: "Technique Selection",
    description:
      "Selecting the best prompt engineering technique for a task, then applying it effectively.",
    byPersona: {
      "Academic Setting": {
        badExample:
          "Task: Build a nuanced synthesis across conflicting abstracts.\nTechnique: Zero-shot\nPrompt:\nSummarize these abstracts quickly.",
        goodExample:
          "Task: Build a nuanced synthesis across conflicting abstracts.\nTechnique: Chain-of-Thought\nPrompt:\nThink step by step: identify each paper's core claim, group agreements and disagreements, compare tensions, then propose one unified research question.",
        instruction:
          "### How to choose the right technique:\n1. **Match task pattern:** Repeated labeling/classification often benefits from Few-shot.\n2. **Use Zero-shot for direct generation:** Clear one-off outputs usually need strong constraints.\n3. **Use CoT for reasoning:** Multi-constraint logic or planning tasks often need step-by-step reasoning.\n4. **Show the choice through structure:** Let the prompt format naturally reflect the technique you selected.",
        levels: {
          1: {
            title: "Technique Match",
            task: 'You are a Graduate Research Assistant comparing 10 abstracts about "AI in the Classroom." Some argue AI improves engagement, others argue it increases cognitive load. Your advisor wants a synthesis that maps disagreements and proposes a unified research question. Which prompting method is MOST suitable?',
            choices: [
              {
                text: "A. Zero-shot Prompting: The model can summarize papers instantly.",
                isCorrect: false,
                explanation:
                  "This task requires multi-step comparative reasoning, not a single-pass summary.",
              },
              {
                text: "B. Few-shot Prompting: Two synthesis examples will enforce formal tone.",
                isCorrect: false,
                explanation:
                  "Few-shot helps style consistency, but the core challenge is reasoning through contradictions.",
              },
              {
                text: "C. Chain-of-Thought (CoT): Extract opposing claims, compare tensions, then propose a unified question.",
                isCorrect: true,
                explanation:
                  "Correct. This is a multi-step reasoning task that benefits from explicit decomposition.",
              },
            ],
          },
          2: {
            title: "Application",
            task: "You are a Head TA for a course with 300 students and raw peer-feedback comments. You need to detect non-constructive language, assign Contribution Level (High/Medium/Low), and output: Student Name | Constructive (Y/N) | Contribution | TA Note.",
            referenceMethod: "Few-shot",
            referenceRationale:
              "Few-shot is most efficient and accurate because this is a high-volume, pattern-driven formatting task where consistency is critical across many records.",
            referencePrompt:
              "Method: Few-shot\nRationale: High-volume formatting tasks need strict pattern consistency for reliable outputs.\nPrompt:\nYou are an Academic Administrative Assistant. Your task is to process peer feedback for a university course.\nCriteria for Contribution: High = led complex tasks or helped others; Medium = completed assigned tasks; Low = unresponsive or missed deadlines.\nConvert feedback into: Name | Constructive (Y/N) | Contribution | TA Note\nInput: 'Feedback for Sarah: She wrote the entire Python script and helped me debug my part. Very polite.'\nOutput: Sarah | Y | High | Led technical development and supported teammates.\nInput: 'Feedback for Mark: We did not hear from him for two weeks and had to finish his slides.'\nOutput: Mark | Y | Low | Unresponsive for a significant period; group covered his workload.\nInput: [Insert Student Feedback Text Here]\nOutput:",
            rubric: TECHNIQUE_SELECTION_RUBRIC,
          },
        },
      },
      "Working Professional": {
        badExample:
          "Task: Summarize a conflict-heavy multi-party email thread.\nTechnique: Zero-shot\nPrompt:\nSummarize this thread in 3 bullets.",
        goodExample:
          "Task: Summarize a conflict-heavy multi-party email thread.\nTechnique: Chain-of-Thought\nPrompt:\nThink step by step: identify each party's position, locate blame-shifting points, infer root cause, then propose a balanced middle-ground solution.",
        instruction:
          "### How to choose the right technique:\n1. **Zero-shot:** Best for direct outputs with clear format and constraints.\n2. **Few-shot:** Best when you need consistent style or classification patterns.\n3. **CoT:** Best for multi-step reasoning with dependencies or trade-offs.\n4. **Show the choice through structure:** The wording and format of the prompt should reveal the selected technique.",
        levels: {
          1: {
            title: "Technique Match",
            task: "You have a 15-email thread between a client, developer, and designer about delays and blame-shifting. Your boss wants a concise executive summary with root cause and a middle-ground solution. Which method is MOST suitable?",
            choices: [
              {
                text: "A. Zero-shot Prompting: The LLM already knows summarization and this is fastest.",
                isCorrect: false,
                explanation:
                  "Fast, but likely to miss subtle conflict dynamics and shifting responsibilities.",
              },
              {
                text: "B. Few-shot Prompting: Two examples will match your boss's tone.",
                isCorrect: false,
                explanation:
                  "Tone control helps style, but the core challenge is reasoning through conflicting perspectives.",
              },
              {
                text: "C. Chain-of-Thought (CoT): Identify perspectives, weigh trade-offs, then synthesize a middle-ground recommendation.",
                isCorrect: true,
                explanation:
                  "Correct. This task needs structured reasoning across conflicting viewpoints.",
              },
            ],
          },
          2: {
            title: "Application",
            task: 'Your company is hiring for a niche "Senior EdTech Researcher" role. You must process 200 resumes and output CSV-ready rows: Name | University Match (Y/N) | Fit Score | Reason.',
            referenceMethod: "Few-shot",
            referenceRationale:
              "Few-shot is best because converting 200 resumes into a strict output format depends on repeatable examples and stable structure.",
            referencePrompt:
              'Method: Few-shot\nRationale: Processing 200 items into strict CSV-ready structure requires pattern consistency and repeatable labeling.\nPrompt:\nYou are an HR Data Analyst. Screen resumes for the "Senior EdTech Researcher" role.\nTarget Universities: CMU, Stanford, Harvard, MIT, UPenn, Columbia, Cornell, NYU, UC Berkeley, and UW.\nCulture Fit Scoring: 1 (no volunteering), 3 (general volunteering), 5 (leadership in education-related volunteering).\nConvert each resume into: Name | University Match (Y/N) | Fit Score | Reason\nInput: Resume: "Alex Smith. PhD from Stanford. Volunteered as a math tutor for 3 years."\nOutput: Alex Smith | Y | 3 | Stanford is on the target list; volunteering is relevant but not leadership-level.\nInput: Resume: "Jamie Doe. Masters from University of Michigan. No volunteer history."\nOutput: Jamie Doe | N | 1 | University not on target list; no volunteer history provided.\nInput: [Insert Resume Text Here]\nOutput:',
            rubric: TECHNIQUE_SELECTION_RUBRIC,
          },
        },
      },
    },
  },
];
