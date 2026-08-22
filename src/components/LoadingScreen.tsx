import React from 'react';
import { VishwamedhaSymbol } from './Logo';

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Initializing Vishwamedha AI...",
  subMessage = "Aligning neural wisdom models & mathematical solver engine"
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col items-center justify-center p-6 select-none">
      {/* Centered Brand Emblem & Ripple */}
      <div className="relative flex items-center justify-center">
        {/* Pulsing Ripple Rings */}
        <div className="absolute w-36 h-36 rounded-full bg-indigo-500/10 animate-ping" />
        <div className="absolute w-28 h-28 rounded-full bg-amber-500/10 animate-pulse" />

        {/* Floating Card with Symbol */}
        <div className="relative p-6 rounded-3xl bg-white border border-slate-200 shadow-xl flex items-center justify-center">
          <VishwamedhaSymbol size={72} animated />
        </div>
      </div>

      {/* Brand Title */}
      <div className="mt-8 text-center space-y-1.5">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
            Vishwamedha
          </h1>
          <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-gradient-to-r from-indigo-600 via-indigo-700 to-amber-600 text-white shadow-xs">
            AI
          </span>
        </div>
        <p className="text-xs font-semibold text-indigo-700">{message}</p>
        <p className="text-[11px] text-slate-400 font-medium max-w-xs">{subMessage}</p>
      </div>

      {/* Progress Bar */}
      <div className="w-48 h-1.5 bg-slate-200 rounded-full mt-6 overflow-hidden">
        <div className="w-full h-full bg-gradient-to-r from-indigo-600 via-amber-500 to-indigo-600 animate-[progress_1.5s_ease-in-out_infinite]" />
      </div>
    </div>
  );
};
