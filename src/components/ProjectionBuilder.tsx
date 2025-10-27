import { useState, useEffect } from 'react';
import { ArrowLeft, Award, AlertCircle, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase, ProjectionScenario, UserProgress } from '../lib/supabase';

interface ProjectionBuilderProps {
  userName: string;
  onBack: () => void;
}

export default function ProjectionBuilder({ userName, onBack }: ProjectionBuilderProps) {
  const [scenarios, setScenarios] = useState<ProjectionScenario[]>([]);
  const [currentScenario, setCurrentScenario] = useState<ProjectionScenario | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{
    score: number;
    results: Record<string, { correct: number; user: number; isCorrect: boolean; deviation: number }>;
  } | null>(null);
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [failedAttempts, setFailedAttempts] = useState(0);

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projection_scenarios')
      .select('*')
      .order('created_at');

    if (!error && data) {
      setScenarios(data as ProjectionScenario[]);
      if (data.length > 0) {
        selectScenario(data[0] as ProjectionScenario);
      }
    }
    setLoading(false);
  };

  const selectScenario = (scenario: ProjectionScenario) => {
    setCurrentScenario(scenario);
    const initialAnswers: Record<string, string> = {};
    Object.keys(scenario.answers).forEach((key) => {
      initialAnswers[key] = '';
    });
    setUserAnswers(initialAnswers);
    setFeedback(null);
    setShowHints({});
    setAttemptNumber(1);
    setFailedAttempts(0);
  };

  const calculateDeviation = (userValue: number, correctValue: number): number => {
    if (correctValue === 0) return userValue === 0 ? 0 : 100;
    return Math.abs((userValue - correctValue) / correctValue) * 100;
  };

  const evaluateAnswers = async () => {
    if (!currentScenario) return;

    const results: Record<string, { correct: number; user: number; isCorrect: boolean; deviation: number }> = {};
    let totalScore = 0;

    Object.entries(currentScenario.answers).forEach(([key, correctValue]) => {
      const userValue = parseFloat(userAnswers[key]) || 0;
      const deviation = calculateDeviation(userValue, correctValue);
      const isCorrect = deviation <= 10;

      results[key] = {
        correct: correctValue,
        user: userValue,
        isCorrect,
        deviation,
      };

      if (deviation === 0) {
        totalScore += 100;
      } else if (deviation <= 5) {
        totalScore += 95;
      } else if (deviation <= 10) {
        totalScore += 85;
      } else if (deviation <= 20) {
        totalScore += 70;
      } else if (deviation <= 30) {
        totalScore += 50;
      } else {
        totalScore += 25;
      }
    });

    const avgScore = Math.round(totalScore / Object.keys(currentScenario.answers).length);

    const numericAnswers: Record<string, number> = {};
    Object.entries(userAnswers).forEach(([key, value]) => {
      numericAnswers[key] = parseFloat(value) || 0;
    });

    const progress: UserProgress = {
      user_name: userName,
      scenario_type: 'projection',
      scenario_id: currentScenario.id,
      score: avgScore,
      user_answer: numericAnswers,
      attempt_number: attemptNumber,
    };

    await supabase.from('user_progress').insert(progress);

    setFeedback({ score: avgScore, results });

    if (avgScore < 70) {
      setFailedAttempts(failedAttempts + 1);
    }
  };

  const toggleHint = (key: string) => {
    setShowHints({ ...showHints, [key]: !showHints[key] });
  };

  const tryAgain = () => {
    const resetAnswers: Record<string, string> = {};
    if (currentScenario) {
      Object.keys(currentScenario.answers).forEach((key) => {
        resetAnswers[key] = '';
      });
    }
    setUserAnswers(resetAnswers);
    setFeedback(null);
    setAttemptNumber(attemptNumber + 1);
  };

  const nextScenario = () => {
    const currentIndex = scenarios.findIndex((s) => s.id === currentScenario?.id);
    if (currentIndex < scenarios.length - 1) {
      selectScenario(scenarios[currentIndex + 1]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-100 bg-texture flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-700 font-medium">Loading scenarios...</p>
        </div>
      </div>
    );
  }

  if (!currentScenario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-100 bg-texture flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-700">No scenarios available</p>
        </div>
      </div>
    );
  }

  const allFieldsFilled = Object.values(userAnswers).every((val) => val.trim() !== '');
  const canShowHints = failedAttempts >= 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-100 bg-texture p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20"></div>
      <div className="absolute top-40 left-20 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="max-w-4xl mx-auto py-8 relative z-10">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-8 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </button>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 mb-6 border border-cyan-100">
          <div className="flex items-center justify-between mb-6">
            <div className="inline-block px-3 py-1 bg-gradient-to-r from-cyan-100 to-sky-100 text-cyan-700 rounded-full text-sm font-medium">
              Projection Builder
            </div>
            <div className="text-sm text-slate-500">
              Attempt #{attemptNumber}
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            {currentScenario.title}
          </h2>
          <p className="text-slate-600 mb-6">{currentScenario.description}</p>

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Campaign Metrics
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(currentScenario.metrics).map(([key, value]) => (
                <div key={key} className="p-4 bg-gradient-to-br from-cyan-50 to-sky-50 rounded-lg border border-cyan-100">
                  <p className="text-sm text-cyan-600 mb-1 capitalize font-medium">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-sky-600 bg-clip-text text-transparent">
                    {typeof value === 'number' && value < 1 && value > 0
                      ? `${(value * 100).toFixed(1)}%`
                      : typeof value === 'number'
                      ? value.toLocaleString()
                      : value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Calculate the Following Metrics
            </h3>
            {Object.keys(currentScenario.answers).map((key) => (
              <div key={key} className="border border-cyan-200 rounded-lg p-4 bg-white/50">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-700 font-medium uppercase text-sm tracking-wide">
                    {key}
                  </label>
                  {canShowHints && currentScenario.hints[key] && (
                    <button
                      onClick={() => toggleHint(key)}
                      className="flex items-center gap-1 text-cyan-600 hover:text-cyan-700 text-sm font-medium"
                    >
                      <HelpCircle className="w-4 h-4" />
                      Hint
                      {showHints[key] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                {showHints[key] && currentScenario.hints[key] && (
                  <div className="mb-3 p-3 bg-gradient-to-r from-cyan-50 to-sky-50 border border-cyan-200 rounded text-sm text-slate-700">
                    {currentScenario.hints[key]}
                  </div>
                )}
                <input
                  type="number"
                  step="0.01"
                  value={userAnswers[key]}
                  onChange={(e) =>
                    setUserAnswers({ ...userAnswers, [key]: e.target.value })
                  }
                  disabled={!!feedback}
                  placeholder="Enter your answer"
                  className="w-full px-4 py-2 border border-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none disabled:bg-slate-100"
                />
                {feedback && (
                  <div className="mt-3">
                    <div className={`flex items-center gap-2 text-sm ${feedback.results[key].isCorrect ? 'text-cyan-600' : 'text-red-600'}`}>
                      {feedback.results[key].isCorrect ? (
                        <>
                          <div className="w-5 h-5 bg-cyan-100 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="font-medium">
                            Correct! (Deviation: {feedback.results[key].deviation.toFixed(1)}%)
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5" />
                          <span className="font-medium">
                            Your answer: {feedback.results[key].user.toFixed(2)} | Correct: {feedback.results[key].correct.toFixed(2)} | Deviation: {feedback.results[key].deviation.toFixed(1)}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {canShowHints && !feedback && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2 text-amber-800">
                <HelpCircle className="w-5 h-5 mt-0.5" />
                <p className="text-sm">
                  Having trouble? Hints are now available for each metric. Click the "Hint" button next to any field.
                </p>
              </div>
            </div>
          )}

          {!feedback ? (
            <button
              onClick={evaluateAnswers}
              disabled={!allFieldsFilled}
              className="w-full bg-gradient-to-r from-cyan-500 to-sky-500 text-white py-3 rounded-lg font-medium hover:from-cyan-600 hover:to-sky-600 transition-all shadow-lg hover:shadow-xl disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed"
            >
              Submit Answers
            </button>
          ) : (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${feedback.score >= 75 ? 'bg-gradient-to-r from-cyan-50 to-sky-50 border border-cyan-200' : 'bg-amber-50 border border-amber-200'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <Award className={`w-6 h-6 ${feedback.score >= 75 ? 'text-cyan-600' : 'text-amber-600'}`} />
                  <span className="text-2xl font-bold text-slate-900">
                    Score: {feedback.score}/100
                  </span>
                </div>
                <p className="text-slate-700">
                  {feedback.score >= 90 && 'Excellent work! Your calculations are spot on.'}
                  {feedback.score >= 75 && feedback.score < 90 && 'Great job! Minor adjustments in your calculations.'}
                  {feedback.score >= 60 && feedback.score < 75 && 'Good effort. Review the formulas and try again.'}
                  {feedback.score < 60 && 'Keep practicing! Focus on understanding each metric formula.'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={tryAgain}
                  className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                >
                  Try Again
                </button>
                {scenarios.findIndex((s) => s.id === currentScenario.id) < scenarios.length - 1 && (
                  <button
                    onClick={nextScenario}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-sky-500 text-white py-3 rounded-lg font-medium hover:from-cyan-600 hover:to-sky-600 transition-all shadow-lg"
                  >
                    Next Scenario
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
