import { Module } from './types';

export const MODULES: Module[] = [
  {
    id: 'Zero-shot',
    title: 'Zero-shot Prompting',
    description: 'Asking the AI to perform a task without any examples.',
    badExample: 'Write a poem.',
    goodExample: 'Write a 4-line poem about a sunset in the style of Robert Frost.',
    instruction: '### How to write a good Zero-shot prompt:\n1. **Be Specific:** Clearly define the topic, length, and format.\n2. **Set the Tone:** Specify if you want it to be professional, witty, or poetic.\n3. **Define the Audience:** Tell the AI who the content is for.\n4. **Add Constraints:** Mention what to include or exclude.',
    levels: {
      1: {
        title: 'The Choice',
        task: 'Select from given prompt examples. Which of these zero-shot prompts is more likely to give a high-quality, specific result?',
        choices: [
          { 
            text: 'Write a blog post about healthy eating.', 
            isCorrect: false, 
            explanation: 'This is too vague. The AI doesn\'t know the target audience, tone, or specific focus area.' 
          },
          { 
            text: 'Write a 500-word blog post about the benefits of a Mediterranean diet for office workers, using a professional yet encouraging tone.', 
            isCorrect: true, 
            explanation: 'This prompt provides clear constraints (length), a specific topic (Mediterranean diet), a target audience (office workers), and a desired tone.' 
          }
        ],
      },
      2: {
        title: 'Application',
        task: 'Task: Write a prompt to explain the concept of "Photosynthesis" to a 10-year-old. Ensure your prompt is specific, sets a tone, defines the audience, and adds constraints.',
      },
      3: {
        title: 'Refinement',
        task: 'Task: Refine your previous prompt. Add a specific constraint to exclude any mention of "sunlight" but still explain the process accurately.',
      },
    },
  },
  {
    id: 'Few-shot',
    title: 'Few-shot Prompting',
    description: 'Providing a few examples to guide the AI\'s output format or style.',
    badExample: 'Classify this movie as good or bad: "The acting was superb."',
    goodExample: 'Input: "I loved it!" Output: Positive. Input: "It was okay." Output: Neutral. Input: "The acting was superb." Output:',
    instruction: '### How to write a good Few-shot prompt:\n1. **Consistency is Key:** Use the exact same format for every example.\n2. **Label Clearly:** Use labels like "Input:" and "Output:" or "Q:" and "A:".\n3. **Diverse Examples:** Provide a range of examples (e.g., positive, negative, and neutral).\n4. **End with a Trigger:** Finish with a trailing label (like "Output:") to signal the AI to start.',
    levels: {
      1: {
        title: 'The Choice',
        task: 'Select from given prompt examples. Which few-shot prompt better guides the AI to follow a specific sentiment classification format?',
        choices: [
          { 
            text: 'Classify these: "I love it" (Positive), "It is bad" (Negative). Now classify: "The food was okay."', 
            isCorrect: false, 
            explanation: 'While it gives examples, the format is a bit cluttered and doesn\'t clearly separate input from output for the AI to follow.' 
          },
          { 
            text: 'Input: "I love it" \nOutput: Positive\n\nInput: "It is bad"\nOutput: Negative\n\nInput: "The food was okay."\nOutput:', 
            isCorrect: true, 
            explanation: 'This uses a clear, consistent pattern that the AI can easily replicate. The use of "Input:" and "Output:" labels makes the structure explicit.' 
          }
        ],
      },
      2: {
        title: 'Application',
        task: 'Task: Create a few-shot prompt to classify customer reviews as "Billing", "Technical", or "General". Provide at least 3 examples in your prompt.',
      },
      3: {
        title: 'Refinement',
        task: 'Task: Refine your few-shot prompt to also handle "Shipping" issues. Add an example for this new category.',
      },
    },
  },
  {
    id: 'Chain-of-Thought',
    title: 'Chain-of-Thought (CoT)',
    description: 'Encouraging the AI to "think out loud" or show its reasoning steps.',
    badExample: 'What is 15 * 12?',
    goodExample: 'To find 15 * 12, first multiply 15 * 10 = 150. Then multiply 15 * 2 = 30. Finally, add 150 + 30 = 180. Now, what is 24 * 11?',
    instruction: '### How to write a good Chain-of-Thought prompt:\n1. **Use Triggers:** Phrases like "Let\'s think step by step" or "Show your reasoning" are powerful.\n2. **Decompose Tasks:** Break complex problems into smaller, logical sub-tasks.\n3. **Provide a Path:** Sometimes showing one example of the reasoning process helps the AI follow suit.\n4. **Verify Steps:** Ask the AI to double-check its own logic at the end.',
    levels: {
      1: {
        title: 'The Choice',
        task: 'Select from given prompt examples. Which prompt effectively uses Chain-of-Thought to solve a math problem?',
        choices: [
          { 
            text: 'What is 25 * 4 + 10? Think step by step.', 
            isCorrect: true, 
            explanation: 'Adding "Think step by step" is a simple yet powerful CoT trigger that encourages the AI to decompose the problem.' 
          },
          { 
            text: 'Calculate 25 * 4 + 10 and give me the final answer immediately.', 
            isCorrect: false, 
            explanation: 'Asking for the answer "immediately" discourages the AI from using internal reasoning steps, which can lead to errors in complex tasks.' 
          }
        ],
      },
      2: {
        title: 'Application',
        task: 'Task: Write a prompt to solve a logic puzzle about 3 people in a race, ensuring the AI shows its reasoning steps.',
      },
      3: {
        title: 'Refinement',
        task: 'Task: Refine your CoT prompt to solve a more complex version: 5 people in a race, and one person finished twice as fast as another.',
      },
    },
  },
];
