/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { SplashScreen } from './components/SplashScreen';
import { HomeScreen } from './components/HomeScreen';
import { ChatHistoryScreen } from './components/ChatHistoryScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { ChatMessageItem } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { WelcomeState } from './components/WelcomeState';
import { ImageModal } from './components/ImageModal';
import { FormulaSheetModal } from './components/FormulaSheetModal';
import { PracticeDrillModal } from './components/PracticeDrillModal';
import { AuthModal } from './components/AuthModal';
import { AuthClient } from './utils/authClient';
import { 
  AppScreen, 
  ChatSession, 
  ChatMessage, 
  MessageImage, 
  StudentGrade, 
  SubjectFocus, 
  UserProfile, 
  AppSettings 
} from './types';

const APP_SETTINGS_KEY = 'vishwamedha_ai_app_settings';

const createDefaultSession = (defaultGrade: StudentGrade = 'high_school', defaultSubject: SubjectFocus = 'mathematics'): ChatSession => ({
  id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  title: 'New Conversation',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: [],
  studentGrade: defaultGrade,
  subjectFocus: defaultSubject,
});

export default function App() {
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(APP_SETTINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load app settings:', e);
    }
    return {
      defaultGrade: 'high_school',
      defaultSubject: 'mathematics',
      responseStyle: 'step_by_step',
      speechRate: 1.0,
      autoScroll: true,
      modelIdentifier: 'meta/llama-3.2-11b-vision-instruct',
    };
  });

  // User Profile from AuthClient or default fallback
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const existing = AuthClient.getCurrentUser();
    if (existing) return existing;

    const defaultProfile: UserProfile = {
      userId: 'usr_kalpna_demo_001',
      displayName: 'Kalpna Neware',
      name: 'Kalpna Neware',
      email: 'kalpnaneware1@gmail.com',
      studentGrade: 'high_school',
      preferredSubject: 'mathematics',
      authProvider: 'email',
      learningGoals: 'Master competitive exams, advanced mathematics problem solving, and science concepts.',
      customInstructions: 'Provide step-by-step rigorous workings, cite formulas, and explain key principles clearly.',
    };
    return defaultProfile;
  });

  // Isolated Chat Sessions for active user
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const defaultUid = 'usr_kalpna_demo_001';
    try {
      const scopedKey = `vishwamedha_sessions_${defaultUid}`;
      const saved = localStorage.getItem(scopedKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [createDefaultSession()];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => sessions[0]?.id || '');

  // Current screen management
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home');
  const [isSplashScreen, setIsSplashScreen] = useState(true);

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeImage, setActiveImage] = useState<MessageImage | null>(null);
  const [isFormulaSheetOpen, setIsFormulaSheetOpen] = useState(false);
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Active session
  const activeSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];

  // Sync isolated user sessions on user change
  useEffect(() => {
    const currentUid = userProfile.userId || 'usr_kalpna_demo_001';
    let isMounted = true;

    AuthClient.fetchUserSessions(currentUid).then((loadedSessions) => {
      if (!isMounted) return;
      if (loadedSessions && loadedSessions.length > 0) {
        setSessions(loadedSessions);
        setCurrentSessionId(loadedSessions[0].id);
      } else {
        const fresh = createDefaultSession(userProfile.studentGrade, userProfile.preferredSubject);
        setSessions([fresh]);
        setCurrentSessionId(fresh.id);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [userProfile.userId]);

  // Persist sessions isolated to this active user
  useEffect(() => {
    const currentUid = userProfile.userId || 'usr_kalpna_demo_001';
    AuthClient.saveUserSessions(currentUid, sessions);
  }, [sessions, userProfile.userId]);

  // Save Settings
  useEffect(() => {
    try {
      localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(appSettings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }, [appSettings]);

  // Auto-scroll when messages change or stream
  useEffect(() => {
    if (currentScreen === 'chat' && appSettings.autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeSession?.messages, isLoading, currentScreen, appSettings.autoScroll]);

  // Handle New Session
  const handleNewSession = (grade?: StudentGrade, subject?: SubjectFocus) => {
    const newSess = createDefaultSession(
      grade || userProfile.studentGrade || appSettings.defaultGrade,
      subject || userProfile.preferredSubject || appSettings.defaultSubject
    );
    setSessions((prev) => [newSess, ...prev]);
    setCurrentSessionId(newSess.id);
    setCurrentScreen('chat');
  };

  const handleDeleteSession = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      if (remaining.length === 0) {
        const fresh = createDefaultSession(userProfile.studentGrade, userProfile.preferredSubject);
        setCurrentSessionId(fresh.id);
        return [fresh];
      }
      if (currentSessionId === id) {
        setCurrentSessionId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s))
    );
  };

  const handleClearAllSessions = () => {
    if (window.confirm("Are you sure you want to clear ALL conversation history? This cannot be undone.")) {
      const fresh = createDefaultSession(userProfile.studentGrade, userProfile.preferredSubject);
      setSessions([fresh]);
      setCurrentSessionId(fresh.id);
      setCurrentScreen('home');
    }
  };

  const handleClearCurrentChat = () => {
    if (!activeSession || activeSession.messages.length === 0) return;
    if (window.confirm("Are you sure you want to clear this conversation?")) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? { ...s, messages: [], updatedAt: Date.now(), title: 'New Conversation' }
            : s
        )
      );
    }
  };

  const handleExportSession = (session: ChatSession) => {
    if (!session || session.messages.length === 0) {
      alert("No messages to export in this conversation.");
      return;
    }

    let content = `# Vishwamedha AI — Study Notes & Conversation\n\n`;
    content += `**User:** ${userProfile.displayName} (${userProfile.email})\n`;
    content += `**Title:** ${session.title}\n`;
    content += `**Date:** ${new Date(session.createdAt).toLocaleString()}\n`;
    content += `**Grade Level:** ${session.studentGrade}\n`;
    content += `**Subject Focus:** ${session.subjectFocus}\n\n---\n\n`;

    session.messages.forEach((msg) => {
      const role = msg.role === 'user' ? '### Student Question' : '### Vishwamedha AI Solution';
      content += `${role} (${new Date(msg.timestamp).toLocaleTimeString()}):\n\n${msg.content}\n\n---\n\n`;
    });

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Vishwamedha_${session.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAllJson = () => {
    const dataStr = JSON.stringify(sessions, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Vishwamedha_User_${userProfile.userId || 'data'}_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSessions = (imported: ChatSession[]) => {
    setSessions(imported);
    if (imported.length > 0) {
      setCurrentSessionId(imported[0].id);
    }
  };

  const handleChangeGrade = (grade: StudentGrade) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSession?.id ? { ...s, studentGrade: grade } : s))
    );
  };

  const handleChangeSubject = (subject: SubjectFocus) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSession?.id ? { ...s, subjectFocus: subject } : s))
    );
  };

  const handleUpdateProfile = async (updated: UserProfile) => {
    try {
      const token = AuthClient.getToken();
      if (token) {
        const saved = await AuthClient.updateProfile(updated);
        setUserProfile(saved);
      } else {
        setUserProfile(updated);
      }
    } catch {
      setUserProfile(updated);
    }
  };

  const handleSignOut = async () => {
    await AuthClient.signOut();
    // Reset to unauthenticated guest profile with a fresh isolated chat session
    const guestUser: UserProfile = {
      userId: `usr_guest_${Date.now()}`,
      displayName: 'Guest Student',
      email: 'guest@vishwamedha.ai',
      studentGrade: 'high_school',
      preferredSubject: 'mathematics',
    };
    setUserProfile(guestUser);
    const freshSession = createDefaultSession();
    setSessions([freshSession]);
    setCurrentSessionId(freshSession.id);
    setCurrentScreen('home');
    setIsAuthModalOpen(true);
  };

  const handleLoginSuccess = async (user: UserProfile) => {
    setUserProfile(user);
    const userSessions = await AuthClient.fetchUserSessions(user.userId || 'usr_default');
    if (userSessions.length > 0) {
      setSessions(userSessions);
      setCurrentSessionId(userSessions[0].id);
    } else {
      const fresh = createDefaultSession(user.studentGrade, user.preferredSubject);
      setSessions([fresh]);
      setCurrentSessionId(fresh.id);
    }
    setCurrentScreen('home');
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setSessions((prev) =>
      prev.map((sess) => {
        if (sess.id !== activeSession?.id) return sess;
        return {
          ...sess,
          messages: sess.messages.map((m) =>
            m.isStreaming ? { ...m, isStreaming: false } : m
          ),
        };
      })
    );
  };

  // Main message sender with NVIDIA multimodal capability
  const handleSendMessage = async (text: string, images?: MessageImage[]) => {
    if (!text.trim() && (!images || images.length === 0)) return;
    
    if (currentScreen !== 'chat') {
      setCurrentScreen('chat');
    }

    let targetSession = activeSession;
    if (!targetSession) {
      targetSession = createDefaultSession(userProfile.studentGrade, userProfile.preferredSubject);
      setSessions((prev) => [targetSession, ...prev]);
      setCurrentSessionId(targetSession.id);
    }

    // Create user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
      images: images,
    };

    // Placeholder for assistant response
    const assistantMessageId = `msg-${Date.now() + 1}-${Math.random().toString(36).substring(2, 7)}`;
    const initialAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now() + 1,
      isStreaming: true,
    };

    // Update conversation title if first message
    const currentMessages = targetSession.messages;
    const isFirstMessage = currentMessages.length === 0;
    const newTitle = isFirstMessage 
      ? (text.slice(0, 32).trim() || (images ? 'Image Inquiry' : 'Conversation'))
      : targetSession.title;

    const updatedSessionMessages = [...currentMessages, userMessage, initialAssistantMessage];

    setSessions((prev) =>
      prev.map((s) =>
        s.id === targetSession.id
          ? {
              ...s,
              title: newTitle,
              updatedAt: Date.now(),
              messages: updatedSessionMessages,
            }
          : s
      )
    );

    setIsLoading(true);

    // Prepare full conversation history for context preservation
    const validPastMessages = currentMessages.filter(
      (m) => !m.isError && ((m.content && m.content.trim().length > 0) || (m.images && m.images.length > 0))
    );

    const historyPayload = [...validPastMessages, userMessage].map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      content: m.content || '',
      images: m.images ? m.images.map(img => ({ mimeType: img.mimeType, data: img.data })) : undefined,
    }));

    try {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const response = await fetch('/api/nvidia-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyPayload,
          studentGrade: targetSession.studentGrade || userProfile.studentGrade || appSettings.defaultGrade,
          subjectFocus: targetSession.subjectFocus || userProfile.preferredSubject || appSettings.defaultSubject,
          model: 'meta/llama-3.2-11b-vision-instruct',
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        let errDetail = `${response.status} ${response.statusText}`;
        try {
          const errJson = await response.json();
          if (errJson.error) errDetail = errJson.error;
        } catch {
          // ignore
        }
        throw new Error(errDetail);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      const accumulatedText = data.content || '';

      // Mark generation complete
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== targetSession.id) return s;
          return {
            ...s,
            messages: s.messages.map((m) =>
              m.id === assistantMessageId
                ? {
                    ...m,
                    content: accumulatedText.trim() ? accumulatedText : (m.content || 'Response completed.'),
                    isStreaming: false,
                    isError: !accumulatedText.trim() && !m.content,
                  }
                : m
            ),
          };
        })
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Generation aborted by user.');
        return;
      }
      console.error('Chat error:', err);
      let errorMessage = err.message || 'Failed to get a response from Vishwamedha AI. Please check your connection or retry.';
      
      try {
        if (errorMessage.includes('{') && errorMessage.includes('"error"')) {
          const parsed = JSON.parse(errorMessage);
          if (parsed.error?.message) {
            errorMessage = parsed.error.message;
          }
        }
      } catch {
        // ignore
      }

      if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota')) {
        const retryMatch = errorMessage.match(/retry in\s*([\d\.]+\s*s)/i) || errorMessage.match(/retryDelay['":\s]+(\d+s)/i);
        const retrySec = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : null;
        errorMessage = retrySec
          ? `Vishwamedha AI is momentarily rate-limited by the free tier quota. Please wait ~${retrySec}s and click Retry.`
          : `Vishwamedha AI is momentarily rate-limited. Please wait a few moments and click Retry.`;
      }

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== targetSession.id) return s;
          return {
            ...s,
            messages: s.messages.map((m) =>
              m.id === assistantMessageId
                ? { ...m, content: errorMessage, isStreaming: false, isError: true }
                : m
            ),
          };
        })
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleRetry = () => {
    if (!activeSession) return;
    const lastUserMessage = [...activeSession.messages]
      .reverse()
      .find((m) => m.role === 'user');

    if (lastUserMessage) {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeSession.id) return s;
          return {
            ...s,
            messages: s.messages.filter((m) => !m.isError),
          };
        })
      );
      handleSendMessage(lastUserMessage.content, lastUserMessage.images);
    }
  };

  const handleOpenChatWithPrompt = (prompt: string, grade?: StudentGrade, subject?: SubjectFocus) => {
    handleNewSession(grade, subject);
    handleSendMessage(prompt);
  };

  if (isSplashScreen) {
    return <SplashScreen onEnter={() => setIsSplashScreen(false)} autoDismissMs={1800} />;
  }

  return (
    <div className="flex h-screen h-[100dvh] w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Responsive Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onNewSession={() => handleNewSession()}
        onDeleteSession={handleDeleteSession}
        onQuickPromptSelect={(prompt) => {
          setCurrentScreen('chat');
          handleSendMessage(prompt);
        }}
        userProfile={userProfile}
        onSignOut={handleSignOut}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col h-full min-h-0 min-w-0 bg-slate-50 overflow-hidden">
        {/* Global Header */}
        <Header
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onStartNewChat={() => handleNewSession()}
          studentGrade={activeSession?.studentGrade || userProfile.studentGrade || appSettings.defaultGrade}
          onChangeGrade={handleChangeGrade}
          subjectFocus={activeSession?.subjectFocus || userProfile.preferredSubject || appSettings.defaultSubject}
          onChangeSubject={handleChangeSubject}
          onClearChat={handleClearCurrentChat}
          onExportChat={() => handleExportSession(activeSession)}
          onOpenFormulaSheet={() => setIsFormulaSheetOpen(true)}
          onOpenPracticeModal={() => setIsPracticeModalOpen(true)}
          userProfile={userProfile}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onSignOut={handleSignOut}
          messageCount={activeSession?.messages.length || 0}
        />

        {/* Screen 1: Home Screen */}
        {currentScreen === 'home' && (
          <HomeScreen
            onStartNewChat={() => handleNewSession()}
            onOpenChatWithPrompt={handleOpenChatWithPrompt}
            onSelectSession={(id) => {
              setCurrentSessionId(id);
              setCurrentScreen('chat');
            }}
            onNavigateHistory={() => setCurrentScreen('history')}
            onNavigateProfile={() => setCurrentScreen('profile')}
            onOpenFormulaSheet={() => setIsFormulaSheetOpen(true)}
            onOpenPracticeModal={() => setIsPracticeModalOpen(true)}
            sessions={sessions}
            userProfile={userProfile}
          />
        )}

        {/* Screen 2: AI Chat Screen */}
        {currentScreen === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50 overflow-hidden">
            {/* Scrollable Conversation Feed */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 w-full smooth-scroll">
              {(!activeSession || activeSession.messages.length === 0) ? (
                <WelcomeState
                  onSelectPrompt={(prompt) => handleSendMessage(prompt)}
                  studentGrade={activeSession?.studentGrade || userProfile.studentGrade || appSettings.defaultGrade}
                />
              ) : (
                <div className="divide-y divide-slate-100 pb-4">
                  {activeSession.messages.map((msg, index) => {
                    const isLast = index === activeSession.messages.length - 1;
                    const isLastAssistant = isLast && msg.role === 'assistant';

                    return (
                      <ChatMessageItem
                        key={msg.id}
                        message={msg}
                        isLastAssistantMessage={isLastAssistant}
                        onSelectPrompt={(prompt) => handleSendMessage(prompt)}
                        onImageClick={(img) => setActiveImage(img)}
                        onRetry={msg.isError ? handleRetry : undefined}
                      />
                    );
                  })}
                  <div ref={messagesEndRef} className="h-6 shrink-0" />
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              onStopGeneration={handleStopGeneration}
            />
          </div>
        )}

        {/* Screen 3: Chat History Screen */}
        {currentScreen === 'history' && (
          <ChatHistoryScreen
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelectSession={(id) => {
              setCurrentSessionId(id);
              setCurrentScreen('chat');
            }}
            onStartNewChat={() => handleNewSession()}
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameSession}
            onExportSession={handleExportSession}
            onClearAllSessions={handleClearAllSessions}
          />
        )}

        {/* Screen 4: Profile Screen */}
        {currentScreen === 'profile' && (
          <ProfileScreen
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
            onSignOut={handleSignOut}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            sessions={sessions}
          />
        )}

        {/* Screen 5: Settings Screen */}
        {currentScreen === 'settings' && (
          <SettingsScreen
            settings={appSettings}
            onUpdateSettings={setAppSettings}
            sessions={sessions}
            onImportSessions={handleImportSessions}
            onClearAllSessions={handleClearAllSessions}
            onExportAllJson={handleExportAllJson}
          />
        )}

        {/* Mobile & Tablet Bottom Navigation Bar */}
        <MobileBottomNav
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
          onNewChat={() => handleNewSession()}
        />
      </div>

      {/* Modals & Dialogs */}
      <ImageModal
        image={activeImage}
        onClose={() => setActiveImage(null)}
      />

      <FormulaSheetModal
        isOpen={isFormulaSheetOpen}
        onClose={() => setIsFormulaSheetOpen(false)}
        onAskAboutFormula={(prompt) => {
          setIsFormulaSheetOpen(false);
          handleSendMessage(prompt);
        }}
      />

      <PracticeDrillModal
        isOpen={isPracticeModalOpen}
        onClose={() => setIsPracticeModalOpen(false)}
        onStartPractice={(prompt) => {
          setIsPracticeModalOpen(false);
          handleSendMessage(prompt);
        }}
        currentGrade={activeSession?.studentGrade || userProfile.studentGrade || appSettings.defaultGrade}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        userEmail={userProfile.email}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
