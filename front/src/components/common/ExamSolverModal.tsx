import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { X, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Trophy, Award, Clock } from 'lucide-react';
import { Exam, Profile } from '../../types/database';
import { db } from '../../services/mockDatabase';
import { sounds } from '../../services/soundEffects';

interface ExamSolverModalProps {
  exam: Exam | null;
  student: Profile;
  onClose: () => void;
  onCompleted?: () => void;
}

const ARABIC_LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];

export const ExamSolverModal: React.FC<ExamSolverModalProps> = ({
  exam,
  student,
  onClose,
  onCompleted,
}) => {
  if (!exam || !exam.questions || exam.questions.length === 0) return null;

  const questions = exam.questions;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState((exam.duration_minutes || 15) * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resultData, setResultData] = useState<{
    score: number;
    total: number;
    pct: number;
    passed: boolean;
    review: {
      question: string;
      studentChoice: string;
      correctChoice: string;
      isCorrect: boolean;
      explanation: string;
    }[];
  } | null>(null);

  // Timer countdown
  useEffect(() => {
    if (isSubmitted) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSubmitted]);

  const mins = Math.floor(timeRemaining / 60);
  const secs = timeRemaining % 60;
  const timerStr = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPct = Math.round(((currentIdx + 1) / questions.length) * 100);

  const handleSelectChoice = (choice: string) => {
    sounds.playClick();
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: choice,
    }));
  };

  const handleSubmit = () => {
    if (!isSubmitted && answeredCount < questions.length) {
      const confirmSubmit = window.confirm(
        `لقد أجبت على ${answeredCount} من ${questions.length} أسئلة فقط. هل تريد بالتأكيد تسليم الاختبار الآن؟`
      );
      if (!confirmSubmit) return;
    }

    const res = db.submitExamAttempt({
      exam_id: exam.id,
      student_id: student.id,
      student_name: student.full_name,
      parent_email: student.parent_email || 'parent@eduflow.edu',
      answers: selectedAnswers,
    });

    setResultData(res);
    setIsSubmitted(true);

    if (res.passed) {
      sounds.playFanfare();
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });
    } else {
      sounds.playWrong();
    }

    if (onCompleted) {
      onCompleted();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Top Accent Gradient */}
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" />

        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-3 py-1 rounded-full">
                🔬 {exam.subject || 'مادة علمية'}
              </span>
              <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-full">
                {exam.grade_level || 'المرحلة الإعدادية'}
              </span>
              {!isSubmitted && (
                <span className="bg-red-50 text-red-600 border border-red-200 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{timerStr}</span>
                </span>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-base sm:text-lg font-black text-slate-900 line-clamp-1">
              {exam.title}
            </h3>
            {!isSubmitted && (
              <span className="text-xs font-bold text-blue-600 shrink-0">
                السؤال {currentIdx + 1} من {questions.length}
              </span>
            )}
          </div>

          {/* Stepper & Progress */}
          {!isSubmitted && (
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto py-1">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIdx;
                  const isAnswered = selectedAnswers[q.id] !== undefined;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIdx(idx)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-md scale-105'
                          : isAnswered
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      title={`انتقال للسؤال ${idx + 1}`}
                    >
                      {idx + 1}
                      {isAnswered && !isCurrent ? '✓' : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Body Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {!isSubmitted ? (
            <div className="bg-slate-50/60 border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 font-bold text-xs px-3 py-1 rounded-full">
                  سؤال رقم {currentIdx + 1}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  درجة السؤال: {currentQ.points} {currentQ.points === 1 ? 'درجة' : 'درجات'}
                </span>
              </div>

              <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed mb-6">
                {currentQ.question_text}
              </h4>

              {/* Choices */}
              <div className="space-y-2.5">
                {currentQ.options.map((choice, cIdx) => {
                  const isSelected = selectedAnswers[currentQ.id] === choice;
                  return (
                    <div
                      key={cIdx}
                      onClick={() => handleSelectChoice(choice)}
                      className={`flex items-center justify-between p-3.5 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/90 shadow-sm translate-y-[-1px]'
                          : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {ARABIC_LETTERS[cIdx] || cIdx + 1}
                        </span>
                        <span
                          className={`text-sm font-bold ${
                            isSelected ? 'text-blue-950 font-black' : 'text-slate-700'
                          }`}
                        >
                          {choice}
                        </span>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && '✓'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Results Screen */
            resultData && (
              <div className="space-y-6">
                <div className="text-center py-4">
                  <div
                    className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl border-4 shadow-lg ${
                      resultData.passed
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-500'
                        : 'bg-red-50 text-red-600 border-red-500'
                    }`}
                  >
                    {resultData.pct >= 85 ? '🏆' : resultData.passed ? '🎖️' : '📚'}
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 mb-2">
                    درجتك النهائية: {resultData.score} من {resultData.total} ({resultData.pct}%)
                  </h3>

                  <span
                    className={`inline-block px-4 py-1.5 rounded-full text-sm font-black border ${
                      resultData.passed
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-red-50 text-red-700 border-red-300'
                    }`}
                  >
                    {resultData.pct >= 85
                      ? '🌟 تفوق باهر وامتياز'
                      : resultData.passed
                      ? '👍 مستوى جيد جداً ومبشر'
                      : '💡 يحتاج لمراجعة وتدريب إضافي'}
                  </span>

                  <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-3 leading-relaxed">
                    ✅ تم توثيق نتيجتك سحابياً في منظومة <strong>EduFlow</strong>، وإضافتها لسجل المعلم، وإرسال تقرير الأداء التفصيلي لولي أمرك ({student.parent_email || 'المعتمد'}) عبر محرك الأتمتة n8n.
                  </p>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                    <div className="text-[11px] font-bold text-slate-500 mb-1">
                      الإجابات الصحيحة
                    </div>
                    <div className="text-lg font-black text-emerald-600">
                      {resultData.score} / {resultData.total}
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                    <div className="text-[11px] font-bold text-slate-500 mb-1">
                      النسبة المئوية
                    </div>
                    <div className="text-lg font-black text-blue-600">
                      {resultData.pct}%
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                    <div className="text-[11px] font-bold text-slate-500 mb-1">
                      حالة التوثيق
                    </div>
                    <div className="text-xs font-black text-emerald-600 mt-1.5">
                      معتمد سحابياً ☁️
                    </div>
                  </div>
                </div>

                {/* Review Questions List */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 max-h-72 overflow-y-auto space-y-3">
                  <h4 className="font-black text-sm text-blue-900 flex items-center gap-1.5">
                    <span>💡 مراجعة بنك الأسئلة والتفسيرات العلمية:</span>
                  </h4>

                  {resultData.review.map((r, i) => (
                    <div
                      key={i}
                      className={`p-3.5 rounded-xl border-r-4 border bg-slate-50/70 text-xs leading-relaxed ${
                        r.isCorrect
                          ? 'border-r-emerald-500 border-slate-200'
                          : 'border-r-red-500 border-slate-200'
                      }`}
                    >
                      <div className="font-bold text-slate-900 text-sm mb-1.5">
                        س {i + 1}: {r.question}
                      </div>
                      <div className="flex flex-wrap gap-3 mb-2 font-bold">
                        <span className={r.isCorrect ? 'text-emerald-700' : 'text-red-600'}>
                          إجابتك: <strong>{r.studentChoice}</strong> {r.isCorrect ? '✓' : '✗'}
                        </span>
                        {!r.isCorrect && (
                          <span className="text-blue-700">
                            الإجابة النموذجية: <strong>{r.correctChoice}</strong>
                          </span>
                        )}
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-600">
                        🎯 <strong>التفسير العلمي:</strong> {r.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          {!isSubmitted ? (
            <>
              <button
                type="button"
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                <span>السابق</span>
              </button>

              <span className="text-xs font-bold text-slate-500 hidden sm:inline">
                تمت الإجابة على {answeredCount} من {questions.length} أسئلة
              </span>

              <div className="flex items-center gap-2">
                {currentIdx < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 flex items-center gap-1.5 transition-colors"
                  >
                    <span>التالي</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تسليم الاختبار 🚀</span>
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-colors"
              >
                العودة للبوابة
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
