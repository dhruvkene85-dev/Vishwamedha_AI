import React from 'react';
import { 
  Sparkles, 
  Calculator, 
  Atom, 
  ImageIcon, 
  CheckCircle2, 
  Brain,
  ArrowRight
} from 'lucide-react';
import { StudentGrade } from '../types';
import { VishwamedhaLogo, VishwamedhaSymbol } from './Logo';

interface WelcomeStateProps {
  onSelectPrompt: (prompt: string) => void;
  studentGrade: StudentGrade;
}

export const WelcomeState: React.FC<WelcomeStateProps> = ({ 
  onSelectPrompt, 
  studentGrade,
}) => {
  const bentoCards = [
    {
      id: "card-math-solve",
      icon: <Calculator className="w-5 h-5 text-amber-600" />,
      tag: "Mathematics & Logic",
      title: "Step-by-Step Problem Solving",
      description: "Solves algebra, calculus, geometry proofs, and reasoning problems with clear Given, Formulas, Working & Final Answer.",
      prompt: "Solve this mathematics problem step-by-step with complete formulas and detailed working: Solve for x: 2x^2 + 5x - 12 = 0",
      accent: "hover:border-amber-300 hover:bg-amber-50/20"
    },
    {
      id: "card-science-concept",
      icon: <Atom className="w-5 h-5 text-indigo-600" />,
      tag: "Science & Concepts",
      title: "Deep Conceptual Explanations",
      description: "Explains complex physics, chemistry, biology, and computational concepts using intuitive analogies and textbook precision.",
      prompt: "Explain Newton's Third Law and conservation of momentum with a realistic real-world physics example.",
      accent: "hover:border-indigo-300 hover:bg-indigo-50/20"
    },
    {
      id: "card-diagram-helper",
      icon: <ImageIcon className="w-5 h-5 text-sky-600" />,
      tag: "Multimodal Vision",
      title: "Image & Diagram Understanding",
      description: "Upload textbook photos, handwritten questions, geometry figures, circuit diagrams, or charts for detailed analysis.",
      prompt: "I am going to attach an image of my problem. Please inspect the visual information and solve it step-by-step.",
      accent: "hover:border-sky-300 hover:bg-sky-50/20"
    },
    {
      id: "card-practice-test",
      icon: <Brain className="w-5 h-5 text-emerald-600" />,
      tag: "Writing & Reasoning",
      title: "Writing, Analysis & Brainstorming",
      description: "Structure essays, summarize complex texts, generate practice questions, and refine answers to any custom format or style.",
      prompt: "Give me 5 practical uses of radioisotopes in medicine and industry with concise scientific explanations.",
      accent: "hover:border-emerald-300 hover:bg-emerald-50/20"
    }
  ];

  const quickPrompts = [
    "What is photosynthesis? (then ask: Explain for Grade 9)",
    "Solve 3x + 7 = 22 and show each step",
    "Explain Einstein's $E=mc^2$ in simple terms",
    "Give 5 uses of isotopes in points",
    "How does the nephron in the human kidney filter blood?"
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 flex flex-col items-center justify-start pb-12">
      {/* Hero Welcome in Bento Box style with official Vishwamedha Logo */}
      <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center mb-6 relative overflow-hidden">
        {/* Subtle background ambient glows */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-indigo-100/50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-amber-100/40 rounded-full blur-2xl pointer-events-none" />

        {/* Stacked Logo Display in Hero */}
        <div className="flex flex-col items-center justify-center mb-4">
          <VishwamedhaLogo size="xl" variant="stacked" showSubtitle={true} animated />
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
          How can Vishwamedha AI assist you today?
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed font-medium">
          A versatile conversational AI assistant for mathematics, science, complex reasoning, writing, and multimodal image analysis.
        </p>

        {/* Core Principles Pill row */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1 rounded-full border border-slate-200/80 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Full Multi-turn Context Memory</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1 rounded-full border border-slate-200/80 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Factual Accuracy & Step-by-Step Working</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1 rounded-full border border-slate-200/80 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Adaptive Length & Style Control</span>
          </span>
        </div>
      </div>

      {/* Bento Grid 2x2 Feature Modules */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {bentoCards.map((card) => (
          <div
            key={card.id}
            id={card.id}
            onClick={() => onSelectPrompt(card.prompt)}
            className={`p-5 rounded-2xl bg-white border border-slate-200 shadow-xs cursor-pointer transition-all hover:shadow-md ${card.accent} flex flex-col justify-between group`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 group-hover:scale-105 transition-transform">
                  {card.icon}
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {card.tag}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1.5 group-hover:text-indigo-600 transition-colors">
                {card.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                {card.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-bold opacity-90 group-hover:opacity-100">
              <span>Try this topic</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Prompt Suggestions Row */}
      <div className="w-full bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Quick Exploration Queries</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              id={`btn-welcome-quick-${idx}`}
              onClick={() => onSelectPrompt(prompt)}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 transition font-medium cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
