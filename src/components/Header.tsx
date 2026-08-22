import React from 'react';
import { 
  FileText, 
  Trash2, 
  Menu, 
  Sigma, 
  HelpCircle, 
  User, 
  Home, 
  MessageSquare, 
  Clock, 
  Settings, 
  Plus,
  LogIn,
  LogOut
} from 'lucide-react';
import { AppScreen, StudentGrade, SubjectFocus, UserProfile } from '../types';
import { VishwamedhaSymbol } from './Logo';

interface HeaderProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  onToggleSidebar: () => void;
  onStartNewChat: () => void;
  studentGrade: StudentGrade;
  onChangeGrade: (grade: StudentGrade) => void;
  subjectFocus: SubjectFocus;
  onChangeSubject: (subject: SubjectFocus) => void;
  onClearChat: () => void;
  onExportChat: () => void;
  onOpenFormulaSheet: () => void;
  onOpenPracticeModal: () => void;
  userProfile?: UserProfile;
  onOpenAuthModal?: () => void;
  onSignOut?: () => void;
  messageCount: number;
}

const GRADE_OPTIONS: { value: StudentGrade; label: string; desc: string }[] = [
  { value: 'general', label: 'Standard / General', desc: 'Standard conversational depth' },
  { value: 'elementary', label: 'Elementary (Grades 1-5)', desc: 'Simple words, friendly analogies' },
  { value: 'middle', label: 'Middle School (6-8)', desc: 'Clear step-by-step guidance' },
  { value: 'high_school', label: 'High School (9-12)', desc: 'Exam rigor, theorems & formulas' },
  { value: 'college', label: 'College / Advanced', desc: 'Advanced academic precision' },
];

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  onToggleSidebar,
  onStartNewChat,
  studentGrade,
  onChangeGrade,
  onClearChat,
  onExportChat,
  onOpenFormulaSheet,
  onOpenPracticeModal,
  userProfile,
  onOpenAuthModal,
  onSignOut,
  messageCount,
}) => {
  return (
    <header className="shrink-0 flex items-center justify-between p-3 sm:p-3.5 bg-white border-b border-slate-200 shadow-2xs text-slate-800 z-20">
      {/* Left Brand & Sidebar Toggle */}
      <div className="flex items-center gap-3">
        <button
          id="btn-toggle-sidebar"
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition lg:hidden cursor-pointer"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Vishwamedha AI branding clickable to Home */}
        <button 
          id="btn-header-home"
          onClick={() => onNavigate('home')} 
          className="flex items-center gap-2.5 cursor-pointer transition hover:opacity-90 active:scale-95 focus:outline-hidden p-1 rounded-xl"
          title="Vishwamedha AI Home"
          aria-label="Vishwamedha AI Home"
        >
          <VishwamedhaSymbol size={34} animated />
          <div className="hidden sm:flex flex-col text-left">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold text-sm tracking-tight text-slate-900 font-sans">Vishwamedha</span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-indigo-600 text-white leading-none">AI</span>
            </div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Intelligence Without Boundaries</span>
          </div>
        </button>
      </div>

      {/* Desktop Main Navigation Tabs */}
      <div className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/80">
        <button
          id="nav-tab-home"
          onClick={() => onNavigate('home')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            currentScreen === 'home'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>

        <button
          id="nav-tab-chat"
          onClick={() => onNavigate('chat')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            currentScreen === 'chat'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>AI Chat</span>
        </button>

        <button
          id="nav-tab-history"
          onClick={() => onNavigate('history')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            currentScreen === 'history'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>History</span>
        </button>

        <button
          id="nav-tab-profile"
          onClick={() => onNavigate('profile')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            currentScreen === 'profile'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Profile</span>
        </button>

        <button
          id="nav-tab-settings"
          onClick={() => onNavigate('settings')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            currentScreen === 'settings'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>
      </div>

      {/* Right Controls & Quick Tools */}
      <div className="flex items-center gap-2">
        {/* Quick New Chat Button */}
        <button
          id="btn-header-new-chat"
          onClick={onStartNewChat}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </button>

        {/* Grade Selector (Shown when in Chat view) */}
        {currentScreen === 'chat' && (
          <div className="relative flex items-center">
            <select
              id="select-student-grade"
              value={studentGrade}
              onChange={(e) => onChangeGrade(e.target.value as StudentGrade)}
              className="text-xs bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer font-medium"
              title="Adjust student grade level"
            >
              {GRADE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Formulas Button */}
        <button
          id="btn-open-formula-sheet"
          onClick={onOpenFormulaSheet}
          className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 transition cursor-pointer"
          title="Open Math & Physics formula reference"
        >
          <Sigma className="w-3.5 h-3.5 text-indigo-600" />
          <span>Formulas</span>
        </button>

        {/* Practice Drill MCQ button */}
        <button
          id="btn-open-practice"
          onClick={onOpenPracticeModal}
          className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 shadow-xs transition cursor-pointer"
          title="Generate custom practice quiz or MCQ"
        >
          <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
          <span>Drill</span>
        </button>

        {/* Export Chat (When in chat with messages) */}
        {currentScreen === 'chat' && messageCount > 0 && (
          <button
            id="btn-export-chat"
            onClick={onExportChat}
            className="p-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition border border-transparent hover:border-slate-200 cursor-pointer"
            title="Export conversation as Markdown notes"
          >
            <FileText className="w-4 h-4" />
          </button>
        )}

        {/* Clear Chat (When in chat with messages) */}
        {currentScreen === 'chat' && messageCount > 0 && (
          <button
            id="btn-clear-chat"
            onClick={onClearChat}
            className="p-2 rounded-xl text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition border border-transparent hover:border-rose-100 cursor-pointer"
            title="Clear current conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* User Account / Sign In Widget */}
        {userProfile ? (
          <div className="flex items-center gap-1 pl-1">
            <button
              id="btn-header-profile"
              onClick={() => onNavigate('profile')}
              title={`Logged in as ${userProfile.displayName || userProfile.email}`}
              className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-xl bg-slate-100/90 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200/80 transition cursor-pointer text-xs font-bold text-slate-700"
            >
              {userProfile.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt={userProfile.displayName}
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-lg object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-extrabold">
                  {(userProfile.displayName || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden sm:inline max-w-[100px] truncate">
                {userProfile.displayName || 'Account'}
              </span>
            </button>

            {onSignOut && (
              <button
                id="btn-header-signout"
                onClick={onSignOut}
                title="Sign out of Vishwamedha AI"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <button
            id="btn-header-signin"
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
