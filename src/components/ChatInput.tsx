import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Image as ImageIcon, 
  Mic, 
  MicOff,
  X, 
  Square, 
  Calculator, 
  Atom, 
  CheckSquare, 
  FileText,
  AlertCircle,
  Radio,
  Loader2
} from 'lucide-react';
import { MessageImage } from '../types';
import { SpeechController, SpeechRecognitionStatus } from '../utils/speech';

interface ChatInputProps {
  onSendMessage: (text: string, images?: MessageImage[]) => void;
  isLoading: boolean;
  onStopGeneration?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  onStopGeneration,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachedImages, setAttachedImages] = useState<MessageImage[]>([]);
  const [speechStatus, setSpeechStatus] = useState<SpeechRecognitionStatus>('ready');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stopListeningFnRef = useRef<(() => void) | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputText]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (stopListeningFnRef.current) {
        stopListeningFnRef.current();
      }
    };
  }, []);

  // Handle image file input
  const processFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target?.result as string;
        if (base64Data) {
          const newImg: MessageImage = {
            id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            mimeType: file.type,
            data: base64Data,
            name: file.name,
            size: file.size,
          };
          setAttachedImages((prev) => [...prev, newImg]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
    e.target.value = '';
  };

  // Handle paste for screenshots/diagrams
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    if (imageFiles.length > 0) {
      processFiles(imageFiles);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Voice speech-to-text toggle with comprehensive state handling (READY, LISTENING, PROCESSING, ERROR)
  const toggleListening = () => {
    setSpeechError(null);

    if (speechStatus === 'listening' || speechStatus === 'processing') {
      if (stopListeningFnRef.current) {
        stopListeningFnRef.current();
        stopListeningFnRef.current = null;
      }
      setSpeechStatus('ready');
      return;
    }

    const currentText = inputText;
    const stopFn = SpeechController.startListening(currentText, {
      onStatusChange: (status) => {
        setSpeechStatus(status);
      },
      onTranscriptChange: (text) => {
        setInputText(text);
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      },
      onError: (errorMsg) => {
        setSpeechError(errorMsg);
        setSpeechStatus('error');
      },
      onEnd: () => {
        stopListeningFnRef.current = null;
        setSpeechStatus('ready');
      }
    });

    stopListeningFnRef.current = stopFn;
  };

  const handleRemoveImage = (id: string) => {
    setAttachedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSend = () => {
    if ((!inputText.trim() && attachedImages.length === 0) || isLoading) return;

    if (speechStatus === 'listening' || speechStatus === 'processing') {
      if (stopListeningFnRef.current) {
        stopListeningFnRef.current();
        stopListeningFnRef.current = null;
      }
      setSpeechStatus('ready');
    }

    onSendMessage(inputText.trim(), attachedImages.length > 0 ? attachedImages : undefined);
    setInputText('');
    setAttachedImages([]);
    setSpeechError(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertPromptHelper = (template: string) => {
    setInputText((prev) => (prev ? `${prev}\n${template}` : template));
    textareaRef.current?.focus();
  };

  return (
    <div className="p-4 bg-white border-t border-slate-200">
      <div className="max-w-4xl mx-auto space-y-2.5">
        {/* Quick Question Format Helper Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none text-slate-500">
          <span className="shrink-0 font-bold uppercase tracking-wider text-slate-400 text-[10px]">Format Presets:</span>
          <button
            id="btn-helper-math"
            onClick={() => insertPromptHelper("Solve step-by-step with Given, To Find, Formula, and Steps:\n")}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-800 transition border border-slate-200 hover:border-amber-200 font-medium cursor-pointer"
          >
            <Calculator className="w-3 h-3 text-amber-600" />
            <span>Math Solver</span>
          </button>
          <button
            id="btn-helper-science"
            onClick={() => insertPromptHelper("Explain the scientific mechanism and formula for:\n")}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 transition border border-slate-200 hover:border-emerald-200 font-medium cursor-pointer"
          >
            <Atom className="w-3 h-3 text-emerald-600" />
            <span>Science Concept</span>
          </button>
          <button
            id="btn-helper-mcq"
            onClick={() => insertPromptHelper("Which option is correct and why?\n")}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-800 transition border border-slate-200 hover:border-indigo-200 font-medium cursor-pointer"
          >
            <CheckSquare className="w-3 h-3 text-indigo-600" />
            <span>MCQ Solver</span>
          </button>
          <button
            id="btn-helper-proof"
            onClick={() => insertPromptHelper("Prove the following theorem (Given → To Prove → Construction → Proof):\n")}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-purple-50 text-slate-600 hover:text-purple-800 transition border border-slate-200 hover:border-purple-200 font-medium cursor-pointer"
          >
            <FileText className="w-3 h-3 text-purple-600" />
            <span>Theorem Proof</span>
          </button>
        </div>

        {/* Speech Recognition Status Banner */}
        {speechStatus === 'listening' && (
          <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold animate-pulse">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
              </span>
              <span className="tracking-wider uppercase text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-bold">LISTENING</span>
              <span>Speak your question clearly into the microphone... (tap to finish)</span>
            </div>
            <button
              onClick={toggleListening}
              className="text-rose-700 hover:text-rose-900 text-xs font-bold underline cursor-pointer"
            >
              Done Speaking
            </button>
          </div>
        )}

        {speechStatus === 'processing' && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
            <span className="tracking-wider uppercase text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-bold">PROCESSING</span>
            <span>Converting your speech to editable text...</span>
          </div>
        )}

        {speechError && (
          <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="tracking-wider uppercase text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-bold">ERROR</span>
              <span>{speechError}</span>
            </div>
            <button
              onClick={() => {
                setSpeechError(null);
                setSpeechStatus('ready');
              }}
              className="p-1 text-rose-600 hover:text-rose-800 rounded-md cursor-pointer"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Uploaded Images Preview Strip */}
        {attachedImages.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-200">
            {attachedImages.map((img) => (
              <div key={img.id} className="relative group rounded-xl overflow-hidden border border-slate-300 bg-white w-16 h-16 sm:w-20 sm:h-20 shadow-xs">
                <img src={img.data} alt="Upload preview" className="w-full h-full object-cover" />
                <button
                  id={`btn-remove-img-${img.id}`}
                  onClick={() => handleRemoveImage(img.id)}
                  className="absolute top-1 right-1 p-0.5 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input box in Bento style */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-2xl border transition-all duration-200 bg-slate-100/70 focus-within:bg-white ${
            isDragging 
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/50' 
              : speechStatus === 'listening'
              ? 'border-rose-400 ring-2 ring-rose-400/20 bg-rose-50/20'
              : 'border-slate-200 focus-within:border-indigo-500 focus-within:shadow-md'
          }`}
        >
          {isDragging && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-indigo-500/10 rounded-2xl backdrop-blur-xs border-2 border-dashed border-indigo-500 text-indigo-700 text-sm font-semibold">
              Drop diagrams, math questions, or study images here
            </div>
          )}

          <textarea
            id="textarea-chat-input"
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              attachedImages.length > 0 
                ? "Ask a question about the attached diagram or study image..." 
                : speechStatus === 'listening'
                ? "Listening... Your words will appear here in real-time."
                : "Ask a question, follow-up, math problem, or upload a diagram..."
            }
            className="w-full bg-transparent text-slate-800 placeholder-slate-400 px-4 pt-3.5 pb-12 resize-none focus:outline-none text-sm leading-relaxed max-h-[200px]"
          />

          {/* Bottom Bar Actions Inside Box */}
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between pointer-events-auto">
            {/* Left buttons (Image upload, Mic) */}
            <div className="flex items-center gap-1">
              <input
                id="file-input-diagram"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                id="btn-upload-image"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-200/70 transition cursor-pointer"
                title="Attach question photo, diagram or study notes"
              >
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Attach Diagram</span>
              </button>

              <button
                id="btn-voice-input"
                type="button"
                onClick={toggleListening}
                className={`flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  speechStatus === 'listening'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
                    : speechStatus === 'processing'
                    ? 'bg-amber-500 text-white'
                    : speechStatus === 'error'
                    ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
                title={
                  speechStatus === 'listening'
                    ? "LISTENING: Click to stop and finish transcription"
                    : speechStatus === 'processing'
                    ? "PROCESSING speech..."
                    : "Microphone Voice Input (READY)"
                }
              >
                {speechStatus === 'listening' ? (
                  <Radio className="w-4 h-4 text-white animate-pulse" />
                ) : speechStatus === 'processing' ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Mic className="w-4 h-4 text-slate-600" />
                )}
                <span className="hidden sm:inline">
                  {speechStatus === 'listening' 
                    ? 'Listening...' 
                    : speechStatus === 'processing'
                    ? 'Processing...'
                    : 'Voice'}
                </span>
              </button>
            </div>

            {/* Right button (Send / Stop) */}
            <div className="flex items-center gap-2">
              {isLoading ? (
                <button
                  id="btn-stop-generation"
                  type="button"
                  onClick={onStopGeneration}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current text-rose-600" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  id="btn-send-message"
                  type="button"
                  onClick={handleSend}
                  disabled={!inputText.trim() && attachedImages.length === 0}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition ${
                    inputText.trim() || attachedImages.length > 0
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 active:scale-95 cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                  title="Send question"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-medium">
          <span>Vishwamedha AI adapts to your grade level and maintains multi-turn context.</span>
          <span className="hidden sm:inline">Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] text-slate-600">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] text-slate-600">Shift+Enter</kbd> for newline</span>
        </div>
      </div>
    </div>
  );
};
