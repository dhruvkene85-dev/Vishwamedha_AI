import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  GraduationCap, 
  BookOpen, 
  Target, 
  Sparkles, 
  CheckCircle2, 
  Save, 
  Edit3, 
  Award, 
  ShieldCheck,
  LogOut,
  Copy,
  Check,
  KeyRound,
  UserCheck
} from 'lucide-react';
import { StudentGrade, SubjectFocus, UserProfile, ChatSession } from '../types';
import { VishwamedhaSymbol } from './Logo';

interface ProfileScreenProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onSignOut: () => void;
  onOpenAuthModal?: () => void;
  sessions: ChatSession[];
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  userProfile,
  onUpdateProfile,
  onSignOut,
  onOpenAuthModal,
  sessions,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(userProfile.displayName || 'Kalpna Neware');
  const [email, setEmail] = useState(userProfile.email || 'kalpnaneware1@gmail.com');
  const [photoURL, setPhotoURL] = useState(userProfile.photoURL || '');
  const [studentGrade, setStudentGrade] = useState<StudentGrade>(userProfile.studentGrade || 'high_school');
  const [preferredSubject, setPreferredSubject] = useState<SubjectFocus>(userProfile.preferredSubject || 'mathematics');
  const [learningGoals, setLearningGoals] = useState(
    userProfile.learningGoals || 'Master competitive exams, advanced mathematics problem solving, and science concepts.'
  );
  const [customInstructions, setCustomInstructions] = useState(
    userProfile.customInstructions || 'Provide step-by-step rigorous workings, cite formulas, and explain key principles clearly.'
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState(false);

  const totalMessages = sessions.reduce((acc, s) => acc + s.messages.length, 0);
  const totalImages = sessions.reduce(
    (acc, s) => acc + s.messages.filter((m) => m.images && m.images.length > 0).length,
    0
  );

  const handleCopyUserId = () => {
    const uid = userProfile.userId || 'usr_demo_kalpna_001';
    navigator.clipboard.writeText(uid);
    setCopiedUserId(true);
    setTimeout(() => setCopiedUserId(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...userProfile,
      displayName: displayName.trim(),
      email: email.trim(),
      photoURL: photoURL.trim(),
      studentGrade,
      preferredSubject,
      learningGoals: learningGoals.trim(),
      customInstructions: customInstructions.trim(),
    });
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 w-full bg-slate-50 smooth-scroll">
      <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 pb-28 lg:pb-12 space-y-6">
        {/* Top Banner with Profile Header */}
      <div className="relative overflow-hidden rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar with Vishwamedha aura */}
          <div className="relative group shrink-0">
            {userProfile.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt={userProfile.displayName}
                referrerPolicy="no-referrer"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-2 border-indigo-100 shadow-md"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-amber-500 flex items-center justify-center text-white text-3xl font-extrabold shadow-md">
                {(userProfile.displayName || 'S').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <VishwamedhaSymbol size={18} />
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {userProfile.displayName || 'Student Scholar'}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    <UserCheck className="w-3 h-3" />
                    <span>Active User</span>
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-500 flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{userProfile.email || 'student@vishwamedha.ai'}</span>
                </p>

                {/* User ID Badge */}
                <div className="mt-1.5 flex items-center justify-center sm:justify-start gap-1.5">
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <KeyRound className="w-3 h-3 text-slate-400" />
                    <span>ID: {userProfile.userId || 'usr_demo_kalpna_001'}</span>
                  </span>
                  <button
                    id="btn-copy-user-id"
                    onClick={handleCopyUserId}
                    title="Copy User ID"
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded transition cursor-pointer"
                  >
                    {copiedUserId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center sm:justify-end gap-2 self-center sm:self-auto flex-wrap">
                <button
                  id="btn-toggle-edit-profile"
                  onClick={() => setIsEditing(!isEditing)}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-100 transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
                </button>

                <button
                  id="btn-profile-signout"
                  onClick={onSignOut}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-bold border border-slate-200 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100/80 text-indigo-800">
                <GraduationCap className="w-3.5 h-3.5" />
                <span className="capitalize">{userProfile.studentGrade} Level</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100/80 text-amber-900">
                <BookOpen className="w-3.5 h-3.5" />
                <span className="capitalize">{(userProfile.preferredSubject || 'mathematics').replace('_', ' ')}</span>
              </span>
              {userProfile.authProvider && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Auth: {userProfile.authProvider === 'google' ? 'Google SSO' : 'Email/Password'}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {savedSuccess && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Profile settings updated and synced successfully!</span>
          </div>
        )}
      </div>

      {/* Profile Form (Edit Mode vs View Mode) */}
      {isEditing ? (
        <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
            Edit Profile Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Academic Grade Level
              </label>
              <select
                value={studentGrade}
                onChange={(e) => setStudentGrade(e.target.value as StudentGrade)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="general">Standard / General</option>
                <option value="elementary">Elementary School (1-5)</option>
                <option value="middle">Middle School (6-8)</option>
                <option value="high_school">High School (9-12)</option>
                <option value="college">College / University</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Primary Subject Focus
              </label>
              <select
                value={preferredSubject}
                onChange={(e) => setPreferredSubject(e.target.value as SubjectFocus)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="all">All Subjects</option>
                <option value="mathematics">Mathematics & Logic</option>
                <option value="science">Physics, Chemistry & Science</option>
                <option value="english_writing">Writing & English</option>
                <option value="coding_computer_science">Computer Science & Coding</option>
                <option value="social_studies">Social Studies & History</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Profile Picture URL (Optional)
            </label>
            <input
              type="url"
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Learning Goals
            </label>
            <input
              type="text"
              value={learningGoals}
              onChange={(e) => setLearningGoals(e.target.value)}
              placeholder="e.g. Prepare for exams, understand algebra proofs, master physics..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              AI Custom Instructions
            </label>
            <textarea
              rows={3}
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Provide instructions on how you want Vishwamedha AI to format answers for you..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 font-medium leading-relaxed"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Learning Focus Card */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-indigo-600">
              <Target className="w-4 h-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Learning Goals
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              {userProfile.learningGoals || 'Master competitive exams, advanced problem solving, and science concepts.'}
            </p>
          </div>

          {/* Custom System Guidance Card */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-amber-600">
              <Sparkles className="w-4 h-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                AI Guidance & Preferences
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              {userProfile.customInstructions || 'Default step-by-step academic response style enabled.'}
            </p>
          </div>
        </div>
      )}

      {/* Activity Statistics Grid */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <Award className="w-4 h-4 text-indigo-600" />
          <span>Personal Study & Session Statistics</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-center">
            <div className="text-2xl font-extrabold text-indigo-900">{sessions.length}</div>
            <div className="text-[11px] font-semibold text-indigo-700 mt-0.5">Isolated Sessions</div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 text-center">
            <div className="text-2xl font-extrabold text-amber-900">{totalMessages}</div>
            <div className="text-[11px] font-semibold text-amber-700 mt-0.5">Questions & Answers</div>
          </div>

          <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 text-center">
            <div className="text-2xl font-extrabold text-sky-900">{totalImages}</div>
            <div className="text-[11px] font-semibold text-sky-700 mt-0.5">Diagrams Analyzed</div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-center">
            <div className="text-2xl font-extrabold text-emerald-900">Protected</div>
            <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">Account Isolation</div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
