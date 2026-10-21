'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Award,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Download,
  ExternalLink,
  Check
} from 'lucide-react';
import { getCurrentAuthToken } from '@/lib/firebaseClient';

interface QuizEngineProps {
  courseId: string;
  quizId: string;
  onQuizPassed: (quizResult?: any) => void;
  onDownloadCertificate?: () => void;
}

interface QuestionReview {
  questionIndex: number;
  questionText: string;
  options: string[];
  selectedOptionIndex: number | null;
  correctOptionIndex: number;
  isCorrect: boolean;
  explanation: string;
}

interface QuizResult {
  scorePercent: number;
  passed: boolean;
  passingScore: number;
  correctCount: number;
  totalQuestions: number;
  perQuestionReview: QuestionReview[];
  updatedProgress?: any;
}

interface QuestionItem {
  questionIndex: number;
  questionText: string;
  options: string[];
}

export default function QuizEngine({
  courseId,
  quizId,
  onQuizPassed,
  onDownloadCertificate
}: QuizEngineProps) {
  // Empty initial selection (fixes issue 1: options are not preselected)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [passingScore, setPassingScore] = useState<number>(70);
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // Fetch real questions for the given quizId
  useEffect(() => {
    let isMounted = true;
    const fetchQuestions = async () => {
      try {
        setLoadingQuestions(true);
        setErrorMsg(null);
        setResult(null);
        setSelectedAnswers({});

        const token = await getCurrentAuthToken();
        const res = await fetch(`${API_URL}/learn/${courseId}/quiz/${quizId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
          throw new Error('Failed to load assessment questions from LMS registry');
        }

        const data = await res.json();
        if (isMounted) {
          setQuestions(data.questions || []);
          if (data.passingScore) setPassingScore(data.passingScore);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err.message || 'Error loading examination questions');
        }
      } finally {
        if (isMounted) {
          setLoadingQuestions(false);
        }
      }
    };

    if (quizId && courseId) {
      fetchQuestions();
    }

    return () => {
      isMounted = false;
    };
  }, [courseId, quizId, API_URL]);

  const handleSelect = (qIdx: number, optionIdx: number) => {
    if (result) return; // Locked once submitted
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: optionIdx }));
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = async () => {
    // Validate all questions answered
    const unansweredIndices = questions
      .map((_, idx) => idx)
      .filter(idx => selectedAnswers[idx] === undefined);

    if (unansweredIndices.length > 0) {
      setErrorMsg(`Please answer all questions before submitting. Unanswered: Question ${unansweredIndices.map(i => i + 1).join(', ')}`);
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const token = await getCurrentAuthToken();
      const answersArray = questions.map((_, idx) => selectedAnswers[idx]);

      const res = await fetch(`${API_URL}/learn/${courseId}/quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          quizId,
          answers: answersArray
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit examination');
      }

      // Display results view immediately and permanently
      setResult(data);

      // Notify parent to update progress in state silently without reloading/unmounting!
      if (data.passed) {
        onQuizPassed(data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error grading quiz examination');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setSelectedAnswers({});
    setErrorMsg(null);
  };

  if (loadingQuestions) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center space-y-3">
        <div className="inline-block w-8 h-8 border-4 border-[#3B97D3] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-600 text-xs font-bold">Loading official examination questions...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 sm:p-8 space-y-6">
      {/* Exam Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ddedf8] text-[#206394] text-xs font-bold mb-1.5 border border-[#c1e0f3]">
            <Sparkles className="w-3.5 h-3.5 text-[#3B97D3]" />
            Clinical Assessment Examination
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Knowledge Check & Final Recall
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Passing threshold: {passingScore}% • Instant score review & per-question clinical explanations
          </p>
        </div>

        {/* Real-time Result Badge */}
        {result && (
          <div
            className={`px-5 py-3 rounded-2xl border text-center transition-all ${
              result.passed
                ? 'bg-[#e4f6dc] border-[#ccedbc] text-[#345326]'
                : 'bg-[#fbf0e3] border-[#f6dec4] text-[#904e2b]'
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider">Exam Result</p>
            <p className="text-2xl font-black">{result.scorePercent}%</p>
            <p className="text-xs font-bold mt-0.5">
              {result.passed
                ? `✓ Passed (${result.correctCount}/${result.totalQuestions})`
                : `✗ Need ${passingScore}% to Pass (${result.correctCount}/${result.totalQuestions})`}
            </p>
          </div>
        )}
      </div>

      {/* Celebratory Banner if Passed */}
      {result?.passed && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#e4f6dc] via-[#f3fbf0] to-white border border-[#ccedbc] space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5 text-[#345326]">
            <div className="w-8 h-8 rounded-xl bg-[#7CC157] text-white flex items-center justify-center font-bold shadow-sm">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm">Congratulations! You have passed this examination.</h4>
              <p className="text-xs text-[#487d30]">
                Your score of {result.scorePercent}% has been officially recorded toward your course completion.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {onDownloadCertificate && (
              <button
                type="button"
                onClick={onDownloadCertificate}
                className="px-4 py-2 rounded-xl bg-[#7CC157] hover:bg-[#6eb249] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]"
              >
                <Download className="w-4 h-4" />
                Download Verified PDF Certificate
              </button>
            )}
            <a
              href={`/course/${courseId}`}
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <span>Back to Syllabus</span>
            </a>
          </div>
        </div>
      )}

      {/* Retake Notice if Failed */}
      {result && !result.passed && (
        <div className="p-4 rounded-2xl bg-[#fbf0e3] border border-[#f6dec4] text-[#904e2b] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#F4A261] shrink-0" />
            <div>
              <p className="text-xs font-bold">Passing score of {passingScore}% is required for certification.</p>
              <p className="text-[11px] text-[#754227]">Review the clinical explanations below, then click Retry to take the exam again.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shrink-0 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retry Now
          </button>
        </div>
      )}

      {/* Question List */}
      <div className="space-y-6">
        {(result?.perQuestionReview || questions).map((q: any, qIdx: number) => {
          const isReviewed = Boolean(result);
          const isCorrect = q.isCorrect;

          return (
            <div
              key={qIdx}
              className={`p-5 rounded-2xl border transition-all ${
                isReviewed
                  ? isCorrect
                    ? 'bg-[#f3fbf0]/60 border-[#ccedbc]'
                    : 'bg-red-50/40 border-red-200'
                  : 'bg-slate-50/70 border-slate-200/80'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                  <span className="text-[#206394] font-mono font-bold mr-2">Q{qIdx + 1}.</span>
                  {q.questionText}
                </h3>
                {isReviewed && (
                  <span className="shrink-0 mt-0.5">
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#e4f6dc] text-[#345326] text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#7CC157]" />
                        Correct
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-bold">
                        <XCircle className="w-3.5 h-3.5 text-red-600" />
                        Incorrect
                      </span>
                    )}
                  </span>
                )}
              </div>

              {/* Options */}
              <div className="space-y-2.5 mt-3">
                {q.options.map((option: string, optIdx: number) => {
                  const isSelected = selectedAnswers[qIdx] === optIdx;
                  let optionStyle = 'border-slate-200 bg-white text-slate-700 hover:border-[#3B97D3] hover:bg-[#ddedf8]/20';

                  if (isReviewed) {
                    if (optIdx === q.correctOptionIndex) {
                      optionStyle = 'border-[#7CC157] bg-[#e4f6dc] text-[#345326] font-bold shadow-sm ring-1 ring-[#7CC157]';
                    } else if (isSelected && !isCorrect) {
                      optionStyle = 'border-red-400 bg-red-50 text-red-800 line-through';
                    } else {
                      optionStyle = 'border-slate-200 bg-slate-50 text-slate-400 opacity-60';
                    }
                  } else if (isSelected) {
                    optionStyle = 'border-[#3B97D3] bg-[#ddedf8]/60 text-[#102a3f] font-bold shadow-sm ring-1 ring-[#3B97D3]';
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={isReviewed}
                      onClick={() => handleSelect(qIdx, optIdx)}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between ${optionStyle}`}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full border flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors ${
                            isReviewed && optIdx === q.correctOptionIndex
                              ? 'bg-[#7CC157] text-white border-[#7CC157]'
                              : isSelected
                              ? 'bg-[#3B97D3] text-white border-[#3B97D3]'
                              : 'bg-white text-slate-500 border-slate-300'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{option}</span>
                      </span>

                      {isReviewed && optIdx === q.correctOptionIndex && (
                        <span className="text-[10px] uppercase font-bold text-[#345326] px-2 py-0.5 rounded bg-[#ccedbc]">
                          Correct Answer
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Clinical Explanation Box (Always displayed upon submission) */}
              {isReviewed && (
                <div className="mt-4 p-4 rounded-xl bg-white border border-[#c1e0f3] text-xs text-slate-700 space-y-1 shadow-sm">
                  <div className="flex items-center gap-1.5 font-bold text-[#206394]">
                    <HelpCircle className="w-4 h-4 text-[#3B97D3]" />
                    <span>Clinical Rationale & Psychoeducation:</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed pl-5 font-normal">
                    {q.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        {!result ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#7CC157] hover:bg-[#6eb249] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-[#7CC157]/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
          >
            {submitting ? 'Grading Answers...' : 'Submit Assessment for Clinical Grading'}
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {!result.passed && (
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Instant Retry Assessment
              </button>
            )}
            {result.passed && (
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e4f6dc] text-[#345326] text-xs font-bold border border-[#ccedbc]">
                <Check className="w-4 h-4 text-[#7CC157]" />
                Assessment Finished • Score: {result.scorePercent}%
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
