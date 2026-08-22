// Web Speech API utility for Text-to-Speech (Voice Readout) and Speech-to-Text (Microphone Voice Input)

export type SpeechRecognitionStatus = 'ready' | 'listening' | 'processing' | 'error';

export interface SpeechRecognitionHandlers {
  onStatusChange?: (status: SpeechRecognitionStatus) => void;
  onTranscriptChange?: (text: string, isFinal: boolean) => void;
  onError?: (errorMessage: string, errorCode?: string) => void;
  onEnd?: () => void;
}

export class SpeechController {
  private static synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static activeRecognition: any = null;

  // ==========================================
  // 1. Text-to-Speech (Voice Readout)
  // ==========================================
  static isSpeechSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  static speak(text: string, onEnd?: () => void, rate: number = 1.0): void {
    if (!this.synth) {
      if (onEnd) onEnd();
      return;
    }
    this.stopSpeaking();

    // Clean text of markdown symbols and LaTeX for natural voice reading
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code snippet omitted for speech.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\$\$[\s\S]*?\$\$/g, 'Mathematical expression.')
      .replace(/\$([^$]+)\$/g, '$1')
      .replace(/[#*_~>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\n+/g, '. ')
      .trim();

    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = rate || 1.0;
    utterance.pitch = 1.0;

    // Pick a natural clear voice if available
    try {
      const voices = this.synth.getVoices();
      const naturalVoice = voices.find(
        v => (v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Jenny')))
      ) || voices.find(v => v.lang.startsWith('en'));

      if (naturalVoice) {
        utterance.voice = naturalVoice;
      }
    } catch {
      // ignore
    }

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }

    this.synth.speak(utterance);
  }

  static stopSpeaking(): void {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {
        // ignore
      }
    }
  }

  static isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }

  // ==========================================
  // 2. Speech-to-Text (Microphone Input)
  // ==========================================
  static isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  static startListening(
    initialBaseText: string,
    handlers: SpeechRecognitionHandlers
  ): () => void {
    if (!this.isSpeechRecognitionSupported()) {
      handlers.onError?.(
        'Speech recognition is not supported in this browser. Please type your question or use Chrome, Edge, or Safari.',
        'not_supported'
      );
      handlers.onStatusChange?.('error');
      return () => {};
    }

    this.stopListening();

    try {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRec();
      this.activeRecognition = recognition;

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      let accumulatedFinal = '';
      let hasAbortedManually = false;

      recognition.onstart = () => {
        handlers.onStatusChange?.('listening');
      };

      recognition.onaudiostart = () => {
        handlers.onStatusChange?.('listening');
      };

      recognition.onspeechstart = () => {
        handlers.onStatusChange?.('listening');
      };

      recognition.onspeechend = () => {
        handlers.onStatusChange?.('processing');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let currentFinal = '';

        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            currentFinal += res[0].transcript;
          } else {
            interim += res[0].transcript;
          }
        }

        if (currentFinal) {
          accumulatedFinal = currentFinal;
        }

        const activeTranscript = (accumulatedFinal + (interim ? ' ' + interim : '')).trim();
        if (activeTranscript) {
          const combined = initialBaseText 
            ? `${initialBaseText.trim()} ${activeTranscript}` 
            : activeTranscript;
          handlers.onTranscriptChange?.(combined, false);
        }
      };

      recognition.onerror = (event: any) => {
        const err = event.error;
        console.warn('Speech recognition event error:', err);

        if (hasAbortedManually || err === 'aborted') {
          handlers.onStatusChange?.('ready');
          return;
        }

        let userFriendlyMsg = 'Speech recognition encountered an issue. Please try again.';
        if (err === 'not-allowed' || err === 'service-not-allowed') {
          userFriendlyMsg = 'Microphone access was denied. Please allow microphone permission in your browser address bar.';
        } else if (err === 'no-speech') {
          userFriendlyMsg = 'No speech was detected. Please tap the microphone and speak clearly.';
        } else if (err === 'audio-capture') {
          userFriendlyMsg = 'No microphone was found or the microphone is currently busy in another app.';
        } else if (err === 'network') {
          userFriendlyMsg = 'Network error during speech recognition. Please check your internet connection.';
        }

        handlers.onError?.(userFriendlyMsg, err);
        handlers.onStatusChange?.('error');
      };

      recognition.onend = () => {
        this.activeRecognition = null;
        handlers.onStatusChange?.('ready');
        handlers.onEnd?.();
      };

      recognition.start();

      return () => {
        hasAbortedManually = true;
        try {
          recognition.stop();
        } catch {
          try {
            recognition.abort();
          } catch {
            // ignore
          }
        }
        this.activeRecognition = null;
        handlers.onStatusChange?.('ready');
      };
    } catch (e: any) {
      console.error('Failed to initialize speech recognition:', e);
      handlers.onError?.(
        e.message || 'Could not access the microphone. Please check permissions.',
        'init_failed'
      );
      handlers.onStatusChange?.('error');
      return () => {};
    }
  }

  static stopListening(): void {
    if (this.activeRecognition) {
      try {
        this.activeRecognition.stop();
      } catch {
        try {
          this.activeRecognition.abort();
        } catch {
          // ignore
        }
      }
      this.activeRecognition = null;
    }
  }
}
