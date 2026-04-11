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
      'Which of the following is the most effective one-sentence zero-shot prompt to classify the sentiment of the review: "The coffee was lukewarm, but the staff was incredibly friendly and offered a refund"?',
    choices: [
      {
        id: "A",
        text: 'Read this review and tell me if the customer liked the coffee or the staff more.',
      },
      {
        id: "B",
        text: 'Classify the sentiment of the following review as "Happy," "Neutral," or "Angry": "The coffee was lukewarm, but the staff was incredibly friendly and offered a refund."',
      },
      {
        id: "C",
        text: "Here are some examples of happy and angry reviews; please use them to label this specific text about a cafe.",
      },
      {
        id: "D",
        text: "Explain why a customer might feel neutral about receiving a refund for lukewarm coffee.",
      },
    ],
    correctChoiceId: "B",
    referencePrompt:
      'Classify the sentiment of the following review as "Happy," "Neutral," or "Angry": "The coffee was lukewarm, but the staff was incredibly friendly and offered a refund."',
    rubric: ZERO_SHOT_RUBRIC,
  },
  {
    id: 2,
    title: "Task 2",
    technique: "Few-shot",
    scenario:
      'You want the AI to change project names into a code-friendly format by replacing spaces with underscores (e.g., "Project Delta" -> "Project_Delta").',
    requirement:
      'To ensure an AI correctly formats "Upgrade Server Alpha" into a code-friendly version (replacing spaces with underscores), which few-shot prompt should you use?',
    choices: [
      {
        id: "A",
        text: "Please replace all the spaces in the string 'Upgrade Server Alpha' with underscores.",
      },
      {
        id: "B",
        text: "Format this text like a variable name: Upgrade Server Alpha.",
      },
      {
        id: "C",
        text: "Project Delta -> Project_Delta; System Update -> System_Update; Upgrade Server Alpha ->",
      },
      {
        id: "D",
        text: "Change 'Project Delta' to 'Project_Delta' and then do the same for 'Upgrade Server Alpha'.",
      },
    ],
    correctChoiceId: "C",
    referencePrompt:
      "Project Delta -> Project_Delta; System Update -> System_Update; Upgrade Server Alpha ->",
    rubric: FEW_SHOT_RUBRIC,
  },
  {
    id: 3,
    title: "Task 3",
    technique: "Chain-of-Thought",
    scenario:
      "A library starts with 500 books. On Monday, 50 books are checked out. On Tuesday, 20 books are returned, but 10 books are lost. On Wednesday, the library gets 30 new books as a donation.",
    requirement:
      "A library starts with 500 books. On Monday, 50 are checked out. On Tuesday, 20 are returned but 10 are lost. On Wednesday, 30 new books are donated. Which prompt best utilizes Chain-of-Thought to find the final total?",
    choices: [
      {
        id: "A",
        text: "How many books are in the library now? Give me the final number only.",
      },
      {
        id: "B",
        text: "Calculate the total number of books after the changes on Monday, Tuesday, and Wednesday.",
      },
      {
        id: "C",
        text: "A library has 500 books. After various check-outs and donations, what is the final count? Work through the math step-by-step to find the answer.",
      },
      {
        id: "D",
        text: "Is the final number of books 490? Answer yes or no.",
      },
    ],
    correctChoiceId: "C",
    referencePrompt:
      "A library has 500 books. After various check-outs and donations, what is the final count? Work through the math step-by-step to find the answer.",
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
      'You need to turn a 3-page research paper about "Solar Flare Impact on GPS" into a catchy tweet for teenagers. Which of the following prompts correctly defines the persona, audience, and specific constraints required for this zero-shot task?',
    choices: [
      {
        id: "A",
        text: "Summarize the solar flare research paper as a tweet for teenagers and make sure it's catchy.",
      },
      {
        id: "B",
        text: "Act as a Social Media Manager for a tech news outlet. Summarize the 'Solar Flare Impact on GPS' paper for teenagers (13-19). Use an energetic tone, a single tweet format, no words over 4 syllables, exactly 2 hashtags, and mention phone navigation apps.",
      },
      {
        id: "C",
        text: "Write a tweet about how solar flares affect GPS. Use simple words so that a teenager can understand it, and include a few hashtags about technology.",
      },
      {
        id: "D",
        text: "Explain the impact of solar flares on GPS to a young audience. Compare the scientific data to how Google Maps works on a smartphone.",
      },
    ],
    correctChoiceId: "B",
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
      'To ensure an AI consistently converts text into a valid JSON object with the keys "summary" and "word_count", which few-shot prompt structure is most effective?',
    choices: [
      {
        id: "A",
        text: "Convert this text into JSON: 'The Great Wall of China is a series of fortifications...' Use the keys 'summary' and 'word_count'.",
      },
      {
        id: "B",
        text: 'I need a JSON output. Here is an example: {"fruit": "apple", "color": "red"}. Now do the same for the Great Wall of China.',
      },
      {
        id: "C",
        text: "Provide a summary and word count for the Great Wall of China. Ensure the output looks like a dictionary in Python.",
      },
      {
        id: "D",
        text: 'Input: The Eiffel Tower is a famous landmark... Output: {"summary": "A famous landmark...", "word_count": 7} | Input: The Amazon Rainforest... Output: {"summary": "The world\'s largest...", "word_count": 6} | Input: The Great Wall of China... Output:',
      },
    ],
    correctChoiceId: "D",
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
      "A self-driving car must choose between hitting a dog or swerving into a ditch (damaging sensors). Which prompt correctly implements a Chain-of-Thought approach using a safety-first framework?",
    choices: [
      {
        id: "A",
        text: "What should a self-driving car do if it has to choose between hitting a dog or damaging its sensors? Choose the safest option.",
      },
      {
        id: "B",
        text: "Analyze the choice between hitting a dog or damaging sensors step by step: First, consider the harm to the dog; second, analyze long-term safety risks of damaged sensors; third, compare both via a safety-first approach; finally, state the best action.",
      },
      {
        id: "C",
        text: "Think step-by-step: Is it better to save a dog's life or save expensive technology? Provide a logical argument for your final decision.",
      },
      {
        id: "D",
        text: "Compare the cost of a stray dog's life versus the cost of expensive car sensors. Which is more important in a safety-first framework?",
      },
    ],
    correctChoiceId: "B",
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
            hint: `### Hint
Strong **zero-shot** prompts spell out **format**, **length**, **audience**, and **topic scope**. Weak prompts only name a broad topic. Ask: which option forces a specific, usable deliverable?`,
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
            title: "Spot the Gap",
            task: "Look at the prompt below. Which Zero-shot rubric criterion is MISSING?",
            diagnosticPrompt: "Write a 3-paragraph summary of climate change causes for college students.",
            choices: [
              {
                text: "Specificity — the topic isn't clearly defined",
                isCorrect: false,
                explanation: "The topic (climate change causes) is clearly named, so Specificity is present.",
              },
              {
                text: "Audience — the target reader isn't specified",
                isCorrect: false,
                explanation: "College students are explicitly mentioned, so Audience is covered.",
              },
              {
                text: "Format — the output structure isn't described",
                isCorrect: false,
                explanation: "Three paragraphs is a concrete format, so Format is present.",
              },
              {
                text: "Constraints — no length limits or scope boundaries are set",
                isCorrect: true,
                explanation: "Correct. The prompt specifies paragraphs and audience but sets no word count, depth limit, or exclusions (e.g., 'don't include policy solutions'). Adding a constraint like 'keep each paragraph under 80 words' would strengthen it.",
              },
            ],
          },
          3: {
            title: "Application",
            task: 'Task: Write a prompt to explain "Photosynthesis" for an academic audience (students and instructors). Ensure your prompt is specific, sets a tone, defines the audience, and adds constraints (e.g., length or format).',
            hint: `### How to write a strong zero-shot prompt here
- **Be specific:** name the concept and what the explanation should cover.
- **Set the tone:** e.g. clear, educational, appropriate for class use.
- **Define the audience:** both students and instructors (or who reads it first).
- **Add constraints:** number of paragraphs or sections, approximate length, bullets vs prose.

You are only writing *instructions* for the model—not the biology content itself.`,
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
            hint: `### Hint
Workplace zero-shot prompts usually specify **deliverable type**, **length**, **audience**, **tone**, and **concrete topic**. Vague prompts only ask for a genre (e.g. "a blog post") without constraints.`,
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
            title: "Spot the Gap",
            task: "Look at the prompt below. Which Zero-shot rubric criterion is MISSING?",
            diagnosticPrompt: "Write a 3-bullet professional summary of Q3 marketing performance for the executive team, highlighting key results and next steps.",
            choices: [
              {
                text: "Specificity — the subject matter isn't clearly defined",
                isCorrect: false,
                explanation: "Q3 marketing performance is a specific topic, so Specificity is present.",
              },
              {
                text: "Audience — the target reader isn't identified",
                isCorrect: false,
                explanation: "The executive team is explicitly mentioned, so Audience is covered.",
              },
              {
                text: "Format — no output structure is described",
                isCorrect: false,
                explanation: "Three bullets with key results and next steps provides a clear format.",
              },
              {
                text: "Constraints — no word limits or scope boundaries are set",
                isCorrect: true,
                explanation: "Correct. The prompt gives format and audience but doesn't set a word limit per bullet or clarify what 'key results' includes. Adding something like 'keep each bullet under 20 words' or 'include only revenue and pipeline metrics' would tighten the output.",
              },
            ],
          },
          3: {
            title: "Application",
            task: "Task: Write a prompt to draft a short project update email for your manager. Ensure your prompt is specific (project name, timeframe), sets the tone, defines what to include (e.g., progress, blockers, next steps), and any constraints (length, no attachments).",
            hint: `### How to structure this zero-shot prompt
- Name the **project** and **reporting period** (e.g. week or sprint).
- List **must-include bullets**: progress, wins, blockers, next steps—whatever the task asks for.
- Set **tone** (professional, concise, etc.).
- Add **constraints**: word limit, no attachments, etc.

Use your own project names and dates; you are not graded on matching any sample wording.`,
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
            hint: `### Hint 
Few-shot works when every example uses the **same labels, spacing, and line shape**, and the prompt **ends with an unfinished last line** so the model continues the pattern. Inconsistent or mashed-together examples are harder to copy.`,
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
            title: "Spot the Gap",
            task: "Look at the few-shot prompt below. Which Few-shot rubric criterion is MISSING or WEAKEST?",
            diagnosticPrompt: 'Classify the following sources as "Primary" or "Secondary":\n\nInput: "A letter written by Charles Darwin in 1859."\nOutput: "Primary"\n\nInput: "A textbook chapter summarizing Darwin\'s theory of evolution."\nOutput: "Secondary"\n\nInput: "A research article written by Marie Curie in 1903."',
            choices: [
              {
                text: "Pattern Consistency — the input/output format is inconsistent across examples",
                isCorrect: false,
                explanation: "The format is consistent: every example uses the same 'Input:' / 'Output:' labels with identical spacing.",
              },
              {
                text: "Representational Logic — the examples don't demonstrate the classification rule",
                isCorrect: false,
                explanation: "Both examples clearly show the rule (first-hand source vs. derived commentary), so Representational Logic is present.",
              },
              {
                text: "Completion Trigger — the prompt doesn't end with an output label to signal the model",
                isCorrect: true,
                explanation: "Correct. The last entry ends at 'Input: ...' with no trailing 'Output:' label. Without that trigger, the model may not know it should produce a label next. Adding 'Output:' on a new line after the final input would fix this.",
              },
              {
                text: "Constraints — the allowed label values aren't defined",
                isCorrect: false,
                explanation: "The two allowed labels (Primary and Secondary) are shown clearly in the examples, so Constraints are present.",
              },
            ],
          },
          3: {

            title: "Application",
            task: 'Task: Create a few-shot prompt to classify academic support tips as "Time Management", "Learning Strategy", or "Assessment Prep". Provide at least 3 examples in a consistent format (e.g., Tip: ... Category: ...).',
            hint: `### Example *pattern* (different topic—illustration only)
Use a **fixed template** for every example, then leave the last category blank:

\`\`\`
Note: "Need budget sign-off by Friday" → Follow-up: Finance
Note: "Design review moved to Tuesday" → Follow-up: Calendar
Note: "Pipeline is blocked on approvals" → Follow-up: Leadership
Note: [next note here] → Follow-up:
\`\`\`

Your real exercise uses **Time Management / Learning Strategy / Assessment Prep**—copy this *shape* with **your own** tip text (do not copy any model solution).`,
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
            hint: `### Hint 
Prefer prompts that repeat **Input:** / **Output:** (or equivalent) **exactly** on every line and end with a fresh **Input:** waiting for the label. Inline parentheses mixed into one paragraph are harder for the model to generalize.`,
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
            title: "Spot the Gap",
            task: "Look at the few-shot prompt below. Which Few-shot rubric criterion is MISSING or WEAKEST?",
            diagnosticPrompt: 'Label each customer request as "Billing", "Technical", or "General":\n\nCustomer: "I can\'t reset my password." → Technical\nCustomer: "Please update my billing address." > Billing\nCustomer: "When is your customer service available?"\nAnswer:',
            choices: [
              {
                text: "Pattern Consistency — the separator between input and label is inconsistent",
                isCorrect: true,
                explanation: "Correct. The first example uses '→' and the second uses '>'. Inconsistent separators break the pattern the model is meant to copy, making it less reliable. Every row should use the same separator (e.g., always '→').",
              },
              {
                text: "Representational Logic — the examples don't cover the full range of categories",
                isCorrect: false,
                explanation: "Two of the three categories (Technical and Billing) are shown, which is sufficient to demonstrate the classification rule.",
              },
              {
                text: "Completion Trigger — the prompt doesn't end with a label to signal the model",
                isCorrect: false,
                explanation: "'Answer:' at the end serves as a completion trigger, so this criterion is met.",
              },
              {
                text: "Constraints — the allowed label values aren't defined",
                isCorrect: false,
                explanation: "All three labels (Billing, Technical, General) are stated in the opening instruction, so Constraints are present.",
              },
            ],
          },
          3: {

            title: "Application",
            task: 'Task: Create a few-shot prompt to classify support tickets or customer emails as "Billing", "Technical", or "General". Provide at least 3 examples in a consistent format.',
            hint: `### Example *pattern* (different labels—practice the shape)
\`\`\`
Message: "Double charge on last invoice" → Type: Payments
Message: "Sync fails after update" → Type: Product
Message: "What are support hours?" → Type: Info
Message: [next customer message] → Type:
\`\`\`

Apply the same rhythm for **Billing / Technical / General** with **original** ticket text.`,
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
            hint: `### Hint 
Strong **Chain-of-Thought** prompts **order** the work: compute costs (with rules like insurance), compare risk and time, check constraints, *then* recommend. Prompts that ask for a final choice in one jump usually skip that scaffolding.`,
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
            title: "Spot the Gap",
            task: "Look at the Chain-of-Thought prompt below. Which CoT rubric criterion is MISSING?",
            diagnosticPrompt: "Solve this problem step by step, numbering each step: A class of 30 students needs to be divided into groups of 4 for a project. How many complete groups can be formed, and how many students will be left over?",
            choices: [
              {
                text: "Reasoning Trigger — the prompt doesn't ask the model to think step by step",
                isCorrect: false,
                explanation: "'Step by step' is explicitly stated, so the Reasoning Trigger is present.",
              },
              {
                text: "Logic Sequencing — no numbered or ordered steps are requested",
                isCorrect: false,
                explanation: "'Numbering each step' is explicitly requested, so Logic Sequencing is covered.",
              },
              {
                text: "Specificity — the task isn't described clearly enough for the model to solve",
                isCorrect: false,
                explanation: "The numbers (30 students, groups of 4) and the two questions are clearly stated, so Specificity is present.",
              },
              {
                text: "Format — no instruction on how to present the final answer",
                isCorrect: true,
                explanation: "Correct. The prompt asks for numbered steps but doesn't say how the final answer should look — a sentence, a table, bold numbers? Adding something like 'State the final answer in one sentence at the end' would complete this criterion.",
              },
            ],
          },
          3: {

            title: "Application",
            task: 'Write a Chain-of-Thought prompt for the "Green Logistics" puzzle.\n\nThe school must deliver a fragile chemistry apparatus from City A to City D.\nRoute 1: A-B-D, cost $40, risk 5%, time 4h.\nRoute 2: A-C-D, cost $30, risk 20%, time 3h.\n\nConstraint: budget is $40, and if risk is over 15%, insurance adds $15.\nYour prompt should make the AI reason step by step and choose the best route.',
            hint: `### Structure your Chain-of-Thought prompt
1. Restate **both routes** with cost, risk %, and time.
2. State the **insurance rule** and **budget** in your own words.
3. Ask the model to compute **each route’s total cost** (including insurance when the rule fires).
4. Then compare **risk vs. time**, check the budget, and **only then** pick a route.

Phrases like *think step by step* or *show reasoning before the final answer* help signal CoT.`,
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
            hint: `### Hint 
Look for prompts that **sequence** math (base cost + insurance), **compare** risk and time, **validate** budget, and **then** justify a recommendation—not a one-line "pick a route."`,
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
            title: "Spot the Gap",
            task: "Look at the Chain-of-Thought prompt below. Which CoT rubric criterion is MISSING?",
            diagnosticPrompt: "Analyze step by step whether we should outsource customer support for our SaaS product. Weigh the pros and cons and give a final recommendation.",
            choices: [
              {
                text: "Reasoning Trigger — the prompt doesn't ask the model to reason step by step",
                isCorrect: false,
                explanation: "'Analyze step by step' is a clear reasoning trigger, so this criterion is present.",
              },
              {
                text: "Logic Sequencing — no structured reasoning path is defined",
                isCorrect: false,
                explanation: "'Weigh the pros and cons and give a final recommendation' provides a clear sequence (pros → cons → recommendation).",
              },
              {
                text: "Specificity — the task isn't defined precisely enough",
                isCorrect: false,
                explanation: "The decision (outsource customer support for a SaaS product) is specific enough for the model to reason about.",
              },
              {
                text: "Format — no output format is specified for the response",
                isCorrect: true,
                explanation: "Correct. The prompt describes what to do (pros, cons, recommendation) but not how to format the output. Should the pros and cons be a bullet list? A table? Should the recommendation be a single sentence or a paragraph? Specifying the format would make the output more predictable.",
              },
            ],
          },
          3: {

            title: "Application",
            task: 'Write a Chain-of-Thought prompt for the "Green Logistics" puzzle. A company needs to deliver a fragile medical package from City A to City D.\nRoute 1: A-B-D, cost $40, risk 5%, time 4h.\nRoute 2: A-C-D, cost $30, risk 20%, time 3h.\nConstraint: budget is $40, and if risk is over 15%, insurance adds $15.\nYour prompt should force step-by-step reasoning and a final recommendation.',
            hint: `### Structure your Chain-of-Thought prompt
1. Embed **all numeric facts** (cost, risk, time) for each route.
2. Spell out **when insurance applies** and the **budget cap**.
3. Require **numbered or labeled steps**: totals first, trade-offs second, budget check third, recommendation last.

Use your own step labels; you are guiding the reasoning process, not answering the puzzle yourself.`,
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
        instruction: `### How to choose the right technique

Connect what you practiced in **Zero-shot**, **Few-shot**, and **Chain-of-Thought** to coursework and research tasks: match the **task pattern** to the **prompt structure** you will use.

| Technique | What it is (in your prompt) | When to choose it |
| :--- | :--- | :--- |
| **Zero-shot** | One detailed instruction—**no examples**. You spell out goal, audience, tone, output shape, and limits in plain language. | A **single** deliverable where you can describe "good output" clearly without demonstrating examples (one essay plan, one lab handout spec, one email brief). |
| **Few-shot** | **Two or more parallel examples** with the **same labels and layout** every time, then a new case for the model to complete. | **Many similar lines**—labeling, rubric-style scoring, templated feedback—where **consistency across items** matters more than deep reasoning on each line. |
| **Chain-of-Thought (CoT)** | **Numbered steps** or phrases like *think step by step* so the model **shows reasoning before** the final answer. | **Trade-offs, constraints, conflicting evidence, or planning**—when skipping intermediate steps usually produces shallow or wrong conclusions. |

**Make your choice visible:** Shape your prompt so a reader can tell which technique you used—**examples** vs **explicit steps** vs **one rich instruction**—then write the full prompt accordingly.`,
        levels: {

          1: {
            title: "Technique Match",
            task: 'You are a Graduate Research Assistant comparing 10 abstracts about "AI in the Classroom." Some argue AI improves engagement, others argue it increases cognitive load. Your advisor wants a synthesis that maps disagreements and proposes a unified research question. Which prompting method is MOST suitable?',
            hint: `### Hint 
Ask whether the core work is **repeating a format** (Few-shot), **one-shot generation with tight specs** (Zero-shot), or **multi-step reasoning across tensions** (Chain-of-Thought). Synthesis across *conflicting claims* usually needs explicit reasoning, not just speed or tone examples.`,
            choices: [
              {
                text: "A. Zero-shot Prompting: The model can summarize papers instantly.",
                isCorrect: false,
                explanation:
                  "The correct answer is **C. Chain-of-Thought (CoT)**. Zero-shot can produce a quick summary, but this task needs multi-step comparative reasoning across conflicting abstracts—not a single-pass gloss. CoT makes the model extract opposing claims, compare tensions, and then propose a unified research question.",
              },
              {
                text: "B. Few-shot Prompting: Two synthesis examples will enforce formal tone.",
                isCorrect: false,
                explanation:
                  "The correct answer is **C. Chain-of-Thought (CoT)**. Few-shot can help tone and format, but the hard part here is reasoning through contradictions and mapping disagreements. CoT fits because it forces explicit steps: opposing claims, comparison, then a unified question.",
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
            title: "Technique Mismatch",
            task: 'A professor wants to use AI to answer a straightforward factual question: "What year was the Eiffel Tower built?" They chose Chain-of-Thought (CoT) prompting. Why is CoT NOT the best choice here?',
            diagnosticPrompt: 'Task: Answer the question "What year was the Eiffel Tower built?"\nTechnique chosen: Chain-of-Thought (CoT)\nPrompt: "Think step by step and show your reasoning to determine what year the Eiffel Tower was built."',
            choices: [
              {
                text: "CoT requires the AI to have access to real-time data to answer factual questions",
                isCorrect: false,
                explanation: "CoT is about structuring reasoning, not about data access. This isn't why it's a poor fit here.",
              },
              {
                text: "CoT prompts always produce too many tokens and are impractical for short questions",
                isCorrect: false,
                explanation: "Token length is a side effect, not the reason CoT mismatches this task.",
              },
              {
                text: "CoT encourages step-by-step reasoning, which adds unnecessary complexity to a task that just needs a direct factual answer",
                isCorrect: true,
                explanation: "Correct. CoT is designed for tasks requiring multi-step reasoning — comparisons, trade-offs, or structured analysis. A single factual lookup has no reasoning chain to show. Zero-shot with a clear instruction would be simpler and more efficient here.",
              },
              {
                text: "CoT only works when the user provides worked examples alongside the steps",
                isCorrect: false,
                explanation: "CoT doesn't require worked examples — that would be Few-shot. CoT just uses step-by-step reasoning triggers.",
              },
            ],
          },
          3: {

            title: "Application",
            task: "You are a Head TA for a course with 300 students and raw peer-feedback comments. You need to detect non-constructive language, assign Contribution Level (High/Medium/Low), and output: Student Name | Constructive (Y/N) | Contribution | TA Note.",
            hint: `### After you pick a method (Step 1)
For **high-volume rows** with a **rigid pipe format**, **Few-shot** often fits: write **2–3 complete example lines** that show the exact **Name | Constructive | Contribution | Note** pattern, then a line with **Input:** (or similar) waiting for the next comment.

Define **what "constructive" means** and **how you judge High/Medium/Low** in plain language. Invent **original** example names and comments—do not copy any reference solution.`,
            referenceMethod: "Few-shot",
            referenceRationale:
              "Few-shot is most efficient and accurate because this is a high-volume, pattern-driven formatting task where consistency is critical across many records.",
            incorrectMethodFeedback: {
              "Zero-shot":
                "A single instruction without parallel input/output examples makes it easy for the model to drift on the exact pipe-delimited shape, column meanings, and how you judge constructive tone across hundreds of different comments.",
              "Chain-of-Thought":
                "CoT shines when each answer needs visible multi-step reasoning; here the bottleneck is repeating the same rigid row template at scale. Examples anchor the pattern far more reliably than reasoning steps alone.",
            },
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
        instruction: `### How to choose the right technique

Apply **Zero-shot**, **Few-shot**, and **Chain-of-Thought** at work: align **how repetitive**, **how ambiguous**, and **how much step-by-step reasoning** the task needs with the right prompt shape.

| Technique | What it is (in your prompt) | When to choose it |
| :--- | :--- | :--- |
| **Zero-shot** | One detailed instruction—**no examples**. You spell out goal, audience, tone, output shape, and limits in plain language. | A **single** deliverable where you can describe "good output" clearly without demonstrating examples (one executive summary brief, one stakeholder email, one spec). |
| **Few-shot** | **Two or more parallel examples** with the **same labels and layout** every time, then a new case for the model to complete. | **High-volume or repetitive** outputs—ticket routing, CRM fields, slide outlines—where **pattern consistency** across rows beats reasoning depth per row. |
| **Chain-of-Thought (CoT)** | **Numbered steps** or phrases like *think step by step* so the model **shows reasoning before** the final answer. | **Trade-offs, budgets, root-cause analysis, blame-heavy threads, or strategy**—when the wrong answer is costly if intermediate logic is skipped. |

**Make your choice visible:** Shape your prompt so a reader can tell which technique you used—**examples** vs **explicit steps** vs **one rich instruction**—then write the full prompt accordingly.`,
        levels: {

          1: {
            title: "Technique Match",
            task: "You have a 15-email thread between a client, developer, and designer about delays and blame-shifting. Your boss wants a concise executive summary with root cause and a middle-ground solution. Which method is MOST suitable?",
            hint: `### Hint 
Blame-shifting threads need **structured comparison** of parties and incentives before a recommendation. Ask whether **step-by-step reasoning** is required versus a quick summary or style-matching examples alone.`,
            choices: [
              {
                text: "A. Zero-shot Prompting: The LLM already knows summarization and this is fastest.",
                isCorrect: false,
                explanation:
                  "The correct answer is **C. Chain-of-Thought (CoT)**. Zero-shot may be fast, but blame-shifting threads need structured comparison of who said what and why before a sound recommendation. CoT walks through perspectives, trade-offs, and then a middle-ground solution.",
              },
              {
                text: "B. Few-shot Prompting: Two examples will match your boss's tone.",
                isCorrect: false,
                explanation:
                  "The correct answer is **C. Chain-of-Thought (CoT)**. Few-shot can steer tone, but the real risk here is skipping the reasoning that links conflicting emails to root cause and a balanced fix. CoT is the best fit for that step-by-step analysis.",
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
            title: "Technique Mismatch",
            task: "A manager needs to classify 20 customer feedback emails into 3 predefined categories: Billing, Technical, and General. They chose Zero-shot prompting. Why might Zero-shot be LESS effective than another technique for this task?",
            diagnosticPrompt: 'Task: Classify 20 customer feedback emails into "Billing", "Technical", or "General".\nTechnique chosen: Zero-shot\nPrompt: "Classify the following customer email as Billing, Technical, or General. Email: [insert email]"',
            choices: [
              {
                text: "Zero-shot prompts cannot be used for classification tasks",
                isCorrect: false,
                explanation: "Zero-shot can absolutely handle classification — this isn't the issue.",
              },
              {
                text: "Zero-shot gives the AI no examples of how each category applies, so it may classify ambiguous emails inconsistently across 20 items",
                isCorrect: true,
                explanation: "Correct. Without worked examples, the model must infer what each category means, leading to inconsistent labeling across edge cases. Few-shot — providing 2–3 labeled email examples — would anchor the classification logic and improve consistency at scale.",
              },
              {
                text: "Zero-shot prompts are too short to process the full content of an email",
                isCorrect: false,
                explanation: "Prompt length is unrelated to the technique choice here. Zero-shot prompts can be as detailed as needed.",
              },
              {
                text: "Zero-shot only works when a system prompt is provided separately",
                isCorrect: false,
                explanation: "Zero-shot doesn't require a system prompt. This isn't a limitation of the technique.",
              },
            ],
          },
          3: {

            title: "Application",
            task: 'Your company is hiring for a niche "Senior EdTech Researcher" role. You must process 200 resumes and output CSV-ready rows: Name | University Match (Y/N) | Fit Score | Reason.',
            hint: `### After you pick a method (Step 1)
**Few-shot** helps when every resume must become the **same column shape**. Supply **2–3 full example rows** with the exact **Name | University Match | Fit Score | Reason** layout, then end with **Input:** for the next resume.

State your **target university list** and **fit-score rubric** clearly. Use **fictional** resume snippets in examples—do not lift wording from any model answer.`,
            referenceMethod: "Few-shot",
            referenceRationale:
              "Few-shot is best because converting 200 resumes into a strict output format depends on repeatable examples and stable structure.",
            incorrectMethodFeedback: {
              "Zero-shot":
                "One long instruction rarely locks the model onto the exact CSV-style columns, scoring rubric, and labeling style across 200 varied resumes; without worked rows, format and criteria get interpreted inconsistently.",
              "Chain-of-Thought":
                "Step-by-step reasoning helps tricky one-off decisions, but this job is bulk extraction into an identical row shape. Parallel full examples teach the repeating pattern better than asking the model to reason through the layout each time.",
            },
            referencePrompt:
              'Method: Few-shot\nRationale: Processing 200 items into strict CSV-ready structure requires pattern consistency and repeatable labeling.\nPrompt:\nYou are an HR Data Analyst. Screen resumes for the "Senior EdTech Researcher" role.\nTarget Universities: CMU, Stanford, Harvard, MIT, UPenn, Columbia, Cornell, NYU, UC Berkeley, and UW.\nCulture Fit Scoring: 1 (no volunteering), 3 (general volunteering), 5 (leadership in education-related volunteering).\nConvert each resume into: Name | University Match (Y/N) | Fit Score | Reason\nInput: Resume: "Alex Smith. PhD from Stanford. Volunteered as a math tutor for 3 years."\nOutput: Alex Smith | Y | 3 | Stanford is on the target list; volunteering is relevant but not leadership-level.\nInput: Resume: "Jamie Doe. Masters from University of Michigan. No volunteer history."\nOutput: Jamie Doe | N | 1 | University not on target list; no volunteer history provided.\nInput: [Insert Resume Text Here]\nOutput:',
            rubric: TECHNIQUE_SELECTION_RUBRIC,
          },
        },
      },
    },
  },
];
