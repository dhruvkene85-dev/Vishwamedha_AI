import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  GraduationCap,
  BookOpen
} from 'lucide-react';
import { VishwamedhaLogo } from './Logo';
import { AuthClient } from '../utils/authClient';
import { StudentGrade, SubjectFocus, UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  onLoginSuccess?: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  userEmail = '',
  onLoginSuccess,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(userEmail || '');
  const [password, setPassword] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<StudentGrade>('high_school');
  const [selectedSubject, setSelectedSubject] = useState<SubjectFocus>('mathematics');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          throw new Error('Please enter your full name.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        const { user } = await AuthClient.signUp({
          name: name.trim(),
          email: email.trim(),
          password,
          studentGrade: selectedGrade,
          preferredSubject: selectedSubject,
        });

        setSuccessMessage('Account created successfully!');
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess(user);
          onClose();
        }, 600);
      } else {
        const { user } = await AuthClient.login({
          email: email.trim(),
          password,
        });

        setSuccessMessage('Signed in successfully!');
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess(user);
          onClose();
        }, 600);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setIsGoogleSubmitting(true);

    try {
      const defaultGoogleEmail = email.trim() || 'kalpnaneware1@gmail.com';
      const defaultGoogleName = name.trim() || 'Kalpna Neware';

      const { user } = await AuthClient.signInWithGoogle({
        email: defaultGoogleEmail,
        displayName: defaultGoogleName,
        photoURL: 'https://lh3.googleusercontent.com/a/ACg8ocIS0e4Z3P5VqW8=s96-c',
        studentGrade: selectedGrade,
        preferredSubject: selectedSubject,
      });

      setSuccessMessage('Signed in with Google!');
      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess(user);
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sign in with Google.');
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] my-auto"
      >
        {/* Close Button */}
        <button
          id="btn-close-auth-modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Branding Section */}
        <div className="p-5 sm:p-6 pt-7 pb-4 bg-gradient-to-b from-indigo-50/80 via-slate-50 to-white text-center border-b border-slate-100 flex flex-col items-center shrink-0">
          <VishwamedhaLogo size="md" variant="stacked" showSubtitle={false} />
          <p className="text-xs text-slate-500 font-medium mt-2 max-w-xs">
            {isSignUp 
              ? "Create your secure student profile to store your academic journey & AI tutoring history"
              : "Welcome back! Sign in to access your personal AI learning sessions"}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto overflow-x-hidden flex-1 min-h-0 smooth-scroll">
          {successMessage ? (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 animate-bounce" />
              <p className="text-sm font-bold">{successMessage}</p>
              <p className="text-xs text-emerald-600">Loading your private workspace...</p>
            </div>
          ) : (
            <>
              {/* Error Banner */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Continue with Google */}
              <button
                id="btn-auth-google"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleSubmitting || isSubmitting}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-slate-50 active:scale-98 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {isGoogleSubmitting ? (
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  or with email
                </span>
              </div>

              {/* Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                {isSignUp && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Display Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="input-auth-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Kalpna Neware"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition font-medium"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-auth-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@example.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-auth-password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition font-medium"
                    />
                  </div>
                </div>

                {isSignUp && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-indigo-600" />
                        <span>Academic Level</span>
                      </label>
                      <select
                        id="select-auth-grade"
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value as StudentGrade)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition font-medium"
                      >
                        <option value="elementary">Elementary (1-5)</option>
                        <option value="middle">Middle (6-8)</option>
                        <option value="high_school">High School (9-12)</option>
                        <option value="college">College / Undergrad</option>
                        <option value="general">General Learning</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-amber-600" />
                        <span>Preferred Subject</span>
                      </label>
                      <select
                        id="select-auth-subject"
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value as SubjectFocus)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition font-medium"
                      >
                        <option value="all">All Subjects</option>
                        <option value="mathematics">Mathematics</option>
                        <option value="science">Science & Physics</option>
                        <option value="coding_computer_science">Computer Science</option>
                        <option value="english_writing">English & Writing</option>
                        <option value="social_studies">Social Studies</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  id="btn-auth-submit"
                  type="submit"
                  disabled={isSubmitting || isGoogleSubmitting}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-bold shadow-md shadow-indigo-100 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{isSignUp ? "Create Student Account" : "Sign In with Email"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Mode Switcher */}
          <div className="text-center pt-2 text-xs text-slate-500 font-medium">
            {isSignUp ? (
              <span>
                Already have an account?{' '}
                <button
                  id="btn-switch-to-signin"
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setErrorMessage('');
                  }}
                  className="font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                Don't have an account?{' '}
                <button
                  id="btn-switch-to-signup"
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setErrorMessage('');
                  }}
                  className="font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  Create free account
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Security badge footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Isolated User Data & Encrypted AI Session Vault</span>
        </div>
      </div>
    </div>
  );
};
