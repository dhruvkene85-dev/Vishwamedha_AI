import React, { useState } from 'react';
import { X, HelpCircle, ArrowRight } from 'lucide-react';
import { StudentGrade } from '../types';

interface PracticeDrillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartPractice: (prompt: string) => void;
  currentGrade: StudentGrade;
}

export const PracticeDrillModal: React.FC<PracticeDrillModalProps> = ({
  isOpen,
  onClose,
  onStartPractice,
}) => {
  const [subject, setSubject] = useState('Mathematics');
  const [topic, setTopic] = useState('Quadratic Equations and Factoring');
  const [questionType, setQuestionType] = useState<'mcq' | 'step_by_step' | 'proof' | 'conceptual'>('mcq');
  const [numQuestions, setNumQuestions] = useState('3');

  if (!isOpen) return null;

  const popularTopics = [
    { subject: 'Mathematics', topic: 'Quadratic Equations and Factoring' },
    { subject: 'Mathematics', topic: 'Trigonometric Identities & Sine/Cosine' },
    { subject: 'Mathematics', topic: 'Calculus Derivatives and Chain Rule' },
    { subject: 'Physics', topic: 'Newton\'s Laws of Motion & Friction' },
    { subject: 'Physics', topic: 'Kinematics Equations & Projectile Motion' },
    { subject: 'Chemistry', topic: 'Stoichiometry & Chemical Equations' },
    { subject: 'Biology', topic: 'Cellular Respiration & Photosynthesis' },
    { subject: 'Computer Science', topic: 'Recursion and Time Complexity O(n)' },
  ];

  const handleGenerate = () => {
    let prompt = '';
    if (questionType === 'mcq') {
      prompt = `Please generate ${numQuestions} challenging Multiple-Choice Questions (MCQs) for the subject ${subject} on the topic "${topic}".\nFor each question, list 4 clear options (A, B, C, D). Provide the answers and detailed explanations clearly following the format:\n**Correct Answer: [Option]**\nfollowed by the step-by-step reasoning.`;
    } else if (questionType === 'step_by_step') {
      prompt = `Please provide ${numQuestions} structured numerical problem(s) on ${subject}: "${topic}".\nSolve each problem following the strict format:\n1. **Given:**\n2. **To Find:**\n3. **Formula / Theorem:**\n4. **Calculation:**\n5. **Final Answer:**`;
    } else if (questionType === 'proof') {
      prompt = `Please present a key theorem or proof problem in ${subject} on the topic "${topic}".\nBreak down the solution completely with:\n- **Given:**\n- **To Prove:**\n- **Construction:**\n- **Proof:**`;
    } else {
      prompt = `Please ask me 3 deep conceptual study questions on ${subject}: "${topic}" to test my understanding, followed by clear explanations and examples.`;
    }

    onStartPractice(prompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl max-h-[90dvh] bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800">Practice Test & Drill Generator</h2>
              <p className="text-xs text-slate-500 font-medium">Generate targeted practice questions with step-by-step solutions</p>
            </div>
          </div>
          <button
            id="btn-close-practice-modal"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto overflow-x-hidden min-h-0 flex-1 smooth-scroll">
          {/* Subject selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Subject
            </label>
            <select
              id="select-practice-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition font-medium cursor-pointer"
            >
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="Computer Science">Computer Science</option>
              <option value="English Literature & Grammar">English Literature & Grammar</option>
              <option value="Social Studies & History">Social Studies & History</option>
            </select>
          </div>

          {/* Topic text input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Topic or Chapter Name
            </label>
            <input
              id="input-practice-topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Quadratic Formula, Photosynthesis, Thermodynamics..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition font-medium"
            />
          </div>

          {/* Quick topic presets */}
          <div>
            <span className="block text-[11px] text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Popular Exam Topics:</span>
            <div className="flex flex-wrap gap-1.5">
              {popularTopics.map((pt, idx) => (
                <button
                  key={idx}
                  id={`btn-preset-topic-${idx}`}
                  type="button"
                  onClick={() => {
                    setSubject(pt.subject);
                    setTopic(pt.topic);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-800 border border-slate-200 transition font-medium cursor-pointer"
                >
                  {pt.topic}
                </button>
              ))}
            </div>
          </div>

          {/* Question Format */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Question Format
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setQuestionType('mcq')}
                className={`p-3 rounded-2xl border text-left text-xs transition cursor-pointer ${
                  questionType === 'mcq'
                    ? 'bg-indigo-50/80 border-indigo-400 text-indigo-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold">Multiple Choice (MCQs)</div>
                <div className="text-[10px] text-slate-500 mt-0.5">4 options with correct answer & explanation</div>
              </button>

              <button
                type="button"
                onClick={() => setQuestionType('step_by_step')}
                className={`p-3 rounded-2xl border text-left text-xs transition cursor-pointer ${
                  questionType === 'step_by_step'
                    ? 'bg-indigo-50/80 border-indigo-400 text-indigo-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold">Step-by-Step Numerical</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Given, Formula, Calculation, Final Answer</div>
              </button>

              <button
                type="button"
                onClick={() => setQuestionType('proof')}
                className={`p-3 rounded-2xl border text-left text-xs transition cursor-pointer ${
                  questionType === 'proof'
                    ? 'bg-indigo-50/80 border-indigo-400 text-indigo-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold">Formal Theorem Proof</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Given → To Prove → Construction → Proof</div>
              </button>

              <button
                type="button"
                onClick={() => setQuestionType('conceptual')}
                className={`p-3 rounded-2xl border text-left text-xs transition cursor-pointer ${
                  questionType === 'conceptual'
                    ? 'bg-indigo-50/80 border-indigo-400 text-indigo-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold">Conceptual Questions</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Deep understanding & intuitive analogies</div>
              </button>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="btn-start-practice-submit"
            type="button"
            onClick={handleGenerate}
            disabled={!topic.trim()}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold shadow-md shadow-indigo-100 transition active:scale-95 cursor-pointer"
          >
            <span>Generate Practice Drill</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
