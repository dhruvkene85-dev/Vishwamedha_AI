import React, { useState } from 'react';
import { X, Search, Sigma, Atom, Flame, Sparkles } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface FormulaSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAskAboutFormula: (formulaPrompt: string) => void;
}

interface FormulaCategory {
  name: string;
  icon: React.ReactNode;
  formulas: {
    title: string;
    latex: string;
    description: string;
  }[];
}

const FORMULA_DATABASE: FormulaCategory[] = [
  {
    name: "Algebra & Polynomials",
    icon: <Sigma className="w-4 h-4 text-amber-600" />,
    formulas: [
      {
        title: "Quadratic Formula",
        latex: "$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$",
        description: "Roots of $ax^2 + bx + c = 0$"
      },
      {
        title: "Logarithm Change of Base",
        latex: "$$\\log_b(a) = \\frac{\\log_k(a)}{\\log_k(b)}$$",
        description: "Convert between logarithmic bases"
      },
      {
        title: "Binomial Theorem",
        latex: "$$(a+b)^n = \\sum_{k=0}^{n} \\binom{n}{k} a^{n-k} b^k$$",
        description: "Expansion of binomial powers"
      },
      {
        title: "Arithmetic Series Sum",
        latex: "$$S_n = \\frac{n}{2}(2a_1 + (n-1)d)$$",
        description: "Sum of first $n$ arithmetic terms"
      }
    ]
  },
  {
    name: "Geometry & Trigonometry",
    icon: <Sigma className="w-4 h-4 text-emerald-600" />,
    formulas: [
      {
        title: "Pythagorean Theorem",
        latex: "$$a^2 + b^2 = c^2$$",
        description: "Right-angled triangle side lengths"
      },
      {
        title: "Trigonometric Identity",
        latex: "$$\\sin^2(\\theta) + \\cos^2(\\theta) = 1$$",
        description: "Fundamental Pythagorean trig identity"
      },
      {
        title: "Law of Cosines",
        latex: "$$c^2 = a^2 + b^2 - 2ab\\cos(C)$$",
        description: "Finding unknown side or angle in any triangle"
      },
      {
        title: "Law of Sines",
        latex: "$$\\frac{a}{\\sin(A)} = \\frac{b}{\\sin(B)} = \\frac{c}{\\sin(C)}$$",
        description: "Ratio of side lengths to opposite angle sines"
      }
    ]
  },
  {
    name: "Calculus & Limits",
    icon: <Sigma className="w-4 h-4 text-sky-600" />,
    formulas: [
      {
        title: "Product Rule (Derivatives)",
        latex: "$$\\frac{d}{dx}[u \\cdot v] = u'v + uv'$$",
        description: "Derivative of product of functions"
      },
      {
        title: "Quotient Rule",
        latex: "$$\\frac{d}{dx}\\left[\\frac{u}{v}\\right] = \\frac{u'v - uv'}{v^2}$$",
        description: "Derivative of fraction of functions"
      },
      {
        title: "Integration by Parts",
        latex: "$$\\int u \\, dv = uv - \\int v \\, du$$",
        description: "Calculus integration technique"
      }
    ]
  },
  {
    name: "Physics — Mechanics & Kinematics",
    icon: <Atom className="w-4 h-4 text-indigo-600" />,
    formulas: [
      {
        title: "Kinematic Equation 1",
        latex: "$$v = u + at$$",
        description: "Velocity under constant acceleration"
      },
      {
        title: "Kinematic Equation 2",
        latex: "$$s = ut + \\frac{1}{2}at^2$$",
        description: "Displacement under constant acceleration"
      },
      {
        title: "Newton's Second Law",
        latex: "$$F = ma = \\frac{dp}{dt}$$",
        description: "Force equals mass times acceleration"
      },
      {
        title: "Kinetic & Potential Energy",
        latex: "$$E_k = \\frac{1}{2}mv^2, \\quad E_p = mgh$$",
        description: "Mechanical energy formulas"
      }
    ]
  },
  {
    name: "Physics — Electricity & Magnetism",
    icon: <Atom className="w-4 h-4 text-purple-600" />,
    formulas: [
      {
        title: "Ohm's Law",
        latex: "$$V = I \\cdot R, \\quad P = V \\cdot I = I^2 R$$",
        description: "Voltage, current, resistance and power"
      },
      {
        title: "Coulomb's Law",
        latex: "$$F = k_e \\frac{|q_1 q_2|}{r^2}$$",
        description: "Electrostatic force between charges"
      }
    ]
  },
  {
    name: "Chemistry & Thermodynamics",
    icon: <Flame className="w-4 h-4 text-rose-600" />,
    formulas: [
      {
        title: "Ideal Gas Law",
        latex: "$$PV = nRT$$",
        description: "Pressure, Volume, moles, Gas constant, Temp"
      },
      {
        title: "Gibbs Free Energy",
        latex: "$$\\Delta G = \\Delta H - T\\Delta S$$",
        description: "Spontaneity of chemical reactions"
      }
    ]
  }
];

export const FormulaSheetModal: React.FC<FormulaSheetModalProps> = ({
  isOpen,
  onClose,
  onAskAboutFormula,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const filteredCategories = FORMULA_DATABASE.filter(cat => {
    if (selectedCategory !== 'all' && cat.name !== selectedCategory) return false;
    return true;
  }).map(cat => ({
    ...cat,
    formulas: cat.formulas.filter(f => 
      f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.formulas.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[90dvh] sm:max-h-[85vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col my-auto overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
              <Sigma className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800">STEM Formula Reference</h2>
              <p className="text-xs text-slate-500 font-medium">Click any formula to have Vishwamedha AI explain it or generate a practice problem</p>
            </div>
          </div>
          <button
            id="btn-close-formula-modal"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters and search */}
        <div className="p-3 sm:p-4 px-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="input-formula-search"
              type="text"
              placeholder="Search formulas (e.g. Quadratic, Newton, Ideal Gas, Cosines)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition font-medium"
            />
          </div>

          <select
            id="select-formula-category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition font-medium cursor-pointer"
          >
            <option value="all">All Topics</option>
            {FORMULA_DATABASE.map(cat => (
              <option key={cat.name} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-4 sm:p-6 space-y-6 bg-white smooth-scroll">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm font-medium">
              No formulas match your search term.
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div key={category.name} className="space-y-3">
                <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                  {category.icon}
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">{category.name}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.formulas.map((formula, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 hover:border-indigo-200 hover:bg-indigo-50/20 transition flex flex-col justify-between shadow-xs"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-800 mb-1">{formula.title}</div>
                        <div className="bg-white rounded-xl p-3 my-2 border border-slate-200/80 flex items-center justify-center shadow-xs">
                          <MarkdownRenderer content={formula.latex} />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 font-medium">{formula.description}</p>
                      </div>

                      <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-200/60">
                        <button
                          id={`btn-explain-formula-${idx}`}
                          onClick={() => {
                            onAskAboutFormula(`Please explain the ${formula.title} formula in detail, including variables, units, and a worked-out step-by-step example.`);
                            onClose();
                          }}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold border border-indigo-100 transition cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Explain</span>
                        </button>
                        <button
                          id={`btn-practice-formula-${idx}`}
                          onClick={() => {
                            onAskAboutFormula(`Generate a step-by-step practice problem and solution using the ${formula.title} (${formula.latex.replace(/\$\$/g, '')}).`);
                            onClose();
                          }}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200 transition cursor-pointer shadow-xs"
                        >
                          <span>Solve Drill</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
