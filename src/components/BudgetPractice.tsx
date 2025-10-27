import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight, Award, AlertCircle, Lightbulb } from 'lucide-react';
import { supabase, BudgetScenario, UserProgress } from '../lib/supabase';

interface BudgetPracticeProps {
  userName: string;
  onBack: () => void;
}

export default function BudgetPractice({ userName, onBack }: BudgetPracticeProps) {
  const [level, setLevel] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<BudgetScenario[]>([]);
  const [currentScenario, setCurrentScenario] = useState<BudgetScenario | null>(null);
  const [allocations, setAllocations] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{
    score: number;
    messages: string[];
    channelFeedback: Record<string, string>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [attemptNumber, setAttemptNumber] = useState(1);

  useEffect(() => {
    if (level) {
      loadScenarios();
    }
  }, [level]);

  const loadScenarios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('budget_scenarios')
      .select('*')
      .eq('level', level)
      .order('created_at');

    if (!error && data) {
      setScenarios(data as BudgetScenario[]);
      if (data.length > 0) {
        selectScenario(data[0] as BudgetScenario);
      }
    }
    setLoading(false);
  };

  const selectScenario = (scenario: BudgetScenario) => {
    setCurrentScenario(scenario);
    const initialAllocations: Record<string, string> = {};
    scenario.channels.forEach((channel) => {
      initialAllocations[channel] = '';
    });
    setAllocations(initialAllocations);
    setFeedback(null);
    setAttemptNumber(1);
  };

  const getTotalAllocation = () => {
    return Object.values(allocations).reduce((sum, val) => {
      const num = parseFloat(val) || 0;
      return sum + num;
    }, 0);
  };

  const validateAndSubmit = async () => {
    if (!currentScenario) return;

    const total = getTotalAllocation();

    if (total !== 100) {
      alert('Total allocation must equal 100%');
      return;
    }

    const userAllocations: Record<string, number> = {};
    Object.entries(allocations).forEach(([channel, value]) => {
      userAllocations[channel] = parseFloat(value) || 0;
    });

    const result = evaluateAllocation(userAllocations, currentScenario.answer_key);

    const progress: UserProgress = {
      user_name: userName,
      scenario_type: 'budget',
      scenario_id: currentScenario.id,
      score: result.score,
      user_answer: userAllocations,
      attempt_number: attemptNumber,
    };

    await supabase.from('user_progress').insert(progress);
    setFeedback(result);
  };

  const evaluateAllocation = (
    userAnswer: Record<string, number>,
    correctAnswer: Record<string, number>
  ) => {
    let totalDeviation = 0;
    const channelFeedback: Record<string, string> = {};
    const messages: string[] = [];

    Object.keys(correctAnswer).forEach((channel) => {
      const userValue = userAnswer[channel] || 0;
      const correctValue = correctAnswer[channel];
      const deviation = Math.abs(userValue - correctValue);
      totalDeviation += deviation;

      if (deviation === 0) {
        channelFeedback[channel] = 'Perfect allocation!';
      } else if (deviation <= 5) {
        channelFeedback[channel] = 'Very close! Minor adjustment could optimize this.';
      } else if (deviation <= 10) {
        channelFeedback[channel] = `Consider ${userValue > correctValue ? 'decreasing' : 'increasing'} by about ${deviation.toFixed(0)}%.`;
      } else {
        channelFeedback[channel] = `${userValue > correctValue ? 'Over' : 'Under'}-allocated by ${deviation.toFixed(0)}%. This channel ${userValue > correctValue ? 'may be too expensive' : 'offers better efficiency'}.`;
      }
    });

    const avgDeviation = totalDeviation / Object.keys(correctAnswer).length;
    const score = Math.max(0, 100 - avgDeviation * 2);

    if (score >= 90) {
      messages.push('Excellent work! Your allocation is nearly optimal.');
    } else if (score >= 75) {
      messages.push('Good job! A few tweaks could improve efficiency.');
    } else if (score >= 60) {
      messages.push('Not bad, but there is room for improvement in channel selection.');
    } else {
      messages.push('Keep practicing! Consider the relative efficiency of each channel.');
    }

    return { score: Math.round(score), messages, channelFeedback };
  };

  const tryAgain = () => {
    const resetAllocations: Record<string, string> = {};
    if (currentScenario) {
      currentScenario.channels.forEach((channel) => {
        resetAllocations[channel] = '';
      });
    }
    setAllocations(resetAllocations);
    setFeedback(null);
    setAttemptNumber(attemptNumber + 1);
  };

  const nextScenario = () => {
    const currentIndex = scenarios.findIndex((s) => s.id === currentScenario?.id);
    if (currentIndex < scenarios.length - 1) {
      selectScenario(scenarios[currentIndex + 1]);
    }
  };

  if (!level) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-100 bg-texture p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-dots opacity-30"></div>
        <div className="absolute top-20 right-20 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

        <div className="max-w-4xl mx-auto py-8 relative z-10">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-8 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </button>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-3">
              Budget Allocation Practice
            </h1>
            <p className="text-lg text-slate-700">
              Select your difficulty level to begin
            </p>
          </div>

          <div className="grid gap-4">
            {['Basic', 'Intermediate', 'Advanced'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevel(lvl)}
                className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all text-left group border border-blue-100 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">{lvl}</h3>
                    <p className="text-slate-600">
                      {lvl === 'Basic' && '3-4 channels, straightforward goals'}
                      {lvl === 'Intermediate' && '4-5 channels, specific KPI targets'}
                      {lvl === 'Advanced' && '6+ channels, complex multi-stage funnels'}
                    </p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-blue-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

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

  const total = getTotalAllocation();
  const isValid = total === 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-100 bg-texture p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20"></div>
      <div className="absolute top-40 right-20 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

      <div className="max-w-4xl mx-auto py-8 relative z-10">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-8 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </button>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 mb-6 border border-blue-100">
          <div className="flex items-center justify-between mb-6">
            <div className="inline-block px-3 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 rounded-full text-sm font-medium">
              {level}
            </div>
            <div className="text-sm text-slate-500">
              Attempt #{attemptNumber}
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            {currentScenario.title}
          </h2>
          <p className="text-slate-600 mb-6">{currentScenario.description}</p>

          <div className="grid md:grid-cols-2 gap-4 mb-6 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
            <div>
              <p className="text-sm text-blue-600 mb-1 font-medium">Total Budget</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                ${currentScenario.total_budget.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-600 mb-1 font-medium">Goal</p>
              <p className="text-lg font-semibold text-slate-900">
                {currentScenario.goal}
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Allocate Your Budget (%)
            </h3>
            {currentScenario.channels.map((channel) => (
              <div key={channel} className="flex items-center gap-4">
                <label className="flex-1 text-slate-700 font-medium">
                  {channel}
                </label>
                <div className="relative w-32">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={allocations[channel]}
                    onChange={(e) =>
                      setAllocations({ ...allocations, [channel]: e.target.value })
                    }
                    disabled={!!feedback}
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-slate-100"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                    %
                  </span>
                </div>
                <div className="w-24 text-right text-slate-600">
                  ${((parseFloat(allocations[channel]) || 0) * currentScenario.total_budget / 100).toFixed(0)}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg mb-6 border border-blue-100">
            <span className="font-semibold text-slate-700">Total Allocation</span>
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-bold ${isValid ? 'text-blue-600' : total > 100 ? 'text-red-600' : 'text-slate-900'}`}>
                {total.toFixed(1)}%
              </span>
              {isValid && (
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {!feedback ? (
            <button
              onClick={validateAndSubmit}
              disabled={!isValid}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed"
            >
              Submit Allocation
            </button>
          ) : (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${feedback.score >= 75 ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200' : 'bg-amber-50 border border-amber-200'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <Award className={`w-6 h-6 ${feedback.score >= 75 ? 'text-blue-600' : 'text-amber-600'}`} />
                  <span className="text-2xl font-bold text-slate-900">
                    Score: {feedback.score}/100
                  </span>
                </div>
                {feedback.messages.map((msg, idx) => (
                  <p key={idx} className="text-slate-700">{msg}</p>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <Lightbulb className="w-5 h-5" />
                  Channel Feedback
                </div>
                {Object.entries(feedback.channelFeedback).map(([channel, message]) => (
                  <div key={channel} className="p-3 bg-slate-50 rounded-lg">
                    <div className="font-medium text-slate-900 mb-1">{channel}</div>
                    <div className="text-sm text-slate-600 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {message}
                    </div>
                  </div>
                ))}
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
                    className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg"
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
