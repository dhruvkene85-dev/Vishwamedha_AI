import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, BookOpen, Brain, Zap, ShieldCheck } from 'lucide-react';
import { VishwamedhaOfficialGraphic } from './Logo';

interface SplashScreenProps {
  onEnter: () => void;
  autoDismissMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onEnter,
  autoDismissMs = 2400,
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / autoDismissMs) * 100));
      setProgress(pct);

      if (elapsed >= autoDismissMs) {
        clearInterval(interval);
        onEnter();
      }
    }, 40);

    return () => clearInterval(interval);
  }, [autoDismissMs, onEnter]);

  return (
    <div className="fixed inset-0 z-50 bg-[#070b1a] text-white flex flex-col items-center justify-between p-4 sm:p-8 select-none overflow-y-auto">
      {/* Background Cosmic Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[380px] h-[380px] bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/3 w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Status Bar */}
      <div className="w-full flex items-center justify-between max-w-2xl pt-2 z-10">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-indigo-300 uppercase">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>Vishwamedha AI Official</span>
        </div>
        <button
          id="btn-skip-splash"
          onClick={onEnter}
          className="text-xs text-slate-400 hover:text-white px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer flex items-center gap-1.5 font-medium"
        >
          <span>Skip</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Central Official Logo Hero */}
      <div className="flex flex-col items-center text-center max-w-lg my-auto py-6 space-y-5 z-10 w-full">
        {/* Complete Official Uploaded Logo Graphic */}
        <div className="relative w-full flex justify-center px-4">
          <div className="relative group">
            {/* Pulsing ambient halo matching logo colors */}
            <div className="absolute -inset-3 bg-gradient-to-r from-purple-500/30 via-indigo-500/20 to-amber-500/30 rounded-3xl blur-xl animate-pulse" />
            <VishwamedhaOfficialGraphic
              maxWidth={360}
              className="w-full max-w-[300px] sm:max-w-[360px]"
            />
          </div>
        </div>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <span className="flex items-center gap-1.5 text-[11px] sm:text-xs text-indigo-200 bg-indigo-950/70 border border-indigo-800/60 px-3 py-1.5 rounded-full font-medium shadow-xs">
            <Brain className="w-3.5 h-3.5 text-indigo-400" />
            <span>Multimodal Vision</span>
          </span>
          <span className="flex items-center gap-1.5 text-[11px] sm:text-xs text-amber-200 bg-amber-950/70 border border-amber-800/60 px-3 py-1.5 rounded-full font-medium shadow-xs">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Step-by-Step Math & Science</span>
          </span>
          <span className="flex items-center gap-1.5 text-[11px] sm:text-xs text-emerald-200 bg-emerald-950/70 border border-emerald-800/60 px-3 py-1.5 rounded-full font-medium shadow-xs">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Multi-turn Context Memory</span>
          </span>
        </div>
      </div>

      {/* Bottom Progress & Launch Button */}
      <div className="w-full max-w-md space-y-4 text-center pb-2 z-10">
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
            <span>Initializing neural reasoning engine</span>
            <span className="font-mono text-indigo-300">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-amber-400 transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <button
          id="btn-launch-vishwamedha"
          onClick={onEnter}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-950/60 transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Enter Vishwamedha AI</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Official Vishwamedha AI Application</span>
        </div>
      </div>
    </div>
  );
};
