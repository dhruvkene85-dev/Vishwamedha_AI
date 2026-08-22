import React from 'react';
import { Home, MessageSquare, Clock, User, Settings, Plus } from 'lucide-react';
import { AppScreen } from '../types';

interface MobileBottomNavProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  onNewChat: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentScreen,
  onNavigate,
  onNewChat,
}) => {
  return (
    <nav className="lg:hidden shrink-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 flex items-center justify-around z-30 select-none">
      {/* 1. Home */}
      <button
        id="btn-nav-mobile-home"
        onClick={() => onNavigate('home')}
        className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] transition cursor-pointer ${
          currentScreen === 'home' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Home</span>
      </button>

      {/* 2. Chat */}
      <button
        id="btn-nav-mobile-chat"
        onClick={() => onNavigate('chat')}
        className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] transition cursor-pointer ${
          currentScreen === 'chat' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <MessageSquare className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">AI Chat</span>
      </button>

      {/* 3. Central Quick New Chat Button */}
      <button
        id="btn-nav-mobile-new-chat"
        onClick={onNewChat}
        className="flex flex-col items-center justify-center -mt-5 min-h-[48px] min-w-[48px] rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 active:scale-95 transition cursor-pointer"
        title="Start New Chat"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* 4. History */}
      <button
        id="btn-nav-mobile-history"
        onClick={() => onNavigate('history')}
        className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] transition cursor-pointer ${
          currentScreen === 'history' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <Clock className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">History</span>
      </button>

      {/* 5. Profile */}
      <button
        id="btn-nav-mobile-profile"
        onClick={() => onNavigate('profile')}
        className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] transition cursor-pointer ${
          currentScreen === 'profile' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <User className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Profile</span>
      </button>

      {/* 6. Settings */}
      <button
        id="btn-nav-mobile-settings"
        onClick={() => onNavigate('settings')}
        className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] transition cursor-pointer ${
          currentScreen === 'settings' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <Settings className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Settings</span>
      </button>
    </nav>
  );
};
