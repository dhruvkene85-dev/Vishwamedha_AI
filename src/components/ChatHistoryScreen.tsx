import React, { useState } from 'react';
import { 
  Clock, 
  Search, 
  Trash2, 
  FileText, 
  ArrowRight, 
  Plus, 
  Calendar, 
  Copy, 
  Check, 
  Edit3, 
  Sparkles, 
  MessageSquare,
  GraduationCap,
  Download,
  AlertTriangle
} from 'lucide-react';
import { ChatSession } from '../types';

interface ChatHistoryScreenProps {
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onStartNewChat: () => void;
  onDeleteSession: (id: string, e?: React.MouseEvent) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onExportSession: (session: ChatSession) => void;
  onClearAllSessions: () => void;
}

export const ChatHistoryScreen: React.FC<ChatHistoryScreenProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onStartNewChat,
  onDeleteSession,
  onRenameSession,
  onExportSession,
  onClearAllSessions,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredSessions = sessions.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  });

  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 w-full bg-slate-50 smooth-scroll">
      <div className="max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 pb-28 lg:pb-12 space-y-6">
        {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Chat History
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Browse, resume, export, and manage your preserved Vishwamedha AI conversations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-history-new-chat"
            onClick={onStartNewChat}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>

          {sessions.length > 1 && (
            <button
              id="btn-history-clear-all"
              onClick={onClearAllSessions}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs border border-rose-200/60 transition cursor-pointer"
              title="Clear all stored chats"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span className="hidden sm:inline">Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id="input-history-search"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by title, message contents, or unique ID..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs font-medium"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 font-bold"
          >
            Clear
          </button>
        )}
      </div>

      {/* Conversations List */}
      <div className="space-y-3">
        {filteredSessions.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {searchTerm ? 'No matching conversations found' : 'No chat history yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm
                ? `No sessions matched "${searchTerm}". Try a different keyword.`
                : 'Start a new conversation with Vishwamedha AI to preserve your question notes and solutions.'}
            </p>
            <button
              onClick={onStartNewChat}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-indigo-700 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Conversation</span>
            </button>
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isEditing = editingId === session.id;
            const isCurrent = session.id === currentSessionId;
            const lastMsg = session.messages[session.messages.length - 1];

            return (
              <div
                key={session.id}
                id={`history-session-card-${session.id}`}
                onClick={() => onSelectSession(session.id)}
                className={`group p-4 sm:p-5 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs hover:shadow-md flex flex-col gap-3 ${
                  isCurrent
                    ? 'border-indigo-400 ring-2 ring-indigo-500/10'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                {/* Top Title & Metadata Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <MessageSquare
                      className={`w-4 h-4 shrink-0 ${
                        isCurrent ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600'
                      }`}
                    />

                    {isEditing ? (
                      <div
                        className="flex items-center gap-2 flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(session.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          autoFocus
                          className="px-2 py-1 text-xs sm:text-sm font-bold text-slate-900 border border-indigo-500 rounded-lg focus:outline-none w-full"
                        />
                        <button
                          onClick={() => handleSaveRename(session.id)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 truncate">
                        <h2 className="text-sm sm:text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                          {session.title || 'Untitled Session'}
                        </h2>
                        {isCurrent && (
                          <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                            Active
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Top Action Icons */}
                  <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                    <button
                      id={`btn-history-rename-${session.id}`}
                      onClick={(e) => handleStartRename(session, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                      title="Rename conversation"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      id={`btn-history-export-${session.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onExportSession(session);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                      title="Export as Markdown notes"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      id={`btn-history-delete-${session.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm("Are you sure you want to delete this conversation?")) {
                          onDeleteSession(session.id, e);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Message snippet preview */}
                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2 leading-relaxed">
                  {lastMsg ? (
                    <span>
                      <strong className="text-slate-700">{lastMsg.role === 'user' ? 'You: ' : 'AI: '}</strong>
                      {lastMsg.content}
                    </span>
                  ) : (
                    <span className="italic text-slate-400">Empty conversation</span>
                  )}
                </div>

                {/* Bottom details & Metadata strip */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                  {/* Left Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-slate-700">
                      <span>{session.messages.length} messages</span>
                    </span>

                    <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 capitalize">
                      <GraduationCap className="w-3 h-3 text-indigo-600" />
                      <span>{session.studentGrade}</span>
                    </span>

                    {/* Copyable ID */}
                    <button
                      onClick={(e) => handleCopyId(session.id, e)}
                      className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-700 bg-slate-100/70 hover:bg-slate-200/70 px-1.5 py-0.5 rounded transition cursor-pointer font-mono"
                      title="Copy Unique Session ID"
                    >
                      <span>ID: {session.id.slice(0, 14)}...</span>
                      {copiedId === session.id ? (
                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-2.5 h-2.5" />
                      )}
                    </button>
                  </div>

                  {/* Right Timestamps */}
                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span title={`Created: ${new Date(session.createdAt).toLocaleString()}`}>
                      Created: {new Date(session.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span>•</span>
                    <span title={`Last active: ${new Date(session.updatedAt).toLocaleString()}`}>
                      Updated: {new Date(session.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      </div>
    </div>
  );
};
