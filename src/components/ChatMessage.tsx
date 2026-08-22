import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  ZoomIn, 
  MessageSquarePlus, 
  AlertCircle,
  User as UserIcon
} from 'lucide-react';
import { ChatMessage, MessageImage } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { SpeechController } from '../utils/speech';
import { VishwamedhaSymbol } from './Logo';

interface ChatMessageProps {
  message: ChatMessage;
  isLastAssistantMessage: boolean;
  onSelectPrompt: (prompt: string) => void;
  onImageClick: (img: MessageImage) => void;
  onRetry?: () => void;
}

export const ChatMessageItem: React.FC<ChatMessageProps> = ({
  message,
  isLastAssistantMessage,
  onSelectPrompt,
  onImageClick,
  onRetry,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(message.content);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = message.content;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // Fallback method
      const textarea = document.createElement('textarea');
      textarea.value = message.content;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      SpeechController.stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      SpeechController.speak(message.content, () => {
        setIsSpeaking(false);
      });
    }
  };

  // Contextual follow-up suggestions for assistant messages
  const followUpSuggestions = [
    "Make it shorter",
    "Explain in simpler language",
    "Show another example",
    "Give an MCQ test question on this",
    "Break down the formula/steps further",
    "What are common student mistakes on this?"
  ];

  return (
    <div className={`py-4 sm:py-5 px-3 sm:px-6 transition-colors flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-3 max-w-4xl w-full ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              <UserIcon className="w-4 h-4 text-white" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-white border border-indigo-100 shadow-xs flex items-center justify-center p-0.5">
              <VishwamedhaSymbol size={24} />
            </div>
          )}
        </div>

        {/* Message Content Bubble Body */}
        <div className={`space-y-2.5 ${isUser ? 'max-w-[85%]' : 'max-w-[92%]'}`}>
          {/* Sender Header info */}
          <div className={`flex items-center gap-2 ${isUser ? 'justify-end' : 'justify-between'}`}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">
                {isUser ? 'Student' : 'Vishwamedha AI'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Action buttons on assistant message */}
            {!isUser && !message.isStreaming && !message.isError && (
              <div className="flex items-center gap-1 opacity-70 hover:opacity-100 transition">
                <button
                  id={`btn-tts-message-${message.id}`}
                  onClick={handleToggleSpeak}
                  className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                    isSpeaking 
                      ? 'text-indigo-600 bg-indigo-50' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  title={isSpeaking ? "Stop reading" : "Read aloud"}
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>

                <button
                  id={`btn-copy-message-${message.id}`}
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                  title="Copy full response"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Uploaded User Images (if any) */}
          {message.images && message.images.length > 0 && (
            <div className={`flex flex-wrap gap-2.5 pt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {message.images.map((img) => (
                <div
                  key={img.id}
                  onClick={() => onImageClick(img)}
                  className="group relative rounded-xl overflow-hidden border border-slate-200 bg-white cursor-pointer max-w-xs shadow-xs transition hover:border-indigo-500 hover:shadow-md"
                >
                  <img
                    src={img.data}
                    alt={img.name || "Attached question image"}
                    className="max-h-48 w-auto object-contain transition group-hover:scale-102"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-xs text-white transition backdrop-blur-[1px]">
                    <ZoomIn className="w-4 h-4" />
                    <span>View Diagram</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Text / Markdown Content Bubble */}
          {isUser ? (
            <div className="bg-indigo-600 p-4 rounded-2xl rounded-tr-none text-sm leading-relaxed text-white shadow-md shadow-indigo-100 break-words">
              {message.content}
            </div>
          ) : message.isError ? (
            <div className="p-4 rounded-2xl rounded-tl-none bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-xs">Response issue</p>
                <p className="text-xs text-rose-700 mt-0.5">{message.content}</p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold border border-rose-200 shadow-xs transition cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Retry Request</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-5 border border-slate-200/90 rounded-3xl rounded-tl-none text-sm leading-relaxed text-slate-800 shadow-xs">
              <MarkdownRenderer content={message.content} />
              
              {message.isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-indigo-600 animate-pulse align-middle rounded-sm" />
              )}
            </div>
          )}

          {/* Follow-up recommendation chips on the last assistant message */}
          {!isUser && isLastAssistantMessage && !message.isStreaming && !message.isError && (
            <div className="pt-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                <MessageSquarePlus className="w-3 h-3 text-indigo-600" />
                <span>Contextual Follow-ups</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {followUpSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    id={`btn-followup-${idx}`}
                    onClick={() => onSelectPrompt(suggestion)}
                    className="text-xs py-1.5 px-3 rounded-xl bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-900 border border-slate-200 hover:border-indigo-200 shadow-xs transition active:scale-98 font-medium cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
