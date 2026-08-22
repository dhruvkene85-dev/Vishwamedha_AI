import React, { useState } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  X, 
  Search, 
  Calculator, 
  Atom, 
  FileEdit, 
  Lightbulb, 
  Sparkles, 
  ShieldCheck, 
  Home, 
  Clock, 
  User, 
  Settings,
  GraduationCap,
  LogOut,
  LogIn
} from 'lucide-react';
import { AppScreen, ChatSession, UserProfile } from '../types';
import { VishwamedhaLogo } from './Logo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onQuickPromptSelect: (prompt: string) => void;
  userProfile?: UserProfile;
  onSignOut?: () => void;
  onOpenAuthModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentScreen,
  onNavigate,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onQuickPromptSelect,
  userProfile,
  onSignOut,
  onOpenAuthModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const quickStudyTools = [
    {
      icon: <Calculator className="w-3.5 h-3.5 text-amber-600" />,
      label: "Solve Math Problem",
      prompt: "Solve this mathematics question step-by-step with clear working: "
    },
    {
      icon: <Atom className="w-3.5 h-3.5 text-indigo-600" />,
      label: "Explain Science Concept",
      prompt: "Explain this physics/chemistry topic in simple terms with an intuitive real-world analogy: "
    },
    {
      icon: <FileEdit className="w-3.5 h-3.5 text-emerald-600" />,
      label: "Writing & Grammar Polish",
      prompt: "Review, improve, and explain grammar/style enhancements for my paragraph: "
    },
    {
      icon: <Lightbulb className="w-3.5 h-3.5 text-rose-600" />,
      label: "Exam Practice Drill (MCQs)",
      prompt: "Generate 3 high-yield multiple-choice questions with full explanations on: "
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed lg:static top-0 left-0 z-40 h-full w-72 bg-slate-50 border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out shrink-0 select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Branding & Close Button */}
        <div className="p-3.5 border-b border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div 
              onClick={() => {
                onNavigate('home');
                if (window.innerWidth < 1024) onClose();
              }}
              className="flex items-center cursor-pointer"
            >
              <VishwamedhaLogo size="xs" variant="horizontal" showSubtitle={false} animated />
            </div>

            <button
              id="btn-close-sidebar"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl lg:hidden transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <button
            id="btn-new-chat-sidebar"
            onClick={() => {
              onNewSession();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white py-2.5 px-3.5 rounded-xl font-bold text-xs shadow-sm shadow-indigo-100 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>
        </div>

        {/* Navigation Links for Screens */}
        <div className="p-2 border-b border-slate-200/60 space-y-0.5">
          <button
            id="sidebar-nav-home"
            onClick={() => {
              onNavigate('home');
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              currentScreen === 'home'
                ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200/80'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Home className="w-4 h-4 text-indigo-600" />
            <span>Home Hub</span>
          </button>

          <button
            id="sidebar-nav-chat"
            onClick={() => {
              onNavigate('chat');
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              currentScreen === 'chat'
                ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200/80'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            <span>AI Chat Assistant</span>
          </button>

          <button
            id="sidebar-nav-history"
            onClick={() => {
              onNavigate('history');
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              currentScreen === 'history'
                ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200/80'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Chat History</span>
          </button>

          <button
            id="sidebar-nav-profile"
            onClick={() => {
              onNavigate('profile');
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              currentScreen === 'profile'
                ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200/80'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4 text-indigo-600" />
            <span>User Profile</span>
          </button>

          <button
            id="sidebar-nav-settings"
            onClick={() => {
              onNavigate('settings');
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              currentScreen === 'settings'
                ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200/80'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4 text-indigo-600" />
            <span>App Settings</span>
          </button>
        </div>

        {/* Sessions Search */}
        <div className="p-3 border-b border-slate-200/60">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-sidebar-search"
              type="text"
              placeholder="Search chat history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200/80 rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 font-medium"
            />
          </div>
        </div>

        {/* Saved Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Your Conversations ({filteredSessions.length})
          </div>

          {filteredSessions.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 font-medium">
              No conversations found
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === currentSessionId;
              return (
                <div
                  key={session.id}
                  id={`session-item-${session.id}`}
                  onClick={() => {
                    onSelectSession(session.id);
                    onNavigate('chat');
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition ${
                    isActive
                      ? 'bg-white text-indigo-700 font-bold border border-slate-200/80 shadow-xs ring-1 ring-slate-100'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-2">
                    <MessageSquare
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span className="truncate">
                      {session.title || 'Untitled Session'}
                    </span>
                  </div>

                  <button
                    id={`btn-delete-session-${session.id}`}
                    onClick={(e) => onDeleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Study Launcher Bento Box */}
        <div className="p-3 border-t border-slate-200/80 bg-white/60">
          <div className="flex items-center gap-1.5 px-1 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>Study Starters</span>
          </div>
          <div className="space-y-1">
            {quickStudyTools.map((tool, idx) => (
              <button
                key={idx}
                id={`btn-quick-study-${idx}`}
                onClick={() => {
                  onNavigate('chat');
                  onQuickPromptSelect(tool.prompt);
                  if (window.innerWidth < 1024) onClose();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs bg-white hover:bg-slate-100 border border-slate-200/60 text-slate-700 hover:text-indigo-600 transition shadow-2xs font-medium cursor-pointer"
              >
                <div className="p-1 rounded-lg bg-slate-50 border border-slate-100">
                  {tool.icon}
                </div>
                <span className="truncate">{tool.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* User Account Bar & Security Footnote */}
        <div className="p-3 bg-slate-100/80 border-t border-slate-200 space-y-2">
          {userProfile ? (
            <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div 
                onClick={() => {
                  onNavigate('profile');
                  if (window.innerWidth < 1024) onClose();
                }}
                className="flex items-center gap-2 overflow-hidden cursor-pointer flex-1"
              >
                {userProfile.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.displayName}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {(userProfile.displayName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {userProfile.displayName || 'Student'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {userProfile.email}
                  </div>
                </div>
              </div>

              {onSignOut && (
                <button
                  id="btn-sidebar-signout"
                  onClick={onSignOut}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <button
              id="btn-sidebar-signin"
              onClick={() => {
                if (onOpenAuthModal) onOpenAuthModal();
                if (window.innerWidth < 1024) onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs transition cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-indigo-600" />
              <span>Sign In / Create Account</span>
            </button>
          )}

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium px-1">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>User Session Isolated</span>
            </div>
            <span>v2.1</span>
          </div>
        </div>
      </aside>
    </>
  );
};
