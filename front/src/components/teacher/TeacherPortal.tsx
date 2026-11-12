import React, { useState } from 'react';
import {
  Users,
  BookOpen,
  HelpCircle,
  FileCheck,
  CalendarCheck,
  DollarSign,
  Plus,
  CheckCircle,
  Clock,
  Sparkles,
  Award,
  Download,
  Send,
  FileText,
  UserCheck,
} from 'lucide-react';
import { Profile, Session, Exam, Question } from '../../types/database';
import { db } from '../../services/mockDatabase';

interface TeacherPortalProps {
  currentTeacher: Profile;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({ currentTeacher }) => {
  const [activeTab, setActiveTab] = useState<
    'groups' | 'sessions' | 'exams' | 'grading' | 'attendance' | 'earnings'
  >('groups');

  const groups = db.getGroupsForTeacher(currentTeacher.id);
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || 'g-1');
  const sessions = db.getSessions(selectedGroupId);
  const [selectedSessionId, setSelectedSessionId] = useState(sessions[0]?.id || 'sess-1');

  // Enrolled students in this group
  const enrollments = db.state.enrollments.filter((e) => e.group_id === selectedGroupId && e.status === 'active');
  const studentProfiles = db.getStudents().filter((s) => enrollments.some((e) => e.student_id === s.id));

  // Homework grading desk
  const pendingSubmissions = db.state.submissions.filter((s) => s.status === 'submitted');
  const [gradingScore, setGradingScore] = useState<Record<string, number>>({});
  const [gradingFeedback, setGradingFeedback] = useState<Record<string, string>>({});
  const [gradeSuccessMsg, setGradeSuccessMsg] = useState('');

  // Attendance marking
  const [attendanceStatuses, setAttendanceStatuses] = useState<Record<string, 'present' | 'absent' | 'late' | 'excused'>>({});
  const [attendanceSuccessMsg, setAttendanceSuccessMsg] = useState('');

  // New Session form
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionDesc, setNewSessionDesc] = useState('');
  const [newSessionNumber, setNewSessionNumber] = useState(sessions.length + 1);
  const [newSessionVideo, setNewSessionVideo] = useState('');
  const [sessionSuccessMsg, setSessionSuccessMsg] = useState('');

  // New Exam & AI / Manual / Worksheet Creation Modes
  const [examCreationMode, setExamCreationMode] = useState<'ai' | 'manual' | 'upload'>('ai');
  const [examCurriculum, setExamCurriculum] = useState<'languages' | 'arabic'>('languages');
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamDuration, setNewExamDuration] = useState(15);
  const [newExamPassing, setNewExamPassing] = useState(70);
  const [examSubject, setExamSubject] = useState('Sciences & Biology (Languages)');
  const [examTopicPrompt, setExamTopicPrompt] = useState('Periodic Table & Chemical Bonding');
  const [manualQText, setManualQText] = useState('');
  const [manualOptA, setManualOptA] = useState('');
  const [manualOptB, setManualOptB] = useState('');
  const [manualOptC, setManualOptC] = useState('');
  const [manualOptD, setManualOptD] = useState('');
  const [manualCorrect, setManualCorrect] = useState('');
  const [manualExpl, setManualExpl] = useState('');
  const [examWorksheetUrl, setExamWorksheetUrl] = useState('');
  const [examSuccessMsg, setExamSuccessMsg] = useState('');

  // Note for student
  const [noteStudentId, setNoteStudentId] = useState('');
  const [noteText, setNoteText] = useState('');
  const [noteSuccessMsg, setNoteSuccessMsg] = useState('');

  // KPI calculations
  const totalStudents = studentProfiles.length;
  const publishedSessionsCount = sessions.filter((s) => s.is_published).length;
  const myEarnings = db.getTeacherEarnings(currentTeacher.id);
  const totalEarned = myEarnings.reduce((acc, e) => acc + e.amount, 0);

  // Grade submission handler
  const handleGrade = (submissionId: string, maxScore = 20) => {
    const score = gradingScore[submissionId] ?? maxScore;
    const feedback = gradingFeedback[submissionId] || 'إجابة ممتازة وموفقة!';

    db.gradeSubmission(submissionId, score, feedback, currentTeacher.id);
    setGradeSuccessMsg('تم تقييم الواجب ورصد الدرجة بنجاح وإرسال إشعار للطالب! ✓');
    setTimeout(() => setGradeSuccessMsg(''), 4000);
  };

  // Save Attendance Sheet
  const handleSaveAttendance = () => {
    const records = studentProfiles.map((s) => ({
      session_id: selectedSessionId,
      student_id: s.id,
      status: attendanceStatuses[s.id] || 'present',
      recorded_by: currentTeacher.id,
    }));

    db.recordAttendance(records);
    setAttendanceSuccessMsg('تم حفظ كشف الحضور والغياب بنجاح في قاعدة البيانات السحابية! ☁️');
    setTimeout(() => setAttendanceSuccessMsg(''), 4000);
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, 'present'> = {};
    studentProfiles.forEach((s) => {
      updated[s.id] = 'present';
    });
    setAttendanceStatuses(updated);
  };

  // Add Session
  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionTitle.trim()) return;

    db.addSession({
      group_id: selectedGroupId,
      title: newSessionTitle,
      description: newSessionDesc,
      session_number: Number(newSessionNumber),
      video_url: newSessionVideo || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      materials_url: 'https://example.com/materials.pdf',
      is_published: true,
    });

    setSessionSuccessMsg('تم نشر الحصة وإشعار الطلاب المسجلين فوراً! 🚀');
    setNewSessionTitle('');
    setNewSessionDesc('');
    setTimeout(() => setSessionSuccessMsg(''), 4000);
  };

  // Create Exam with AI, Manual Questions, or Worksheet Upload
  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamTitle.trim()) return;

    let questionsPayload = [
      {
        question_text: `What is the core scientific principle of ${newExamTitle}?`,
        question_type: 'mcq' as const,
        options: ['Law of Conservation of Mass & Energy', 'Random Reaction', 'Undetermined State', 'None of the above'],
        correct_answer: 'Law of Conservation of Mass & Energy',
        points: 1,
        explanation: 'The fundamental law states that matter and energy are conserved in isolated systems.',
      },
      {
        question_text: 'Experimental results align with theoretical formulations when controlled variables remain constant.',
        question_type: 'true_false' as const,
        options: ['True (صواب)', 'False (خطأ)'],
        correct_answer: 'True (صواب)',
        points: 1,
        explanation: 'Controlled experiments isolate variables to guarantee reproducible results.',
      },
      {
        question_text: 'Which quantity expresses the rate of change of position in kinematics?',
        question_type: 'mcq' as const,
        options: ['Velocity (السرعة المتجهة)', 'Mass (الكتلة)', 'Volume (الحجم)', 'Charge (الشحنة)'],
        correct_answer: 'Velocity (السرعة المتجهة)',
        points: 1,
        explanation: 'Velocity is defined as the first time-derivative of displacement.',
      },
    ];

    if (examCreationMode === 'manual' && manualQText.trim()) {
      questionsPayload = [
        {
          question_text: manualQText.trim(),
          question_type: 'mcq' as const,
          options: [
            manualOptA.trim() || 'Choice A',
            manualOptB.trim() || 'Choice B',
            manualOptC.trim() || 'Choice C',
            manualOptD.trim() || 'Choice D',
          ],
          correct_answer: manualCorrect.trim() || manualOptA.trim() || 'Choice A',
          points: 1,
          explanation: manualExpl.trim() || 'نموذج الإجابة المعتمد في الاختبار.',
        },
      ];
    }

    const newExam = db.createExamWithQuestions({
      session_id: selectedSessionId,
      title: newExamTitle.trim(),
      duration_minutes: Number(newExamDuration),
      passing_score: Number(newExamPassing),
      subject: examSubject,
      creator_role: 'teacher',
      creation_mode: examCreationMode === 'ai' ? 'ai_generated' : examCreationMode === 'manual' ? 'manual' : 'material_upload',
      curriculum_type: examCurriculum,
      material_url: examWorksheetUrl.trim() || undefined,
      grade_level: 'الصف الثاني الإعدادي - لغات (Prep 2)',
      questions: questionsPayload,
    });

    setExamSuccessMsg(`تم نشر ${newExam.title} بنجاح وإتاحته للطلاب لحله فوراً! 🎯`);
    setNewExamTitle('');
    setManualQText('');
    setManualOptA('');
    setManualOptB('');
    setManualOptC('');
    setManualOptD('');
    setManualCorrect('');
    setManualExpl('');
    setTimeout(() => setExamSuccessMsg(''), 4000);
  };

  // Add Note for Student
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteStudentId || !noteText.trim()) return;

    db.addStudentNote(noteStudentId, currentTeacher.id, selectedGroupId, noteText);
    setNoteSuccessMsg('تم حفظ الملاحظة الأكاديمية وإضافتها لملف متابعة الطالب وولي الأمر! 📝');
    setNoteText('');
    setNoteStudentId('');
    setTimeout(() => setNoteSuccessMsg(''), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Teacher Profile Banner */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 border-2 border-emerald-200 flex items-center justify-center text-3xl shadow-sm shrink-0">
            {currentTeacher.avatar || '👨‍🏫'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                {currentTeacher.full_name}
              </h2>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                معلم معتمد
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {currentTeacher.email} • لوحة إدارة الكورسات والمجموعات والتقييم الآلي
            </p>
          </div>
        </div>

        {/* Group Selector */}
        <div className="w-full sm:w-auto flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 shrink-0">المجموعة النشطة:</span>
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 block mb-1">الطلاب المسجلين</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-600">{totalStudents}</span>
            <Users className="w-5 h-5 text-blue-500/50" />
          </div>
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 block mb-1">الحصص المنشورة</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600">{publishedSessionsCount}</span>
            <BookOpen className="w-5 h-5 text-emerald-500/50" />
          </div>
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 block mb-1">واجبات بانتظار التصحيح</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-600">{pendingSubmissions.length}</span>
            <FileCheck className="w-5 h-5 text-amber-500/50" />
          </div>
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 block mb-1">إجمالي المستحقات المالية</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-600">{totalEarned} EGP</span>
            <DollarSign className="w-5 h-5 text-purple-500/50" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'groups', label: '👥 المجموعات والطلاب', icon: Users },
          { id: 'sessions', label: '📚 إدارة الحصص والمحتوى', icon: BookOpen },
          { id: 'exams', label: '❓ بنك الأسئلة والامتحانات', icon: HelpCircle },
          { id: 'grading', label: `✍️ تصحيح الواجبات (${pendingSubmissions.length})`, icon: FileCheck },
          { id: 'attendance', label: '📋 تسجيل الحضور والغياب', icon: CalendarCheck },
          { id: 'earnings', label: '💰 المستحقات والأرباح', icon: DollarSign },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <TabIcon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Groups & Students */}
      {activeTab === 'groups' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-1">
                👥 قائمة الطلاب المسجلين بالمجموعة
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                متابعة بيانات التواصل ونسبة حضور وتفاعل كل طالب
              </p>

              <div className="divide-y divide-slate-100">
                {studentProfiles.map((s) => (
                  <div key={s.id} className="py-4 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-xl shrink-0">
                        {s.avatar || '👨‍🎓'}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{s.full_name}</h4>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <span>كود: #{s.id}</span>
                          <span>•</span>
                          <span>هاتف: {s.phone || 'غير مسجل'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setNoteStudentId(s.id)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700"
                      >
                        ✍️ إضافة ملاحظة
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Add Note Card */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm h-fit">
            <h4 className="font-black text-slate-900 text-base mb-1">
              📝 إضافة ملاحظة أكاديمية للطالب
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              تظهر في ملف الطالب وبوابة ولي الأمر فوراً
            </p>

            {noteSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl mb-4">
                {noteSuccessMsg}
              </div>
            )}

            <form onSubmit={handleAddNote} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">اختر الطالب:</label>
                <select
                  required
                  value={noteStudentId}
                  onChange={(e) => setNoteStudentId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="">-- اضغط للاختيار --</option>
                  {studentProfiles.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">الملاحظة والتقييم:</label>
                <textarea
                  required
                  rows={4}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="اكتب تقييم مستوى الطالب ونقاط القوة أو ما يحتاج للتحسين..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold resize-y"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                حفظ الملاحظة وإرسالها
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: Sessions & Content */}
      {activeTab === 'sessions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-1">
                📚 الحصص والمحتوى المنشور بالمجموعة
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                تسجيلات الحصص ومذكرات الشرح المرتبطة بنظام RAG
              </p>

              <div className="space-y-4">
                {sessions.map((sess) => (
                  <div key={sess.id} className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                        حصة رقم {sess.session_number}
                      </span>
                      <span className="text-slate-500">منشورة ونشطة ✓</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{sess.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{sess.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Add Session Form */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm h-fit">
            <h4 className="font-black text-slate-900 text-base mb-1">
              ➕ إضافة ونشر حصة جديدة
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              ستصل إشعارات تلقائية لجميع الطلاب
            </p>

            {sessionSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl mb-4">
                {sessionSuccessMsg}
              </div>
            )}

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">عنوان الحصة:</label>
                <input
                  type="text"
                  required
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                  placeholder="مثال: الحصة 4: قوانين الضغط الجوي..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">رقم الحصة:</label>
                <input
                  type="number"
                  required
                  value={newSessionNumber}
                  onChange={(e) => setNewSessionNumber(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">رابط الفيديو (Cloud/HLS/MP4):</label>
                <input
                  type="url"
                  value={newSessionVideo}
                  onChange={(e) => setNewSessionVideo(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">الوصف وملاحظات الدرس:</label>
                <textarea
                  rows={3}
                  value={newSessionDesc}
                  onChange={(e) => setNewSessionDesc(e.target.value)}
                  placeholder="اكتب أهداف الحصة ونقاط التركيز..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold resize-y"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                نشر الحصة فوراً 🚀
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: Exams & Question Bank */}
      {activeTab === 'exams' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-1">
                ❓ بنك الأسئلة والامتحانات المنشورة
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                الامتحانات التقييمية للحصص مع بنك التفسيرات وأسئلة الاختيار من متعدد
              </p>

              <div className="space-y-4">
                {db.getExams().map((ex) => (
                  <div key={ex.id} className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-md">
                        {ex.subject || 'مادة علمية'}
                      </span>
                      <span className="text-slate-500">{ex.duration_minutes} دقيقة • {ex.questions?.length || 0} أسئلة</span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm">{ex.title}</h4>

                    <div className="pt-2 text-xs text-slate-600 space-y-1.5">
                      {ex.questions?.slice(0, 2).map((q, i) => (
                        <div key={q.id} className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <strong>س {i + 1}:</strong> {q.question_text} (الإجابة: {q.correct_answer})
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Add Exam Form */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm h-fit space-y-4">
            <div>
              <h4 className="font-black text-slate-900 text-base mb-1">
                ➕ إنشاء ونشر اختبار تقييمي (Exams & Quizzes)
              </h4>
              <p className="text-xs text-slate-500">
                اختر طريقة الإنشاء: توليد آلي بالذكاء الاصطناعي، بناء يدوي تفاعلي، أو رفع ورقة اختبار
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setExamCreationMode('ai')}
                className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${
                  examCreationMode === 'ai' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                ✨ ذكاء اصطناعي (AI)
              </button>
              <button
                type="button"
                onClick={() => setExamCreationMode('manual')}
                className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${
                  examCreationMode === 'manual' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                ✍️ يدوي (Manual)
              </button>
              <button
                type="button"
                onClick={() => setExamCreationMode('upload')}
                className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${
                  examCreationMode === 'upload' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                📄 ورقة اختبار (PDF)
              </button>
            </div>

            {examSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl mb-4">
                {examSuccessMsg}
              </div>
            )}

            <form onSubmit={handleCreateExam} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">عنوان الاختبار:</label>
                <input
                  type="text"
                  required
                  value={newExamTitle}
                  onChange={(e) => setNewExamTitle(e.target.value)}
                  placeholder="مثال: Quiz: Periodic Table & Chemical Bonding"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">المادة الدراسية:</label>
                  <select
                    value={examSubject}
                    onChange={(e) => setExamSubject(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="Sciences & Biology (Languages)">Sciences & Biology (Languages)</option>
                    <option value="Pure Mathematics & Geometry">Pure Mathematics & Geometry</option>
                    <option value="Physics & Chemistry">Physics & Chemistry (STEM)</option>
                    <option value="علوم - عام">علوم عامة (عربي)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">نوع المنهج:</label>
                  <select
                    value={examCurriculum}
                    onChange={(e) => setExamCurriculum(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="languages">مدارس لغات (STEM / Languages)</option>
                    <option value="arabic">منهاج عربي</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">اربط بالحصة الدراسية:</label>
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">المدة (دقائق):</label>
                  <input
                    type="number"
                    min={5}
                    value={newExamDuration}
                    onChange={(e) => setNewExamDuration(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">نسبة النجاح (%):</label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={newExamPassing}
                    onChange={(e) => setNewExamPassing(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Mode Specific Inputs */}
              {examCreationMode === 'ai' && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                  <span className="font-bold text-emerald-950 block">✨ موجه الذكاء الاصطناعي (AI Topic Prompt):</span>
                  <input
                    type="text"
                    value={examTopicPrompt}
                    onChange={(e) => setExamTopicPrompt(e.target.value)}
                    placeholder="اكتب أهداف الامتحان أو موضوع الحصة..."
                    className="w-full p-2 bg-white rounded-xl border border-emerald-300 text-xs"
                  />
                  <p className="text-[11px] text-emerald-800">
                    يقوم محرك الذكاء الاصطناعي بتوليد 3 أسئلة بنظام MCQ مع الإجابة النموذجية والتفسير العلمي باللغة الإنجليزية لمدارس اللغات فوراً.
                  </p>
                </div>
              )}

              {examCreationMode === 'manual' && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <span className="font-bold text-slate-900 block">✍️ إدخال السؤال يدوياً:</span>
                  <input
                    type="text"
                    placeholder="نص السؤال العلمي..."
                    value={manualQText}
                    onChange={(e) => setManualQText(e.target.value)}
                    className="w-full p-2 bg-white rounded-xl border border-slate-300 text-xs"
                  />
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      placeholder="خيار A"
                      value={manualOptA}
                      onChange={(e) => setManualOptA(e.target.value)}
                      className="p-1.5 bg-white rounded-lg border text-xs"
                    />
                    <input
                      type="text"
                      placeholder="خيار B"
                      value={manualOptB}
                      onChange={(e) => setManualOptB(e.target.value)}
                      className="p-1.5 bg-white rounded-lg border text-xs"
                    />
                    <input
                      type="text"
                      placeholder="خيار C"
                      value={manualOptC}
                      onChange={(e) => setManualOptC(e.target.value)}
                      className="p-1.5 bg-white rounded-lg border text-xs"
                    />
                    <input
                      type="text"
                      placeholder="خيار D"
                      value={manualOptD}
                      onChange={(e) => setManualOptD(e.target.value)}
                      className="p-1.5 bg-white rounded-lg border text-xs"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="الإجابة النموذجية الصحيحة..."
                    value={manualCorrect}
                    onChange={(e) => setManualCorrect(e.target.value)}
                    className="w-full p-1.5 bg-white rounded-xl border border-slate-300 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="تفسير الإجابة وشرح الحل..."
                    value={manualExpl}
                    onChange={(e) => setManualExpl(e.target.value)}
                    className="w-full p-1.5 bg-white rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              )}

              {examCreationMode === 'upload' && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <span className="font-bold text-slate-900 block">📄 رابط ورقة الاختبار (PDF / Google Drive):</span>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/exam-worksheet.pdf"
                    value={examWorksheetUrl}
                    onChange={(e) => setExamWorksheetUrl(e.target.value)}
                    className="w-full p-2 bg-white rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>نشر الاختبار للطلاب فوراً 🚀</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: Homework Grading */}
      {activeTab === 'grading' && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              ✍️ مكتب تصحيح ورصد درجات الواجبات المنزلية
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              مراجعة حلول الطلاب، رصد الدرجة، وكتابة التغذية الراجعة
            </p>

            {gradeSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl mb-4">
                {gradeSuccessMsg}
              </div>
            )}

            {pendingSubmissions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                🎉 رائع! تم تصحيح جميع الواجبات المسلمة ولا توجد تسليمات معلقة.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingSubmissions.map((sub) => (
                  <div key={sub.id} className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/70 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                      <div>
                        <strong className="text-slate-900 text-sm">{sub.student_name}</strong>
                        <span className="text-slate-500 mr-2">سلم: {sub.assignment_title}</span>
                      </div>
                      <span className="bg-amber-100 text-amber-800 px-3 py-0.5 rounded-full font-bold">
                        بانتظار رصد الدرجة
                      </span>
                    </div>

                    <div className="p-4 bg-white border border-slate-200 rounded-xl text-xs space-y-2">
                      <strong className="text-slate-700 block">إجابة الطالب:</strong>
                      <p className="text-slate-800 font-medium leading-relaxed">{sub.submission_text}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">
                          الدرجة (من {sub.max_score}):
                        </label>
                        <input
                          type="number"
                          max={sub.max_score}
                          min={0}
                          value={gradingScore[sub.id] ?? sub.max_score}
                          onChange={(e) =>
                            setGradingScore({ ...gradingScore, [sub.id]: Number(e.target.value) })
                          }
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-xs font-bold text-slate-700">تغذية راجعة للطالب:</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={gradingFeedback[sub.id] || ''}
                            onChange={(e) =>
                              setGradingFeedback({ ...gradingFeedback, [sub.id]: e.target.value })
                            }
                            placeholder="اكتب ملاحظة تشجيعية أو توجيه علمي..."
                            className="flex-1 p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                          />
                          <button
                            onClick={() => handleGrade(sub.id, sub.max_score)}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shrink-0"
                          >
                            رصد الدرجة ✓
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: Attendance Sheet */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  📋 كشف الحضور والغياب للحصة
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  تسجيل الحضور والغياب مع المزامنة الفورية مع أولياء الأمور
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkAllPresent}
                  className="px-3.5 py-2 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors"
                >
                  ✓ تحديد الكل حاضرين
                </button>

                <button
                  onClick={handleSaveAttendance}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  حفظ واعتماد الكشف ☁️
                </button>
              </div>
            </div>

            {attendanceSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl">
                {attendanceSuccessMsg}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold">
                    <th className="pb-3">الطالب</th>
                    <th className="pb-3">الكود</th>
                    <th className="pb-3 text-center">حاضر (Present)</th>
                    <th className="pb-3 text-center">تأخير (Late)</th>
                    <th className="pb-3 text-center">غائب (Absent)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentProfiles.map((s) => {
                    const currentStatus = attendanceStatuses[s.id] || 'present';
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 font-bold text-slate-900">{s.full_name}</td>
                        <td className="py-3.5 text-slate-500">#{s.id}</td>
                        <td className="py-3.5 text-center">
                          <input
                            type="radio"
                            name={`att_${s.id}`}
                            checked={currentStatus === 'present'}
                            onChange={() => setAttendanceStatuses({ ...attendanceStatuses, [s.id]: 'present' })}
                            className="w-4 h-4 text-emerald-600"
                          />
                        </td>
                        <td className="py-3.5 text-center">
                          <input
                            type="radio"
                            name={`att_${s.id}`}
                            checked={currentStatus === 'late'}
                            onChange={() => setAttendanceStatuses({ ...attendanceStatuses, [s.id]: 'late' })}
                            className="w-4 h-4 text-amber-600"
                          />
                        </td>
                        <td className="py-3.5 text-center">
                          <input
                            type="radio"
                            name={`att_${s.id}`}
                            checked={currentStatus === 'absent'}
                            onChange={() => setAttendanceStatuses({ ...attendanceStatuses, [s.id]: 'absent' })}
                            className="w-4 h-4 text-red-600"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: Teacher Earnings */}
      {activeTab === 'earnings' && (
        <div className="space-y-6">
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              💰 كشف حساب وأرباح المعلم
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              مستحقات تدريس الحصص المحتسبة وفق عقد التعويض المالي (200 EGP لكل حصة)
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold">
                    <th className="pb-3">بيان المستحق</th>
                    <th className="pb-3">المجموعة</th>
                    <th className="pb-3">المبلغ المحتسب</th>
                    <th className="pb-3">تاريخ الاحتساب</th>
                    <th className="pb-3">الحالة المالية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myEarnings.map((earn) => (
                    <tr key={earn.id} className="hover:bg-slate-50/50">
                      <td className="py-4 font-bold text-slate-900">{earn.description}</td>
                      <td className="py-4 text-slate-600">{earn.group_name}</td>
                      <td className="py-4 text-emerald-700 font-black">{earn.amount} {earn.currency}</td>
                      <td className="py-4 text-slate-500">
                        {new Date(earn.calculated_at).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="py-4">
                        <span
                          className={`px-3 py-1 rounded-full font-bold text-[11px] ${
                            earn.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : earn.status === 'approved'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {earn.status === 'paid'
                            ? 'تم الصرف والتحويل ✓'
                            : earn.status === 'approved'
                            ? 'معتمد للصرف'
                            : 'قيد المراجعة'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
