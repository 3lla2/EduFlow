import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Video,
  FileText,
  CalendarCheck,
  CreditCard,
  MessageSquare,
  LifeBuoy,
  Play,
  Lock,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
  Download,
  AlertTriangle,
  RotateCw,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Profile, Session, Exam, Assignment, StudentPayment } from '../../types/database';
import { db } from '../../services/mockDatabase';
import { generateLessonContent } from '../../services/aiGenerator';
import { sounds } from '../../services/soundEffects';
import { Flashcard3D } from '../common/Flashcard3D';
import { ExamSolverModal } from '../common/ExamSolverModal';
import { VideoPlayerModal } from '../common/VideoPlayerModal';
import { StudentSwitcherModal } from '../common/StudentSwitcherModal';

interface StudentPortalProps {
  currentStudent: Profile;
  onUpdateStudent: (student: Profile) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  currentStudent,
  onUpdateStudent,
}) => {
  const [activeTab, setActiveTab] = useState<
    'generator' | 'sessions' | 'assignments' | 'attendance' | 'payments' | 'ai_chat' | 'complaints'
  >('generator');

  // Modals state
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [activeExamToSolve, setActiveExamToSolve] = useState<Exam | null>(null);
  const [activeVideoSession, setActiveVideoSession] = useState<Session | null>(null);
  const [videoPlayInfo, setVideoPlayInfo] = useState<{ playNumber: number; remainingPlays: number } | null>(null);

  // AI Generator Form State
  const [grade, setGrade] = useState(currentStudent.grade_level || 'الصف الثاني الإعدادي');
  const [difficulty, setDifficulty] = useState('متوسط متوازن');
  const [questionsCountType, setQuestionsCountType] = useState<'3' | '5' | '10' | 'custom'>('5');
  const [customQuestionsInput, setCustomQuestionsInput] = useState('7');
  const [lessonTitle, setLessonTitle] = useState('');
  const [notesContent, setNotesContent] = useState('');

  // AI Generator Execution State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generatedLesson, setGeneratedLesson] = useState<Awaited<ReturnType<typeof generateLessonContent>> | null>(null);

  // Lesson Quiz State
  const [lessonQuizAnswers, setLessonQuizAnswers] = useState<Record<number, number>>({});
  const [lessonQuizSubmitted, setLessonQuizSubmitted] = useState(false);
  const [lessonQuizScore, setLessonQuizScore] = useState(0);

  // Homework submission form
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [submissionText, setSubmissionText] = useState('');
  const [submissionSuccessMsg, setSubmissionSuccessMsg] = useState('');

  // AI Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState(() => db.getAiMessages(currentStudent.id));

  // Complaint Form State
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintCategory, setComplaintCategory] = useState('أكاديمي وامتحانات');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintSuccessMsg, setComplaintSuccessMsg] = useState('');

  // Data queries
  const assignedExams = db.getExamsByGrade(currentStudent.grade_level || 'الصف الثاني الإعدادي');
  const studentGroups = db.getGroupsForStudent(currentStudent.id);
  const currentGroupId = studentGroups[0]?.id;
  const sessions = db.getSessions(currentGroupId);
  const assignments = db.getAssignments(currentGroupId);
  const mySubmissions = db.getSubmissions(undefined, currentStudent.id);
  const attendanceRecords = db.getAttendance(undefined, currentStudent.id);
  const payments = db.getStudentPayments(currentStudent.id);
  const myComplaints = db.getComplaints(currentStudent.id);
  const studentNotes = db.getStudentNotes(currentStudent.id);

  // Attendance stats
  const presentCount = attendanceRecords.filter((a) => a.status === 'present').length;
  const lateCount = attendanceRecords.filter((a) => a.status === 'late').length;
  const absentCount = attendanceRecords.filter((a) => a.status === 'absent').length;
  const totalAtt = attendanceRecords.length || 1;
  const attendanceRate = Math.round(((presentCount + lateCount) / totalAtt) * 100);

  // Start Generation
  const handleStartGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim()) return;

    let qCount = 5;
    if (questionsCountType === 'custom') {
      qCount = parseInt(customQuestionsInput, 10) || 5;
    } else {
      qCount = parseInt(questionsCountType, 10) || 5;
    }

    setIsGenerating(true);
    setGenerationStep(1);

    const stepTimer = setInterval(() => {
      setGenerationStep((prev) => {
        if (prev < 5) return prev + 1;
        return prev;
      });
    }, 450);

    try {
      const result = await generateLessonContent({
        lesson: lessonTitle,
        grade,
        difficulty,
        questionsCount: qCount,
        studentName: currentStudent.full_name,
        parentEmail: currentStudent.parent_email || 'parent@eduflow.edu',
        studentId: currentStudent.id,
      });

      clearInterval(stepTimer);
      setGeneratedLesson(result);
      setLessonQuizAnswers({});
      setLessonQuizSubmitted(false);
      setIsGenerating(false);

      // Log automation trigger to n8n
      db.addAutomationLog({
        trigger_name: 'Webhook: Lesson & Quiz Generated',
        source: 'n8n',
        payload_summary: `توليد محتوى تفاعلي للدرس "${lessonTitle}" بنجاح للطالب ${currentStudent.full_name}`,
        status: 'success',
      });
    } catch {
      clearInterval(stepTimer);
      setIsGenerating(false);
    }
  };

  // Launch Video
  const handleLaunchVideo = (session: Session) => {
    const playResult = db.startSessionVideo(session.id, currentStudent.id);
    if (!playResult.allowed) {
      alert(playResult.reason || 'تعذر تشغيل الفيديو');
      return;
    }
    setVideoPlayInfo({
      playNumber: playResult.play_number,
      remainingPlays: playResult.remaining_plays,
    });
    setActiveVideoSession(session);
  };

  // Lesson Quiz choice
  const handleLessonQuizSelect = (qIdx: number, choiceIdx: number) => {
    if (lessonQuizSubmitted) return;
    sounds.playClick();
    setLessonQuizAnswers((prev) => ({
      ...prev,
      [qIdx]: choiceIdx,
    }));
  };

  const handleLessonQuizSubmit = () => {
    if (!generatedLesson) return;
    const questions = generatedLesson.questions;
    let score = 0;
    questions.forEach((q, idx) => {
      if (lessonQuizAnswers[idx] === q.correctIndex) {
        score++;
      }
    });

    setLessonQuizScore(score);
    setLessonQuizSubmitted(true);

    const pct = Math.round((score / questions.length) * 100);
    if (pct >= 70) {
      sounds.playFanfare();
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    } else {
      sounds.playWrong();
    }
  };

  // Submit Homework
  const handleSubmitAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentId || !submissionText.trim()) return;

    db.submitAssignment({
      assignment_id: selectedAssignmentId,
      student_id: currentStudent.id,
      submission_text: submissionText,
    });

    setSubmissionSuccessMsg('تم رفع واجبك المنزلي بنجاح وإرساله للمعلم للتقييم! 🚀');
    setSubmissionText('');
    setSelectedAssignmentId('');
    setTimeout(() => setSubmissionSuccessMsg(''), 4000);
  };

  // Submit Complaint
  const handleSubmitComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintSubject.trim() || !complaintDesc.trim()) return;

    db.submitComplaint({
      submitted_by: currentStudent.id,
      subject: complaintSubject,
      category: complaintCategory,
      description: complaintDesc,
      priority: 'normal',
    });

    setComplaintSuccessMsg('تم إرسال طلبك للإدارة، وسيتم الرد عليك في أقرب وقت. 📩');
    setComplaintSubject('');
    setComplaintDesc('');
    setTimeout(() => setComplaintSuccessMsg(''), 4000);
  };

  // Send AI Chat Message
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    db.sendAiMessage(currentStudent.id, chatInput);
    setChatInput('');
    setChatMessages(db.getAiMessages(currentStudent.id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Active Student Session Bar */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 border-2 border-blue-200 flex items-center justify-center text-3xl shadow-sm shrink-0">
            {currentStudent.avatar || '👨‍🎓'}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-blue-950">
                {currentStudent.full_name}
              </h2>
              <span className="bg-blue-900 text-white font-mono text-xs px-2.5 py-0.5 rounded-md font-bold">
                #{currentStudent.id}
              </span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                حساب نشط ومعتمد 🟢
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-700">{currentStudent.grade_level}</span>
              <span>•</span>
              <span>✉️ ولي الأمر: <strong>{currentStudent.parent_name || 'ولي الأمر'}</strong> ({currentStudent.parent_email || 'غير مسجل'})</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowStudentModal(true)}
          className="w-full md:w-auto px-4 py-2.5 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
        >
          <RotateCw className="w-4 h-4" />
          <span>🔄 تبديل حساب الطالب</span>
        </button>
      </div>

      {/* Teacher Assigned Exams Card */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-start sm:items-center justify-between flex-wrap gap-2 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-black text-blue-950 flex items-center gap-2">
              <span>📋 الامتحانات والواجبات المخصصة لصفك الدراسي</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              تم نشرها من قِبل معلم المادة خصيصاً لطلاب مرحلتك الدراسية ({currentStudent.grade_level})
            </p>
          </div>
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full">
            {currentStudent.grade_level} 🎯
          </span>
        </div>

        {assignedExams.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6 text-center text-xs text-slate-500">
            لا توجد امتحانات جديدة منشورة لصفك حالياً. يمكنك التمرن عبر المولد الذكي أدناه!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedExams.map((exam) => (
              <div
                key={exam.id}
                className="bg-slate-50 hover:bg-white border-2 border-slate-200 hover:border-blue-400 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 transition-all hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-2.5 py-0.5 rounded-md">
                      📖 {exam.subject || 'مادة علمية'}
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      متاح للحل الآن 🟢
                    </span>
                  </div>

                  <h4 className="font-black text-blue-950 text-sm sm:text-base leading-snug">
                    {exam.title}
                  </h4>

                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{exam.duration_minutes || 20} دقيقة</span>
                    </span>
                    <span>•</span>
                    <span>❓ {exam.questions?.length || 0} أسئلة</span>
                    <span>•</span>
                    <span>درجة النجاح: {exam.passing_score}%</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveExamToSolve(exam)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>بدء حل الاختبار الآن ⏱️</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'generator', label: '🚀 المولد التفاعلي والشهادة', icon: Sparkles },
          { id: 'sessions', label: '🎬 الحصص والمشاهدة (3 مرات)', icon: Video },
          { id: 'assignments', label: '📝 الواجبات المنزلية', icon: FileText },
          { id: 'attendance', label: '📊 الحضور والغياب', icon: CalendarCheck },
          { id: 'payments', label: '💳 المدفوعات والاشتراكات', icon: CreditCard },
          { id: 'ai_chat', label: '🤖 المساعد الأكاديمي (RAG)', icon: MessageSquare },
          { id: 'complaints', label: '📩 الشكاوى والمقترحات', icon: LifeBuoy },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <TabIcon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: AI Lesson & Quiz Generator (Original Core Feature from HTML) */}
      {activeTab === 'generator' && (
        <div className="space-y-6">
          {/* Hero Banner */}
          <div className="text-center py-4 sm:py-6">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-4 py-1.5 rounded-full text-xs font-bold mb-3 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>EduFlow AI Studio 2026 | التعلم الذكي التفاعلي 🚀</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              صمّم درساً تفاعلياً،{' '}
              <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                واختباراً ذكياً
              </span>{' '}
              مع شهادة تقدير فورية
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto mt-2 leading-relaxed">
              منظومة متكاملة: توليد شرح منظم، بطاقات استذكار سريعة ثلاثية الأبعاد (3D Flashcards)، كويز تفاعلي بأصوات وشروحات فورية، وربط آلي مع بريد ولي الأمر وGoogle Sheets عبر n8n.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" />

            <form onSubmit={handleStartGeneration} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Grade */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    📚 الصف الدراسي:
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-hidden"
                  >
                    <option value="الصف الأول الإعدادي">الصف الأول الإعدادي</option>
                    <option value="الصف الثاني الإعدادي">الصف الثاني الإعدادي</option>
                    <option value="الصف الثالث الإعدادي">الصف الثالث الإعدادي</option>
                    <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                    <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
                    <option value="المرحلة الابتدائية العليا">المرحلة الابتدائية (الرابع - السادس)</option>
                  </select>
                </div>

                {/* Difficulty */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    ⚡ مستوى الصعوبة:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'سهل وممتع', label: '🌱 سهل وممتع' },
                      { id: 'متوسط متوازن', label: '⚖️ متوازن قياسي' },
                      { id: 'تحدي الأوائل', label: '🏆 تحدي الأوائل' },
                    ].map((d) => (
                      <button
                        type="button"
                        key={d.id}
                        onClick={() => setDifficulty(d.id)}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                          difficulty === d.id
                            ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question count selector */}
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      🔢 عدد أسئلة الاختبار (Quiz):
                    </label>
                    <span className="text-[11px] text-slate-400">
                      اختر عدد الأسئلة المناسب لتدريبك (ليس إجبارياً 5 أسئلة)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: '3', label: '⚡ 3 أسئلة', sub: '(سريع ومباشر)' },
                      { id: '5', label: '⚖️ 5 أسئلة', sub: '(النموذج القياسي)' },
                      { id: '10', label: '🎯 10 أسئلة', sub: '(شامل ومكثف)' },
                      { id: 'custom', label: '✍️ عدد مخصص', sub: '(حدد بنفسك)' },
                    ].map((q) => (
                      <button
                        type="button"
                        key={q.id}
                        onClick={() => setQuestionsCountType(q.id as typeof questionsCountType)}
                        className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                          questionsCountType === q.id
                            ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div>{q.label}</div>
                        <div className="text-[10px] font-normal opacity-75 mt-0.5">{q.sub}</div>
                      </button>
                    ))}
                  </div>

                  {questionsCountType === 'custom' && (
                    <div className="mt-2 flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max="25"
                        value={customQuestionsInput}
                        onChange={(e) => setCustomQuestionsInput(e.target.value)}
                        placeholder="أدخل عدد الأسئلة (مثال: 7 أو 12 أو 15 سؤال)"
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold max-w-xs focus:bg-white focus:border-blue-600 outline-hidden"
                      />
                      <span className="text-xs text-slate-500 font-bold">سؤال تفاعلي</span>
                    </div>
                  )}
                </div>

                {/* Lesson Title & Quick Chips */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    🎯 اسم الدرس أو الموضوع العلمي:
                  </label>
                  <input
                    type="text"
                    required
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    placeholder="أدخل اسم الدرس أو الموضوع (مثال: الجهاز الدوري، قوانين نيوتن، المعادلات الخطية...)"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-hidden"
                  />

                  {/* Quick Chips */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      { topic: 'الجهاز الدوري في الإنسان', grade: 'الصف الثاني الإعدادي', icon: '🫀' },
                      { topic: 'التركيب الذري للمادة والجدول الدوري', grade: 'الصف الأول الإعدادي', icon: '⚛️' },
                      { topic: 'حل معادلات الدرجة الثانية في متغير واحد', grade: 'الصف الثالث الإعدادي', icon: '📐' },
                      { topic: 'الحركة في اتجاه واحد وقوانين السرعة', grade: 'الصف الثالث الإعدادي', icon: '🏎️' },
                      { topic: 'مقدمة في الذكاء الاصطناعي والبرمجة', grade: 'المرحلة الثانوية', icon: '🤖' },
                    ].map((chip) => (
                      <button
                        type="button"
                        key={chip.topic}
                        onClick={() => {
                          setLessonTitle(chip.topic);
                          setGrade(chip.grade);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>{chip.icon}</span>
                        <span>{chip.topic}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Notes */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    📝 محتوى الدرس أو نقاط تركيز خاصة (اختياري):
                  </label>
                  <textarea
                    rows={3}
                    value={notesContent}
                    onChange={(e) => setNotesContent(e.target.value)}
                    placeholder="انسخ فقرة من كتاب الوزارة أو اكتب المفاهيم التي ترغب في التركيز عليها..."
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-hidden resize-y"
                  />
                </div>
              </div>

              {/* Features row */}
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-4 flex flex-wrap gap-2 text-xs font-bold text-slate-700">
                <span className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-emerald-700">✓ ملخص وشرح المنهج</span>
                <span className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-emerald-700">✓ 4 بطاقات 3D Flashcards</span>
                <span className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-emerald-700">✓ كويز تفاعلي بأصوات وشروحات (مرن)</span>
                <span className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-emerald-700">✓ احتفال كونفيتي عند النجاح 🎊</span>
                <span className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-emerald-700">✓ شهادة تفوق بالاسم والدرجة 🏆</span>
                <span className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-emerald-700">✓ تقرير آلي لولي الأمر عبر Gmail ✉️</span>
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-black text-base shadow-lg shadow-blue-600/30 flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-5 h-5" />
                <span>🚀 توليد البيئة التفاعلية والاختبار الذكي</span>
              </button>
            </form>
          </div>

          {/* AI Loading Modal Overlay */}
          {isGenerating && (
            <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl border border-slate-200">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-emerald-400 flex items-center justify-center text-4xl shadow-lg shadow-blue-500/40 animate-spin">
                  🧠
                </div>
                <h3 className="text-xl font-black text-blue-950 mb-1">
                  جاري التوليد بواسطة Gemini و n8n...
                </h3>
                <p className="text-xs text-slate-500 mb-6">
                  نقوم الآن ببناء بيئة تعليمية متكاملة لدرسك في ثوانٍ معدودة
                </p>

                <div className="space-y-2.5 text-right bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  {[
                    '🔍 استخراج المفاهيم الأكاديمية وصياغة الشرح المبسط...',
                    '🗂️ هندسة بطاقات الاستذكار السريعة (3D Flashcards)...',
                    '📝 بناء أسئلة الكويز التفاعلية مع بنك التفسيرات والأصوات...',
                    '🏆 إعداد شهادة التفوق ومنظومة إرسال التقارير لولي الأمر...',
                    '✨ اللمسات النهائية للواجهة التفاعلية...',
                  ].map((stepText, idx) => {
                    const stepNum = idx + 1;
                    const isDone = generationStep > stepNum;
                    const isActive = generationStep === stepNum;
                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-2.5 text-xs font-bold transition-all ${
                          isActive
                            ? 'text-blue-600 translate-x-[-3px]'
                            : isDone
                            ? 'text-emerald-600'
                            : 'text-slate-400'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                            isDone
                              ? 'bg-emerald-600 text-white'
                              : isActive
                              ? 'bg-blue-600 text-white animate-pulse'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {isDone ? '✓' : stepNum}
                        </span>
                        <span>{stepText}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Generated Interactive Environment */}
          {generatedLesson && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-blue-200 shadow-md space-y-8 animate-in fade-in duration-300">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full">
                    بيئة الدرس التفاعلية ✨
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-blue-950 mt-2">
                    {generatedLesson.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {generatedLesson.grade} • مستوى: {generatedLesson.difficulty}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setGeneratedLesson(null);
                      window.scrollTo({ top: 300, behavior: 'smooth' });
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs"
                  >
                    ➕ درس جديد
                  </button>
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border border-blue-100 rounded-2xl p-5 sm:p-6 space-y-4">
                <h4 className="font-black text-blue-950 text-base flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span>ملخص وشرح المنهج الأكاديمي</span>
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  {generatedLesson.summary}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {generatedLesson.keyPoints.map((pt, i) => (
                    <div
                      key={i}
                      className="bg-white p-3 rounded-xl border border-blue-100 text-xs font-bold text-slate-700 flex items-start gap-2 shadow-2xs"
                    >
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3D Flashcards Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-blue-950 text-base sm:text-lg flex items-center gap-2">
                      <span>🗂️ بطاقات الاستذكار السريعة ثلاثية الأبعاد (3D Flashcards)</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      اضغط على أي بطاقة لقلبها واكتشاف التفسير العلمي وتثبيت المعلومة
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {generatedLesson.flashcards.map((fc, i) => (
                    <Flashcard3D key={i} card={fc} index={i} />
                  ))}
                </div>
              </div>

              {/* Interactive Quiz Solver Section */}
              <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 sm:p-6 space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-200">
                  <div>
                    <h4 className="font-black text-blue-950 text-base sm:text-lg flex items-center gap-2">
                      <span>📝 الكويز التفاعلي الذكي ({generatedLesson.questions.length} أسئلة)</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      تصحيح فوري وتأثيرات صوتية وتوثيق سحابي للشهادة
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-white border border-slate-300 px-3 py-1 rounded-full text-slate-700">
                    تم الإجابة على {Object.keys(lessonQuizAnswers).length} من {generatedLesson.questions.length}
                  </span>
                </div>

                <div className="space-y-6">
                  {generatedLesson.questions.map((q, qIdx) => {
                    const selectedIdx = lessonQuizAnswers[qIdx];
                    const isAnswered = selectedIdx !== undefined;

                    return (
                      <div
                        key={qIdx}
                        className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                          <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full">
                            سؤال {qIdx + 1}
                          </span>
                          <span>درجة واحدة</span>
                        </div>

                        <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                          {q.question}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {q.choices.map((choice, cIdx) => {
                            const isChoiceSelected = selectedIdx === cIdx;
                            let style = 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700';

                            if (lessonQuizSubmitted) {
                              if (cIdx === q.correctIndex) {
                                style = 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold';
                              } else if (isChoiceSelected && cIdx !== q.correctIndex) {
                                style = 'border-red-400 bg-red-50 text-red-700 font-bold';
                              }
                            } else if (isChoiceSelected) {
                              style = 'border-blue-600 bg-blue-50 text-blue-900 font-bold';
                            }

                            return (
                              <button
                                key={cIdx}
                                type="button"
                                disabled={lessonQuizSubmitted}
                                onClick={() => handleLessonQuizSelect(qIdx, cIdx)}
                                className={`p-3 rounded-xl border-2 text-right text-xs sm:text-sm transition-all flex items-center justify-between gap-2 cursor-pointer ${style}`}
                              >
                                <span>{choice}</span>
                                {lessonQuizSubmitted && cIdx === q.correctIndex && (
                                  <span className="text-emerald-600 font-black">✓ صح</span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {lessonQuizSubmitted && (
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
                            💡 <strong>التفسير العلمي:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!lessonQuizSubmitted ? (
                  <button
                    onClick={handleLessonQuizSubmit}
                    disabled={Object.keys(lessonQuizAnswers).length === 0}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40"
                  >
                    <span>✓ اعتماد وتسليم إجابات الكويز</span>
                  </button>
                ) : (
                  /* Certificate of Excellence */
                  <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl text-center space-y-4 shadow-md">
                    <div className="w-16 h-16 rounded-full bg-amber-400 text-amber-950 mx-auto flex items-center justify-center text-3xl shadow-sm">
                      🏆
                    </div>
                    <div>
                      <span className="text-xs font-black text-amber-800 bg-amber-100 border border-amber-200 px-3 py-1 rounded-full uppercase tracking-wider">
                        شهادة تفوق وإنجاز أكاديمي
                      </span>
                      <h4 className="text-2xl font-black text-slate-900 mt-2">
                        تهانينا للطالب: {currentStudent.full_name}
                      </h4>
                      <p className="text-sm font-bold text-slate-700 mt-1">
                        لاشتيازه اختبار درس: <strong>{generatedLesson.title}</strong> بدرجة{' '}
                        <span className="text-emerald-700 font-black">
                          {lessonQuizScore} من {generatedLesson.questions.length} (
                          {Math.round((lessonQuizScore / generatedLesson.questions.length) * 100)}%)
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        ✉️ تم إرسال نسخة من الشهادة وتقرير الدرجات التفصيلي إلى بريد ولي الأمر:{' '}
                        <strong>{currentStudent.parent_email || 'المسجل في النظام'}</strong> عبر أتمتة n8n.
                      </p>
                    </div>

                    <button
                      onClick={() => window.print()}
                      className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm inline-flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>طباعة أو تحميل الشهادة PDF</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Sessions & Video Viewer with 3-play limit */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-black text-blue-950 mb-1">
              🎬 جدول الحصص والتسجيلات التعليمية
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              يتاح لكل طالب <strong>3 مشاهدات كحد أقصى</strong> لكل حصة، ويشترط اجتياز اختبار الحصة السابقة أولاً.
            </p>

            <div className="space-y-4">
              {sessions.map((sess) => {
                const plays = db.getVideoPlays(sess.id, currentStudent.id);
                const playsCount = plays.length;
                const remaining = Math.max(0, 3 - playsCount);

                return (
                  <div
                    key={sess.id}
                    className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/60 hover:bg-white hover:border-blue-400 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-md">
                          حصة رقم {sess.session_number}
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            remaining > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {remaining > 0 ? `متبقي ${remaining} من 3 مشاهدات` : 'تم استنفاد المشاهدات'}
                        </span>
                      </div>

                      <h4 className="font-black text-blue-950 text-base">
                        {sess.title}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {sess.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleLaunchVideo(sess)}
                        disabled={remaining === 0}
                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>مشاهدة الحصة</span>
                      </button>

                      {sess.materials_url && (
                        <a
                          href={sess.materials_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>المذكرة PDF</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Homework & Assignments */}
      {activeTab === 'assignments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assignments List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-black text-blue-950 mb-1">
                📝 الواجبات والمهام الأكاديمية
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                قم بتسليم الواجب قبل الموعد النهائي لتحصيل درجات أعمال السنة
              </p>

              <div className="space-y-4">
                {assignments.map((asg) => {
                  const submission = mySubmissions.find((s) => s.assignment_id === asg.id);
                  const isGraded = submission?.status === 'graded';
                  const isSubmitted = submission !== undefined;

                  return (
                    <div
                      key={asg.id}
                      className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/50 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-500">
                          الدرجة الكبرى: {asg.max_score} درجة
                        </span>
                        <span
                          className={`text-xs font-bold px-3 py-0.5 rounded-full ${
                            isGraded
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isSubmitted
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isGraded ? 'تم التصحيح والتقييم ✓' : isSubmitted ? 'تم التسليم وقيد المراجعة' : 'مطلوب التسليم'}
                        </span>
                      </div>

                      <h4 className="font-black text-blue-950 text-base">
                        {asg.title}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {asg.description}
                      </p>

                      {submission && (
                        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 text-xs">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-slate-700">إجابتك المسلمة:</span>
                            {isGraded && (
                              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                الدرجة: {submission.score} من {asg.max_score}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-600 italic">"{submission.submission_text}"</p>

                          {submission.teacher_feedback && (
                            <div className="pt-2 border-t border-slate-100 text-blue-900 font-medium">
                              👨‍🏫 <strong>ملاحظات المعلم:</strong> {submission.teacher_feedback}
                            </div>
                          )}
                        </div>
                      )}

                      {!isSubmitted && (
                        <button
                          onClick={() => setSelectedAssignmentId(asg.id)}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                        >
                          تسليم الواجب الآن ✍️
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submission Form */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm h-fit">
            <h4 className="font-black text-blue-950 text-base mb-1">
              📤 نموذج رفع الواجب
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              اكتب إجابتك أو ارفق رابط ملفك
            </p>

            {submissionSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl mb-4">
                {submissionSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSubmitAssignment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">اختر الواجب:</label>
                <select
                  required
                  value={selectedAssignmentId}
                  onChange={(e) => setSelectedAssignmentId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="">-- اضغط للاختيار --</option>
                  {assignments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">نص الإجابة أو الحل:</label>
                <textarea
                  required
                  rows={4}
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="اكتب خطوات الحل أو ملخص البحث المطلوب..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold resize-y"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                تأكيد التسليم والمراجعة
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: Attendance Tracking */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 text-center">
              <span className="text-xs font-bold text-slate-500 block mb-1">نسبة الحضور الإجمالية</span>
              <span className="text-2xl font-black text-blue-600">{attendanceRate}%</span>
            </div>
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 text-center">
              <span className="text-xs font-bold text-slate-500 block mb-1">حضور منتظم (Present)</span>
              <span className="text-2xl font-black text-emerald-600">{presentCount}</span>
            </div>
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 text-center">
              <span className="text-xs font-bold text-slate-500 block mb-1">تأخير بعذر (Late)</span>
              <span className="text-2xl font-black text-amber-600">{lateCount}</span>
            </div>
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 text-center">
              <span className="text-xs font-bold text-slate-500 block mb-1">غياب (Absent)</span>
              <span className="text-2xl font-black text-red-600">{absentCount}</span>
            </div>
          </div>

          {/* Attendance Log Table */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-black text-blue-950 mb-4">
              📅 سجل الحضور والغياب بالحصة
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold">
                    <th className="pb-3">الحصة</th>
                    <th className="pb-3">التاريخ والوقت</th>
                    <th className="pb-3">حالة الحضور</th>
                    <th className="pb-3">الموثّق</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceRecords.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50/60">
                      <td className="py-3.5 font-bold text-slate-900">
                        {att.session_title || `حصة ${att.session_number}`}
                      </td>
                      <td className="py-3.5 text-slate-500">
                        {new Date(att.recorded_at).toLocaleDateString('ar-EG', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`px-3 py-1 rounded-full font-bold text-[11px] ${
                            att.status === 'present'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : att.status === 'late'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {att.status === 'present' ? 'حاضر ✓' : att.status === 'late' ? 'حاضر بتأخير' : 'غائب ✗'}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-500">معلم المادة المعتمد</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Payments & Invoices */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
              <div>
                <h3 className="text-lg font-black text-blue-950">
                  💳 الفواتير والاشتراكات الشهرية
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  كشف حساب الطالب الموثق مع إمكانية السداد عبر إنستاباي وفودافون كاش
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-xs">
                <span className="text-slate-600 block">طرق الدفع المعتمدة:</span>
                <span className="font-bold text-blue-900">إنستاباي (Instapay) • فودافون كاش • نقدي</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold">
                    <th className="pb-3">بيان الفاتورة</th>
                    <th className="pb-3">المبلغ</th>
                    <th className="pb-3">المسدد</th>
                    <th className="pb-3">المتبقي</th>
                    <th className="pb-3">تاريخ الاستحقاق</th>
                    <th className="pb-3">الحالة</th>
                    <th className="pb-3">طريقة الدفع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60">
                      <td className="py-4 font-bold text-slate-900">{p.period_label || 'اشتراك شهري'}</td>
                      <td className="py-4 font-bold text-slate-900">{p.amount} {p.currency}</td>
                      <td className="py-4 text-emerald-700 font-bold">{p.paid_amount || 0} {p.currency}</td>
                      <td className="py-4 text-red-600 font-bold">{p.remaining_amount || 0} {p.currency}</td>
                      <td className="py-4 text-slate-500">{p.due_date}</td>
                      <td className="py-4">
                        <span
                          className={`px-3 py-1 rounded-full font-bold text-[11px] ${
                            p.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : p.status === 'partially_paid'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : p.status === 'overdue'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {p.status === 'paid'
                            ? 'مسدد بالكامل ✓'
                            : p.status === 'partially_paid'
                            ? 'مسدد جزئياً'
                            : p.status === 'overdue'
                            ? 'متأخر في السداد'
                            : p.status === 'waived'
                            ? 'معفى'
                            : 'غير مسدد'}
                        </span>
                      </td>
                      <td className="py-4 text-slate-500 font-semibold">{p.payment_method || 'لم يتم'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: AI Chat (RAG Tutor) */}
      {activeTab === 'ai_chat' && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-blue-950 flex items-center gap-2">
                <span>🤖 المساعد الأكاديمي الذكي (RAG Course Tutor)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                مدرب على مذكرات ومقررات منهجك، ويجيبك بتفسيرات علمية معتمدة
              </p>
            </div>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full">
              متصل بقاعدة البيانات المعرفية 🟢
            </span>
          </div>

          <div className="h-80 overflow-y-auto space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs sm:text-sm ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm shrink-0">
                    🤖
                  </div>
                )}
                <div
                  className={`p-4 rounded-2xl max-w-lg leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white font-medium rounded-bl-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-br-none shadow-2xs'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendChat} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="اطرح سؤالك الأكاديمي هنا (مثال: ما هو الشريان الرئوي؟ كيف نحسب السرعة؟)..."
              className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:bg-white focus:border-blue-600 outline-hidden"
            />
            <button
              type="submit"
              className="px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>إرسال</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 7: Complaints */}
      {activeTab === 'complaints' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-black text-blue-950 mb-1">
                📬 تذاكر الشكاوى والاستفسارات
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                متابعة حالة تذاكرك وردود إدارة المدرسة المعتمدة
              </p>

              {myComplaints.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  لا توجد تذاكر أو شكاوى سابقة.
                </div>
              ) : (
                <div className="space-y-4">
                  {myComplaints.map((c) => (
                    <div
                      key={c.id}
                      className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/60 space-y-3"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-md font-bold">
                          {c.category}
                        </span>
                        <span
                          className={`px-3 py-0.5 rounded-full font-bold ${
                            c.status === 'resolved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {c.status === 'resolved' ? 'تم الحل والرد ✓' : 'قيد المتابعة من الإدارة'}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm">{c.subject}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{c.description}</p>

                      {c.admin_response && (
                        <div className="p-3 bg-white border border-emerald-200 rounded-xl text-xs space-y-1">
                          <strong className="text-emerald-800">رد إدارة EduFlow:</strong>
                          <p className="text-slate-700">{c.admin_response}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* New Complaint Form */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm h-fit">
            <h4 className="font-black text-blue-950 text-base mb-1">
              📝 تقديم استفسار / شكوى
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              تصل مباشرة لإدارة المنظومة وسنرد عليك
            </p>

            {complaintSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl mb-4">
                {complaintSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSubmitComplaint} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">التصنيف:</label>
                <select
                  value={complaintCategory}
                  onChange={(e) => setComplaintCategory(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="أكاديمي وامتحانات">أكاديمي وامتحانات</option>
                  <option value="تقنية وفيديو">تقنية وفيديو</option>
                  <option value="مدفوعات واشتراكات">مدفوعات واشتراكات</option>
                  <option value="اقتراح تطويري">اقتراح تطويري</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">موضوع الطلب:</label>
                <input
                  type="text"
                  required
                  value={complaintSubject}
                  onChange={(e) => setComplaintSubject(e.target.value)}
                  placeholder="عنوان مختصر للمشكلة أو الاستفسار..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">التفاصيل:</label>
                <textarea
                  required
                  rows={4}
                  value={complaintDesc}
                  onChange={(e) => setComplaintDesc(e.target.value)}
                  placeholder="اشرح المشكلة بالتفصيل..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold resize-y"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                إرسال الطلب الآن
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Exam Solver Modal */}
      {activeExamToSolve && (
        <ExamSolverModal
          exam={activeExamToSolve}
          student={currentStudent}
          onClose={() => setActiveExamToSolve(null)}
          onCompleted={() => {
            // refresh data
          }}
        />
      )}

      {/* Video Player Modal */}
      {activeVideoSession && videoPlayInfo && (
        <VideoPlayerModal
          session={activeVideoSession}
          playNumber={videoPlayInfo.playNumber}
          remainingPlays={videoPlayInfo.remainingPlays}
          onClose={() => {
            setActiveVideoSession(null);
            setVideoPlayInfo(null);
          }}
        />
      )}

      {/* Student Switcher Modal */}
      {showStudentModal && (
        <StudentSwitcherModal
          currentStudent={currentStudent}
          onSelectStudent={(s) => {
            onUpdateStudent(s);
            setShowStudentModal(false);
          }}
          onClose={() => setShowStudentModal(false)}
        />
      )}
    </div>
  );
};
