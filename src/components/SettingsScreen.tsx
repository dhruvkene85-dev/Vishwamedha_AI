import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Cpu, 
  Sparkles, 
  Volume2, 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  ShieldCheck, 
  CheckCircle2, 
  Sliders, 
  GraduationCap, 
  BookOpen, 
  Layers, 
  Info
} from 'lucide-react';
import { AppSettings, ChatSession, StudentGrade, SubjectFocus, ResponseStyle } from '../types';
import { VishwamedhaLogo, VishwamedhaSymbol } from './Logo';

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdateSettings: (updated: AppSettings) => void;
  sessions: ChatSession[];
  onImportSessions: (imported: ChatSession[]) => void;
  onClearAllSessions: () => void;
  onExportAllJson: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  sessions,
  onImportSessions,
  onClearAllSessions,
  onExportAllJson,
}) => {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const handleGradeChange = (grade: StudentGrade) => {
    onUpdateSettings({ ...settings, defaultGrade: grade });
    showSuccess(`Default grade updated to ${grade}`);
  };

  const handleSubjectChange = (subject: SubjectFocus) => {
    onUpdateSettings({ ...settings, defaultSubject: subject });
    showSuccess(`Default subject focus updated to ${subject}`);
  };

  const handleResponseStyleChange = (style: ResponseStyle) => {
    onUpdateSettings({ ...settings, responseStyle: style });
    showSuccess(`Response style updated to ${style}`);
  };

  const handleSpeechRateChange = (rate: number) => {
    onUpdateSettings({ ...settings, speechRate: rate });
  };

  const handleAutoScrollToggle = () => {
    onUpdateSettings({ ...settings, autoScroll: !settings.autoScroll });
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onImportSessions(parsed);
          showSuccess(`Imported ${parsed.length} conversation sessions.`);
        } else {
          alert("Invalid backup file structure.");
        }
      } catch (err) {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 w-full bg-slate-50 smooth-scroll">
      <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 pb-28 lg:pb-12 space-y-6">
        {/* Top Banner */}
      <div className="flex items-center justify-between bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Settings & Preferences
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Configure Vishwamedha AI engine defaults, voice settings, and data management.
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1. AI Model Architecture Info & Selector */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600">
            <Cpu className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              AI Engine & Foundation Model
            </h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active: {settings.modelIdentifier || 'gemini-3.7-flash'}
          </span>
        </div>

        <div className="space-y-3 text-xs">
          {/* Active Model Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100">
            <div>
              <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Primary Gemini Model</span>
              </div>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Select the primary Google Gemini model used for generation.
              </p>
            </div>

            <select
              value={settings.modelIdentifier || 'gemini-3.7-flash'}
              onChange={(e) => {
                onUpdateSettings({ ...settings, modelIdentifier: e.target.value });
                showSuccess(`Model updated to ${e.target.value}`);
              }}
              className="bg-white px-3 py-2 border border-indigo-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
            >
              <option value="gemini-3.7-flash">Gemini 3.7 Flash (Recommended)</option>
              <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Ultra Fast)</option>
              <option value="gemini-3-flash-preview">Gemini 3.0 Flash Preview</option>
              <option value="gemini-flash-latest">Gemini Flash Latest (Auto-Updated)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="text-slate-400 font-medium mb-1">Multimodal Reasoning</div>
              <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Vision & Visual Grounding</span>
              </div>
              <p className="text-slate-500 mt-1 text-[11px]">
                High-throughput mathematical, diagrammatic, and text reasoning.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="text-slate-400 font-medium mb-1">Resilient Cascade Strategy</div>
              <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Multi-Tier Failover</span>
              </div>
              <p className="text-slate-500 mt-1 text-[11px]">
                Automatic instant failover to secondary candidates on quota limits.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Academic Defaults */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-indigo-600">
          <Sliders className="w-4 h-4" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Academic Level & Response Defaults
          </h2>
        </div>

        <div className="space-y-4 text-xs">
          {/* Default Grade */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
            <div>
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span>Default Grade Level</span>
              </div>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Sets default complexity and depth when starting a new conversation.
              </p>
            </div>

            <select
              value={settings.defaultGrade}
              onChange={(e) => handleGradeChange(e.target.value as StudentGrade)}
              className="bg-white px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="general">Standard / General</option>
              <option value="elementary">Elementary (1-5)</option>
              <option value="middle">Middle School (6-8)</option>
              <option value="high_school">High School (9-12)</option>
              <option value="college">College / University</option>
            </select>
          </div>

          {/* Response Style */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
            <div>
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>Response Explanation Style</span>
              </div>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Choose how explanations are structured.
              </p>
            </div>

            <select
              value={settings.responseStyle}
              onChange={(e) => handleResponseStyleChange(e.target.value as ResponseStyle)}
              className="bg-white px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="step_by_step">Step-by-Step Academic</option>
              <option value="standard">Standard Conversational</option>
              <option value="concise">Concise & Quick Summary</option>
              <option value="socratic">Socratic Guidance</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Audio & Voice Controls */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-indigo-600">
          <Volume2 className="w-4 h-4" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Voice Readout Settings
          </h2>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
            <div>
              <span className="font-bold text-slate-800 text-xs">Text-to-Speech Speed</span>
              <p className="text-[11px] text-slate-500">Adjust the voice playback reading speed.</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.75"
                max="1.5"
                step="0.05"
                value={settings.speechRate || 1}
                onChange={(e) => handleSpeechRateChange(parseFloat(e.target.value))}
                className="w-32 accent-indigo-600"
              />
              <span className="text-xs font-bold text-slate-700 w-10 text-right">
                {settings.speechRate || 1.0}x
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Data & Storage Backup */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-indigo-600">
          <Database className="w-4 h-4" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Storage & Backup Management
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={onExportAllJson}
            className="p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-800 text-left transition flex flex-col justify-between gap-2 group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <Download className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-slate-400">JSON</span>
            </div>
            <div>
              <div className="text-xs font-bold">Export All Chats</div>
              <div className="text-[11px] text-slate-500">Backup {sessions.length} sessions to file</div>
            </div>
          </button>

          <label className="p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-800 text-left transition flex flex-col justify-between gap-2 group cursor-pointer">
            <div className="flex items-center justify-between">
              <Upload className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-slate-400">RESTORE</span>
            </div>
            <div>
              <div className="text-xs font-bold">Import Backup</div>
              <div className="text-[11px] text-slate-500">Load chats from JSON file</div>
            </div>
            <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
          </label>

          <button
            onClick={onClearAllSessions}
            className="p-3.5 rounded-2xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-800 text-left transition flex flex-col justify-between gap-2 group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <Trash2 className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-rose-400">RESET</span>
            </div>
            <div>
              <div className="text-xs font-bold text-rose-700">Clear All Storage</div>
              <div className="text-[11px] text-rose-500">Erase all saved chat history</div>
            </div>
          </button>
        </div>
      </div>

      {/* 5. Brand Heritage Info */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 border border-slate-800 space-y-3">
        <div className="flex items-center gap-3">
          <VishwamedhaLogo size="sm" variant="horizontal" theme="dark" showSubtitle={false} />
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong>Vishwamedha AI</strong> embodies the union of universal knowledge (<em>Vishwa</em>) and luminous intellect (<em>Medha</em>). Designed to deliver unbounded intelligence across mathematics, sciences, reasoning, and visual understanding.
        </p>
        <div className="text-[11px] text-slate-400 border-t border-white/10 pt-2 flex items-center justify-between">
          <span>Tagline: Intelligence Without Boundaries</span>
          <span>Version 1.0 Production</span>
        </div>
      </div>
      </div>
    </div>
  );
};
