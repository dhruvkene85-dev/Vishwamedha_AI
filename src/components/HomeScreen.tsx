import React from 'react';
import { 
  Sparkles, 
  MessageSquarePlus, 
  Calculator, 
  Atom, 
  ImageIcon, 
  FileEdit, 
  Sigma, 
  HelpCircle, 
  Clock, 
  ArrowRight, 
  Flame, 
  GraduationCap, 
  Brain, 
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { ChatSession, StudentGrade, SubjectFocus, UserProfile } from '../types';
import { VishwamedhaLogo, VishwamedhaSymbol } from './Logo';

interface HomeScreenProps {
  onStartNewChat: () => void;
  onOpenChatWithPrompt: (prompt: string, grade?: StudentGrade, subject?: SubjectFocus) => void;
  onSelectSession: (id: string) => void;
  onNavigateHistory: () => void;
  onNavigateProfile: () => void;
  onOpenFormulaSheet: () => void;
  onOpenPracticeModal: () => void;
  sessions: ChatSession[];
  userProfile?: UserProfile;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartNewChat,
  onOpenChatWithPrompt,
  onSelectSession,
  onNavigateHistory,
  onNavigateProfile,
  onOpenFormulaSheet,
  onOpenPracticeModal,
  sessions,
  userProfile,
}) => {
  const recentSessions = sessions.slice(0, 4);

  // Compute summary metrics
  const totalMessages = sessions.reduce((acc, s) => acc + s.messages.length, 0);
  const totalImages = sessions.reduce(
    (acc, s) => acc + s.messages.filter((m) => m.images && m.images.length > 0).length,
    0
  );

  const learningModules = [
    {
      id: "module-math",
      title: "Mathematics & Logic",
      desc: "Step-by-step solutions for algebra, geometry, calculus & word problems.",
      tag: "Math Solver",
      icon: <Calculator className="w-5 h-5 text-amber-600" />,
      bg: "bg-amber-50/50 hover:bg-amber-50",
      border: "border-amber-200/80 hover:border-amber-300",
      action: () => onOpenChatWithPrompt("Solve this mathematics question with full step-by-step working:\n", 'general', 'mathematics'),
    },
    {
      id: "module-science",
      title: "Science & Physics",
      desc: "Deep conceptual clarity, real-world analogies, laws and experimental proofs.",
      tag: "Concepts",
      icon: <Atom className="w-5 h-5 text-indigo-600" />,
      bg: "bg-indigo-50/50 hover:bg-indigo-50",
      border: "border-indigo-200/80 hover:border-indigo-300",
      action: () => onOpenChatWithPrompt("Explain the scientific concept, mechanism, and formulas for:\n", 'general', 'science'),
    },
    {
      id: "module-vision",
      title: "Multimodal Vision",
      desc: "Upload textbook photos, handwritten equations, diagrams & test papers.",
      tag: "Image AI",
      icon: <ImageIcon className="w-5 h-5 text-sky-600" />,
      bg: "bg-sky-50/50 hover:bg-sky-50",
      border: "border-sky-200/80 hover:border-sky-300",
      action: () => onOpenChatWithPrompt("I am going to attach an image or diagram. Please analyze it step-by-step.\n"),
    },
    {
      id: "module-writing",
      title: "Writing & Reasoning",
      desc: "Essay structure, critical analysis, summaries, and grammar enhancement.",
      tag: "Composition",
      icon: <FileEdit className="w-5 h-5 text-emerald-600" />,
      bg: "bg-emerald-50/50 hover:bg-emerald-50",
      border: "border-emerald-200/80 hover:border-emerald-300",
      action: () => onOpenChatWithPrompt("Review and polish this writing for clarity, flow, and academic precision:\n", 'general', 'english_writing'),
    },
  ];

  const quickPrompts = [
    { label: "📐 Pythagorean Theorem", prompt: "Explain the Pythagorean theorem with a geometric proof and an example." },
    { label: "⚡ Ohm's Law & Circuits", prompt: "Explain Ohm's Law (V = IR) and how to calculate total resistance in parallel circuits." },
    { label: "🌱 Photosynthesis Process", prompt: "Summarize the light-dependent and Calvin cycle stages of photosynthesis." },
    { label: "🧮 Quadratic Formula", prompt: "Solve 3x^2 - 5x + 2 = 0 using the quadratic formula with every step." },
    { label: "🌍 Plate Tectonics", prompt: "What causes earthquakes according to plate tectonic theory?" },
  ];

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 w-full bg-slate-50 smooth-scroll">
      <div className="max-w-6xl mx-auto w-full p-4 sm:p-6 lg:p-8 pb-28 lg:pb-12 space-y-6">
        {/* Top Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-md border border-slate-800">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center sm:items-start gap-3.5 sm:gap-4 max-w-xl">
            <div className="shrink-0">
              <VishwamedhaSymbol size={44} className="sm:w-[52px] sm:h-[52px]" animated />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>INTELLIGENCE WITHOUT BOUNDARIES</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
                Welcome{userProfile?.displayName || userProfile?.name ? `, ${userProfile.displayName || userProfile.name}` : ''}
              </h1>
              
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                Your universal AI workspace for intelligent conversations, multimodal diagram understanding, academic problem solving, and rigorous reasoning.
              </p>
            </div>
          </div>

          {/* Quick Launch CTA Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              id="btn-home-start-new-chat"
              onClick={onStartNewChat}
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-950 flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Start New Chat</span>
            </button>

            <button
              id="btn-home-view-history"
              onClick={onNavigateHistory}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm border border-white/15 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Clock className="w-4 h-4 text-indigo-300" />
              <span>Chat History</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Strip in Hero */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-slate-400 font-medium">Conversations</div>
            <div className="text-lg font-bold text-white mt-0.5">{sessions.length}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-slate-400 font-medium">Messages Exchanged</div>
            <div className="text-lg font-bold text-white mt-0.5">{totalMessages}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-slate-400 font-medium">Diagrams Analyzed</div>
            <div className="text-lg font-bold text-white mt-0.5">{totalImages}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-slate-400 font-medium">Active Engine</div>
            <div className="text-sm font-bold text-amber-300 mt-0.5 truncate">Meta Muse Glimmer 30B</div>
          </div>
        </div>
      </div>

      {/* 4 Specialized Learning & AI Modules (Bento Grid) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-600" />
            <span>AI Capabilities & Workspaces</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">Select a module to launch</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {learningModules.map((mod) => (
            <div
              key={mod.id}
              id={`home-card-${mod.id}`}
              onClick={mod.action}
              className={`p-5 rounded-2xl bg-white border shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group ${mod.bg} ${mod.border}`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs group-hover:scale-105 transition-transform">
                    {mod.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                    {mod.tag}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                  {mod.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {mod.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-indigo-600">
                <span>Open Chat</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Quick Tools (Formulas + Practice Drills) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={onOpenFormulaSheet}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 shadow-2xs hover:shadow-sm transition cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Sigma className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                Interactive Formula Sheet
              </h4>
              <p className="text-xs text-slate-500">
                Math, Physics & Chemistry reference handbook
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
        </div>

        <div
          onClick={onOpenPracticeModal}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 shadow-2xs hover:shadow-sm transition cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-amber-700 transition-colors">
                Practice Drills & MCQs
              </h4>
              <p className="text-xs text-slate-500">
                Generate high-yield questions with full solutions
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      {/* Recent Chats Section */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
              Recent Conversations
            </h3>
          </div>
          <button
            id="btn-view-all-history"
            onClick={onNavigateHistory}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition cursor-pointer flex items-center gap-1"
          >
            <span>View All ({sessions.length})</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {recentSessions.length === 0 || (recentSessions.length === 1 && recentSessions[0].messages.length === 0) ? (
          <div className="py-6 text-center text-xs text-slate-400 font-medium">
            No previous conversations yet. Click "Start New Chat" to begin exploring!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentSessions.map((sess) => {
              const lastMsg = sess.messages[sess.messages.length - 1];
              return (
                <div
                  key={sess.id}
                  id={`recent-session-card-${sess.id}`}
                  onClick={() => onSelectSession(sess.id)}
                  className="p-3.5 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/80 hover:border-indigo-200 transition cursor-pointer flex flex-col justify-between group shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-700 truncate max-w-[200px]">
                        {sess.title || 'Untitled Session'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(sess.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {lastMsg ? lastMsg.content : 'New conversation'}
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{sess.messages.length} messages</span>
                    <span className="text-indigo-600 font-semibold group-hover:underline">Resume →</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Explore Prompt Ideas</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((item, idx) => (
            <button
              key={idx}
              id={`btn-home-quick-${idx}`}
              onClick={() => onOpenChatWithPrompt(item.prompt)}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 transition font-medium cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
};
