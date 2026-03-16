/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, BookOpen, Brain, Target, ChevronRight, User, ArrowRight } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { UserBackground, LogEntry, Technique, Level } from './types';
import { MODULES } from './constants';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ReactMarkdown from 'react-markdown';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [background, setBackground] = useState<UserBackground | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentTechnique, setCurrentTechnique] = useState<Technique>('Zero-shot');
  const [currentLevel, setCurrentLevel] = useState<Level>(1);
  const [inputValue, setInputValue] = useState('');
  const [predictionValue, setPredictionValue] = useState('');
  const [isWaitingForPrediction, setIsWaitingForPrediction] = useState(false);
  const [isWaitingForResult, setIsWaitingForResult] = useState(false);
  const [isModuleIntro, setIsModuleIntro] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    setLogs(prev => [...prev, {
      ...entry,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    }]);
  };

  const handleBackgroundSelect = (bg: UserBackground) => {
    setBackground(bg);
    addLog({
      type: 'intro',
      content: `Welcome, ${bg}. I'm your Prompt Engineering Mentor. Together, we'll explore the nuances of effective AI communication.`
    });
    startModule('Zero-shot', bg);
  };

  const startModule = (tech: Technique, persona?: UserBackground) => {
    const module = MODULES.find(m => m.id === tech)!;
    const content = module.byPersona[persona ?? background!];
    setCurrentTechnique(tech);
    setCurrentLevel(1);
    setIsModuleIntro(true);
    setLogs([]); // Clear logs for new module

    addLog({
      type: 'intro',
      content: `### ${module.title}\n${module.description}`
    });

    addLog({
      type: 'intro',
      content: `**Comparison:**\n\n*   **Ineffective:** "${content.badExample}"\n*   **Effective:** "${content.goodExample}"`
    });
  };

  const proceedToLevel = (level: Level) => {
    setIsModuleIntro(false);
    const module = MODULES.find(m => m.id === currentTechnique)!;
    const content = module.byPersona[background!];
    const levelData = content.levels[level];

    addLog({
      type: 'build',
      content: `**Level ${level}: ${levelData.title}**\n${levelData.task}`,
      level: level,
      technique: currentTechnique
    });
  };

  const handleChoiceSelect = (choice: { text: string; isCorrect: boolean; explanation: string }, logId: string) => {
    setLogs(prev => prev.map(log => {
      if (log.id === logId) {
        return {
          ...log,
          selectedChoice: choice.text,
          isCorrect: choice.isCorrect,
          explanation: choice.explanation
        };
      }
      return log;
    }));

    addLog({
      type: 'review',
      content: `**${choice.isCorrect ? 'Correct!' : 'Not quite.'}**\n\n${choice.explanation}`,
      isCorrect: choice.isCorrect
    });

    const nextLevel = (currentLevel + 1) as Level;

    if (currentLevel === 1) {
      const module = MODULES.find(m => m.id === currentTechnique)!;
      const content = module.byPersona[background!];
      setTimeout(() => {
        addLog({
          type: 'intro',
          content: content.instruction
        });
      }, 1500);
      
      if (nextLevel <= 3) {
        setTimeout(() => {
          setCurrentLevel(nextLevel);
          proceedToLevel(nextLevel);
        }, 6000);
      }
    } else {
      if (nextLevel <= 3) {
        setTimeout(() => {
          setCurrentLevel(nextLevel);
          proceedToLevel(nextLevel);
        }, 3000);
      }
    }
  };

  const handlePromptSubmit = async (prompt: string, logId: string) => {
    if (!prompt.trim()) return;
    
    // Mark the log as submitted so the input disappears
    setLogs(prev => prev.map(log => {
      if (log.id === logId) {
        return { ...log, submittedPrompt: prompt };
      }
      return log;
    }));

    setIsWaitingForResult(true);
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const resultText = response.text || "No response received.";
      
      addLog({
        type: 'result',
        content: resultText,
        prompt: prompt
      });

      const module = MODULES.find(m => m.id === currentTechnique)!;
      const content = module.byPersona[background!];
      let feedbackPrompt = `The user was asked to write a ${currentTechnique} prompt for a specific task. 
        User's prompt: "${prompt}"
        AI's response to that prompt: "${resultText}"
        
        Criteria for a good ${currentTechnique} prompt:
        ${content.instruction}
        
        Analyze the user's prompt against these specific criteria. Be encouraging but rigorous. Explain what they did well and what they could improve to better meet the criteria. (3-4 sentences)`;

      const feedbackResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: feedbackPrompt,
      });

      addLog({
        type: 'review',
        content: feedbackResponse.text || "Insightful experiment."
      });

      setIsWaitingForResult(false);
      
      const nextLevel = (currentLevel + 1) as Level;
      if (nextLevel <= 3) {
        setTimeout(() => {
          setCurrentLevel(nextLevel);
          proceedToLevel(nextLevel);
        }, 2000);
      } else {
        const nextTechIndex = MODULES.findIndex(m => m.id === currentTechnique) + 1;
        if (nextTechIndex < MODULES.length) {
          setTimeout(() => startModule(MODULES[nextTechIndex].id), 3000);
        } else {
          addLog({
            type: 'intro',
            content: "You have successfully completed all modules. You are now equipped with the fundamental techniques of prompt engineering."
          });
        }
      }
    } catch (error) {
      console.error(error);
      setIsWaitingForResult(false);
      addLog({
        type: 'intro',
        content: "An error occurred while communicating with the AI. Please try again."
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#fcfcfc] text-slate-800 font-sans">
      {/* Header - Always visible */}
      <header className="h-16 border-b border-slate-100 flex items-center justify-between px-10 shrink-0 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl font-light tracking-tight gradient-text">Mentor</h2>
          </div>
          {background && (
            <>
              <div className="h-4 w-px bg-slate-200" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {currentTechnique} <span className="mx-2 text-slate-200">|</span> Level {currentLevel}
              </p>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          {background ? (
            <div className="h-8 px-4 rounded-full border border-slate-100 bg-slate-50/50 flex items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {background}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                System Ready
              </span>
            </div>
          )}
        </div>
      </header>

      {!background ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full p-8 text-center"
          >
            <div className="mb-12">
              <h1 className="text-6xl font-serif font-light mb-2 tracking-tight gradient-text">Mentor</h1>
              <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">Prompt Engineering</p>
            </div>
            
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Select Your Path</p>
              {(['Student', 'Teacher', 'Professional'] as UserBackground[]).map((bg) => (
                <button
                  key={bg}
                  onClick={() => handleBackgroundSelect(bg)}
                  className="w-full py-5 px-8 rounded-xl bg-white border border-slate-100 hover:border-brand-pink shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
                >
                  <span className="text-sm font-semibold text-slate-700">{bg}</span>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-pink transition-all transform group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      ) : (
        <main className="flex-1 overflow-hidden flex flex-col relative">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-10 space-y-16 scrollbar-hide pb-48"
          >
            <AnimatePresence mode="popLayout">
              {logs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-2xl mx-auto w-full"
                >
                  {log.type === 'intro' && (
                    <div className="space-y-8">
                      {log.content.startsWith('###') && !log.content.includes('\n1.') ? (
                        <div className="max-w-none">
                          <div className="w-12 h-1 gradient-bg mb-6" />
                          <h3 className="text-4xl font-serif font-light text-slate-900 mb-4 tracking-tight">
                            {log.content.split('\n')[0].replace('### ', '')}
                          </h3>
                          <p className="text-lg font-serif italic text-slate-500 leading-relaxed">
                            {log.content.split('\n')[1]}
                          </p>
                        </div>
                      ) : log.content.includes('**Comparison:**') ? (
                        <div className="space-y-6">
                          <div className="flex items-center gap-3">
                            <div className="h-px flex-1 bg-slate-100" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Contrast Analysis</span>
                            <div className="h-px flex-1 bg-slate-100" />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ineffective</span>
                              <p className="text-slate-600 font-mono text-sm leading-relaxed">
                                {log.content.match(/\*\*Ineffective:\*\* "(.*?)"/)?.[1] || "Generic prompt"}
                              </p>
                            </div>
                            <div className="p-6 rounded-2xl bg-white border border-brand-pink/10 shadow-sm space-y-3">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-pink">Effective</span>
                              <p className="text-slate-800 font-mono text-sm leading-relaxed">
                                {log.content.match(/\*\*Effective:\*\* "(.*?)"/)?.[1] || "Specific prompt"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="markdown-content text-slate-600 leading-relaxed font-serif text-xl italic">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                              ul: ({ children }) => <ul className="space-y-4 my-8">{children}</ul>,
                              li: ({ children }) => (
                                <li className="flex gap-4 items-start font-sans text-base not-italic">
                                  <div className="w-1.5 h-1.5 rounded-full gradient-bg mt-2.5 shrink-0" />
                                  <div className="text-slate-700 leading-relaxed">{children}</div>
                                </li>
                              ),
                              strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>
                            }}
                          >
                            {log.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  )}

                  {log.type === 'build' && (
                    <div className="pt-12 border-t border-slate-100">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-pink mb-8">Current Exercise</p>
                      <div className="markdown-content">
                        <ReactMarkdown
                          components={{
                            p: ({ children, ...props }) => {
                              // Check if this is the first paragraph (the title)
                              let content = '';
                              if (typeof children === 'string') {
                                content = children;
                              } else if (Array.isArray(children) && typeof children[0] === 'string') {
                                content = children[0];
                              } else if (children && typeof children === 'object' && 'props' in (children as any)) {
                                const childProps = (children as any).props;
                                if (childProps && typeof childProps.children === 'string') {
                                  content = childProps.children;
                                }
                              }
                              
                              const isTitle = content.startsWith('Level');
                              return (
                                <p className={cn(
                                  "leading-relaxed",
                                  isTitle ? "text-xs font-bold uppercase tracking-widest text-brand-orange mb-6 font-sans" : "text-3xl font-serif font-light text-slate-900 mb-4"
                                )} {...props}>
                                  {children}
                                </p>
                              );
                            },
                            strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>
                          }}
                        >
                          {log.content}
                        </ReactMarkdown>
                      </div>

                      {log.level === 1 && (
                        <div className="mt-12 space-y-4">
                          {MODULES.find(m => m.id === log.technique)?.byPersona[background!].levels[1].choices?.map((choice, idx) => {
                            const isSelected = log.selectedChoice === choice.text;
                            const hasSelected = !!log.selectedChoice;
                            
                            return (
                              <button
                                key={idx}
                                disabled={hasSelected}
                                onClick={() => handleChoiceSelect(choice, log.id)}
                                className={cn(
                                  "w-full p-6 rounded-2xl border text-left transition-all group relative overflow-hidden",
                                  !hasSelected ? "bg-white border-slate-100 hover:border-brand-pink hover:shadow-md" : 
                                  isSelected ? (choice.isCorrect ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200") :
                                  "bg-slate-50 border-slate-100 opacity-50"
                                )}
                              >
                                <div className="flex items-start gap-4">
                                  <div className={cn(
                                    "w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-1",
                                    !hasSelected ? "border-slate-200 group-hover:border-brand-pink" :
                                    isSelected ? (choice.isCorrect ? "border-emerald-500 bg-emerald-500 text-white" : "border-red-500 bg-red-500 text-white") :
                                    "border-slate-200"
                                  )}>
                                    {isSelected && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                      >
                                        {choice.isCorrect ? "✓" : "×"}
                                      </motion.div>
                                    )}
                                  </div>
                                  <p className={cn(
                                    "text-sm leading-relaxed font-mono",
                                    isSelected ? (choice.isCorrect ? "text-emerald-900" : "text-red-900") : "text-slate-700"
                                  )}>
                                    {choice.text}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {log.level && log.level >= 2 && !log.submittedPrompt && (
                        <div className="mt-12 relative">
                          <textarea
                            autoFocus
                            placeholder="Compose your prompt..."
                            className="w-full bg-white border border-slate-200 rounded-xl py-5 pl-8 pr-20 focus:outline-none focus:border-brand-pink shadow-sm transition-all text-sm resize-none min-h-[100px]"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handlePromptSubmit((e.target as HTMLTextAreaElement).value, log.id);
                              }
                            }}
                          />
                          <button
                            onClick={(e) => {
                              const textarea = (e.currentTarget.previousSibling as HTMLTextAreaElement);
                              handlePromptSubmit(textarea.value, log.id);
                            }}
                            className="absolute right-3 bottom-3 p-4 gradient-text"
                          >
                            <Send className="w-6 h-6" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {log.type === 'predict' && (
                    <div className="hidden">
                      {/* Prediction step removed */}
                    </div>
                  )}

                  {log.type === 'result' && (
                    <div className="space-y-12 py-12">
                      <div className="grid grid-cols-1 gap-12">
                        <div className="space-y-4">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Your Prompt</p>
                          <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 font-mono text-sm text-slate-600 leading-relaxed">
                            {log.prompt}
                          </div>
                        </div>
                        <div className="space-y-6">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-pink">Observation (AI Response)</p>
                          <div className="p-10 bg-white border border-slate-100 rounded-2xl shadow-sm leading-relaxed text-slate-700 text-lg font-serif markdown-content">
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                                ul: ({ children }) => <ul className="space-y-3 my-6 list-disc pl-5">{children}</ul>,
                                ol: ({ children }) => <ol className="space-y-3 my-6 list-decimal pl-5">{children}</ol>,
                                li: ({ children }) => <li className="text-slate-700">{children}</li>,
                                strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>
                              }}
                            >
                              {log.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {log.type === 'review' && (
                    <div className={cn(
                      "p-8 border rounded-xl markdown-content",
                      log.isCorrect === false 
                        ? "bg-red-50/30 border-red-100" 
                        : "bg-emerald-50/30 border-emerald-100"
                    )}>
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => (
                            <p className={cn(
                              "text-base leading-relaxed italic font-serif",
                              log.isCorrect === false ? "text-red-900" : "text-emerald-900"
                            )}>
                              {children}
                            </p>
                          ),
                          strong: ({ children }) => (
                            <strong className={cn(
                              "font-bold",
                              log.isCorrect === false ? "text-red-950" : "text-emerald-950"
                            )}>
                              {children}
                            </strong>
                          )
                        }}
                      >
                        {log.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isWaitingForResult && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-2xl mx-auto flex items-center gap-4 text-slate-400"
              >
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-pink animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-bounce delay-100" />
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-pink animate-bounce delay-200" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Analyzing Outcome</span>
              </motion.div>
            )}
          </div>

          {/* Input Area */}
          <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-[#fcfcfc] via-[#fcfcfc] to-transparent">
            <div className="max-w-2xl mx-auto">
              {isModuleIntro && (
                <button
                  onClick={() => proceedToLevel(1)}
                  className="w-full py-5 gradient-bg text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-brand-pink/20 hover:scale-[1.01] transition-all"
                >
                  Begin Practice
                </button>
              )}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
