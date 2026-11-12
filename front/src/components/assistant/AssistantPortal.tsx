import React, { useState } from 'react';
import {
  Laptop,
  Users,
  BookOpen,
  CalendarCheck,
  CreditCard,
  LifeBuoy,
  Send,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  FileText,
  Phone,
  Mail,
  Printer,
  ChevronRight,
  Sparkles,
  Info,
  Activity,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Lock,
  Wand2,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import {
  Profile,
  CourseGroup,
  Session,
  CourseMaterial,
  StudentPayment,
  Complaint,
  StudentFollowUpRecord,
  Exam,
  PaymentTransaction,
} from '../../types/database';
import { db } from '../../services/mockDatabase';
import {
  CircularProgress,
  VideoPlayTrackerBadge,
  ExamTrackerBadge,
  AssignmentTrackerBadge,
} from '../common/AnalyticsCharts';
import { EduFlowLogo } from '../common/EduFlowLogo';

interface AssistantPortalProps {
  currentAssistant: Profile;
}

export const AssistantPortal: React.FC<AssistantPortalProps> = ({ currentAssistant }) => {
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'tracker'
    | 'students'
    | 'materials'
    | 'exams'
    | 'attendance'
    | 'payments'
    | 'complaints'
    | 'broadcast'
  >('tracker');

  // Groups and Sessions
  const groups = db.getGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id || 'g-1');
  const selectedGroup = groups.find((g: CourseGroup) => g.id === selectedGroupId) || groups[0];
  const groupSessions = db.getSessions(selectedGroupId);
  const [selectedSessionId, setSelectedSessionId] = useState<string>(groupSessions[0]?.id || 'sess-1');

  // Students enrolled in selected group
  const groupEnrollments = db.state.enrollments.filter(
    (e) => e.group_id === selectedGroupId && e.status === 'active'
  );
  const enrolledStudents = db
    .getStudents()
    .filter((s) => groupEnrollments.some((e) => e.student_id === s.id));

  // Search & filter state
  const [studentSearch, setStudentSearch] = useState('');
  const [trackerFilter, setTrackerFilter] = useState<'all' | 'unwatched' | 'no_exam' | 'no_homework' | 'unpaid'>('all');

  // Academic Follow-up Records
  const followUpRecords: StudentFollowUpRecord[] = db.getStudentAcademicFollowUp(selectedGroupId, selectedSessionId);

  // 1. Parent Follow-up Modal State
  const [followUpStudent, setFollowUpStudent] = useState<StudentFollowUpRecord | null>(null);
  const [followUpIssue, setFollowUpIssue] = useState<'missing_exam' | 'missing_homework' | 'missing_video' | 'fees'>('missing_video');
  const [customFollowUpMsg, setCustomFollowUpMsg] = useState('');
  const [followUpSuccess, setFollowUpSuccess] = useState('');

  // 2. New Student Form State
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStuName, setNewStuName] = useState('');
  const [newStuPhone, setNewStuPhone] = useState('');
  const [newStuEmail, setNewStuEmail] = useState('');
  const [newStuGrade, setNewStuGrade] = useState('Prep 2 - Languages / لغات');
  const [newStuParentName, setNewStuParentName] = useState('');
  const [newStuParentPhone, setNewStuParentPhone] = useState('');
  const [newStuParentEmail, setNewStuParentEmail] = useState('');
  const [newStuGroupId, setNewStuGroupId] = useState(selectedGroupId);
  const [studentActionSuccess, setStudentActionSuccess] = useState('');

  // 3. Material Upload Form State
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [matTitle, setMatTitle] = useState('');
  const [matType, setMatType] = useState('PDF');
  const [matSessionId, setMatSessionId] = useState(groupSessions[0]?.id || '');
  const [matUrl, setMatUrl] = useState('');
  const [matSuccess, setMatSuccess] = useState('');

  // 4. Assistant Exam Publisher State
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [examCreationMode, setExamCreationMode] = useState<'ai' | 'manual' | 'upload'>('ai');
  const [examTitle, setExamTitle] = useState('');
  const [examSubject, setExamSubject] = useState('Sciences & Biology (Languages)');
  const [examCurriculum, setExamCurriculum] = useState<'languages' | 'arabic'>('languages');
  const [examDuration, setExamDuration] = useState(15);
  const [examPassing, setExamPassing] = useState(70);
  const [examTopicPrompt, setExamTopicPrompt] = useState('Atomic Structure & Chemical Bonding');
  const [examManualQText, setExamManualQText] = useState('');
  const [examManualOptA, setExamManualOptA] = useState('');
  const [examManualOptB, setExamManualOptB] = useState('');
  const [examManualOptC, setExamManualOptC] = useState('');
  const [examManualOptD, setExamManualOptD] = useState('');
  const [examManualCorrect, setExamManualCorrect] = useState('');
  const [examManualExpl, setExamManualExpl] = useState('');
  const [examFileUrl, setExamFileUrl] = useState('');
  const [examSuccess, setExamSuccess] = useState('');

  // 5. Batch Attendance State
  const sessionAttendance = db.getAttendance(selectedSessionId);
  const [attendanceDraft, setAttendanceDraft] = useState<
    Record<string, 'present' | 'absent' | 'late' | 'excused'>
  >(() => {
    const draft: Record<string, 'present' | 'absent' | 'late' | 'excused'> = {};
    enrolledStudents.forEach((s) => {
      const rec = sessionAttendance.find((a) => a.student_id === s.id);
      draft[s.id] = rec ? (rec.status as any) : 'present';
    });
    return draft;
  });
  const [attendanceSuccess, setAttendanceSuccess] = useState('');

  // 6. Strict Privacy Student Payment Lookup & Collection State
  const [selectedStudentLookupKey, setSelectedStudentLookupKey] = useState<string>(
    followUpRecords[0]?.student_id || 'stu-1'
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'cash' | 'instapay' | 'vodafone_cash' | 'bank_transfer' | 'other'>('vodafone_cash');
  const [payRefNumber, setPayRefNumber] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [paymentReceipt, setPaymentReceipt] = useState<{
    invoice: StudentPayment;
    amount: number;
    method: string;
    refNumber: string;
    studentName: string;
  } | null>(null);

  // 7. Complaint Resolution State
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [complaintReplyText, setComplaintReplyText] = useState('');
  const [complaintSuccess, setComplaintSuccess] = useState('');

  // 8. Broadcast Announcement State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTargetRole, setBroadcastTargetRole] = useState<'all' | 'student' | 'parent'>('all');
  const [broadcastSuccess, setBroadcastSuccess] = useState('');

  // Database queries
  const materials = db.getMaterials(selectedGroupId);
  const allInvoices = db.getStudentPayments();
  const allComplaints = db.getComplaints();
  const allExams = db.getExams();

  // Metrics for Group Tracker
  const totalStudentsInGroup = followUpRecords.length;
  const watchedCount = followUpRecords.filter((r) => r.video_watched).length;
  const examTakenCount = followUpRecords.filter((r) => r.exam_taken).length;
  const homeworkDoneCount = followUpRecords.filter((r) => r.assignment_submitted).length;

  const videoRate = totalStudentsInGroup > 0 ? Math.round((watchedCount / totalStudentsInGroup) * 100) : 0;
  const examRate = totalStudentsInGroup > 0 ? Math.round((examTakenCount / totalStudentsInGroup) * 100) : 0;
  const homeworkRate = totalStudentsInGroup > 0 ? Math.round((homeworkDoneCount / totalStudentsInGroup) * 100) : 0;

  // Selected student for private payment lookup
  const activeStudentProfile = db.getProfileById(selectedStudentLookupKey) || enrolledStudents[0];
  const activeStudentInvoice = allInvoices.find((i) => i.student_id === selectedStudentLookupKey);
  const activeStudentTransactions = db.getPaymentTransactions(activeStudentInvoice?.id || '');

  // Handlers
  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStuName.trim()) return;

    const student = db.registerStudentByAssistant({
      full_name: newStuName.trim(),
      email: newStuEmail.trim() || `stu.${Date.now()}@eduflow.edu`,
      phone: newStuPhone.trim(),
      grade_level: newStuGrade,
      parent_name: newStuParentName.trim(),
      parent_phone: newStuParentPhone.trim(),
      parent_email: newStuParentEmail.trim(),
      group_id: newStuGroupId,
    });

    setStudentActionSuccess(`تم تسجيل الطالب (${student.full_name}) وربطه برقم ولي الأمر بنجاح.`);
    setShowAddStudentModal(false);
    setNewStuName('');
    setNewStuPhone('');
    setNewStuEmail('');
    setNewStuParentName('');
    setNewStuParentPhone('');
    setTimeout(() => setStudentActionSuccess(''), 5000);
  };

  const handleUploadMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matTitle.trim()) return;

    db.uploadMaterialByAssistant({
      group_id: selectedGroupId,
      session_id: matSessionId || undefined,
      title: matTitle.trim(),
      file_type: matType,
      file_url: matUrl.trim() || undefined,
    });

    setMatSuccess(`تم رفع المذكرة التعليمية "${matTitle}" وإخطار جميع طلاب المجموعة.`);
    setShowAddMaterialModal(false);
    setMatTitle('');
    setMatUrl('');
    setTimeout(() => setMatSuccess(''), 5000);
  };

  const handleCreateExamByAssistant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim()) return;

    let questionsPayload = [
      {
        question_text: `What is the fundamental unit/concept studied in ${examTitle}?`,
        question_type: 'mcq' as const,
        options: ['Atom and Subatomic Particles', 'Random Variable', 'Hypothesis', 'None of the above'],
        correct_answer: 'Atom and Subatomic Particles',
        points: 1,
        explanation: 'According to the curriculum, the atomic structure defines chemical characteristics.',
      },
      {
        question_text: 'The kinetic energy of particles increases proportionally with temperature elevation.',
        question_type: 'true_false' as const,
        options: ['True (صواب)', 'False (خطأ)'],
        correct_answer: 'True (صواب)',
        points: 1,
        explanation: 'Heat directly accelerates molecular motion in matter.',
      },
      {
        question_text: 'Which subatomic particle carries a negative charge?',
        question_type: 'mcq' as const,
        options: ['Electron', 'Proton', 'Neutron', 'Photon'],
        correct_answer: 'Electron',
        points: 1,
        explanation: 'Electrons carry a single unit of negative elementary electric charge.',
      },
    ];

    if (examCreationMode === 'manual' && examManualQText.trim()) {
      questionsPayload = [
        {
          question_text: examManualQText.trim(),
          question_type: 'mcq' as const,
          options: [
            examManualOptA.trim() || 'Choice A',
            examManualOptB.trim() || 'Choice B',
            examManualOptC.trim() || 'Choice C',
            examManualOptD.trim() || 'Choice D',
          ],
          correct_answer: examManualCorrect.trim() || examManualOptA.trim() || 'Choice A',
          points: 1,
          explanation: examManualExpl.trim() || 'نموذج الإجابة المعتمد في الاختبار.',
        },
      ];
    }

    db.createExamWithQuestions({
      session_id: selectedSessionId,
      title: examTitle.trim(),
      subject: examSubject,
      grade_level: selectedGroup?.name || 'الصف الثاني الإعدادي - لغات',
      duration_minutes: examDuration,
      passing_score: examPassing,
      creator_role: 'assistant',
      creation_mode: examCreationMode === 'ai' ? 'ai_generated' : examCreationMode === 'manual' ? 'manual' : 'material_upload',
      curriculum_type: examCurriculum,
      material_url: examFileUrl || undefined,
      questions: questionsPayload,
    });

    setExamSuccess(`تم نشر الاختبار "${examTitle}" بنجاح وإشعار طلاب الحصة فوراً.`);
    setShowAddExamModal(false);
    setExamTitle('');
    setExamManualQText('');
    setExamManualOptA('');
    setExamManualOptB('');
    setExamManualOptC('');
    setExamManualOptD('');
    setExamManualCorrect('');
    setExamManualExpl('');
    setTimeout(() => setExamSuccess(''), 5000);
  };

  const handleSaveAttendance = () => {
    const records = Object.entries(attendanceDraft).map(([student_id, status]) => ({
      student_id,
      status,
    }));

    db.recordBatchAttendanceByAssistant(selectedSessionId, records);
    setAttendanceSuccess('تم حفظ سجل الحضور والغياب بنجاح، وإرسال تنبيهات الغياب الفورية لأولياء الأمور.');
    setTimeout(() => setAttendanceSuccess(''), 5000);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudentInvoice || payAmount <= 0) return;

    const res = db.recordPaymentVoucherByAssistant({
      student_payment_id: activeStudentInvoice.id,
      amount: payAmount,
      payment_method: payMethod,
      reference_number: payRefNumber || `VF-${Math.floor(10000000 + Math.random() * 90000000)}`,
      notes: payNotes,
      assistant_name: currentAssistant.full_name,
    });

    if (res.success && res.invoice) {
      setPaymentReceipt({
        invoice: res.invoice,
        amount: payAmount,
        method: payMethod,
        refNumber: res.transaction?.reference_number || 'TX-N/A',
        studentName: activeStudentProfile?.full_name || 'طالب',
      });
      setShowPaymentModal(false);
      setPayAmount(0);
      setPayRefNumber('');
      setPayNotes('');
    }
  };

  const handleSendParentFollowUp = () => {
    if (!followUpStudent) return;

    const res = db.sendParentFollowUpMessage(
      followUpStudent.student_id,
      followUpIssue,
      customFollowUpMsg.trim() || undefined
    );

    setFollowUpSuccess(
      `تم إرسال التنبيه الفوري لولي أمر الطالب (${res.studentName}). رقم الهاتف: ${res.parentPhone}`
    );

    // Open WhatsApp Web in new tab if URL available
    if (res.whatsappUrl) {
      window.open(res.whatsappUrl, '_blank');
    }

    setFollowUpStudent(null);
    setCustomFollowUpMsg('');
    setTimeout(() => setFollowUpSuccess(''), 6000);
  };

  const handleResolveComplaint = (complaintId: string) => {
    if (!complaintReplyText.trim()) return;
    db.resolveComplaintByAssistant(
      complaintId,
      complaintReplyText.trim(),
      'resolved',
      currentAssistant.full_name
    );
    setComplaintSuccess('تم حل الشكوى وإرسال الرد والتحديث للطالب وولي الأمر.');
    setSelectedComplaintId(null);
    setComplaintReplyText('');
    setTimeout(() => setComplaintSuccess(''), 5000);
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    const count = db.sendOperationalBroadcast({
      title: broadcastTitle.trim(),
      message: broadcastMessage.trim(),
      target_group_id: selectedGroupId,
      target_role: broadcastTargetRole,
    });

    setBroadcastSuccess(`تم بث التنبيه الفوري بنجاح إلى (${count}) من الطلاب وأولياء الأمور.`);
    setBroadcastTitle('');
    setBroadcastMessage('');
    setTimeout(() => setBroadcastSuccess(''), 5000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Assistant Header & Top Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-3xl shrink-0 shadow-inner">
            🧑‍💻
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-slate-900">{currentAssistant.full_name}</h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                المشرف التشغيلي والمنسق الإداري
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
              <span>{currentAssistant.email}</span>
              <span aria-hidden="true">·</span>
              <span className="text-teal-700 font-semibold">
                حلقة الوصل بين الطالب، المعلم، وولي الأمر
              </span>
            </p>
          </div>
        </div>

        {/* Group Selector Dropdown */}
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-600 whitespace-nowrap">المجموعة النشطة:</span>
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="text-xs sm:text-sm font-semibold bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {groups.map((g: CourseGroup) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Role Guard Info Banner */}
      <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200 text-xs sm:text-sm text-teal-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>نطاق صلاحيات المساعد الإداري (Operational Assistant):</strong> متابعة حضور الحصص، رصد من شاهد الفيديوهات ومن أدّى الامتحان ومن سلّم الواجب، رفع المذكرات والامتحانات نيابة عن المدرس، والتواصل المباشر مع أولياء الأمور عبر الواتساب.
          <span className="block mt-1 text-slate-600 font-medium">
            🔒 <strong>حماية الخصوصية المالية:</strong> لا تظهر الإجماليات العامة للأرباح أو مستحقات المدرسين، بل يقتصر العرض المالي على الفحص الفردي لكود الطالب (#stu) لتسجيل سندات القبض والإيصالات.
          </span>
        </div>
      </div>

      {/* Interactive Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('tracker')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'tracker'
              ? 'bg-white text-teal-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4 text-teal-600" />
          <span>مصفوفة المتابعة الأكاديمية (مين امتحن؟ مين سمع؟)</span>
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-white text-teal-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Laptop className="w-4 h-4 text-teal-600" />
          <span>ملخص المهام</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'students'
              ? 'bg-white text-teal-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-teal-600" />
          <span>تسجيل الطلاب ({enrolledStudents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('materials')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'materials'
              ? 'bg-white text-teal-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4 text-teal-600" />
          <span>المذكرات ({materials.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('exams')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'exams'
              ? 'bg-white text-teal-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-teal-600" />
          <span>نشر الامتحانات ({allExams.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'attendance'
              ? 'bg-white text-teal-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarCheck className="w-4 h-4 text-teal-600" />
          <span>رصد الحضور</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'payments'
              ? 'bg-white text-teal-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4 text-teal-600" />
          <span>فحص مدفوعات الطالب وسندات القبض</span>
        </button>

        <button
          onClick={() => setActiveTab('complaints')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'complaints'
              ? 'bg-white text-teal-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LifeBuoy className="w-4 h-4 text-teal-600" />
          <span>حل الشكاوى ({allComplaints.filter((c) => c.status === 'open').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('broadcast')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'broadcast'
              ? 'bg-white text-teal-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Send className="w-4 h-4 text-teal-600" />
          <span>بث التنبيهات</span>
        </button>
      </div>

      {/* TOASTS */}
      {followUpSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{followUpSuccess}</span>
        </div>
      )}
      {studentActionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{studentActionSuccess}</span>
        </div>
      )}
      {examSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{examSuccess}</span>
        </div>
      )}
      {matSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{matSuccess}</span>
        </div>
      )}
      {attendanceSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{attendanceSuccess}</span>
        </div>
      )}
      {complaintSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{complaintSuccess}</span>
        </div>
      )}
      {broadcastSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{broadcastSuccess}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: ACADEMIC TRACKER MATRIX (CORE FEATURE REQUESTED)  */}
      {/* "مين امتحن مين لا، مين سمع الفيديوز مين لا، مين حل الواجب" */}
      {/* ========================================================= */}
      {activeTab === 'tracker' && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-teal-50 text-teal-700">
                  <Activity className="w-5 h-5" />
                </span>
                <h2 className="text-xl font-black text-slate-900">
                  مصفوفة المتابعة الأكاديمية اللحظية (Student Academic Matrix)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                تتبع شامل: من شاهد الحصة وعدد المرات (0/3 إلى 3/3) • من أدى الامتحان ودرجته • من سلّم الواجب • ومتابعة فورية مع ولي الأمر
              </p>
            </div>

            {/* Session Selector */}
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-600">فحص الحصة:</span>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-teal-500"
              >
                {groupSessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    حصة {s.session_number}: {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3D Visual Completion Rings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  نسبة مشاهدة فيديو الحصة
                </span>
                <div className="text-2xl font-black text-cyan-700 mt-1">
                  {watchedCount} من {totalStudentsInGroup} طالب
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {totalStudentsInGroup - watchedCount} طلاب لم يشاهدوا الحصة بعد
                </div>
              </div>
              <CircularProgress percentage={videoRate} color="cyan" size={90} subLabel="مشاهدة" />
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  نسبة خوض الامتحان التقييمي
                </span>
                <div className="text-2xl font-black text-emerald-700 mt-1">
                  {examTakenCount} من {totalStudentsInGroup} طالب
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {totalStudentsInGroup - examTakenCount} طلاب متأخرين عن الامتحان
                </div>
              </div>
              <CircularProgress percentage={examRate} color="emerald" size={90} subLabel="امتحان" />
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  نسبة تسليم الواجب المنزلي
                </span>
                <div className="text-2xl font-black text-purple-700 mt-1">
                  {homeworkDoneCount} من {totalStudentsInGroup} طالب
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {totalStudentsInGroup - homeworkDoneCount} طلاب لم يسلّموا الشيت
                </div>
              </div>
              <CircularProgress percentage={homeworkRate} color="purple" size={90} subLabel="تسليم" />
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">تصفية سريعة:</span>
              <button
                type="button"
                onClick={() => setTrackerFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  trackerFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                الكل ({followUpRecords.length})
              </button>
              <button
                type="button"
                onClick={() => setTrackerFilter('unwatched')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  trackerFilter === 'unwatched'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                لم يشاهد الفيديو ({followUpRecords.filter((r) => !r.video_watched).length})
              </button>
              <button
                type="button"
                onClick={() => setTrackerFilter('no_exam')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  trackerFilter === 'no_exam'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                لم يمتحن ({followUpRecords.filter((r) => !r.exam_taken).length})
              </button>
              <button
                type="button"
                onClick={() => setTrackerFilter('no_homework')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  trackerFilter === 'no_homework'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                لم يحل الواجب ({followUpRecords.filter((r) => !r.assignment_submitted).length})
              </button>
            </div>

            {/* Student Search */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="بحث بكود الطالب أو اسمه..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pr-8 pl-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Main Tracking Matrix Table */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">الطالب والكود</th>
                    <th className="py-3.5 px-4">مشاهدة الفيديو (مرات 0/3)</th>
                    <th className="py-3.5 px-4">أداء الامتحان والدرجة</th>
                    <th className="py-3.5 px-4">تسليم الواجب المنزلي</th>
                    <th className="py-3.5 px-4">المصروفات</th>
                    <th className="py-3.5 px-4 text-center">إجراء المساعد مع ولي الأمر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {followUpRecords
                    .filter((r) => {
                      if (trackerFilter === 'unwatched') return !r.video_watched;
                      if (trackerFilter === 'no_exam') return !r.exam_taken;
                      if (trackerFilter === 'no_homework') return !r.assignment_submitted;
                      return true;
                    })
                    .filter((r) => {
                      const q = studentSearch.toLowerCase();
                      return (
                        r.student_name.toLowerCase().includes(q) ||
                        r.student_code.toLowerCase().includes(q) ||
                        (r.phone && r.phone.includes(q))
                      );
                    })
                    .map((rec) => (
                      <tr key={rec.student_id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Student Name & Code */}
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">👨‍🎓</span>
                            <div>
                              <div className="font-bold text-slate-900">{rec.student_name}</div>
                              <div className="text-[11px] text-teal-700 font-mono font-medium">
                                {rec.student_code}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Video Plays Badge */}
                        <td className="py-3.5 px-4">
                          <VideoPlayTrackerBadge
                            playCount={rec.video_play_count}
                            maxPlays={rec.max_plays || 3}
                          />
                        </td>

                        {/* Exam Badge */}
                        <td className="py-3.5 px-4">
                          <ExamTrackerBadge
                            examTaken={rec.exam_taken}
                            score={rec.exam_score}
                            total={rec.exam_total}
                            passed={rec.exam_passed}
                          />
                        </td>

                        {/* Assignment Badge */}
                        <td className="py-3.5 px-4">
                          <AssignmentTrackerBadge
                            submitted={rec.assignment_submitted}
                            score={rec.assignment_score}
                            maxScore={rec.assignment_score ? 15 : undefined}
                          />
                        </td>

                        {/* Payment Status (Private individual status) */}
                        <td className="py-3.5 px-4">
                          {rec.remaining_amount === 0 ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>مسدد بالكامل</span>
                            </span>
                          ) : (
                            <span className="text-amber-700 font-semibold">
                              متبقي {rec.remaining_amount} ج.م
                            </span>
                          )}
                        </td>

                        {/* Direct Follow-up Liaison Action */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setFollowUpStudent(rec);
                              // Auto pick likely issue
                              if (!rec.video_watched) setFollowUpIssue('missing_video');
                              else if (!rec.exam_taken) setFollowUpIssue('missing_exam');
                              else if (!rec.assignment_submitted) setFollowUpIssue('missing_homework');
                              else setFollowUpIssue('fees');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold border border-teal-200 transition-colors cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-teal-600" />
                            <span>متابعة مع ولي الأمر</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: OVERVIEW & SHORTCUTS                              */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Action Card 1: Student Registration */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center text-xl mb-4">
                  👨‍🎓
                </div>
                <h3 className="text-base font-bold text-slate-900">تسجيل وإلحاق طالب جديد</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  إدخال بيانات الطالب، ربطه بولي أمره، وإلحاقه بالمجموعة الدراسية المختارة.
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTab('students');
                  setShowAddStudentModal(true);
                }}
                className="mt-6 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة طالب جديد</span>
              </button>
            </div>

            {/* Action Card 2: Upload Material & Exams */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl mb-4">
                  📚
                </div>
                <h3 className="text-base font-bold text-slate-900">رفع المذكرات ونشر الامتحانات</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  توزيع مذكرات المراجعة والشيتات لطلاب المجموعة أو إنشاء امتحان تقييمي مؤتمت.
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTab('exams');
                  setShowAddExamModal(true);
                }}
                className="mt-6 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>نشر امتحان جديد</span>
              </button>
            </div>

            {/* Action Card 3: Record Payment */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center text-xl mb-4">
                  🧾
                </div>
                <h3 className="text-base font-bold text-slate-900">فحص مدفوعات الطالب وسندات القبض</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  البحث بكود الطالب (#stu)، تسجيل إيصال سداد نقدي أو فودافون كاش، وإصدار سند قبض معتمد.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('payments')}
                className="mt-6 w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>فحص كود الطالب والتحصيل</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: EXAM PUBLISHER FOR ASSISTANT                     */}
      {/* ========================================================= */}
      {activeTab === 'exams' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                إدارة ونشر الامتحانات التقييمية (Exams Management)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                يمكن للمساعد الإداري نشر الاختبارات التقييمية للحصص نيابة عن المعلم (توليد آلي بالذكاء الاصطناعي، إنشاء يدوي، أو رفع ورقة اختبار).
              </p>
            </div>
            <button
              onClick={() => setShowAddExamModal(true)}
              className="py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء ونشر اختبار جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allExams.map((ex: Exam) => (
              <div
                key={ex.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                      {ex.subject || 'Languages STEM'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {ex.duration_minutes} دقيقة • {ex.questions?.length || 0} أسئلة
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{ex.title}</h4>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span>نسبة النجاح: {ex.passing_score}%</span>
                    <span>·</span>
                    <span>
                      {ex.creator_role === 'assistant' ? 'نُشر بواسطة الأسستنت' : 'نُشر بواسطة المعلم'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    {new Date(ex.created_at).toLocaleDateString('ar-EG')}
                  </span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>متاح للطلاب</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: STUDENTS REGISTRATION & ROSTER                    */}
      {/* ========================================================= */}
      {activeTab === 'students' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                تسجيل الطلاب وإلحاقهم بالمجموعات
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                إضافة بيانات الطلاب والتأكد من ربطهم بأولياء أمورهم والمجموعات التعليمية
              </p>
            </div>
            <button
              onClick={() => setShowAddStudentModal(true)}
              className="py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل طالب جديد</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="البحث باسم الطالب أو رقم الهاتف أو كود الطالب..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Student Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">الطالب والكود</th>
                  <th className="py-3 px-4">الصف الدراسي</th>
                  <th className="py-3 px-4">رقم الهاتف</th>
                  <th className="py-3 px-4">بيانات ولي الأمر</th>
                  <th className="py-3 px-4">حالة المصروفات</th>
                  <th className="py-3 px-4 text-center">فحص السداد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enrolledStudents
                  .filter((s) => {
                    const q = studentSearch.toLowerCase();
                    return (
                      s.full_name.toLowerCase().includes(q) ||
                      (s.phone && s.phone.includes(q)) ||
                      s.id.includes(q)
                    );
                  })
                  .map((stu) => {
                    const studentInv = allInvoices.find((i) => i.student_id === stu.id);
                    const remaining = studentInv
                      ? (studentInv.remaining_amount ?? ((studentInv.amount || 450) - (studentInv.paid_amount || 0)))
                      : 0;

                    return (
                      <tr key={stu.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{stu.avatar || '👨‍🎓'}</span>
                            <div>
                              <div>{stu.full_name}</div>
                              <div className="text-[11px] text-teal-700 font-mono">#{stu.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{stu.grade_level}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-700">{stu.phone || '—'}</td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div>{stu.parent_name || '—'}</div>
                          <div className="text-[11px] text-slate-400">{stu.parent_email || ''}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          {studentInv?.status === 'paid' ? (
                            <span className="text-emerald-700 font-semibold">مسدد بالكامل ✓</span>
                          ) : (
                            <span className="text-amber-700 font-semibold">
                              متبقي {remaining} ج.م
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedStudentLookupKey(stu.id);
                              setActiveTab('payments');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold border border-teal-200 transition-colors cursor-pointer"
                          >
                            فحص الفواتير 💵
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: MATERIALS & STUDY GUIDES                         */}
      {/* ========================================================= */}
      {activeTab === 'materials' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                المذكرات والماتريال التعليمية المرفوعة
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                توزيع المذكرات وشيتات الواجب والملخصات لطلاب المجموعة ({selectedGroup?.name})
              </p>
            </div>
            <button
              onClick={() => setShowAddMaterialModal(true)}
              className="py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>رفع مذكرة جديدة</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map((m: CourseMaterial) => (
              <div
                key={m.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                      {m.file_type || 'PDF'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {m.download_count} تنزيل 📥
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{m.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    مجموعة: {selectedGroup?.name}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    {new Date(m.created_at).toLocaleDateString('ar-EG')}
                  </span>
                  <a
                    href={m.file_url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل ومعاينة</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: ATTENDANCE DESK                                   */}
      {/* ========================================================= */}
      {activeTab === 'attendance' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                شيت رصد الحضور والغياب الميداني
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                رصد حضور الطلاب بنقرة واحدة وإرسال تنبيه غياب تلقائي لولي الأمر عند الغياب
              </p>
            </div>

            {/* Session Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">الحصة:</span>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {groupSessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    حصة {s.session_number}: {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Roster of Students for Attendance */}
          <div className="divide-y divide-slate-100">
            {enrolledStudents.map((s) => {
              const currentStatus = attendanceDraft[s.id] || 'present';
              return (
                <div
                  key={s.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{s.avatar || '👨‍🎓'}</span>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{s.full_name}</div>
                      <div className="text-slate-400 text-xs">
                        {s.grade_level} • كود: #{s.id} • ولي الأمر: {s.parent_name || '—'}
                      </div>
                    </div>
                  </div>

                  {/* 4 Interactive Status Buttons */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() =>
                        setAttendanceDraft((prev) => ({ ...prev, [s.id]: 'present' }))
                      }
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        currentStatus === 'present'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🟢 حاضر
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setAttendanceDraft((prev) => ({ ...prev, [s.id]: 'absent' }))
                      }
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        currentStatus === 'absent'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🔴 غائب (إشعار ولي الأمر)
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setAttendanceDraft((prev) => ({ ...prev, [s.id]: 'late' }))
                      }
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        currentStatus === 'late'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🟡 متأخر
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setAttendanceDraft((prev) => ({ ...prev, [s.id]: 'excused' }))
                      }
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        currentStatus === 'excused'
                          ? 'bg-slate-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ⚪ بعذر
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              💡 الضغط على "غائب" يرسل إشعاراً فورياً على هاتف وحساب ولي الأمر.
            </div>
            <button
              onClick={handleSaveAttendance}
              className="py-2.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>حفظ كشف الحضور وتأكيد الإشعارات</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 7: STRICT PRIVACY STUDENT PAYMENT LOOKUP & COLLECTION */}
      {/* "ميقدرش يشوف التوتال، هو ليه فيو لكل طالب ودفع ازاي ودفع كام" */}
      {/* ========================================================= */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Strict Privacy Notice */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-teal-50 text-teal-700">
                  <Lock className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  فحص مدفوعات الطالب وسندات القبض (Student Financial Lookup)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                صلاحية المساعد الإداري مبنية على <strong>الفحص الفردي عبر كود الطالب (#stu)</strong> لتسجيل سندات القبض والإيصالات، مع حجب الإجماليات المالية الكلية للمنظومة لحماية سرية الإيرادات.
              </p>
            </div>

            {/* Student Code Lookup Dropdown */}
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-600 whitespace-nowrap">اختر الطالب:</span>
              <select
                value={selectedStudentLookupKey}
                onChange={(e) => setSelectedStudentLookupKey(e.target.value)}
                className="text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-teal-500"
              >
                {enrolledStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    #{s.id} - {s.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Receipt Banner if generated */}
          {paymentReceipt && (
            <div className="p-5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-teal-700" />
                  <span className="font-bold text-sm">تم إصدار سند القبض بنجاح للطالب ({paymentReceipt.studentName})</span>
                </div>
                <div className="text-xs text-teal-800 mt-1">
                  المبلغ المسدد: {paymentReceipt.amount} ج.م • طريقة التحصيل: {paymentReceipt.method} • رقم العملية: {paymentReceipt.refNumber}
                </div>
              </div>
              <button
                onClick={() => window.print()}
                className="py-2 px-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة سند القبض</span>
              </button>
            </div>
          )}

          {/* Selected Student Individual Financial Profile */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{activeStudentProfile?.avatar || '👨‍🎓'}</span>
                <div>
                  <h4 className="text-lg font-black text-slate-900">{activeStudentProfile?.full_name}</h4>
                  <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap mt-0.5">
                    <span className="font-mono text-teal-700 font-bold">#{activeStudentProfile?.id}</span>
                    <span>·</span>
                    <span>{activeStudentProfile?.grade_level}</span>
                    <span>·</span>
                    <span>ولي الأمر: {activeStudentProfile?.parent_name || '—'}</span>
                    <span>·</span>
                    <span>هاتف: {activeStudentProfile?.phone || '—'}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPayAmount(
                    activeStudentInvoice
                      ? (activeStudentInvoice.remaining_amount ?? ((activeStudentInvoice.amount || 450) - (activeStudentInvoice.paid_amount || 0)))
                      : 450
                  );
                  setShowPaymentModal(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>تسجيل سند قبض / سداد كاش أو فودافون كاش</span>
              </button>
            </div>

            {/* Individual Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 font-bold">إجمالي المصروفات المستحقة</span>
                <div className="text-xl font-black text-slate-900 mt-1">
                  {activeStudentInvoice ? (activeStudentInvoice.amount || 450) : 450} ج.م
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">عن الشهر الدراسي الحالي</div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-xs text-emerald-800 font-bold">المبلغ المسدد بالفعل</span>
                <div className="text-xl font-black text-emerald-800 mt-1">
                  {activeStudentInvoice ? (activeStudentInvoice.paid_amount || 0) : 0} ج.م
                </div>
                <div className="text-[11px] text-emerald-600 mt-0.5">موثق بإيصالات وسندات قبض</div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-xs text-amber-800 font-bold">المتبقي المطلوب تحصيله</span>
                <div className="text-xl font-black text-amber-800 mt-1">
                  {activeStudentInvoice
                    ? (activeStudentInvoice.remaining_amount ?? ((activeStudentInvoice.amount || 450) - (activeStudentInvoice.paid_amount || 0)))
                    : 450} ج.م
                </div>
                <div className="text-[11px] text-amber-700 mt-0.5">
                  {activeStudentInvoice?.status === 'paid' ? 'مسدد بالكامل ✓' : 'بانتظار السداد'}
                </div>
              </div>
            </div>

            {/* Transaction History for this Student */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                سجل إيصالات وعمليات السداد السابقة للطالب
              </h5>

              {activeStudentTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-y border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">رقم العملية</th>
                        <th className="py-2.5 px-3">تاريخ السداد</th>
                        <th className="py-2.5 px-3">المبلغ</th>
                        <th className="py-2.5 px-3">طريقة التحصيل</th>
                        <th className="py-2.5 px-3">المستلم</th>
                        <th className="py-2.5 px-3">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeStudentTransactions.map((tx: PaymentTransaction) => (
                        <tr key={tx.id}>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                            {tx.reference_number || tx.id}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {new Date(tx.created_at).toLocaleDateString('ar-EG')}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-emerald-700">{tx.amount} ج.م</td>
                          <td className="py-2.5 px-3 font-medium text-slate-700">
                            {tx.payment_method === 'vodafone_cash'
                              ? '📱 فودافون كاش'
                              : tx.payment_method === 'instapay'
                              ? '⚡ انستاباي'
                              : tx.payment_method === 'cash'
                              ? '💵 نقدي بالسنتر'
                              : tx.payment_method}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{tx.notes || currentAssistant.full_name}</td>
                          <td className="py-2.5 px-3">
                            <span className="text-emerald-700 font-bold">معتمد ✓</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                  لا توجد عمليات سداد مسجلة بعد لهذا الطالب. اضغط "تسجيل سند قبض" لإضافة إيصال.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 8: COMPLAINTS & LIAISON DESK                         */}
      {/* ========================================================= */}
      {activeTab === 'complaints' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              مكتب خدمة واستفسارات الطلاب وأولياء الأمور
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              حلقة الوصل لحل المشاكل الفنية، استفسارات المواعيد، وتنسيق الطلبات مع المدرسين
            </p>
          </div>

          <div className="space-y-4">
            {allComplaints.map((c) => (
              <div
                key={c.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{c.submitter_name || c.user_name || 'مستخدم'}</span>
                    <span className="text-[11px] text-slate-500">({(c.submitter_role || c.user_role) === 'parent' ? 'ولي أمر' : 'طالب'})</span>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      c.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {c.status === 'resolved' ? 'تم الحل والرد ✓' : 'بانتظار المتابعة'}
                  </span>
                </div>

                <div className="font-semibold text-slate-800 text-xs sm:text-sm">
                  📌 {c.subject || c.title || 'طلب أو استفسار'}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/80">
                  {c.description}
                </p>

                {c.status !== 'resolved' ? (
                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="اكتب رد المساعد الإداري وإجراء الحل..."
                      value={selectedComplaintId === c.id ? complaintReplyText : ''}
                      onChange={(e) => {
                        setSelectedComplaintId(c.id);
                        setComplaintReplyText(e.target.value);
                      }}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button
                      onClick={() => handleResolveComplaint(c.id)}
                      className="py-2 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                    >
                      إرسال الرد وحل التذكرة ✓
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                    تم حل المشكلة بواسطة المنسق والتواصل مع مقدم الشكوى.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 9: BROADCAST ANNOUNCEMENTS                           */}
      {/* ========================================================= */}
      {activeTab === 'broadcast' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs max-w-2xl mx-auto space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              بث تنبيه مباشر وفوري للطلاب وأولياء الأمور
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              إرسال إشعار عام بخصوص مواعيد الحصص، الامتحانات القادمة، أو مواعيد تسليم الشيتات
            </p>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                عنوان التنبيه *
              </label>
              <input
                type="text"
                required
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="مثال: تنبيه بخصوص موعد اختبار العلوم والفيزياء القادم..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                الفئة المستهدفة
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBroadcastTargetRole('all')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    broadcastTargetRole === 'all'
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  الجميع (طلاب + أولياء أمور)
                </button>
                <button
                  type="button"
                  onClick={() => setBroadcastTargetRole('student')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    broadcastTargetRole === 'student'
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  الطلاب فقط
                </button>
                <button
                  type="button"
                  onClick={() => setBroadcastTargetRole('parent')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    broadcastTargetRole === 'parent'
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  أولياء الأمور فقط
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                نص الرسالة *
              </label>
              <textarea
                rows={4}
                required
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="اكتب التنبيه هنا..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>إرسال وبث التنبيه للجميع الآن</span>
            </button>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: PARENT FOLLOW UP LIAISON (WHATSAPP + ALERT)       */}
      {/* ========================================================= */}
      {followUpStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-teal-50 text-teal-700">
                  <MessageCircle className="w-5 h-5" />
                </span>
                <h3 className="text-base font-black text-slate-900">
                  متابعة الطالب مع ولي الأمر (WhatsApp Bridge)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFollowUpStudent(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕ إغلاق
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1">
              <div><strong>الطالب:</strong> {followUpStudent.student_name} ({followUpStudent.student_code})</div>
              <div><strong>ولي الأمر:</strong> {followUpStudent.parent_name}</div>
              <div><strong>هاتف التواصل:</strong> {followUpStudent.phone || '01012345678'}</div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">نوع الإشعار المطلوب:</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setFollowUpIssue('missing_video')}
                  className={`p-2.5 rounded-xl border text-right font-bold transition-all ${
                    followUpIssue === 'missing_video'
                      ? 'bg-rose-50 border-rose-300 text-rose-800'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  📹 لم يشاهد الحصة
                </button>
                <button
                  type="button"
                  onClick={() => setFollowUpIssue('missing_exam')}
                  className={`p-2.5 rounded-xl border text-right font-bold transition-all ${
                    followUpIssue === 'missing_exam'
                      ? 'bg-amber-50 border-amber-300 text-amber-800'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  📝 لم يؤدِ الامتحان
                </button>
                <button
                  type="button"
                  onClick={() => setFollowUpIssue('missing_homework')}
                  className={`p-2.5 rounded-xl border text-right font-bold transition-all ${
                    followUpIssue === 'missing_homework'
                      ? 'bg-blue-50 border-blue-300 text-blue-800'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  📚 لم يسلّم الواجب
                </button>
                <button
                  type="button"
                  onClick={() => setFollowUpIssue('fees')}
                  className={`p-2.5 rounded-xl border text-right font-bold transition-all ${
                    followUpIssue === 'fees'
                      ? 'bg-purple-50 border-purple-300 text-purple-800'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  💵 تذكير بالمصروفات
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">نص الرسالة المخصص (اختياري):</label>
              <textarea
                rows={3}
                value={customFollowUpMsg}
                onChange={(e) => setCustomFollowUpMsg(e.target.value)}
                placeholder="اترك فارغاً لتوليد نص المتابعة النموذجي آلياً..."
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={handleSendParentFollowUp}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>إرسال وفتح واتساب WhatsApp 💬</span>
              </button>
              <button
                type="button"
                onClick={() => setFollowUpStudent(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: ADD EXAM (AI, MANUAL, OR WORKSHEET)             */}
      {/* ========================================================= */}
      {showAddExamModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-teal-50 text-teal-700">
                  <Wand2 className="w-5 h-5" />
                </span>
                <h3 className="text-base font-black text-slate-900">
                  نشر اختبار تقييمي جديد للطلاب 🎯
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddExamModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕ إغلاق
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setExamCreationMode('ai')}
                className={`py-2 rounded-lg font-bold transition-all ${
                  examCreationMode === 'ai' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                ✨ ذكاء اصطناعي (AI)
              </button>
              <button
                type="button"
                onClick={() => setExamCreationMode('manual')}
                className={`py-2 rounded-lg font-bold transition-all ${
                  examCreationMode === 'manual' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                ✍️ إنشاء يدوي (Manual)
              </button>
              <button
                type="button"
                onClick={() => setExamCreationMode('upload')}
                className={`py-2 rounded-lg font-bold transition-all ${
                  examCreationMode === 'upload' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                📄 رفع ورقة اختبار (PDF)
              </button>
            </div>

            <form onSubmit={handleCreateExamByAssistant} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">عنوان الاختبار *</label>
                <input
                  type="text"
                  required
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="مثال: Quiz 3: Periodic Table & Chemical Bonding"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">المادة والمحتوى</label>
                  <select
                    value={examSubject}
                    onChange={(e) => setExamSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="Sciences & Biology (Languages)">Sciences & Biology (Languages)</option>
                    <option value="Pure Mathematics & Geometry">Pure Mathematics & Geometry</option>
                    <option value="Physics & Chemistry - Sec 1">Physics & Chemistry - Sec 1</option>
                    <option value="علوم - عربي">العلوم العامة (عربي)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">نوع المنهاج</label>
                  <select
                    value={examCurriculum}
                    onChange={(e) => setExamCurriculum(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="languages">مدارس لغات (STEM / Languages)</option>
                    <option value="arabic">منهاج عربي عام</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">المدة (دقائق)</label>
                  <input
                    type="number"
                    min={5}
                    value={examDuration}
                    onChange={(e) => setExamDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">نسبة الاجتياز (%)</label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={examPassing}
                    onChange={(e) => setExamPassing(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Mode Details */}
              {examCreationMode === 'ai' && (
                <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-2">
                  <span className="font-bold text-teal-900 block">توليد الأسئلة ونموذج الإجابة بالذكاء الاصطناعي:</span>
                  <input
                    type="text"
                    value={examTopicPrompt}
                    onChange={(e) => setExamTopicPrompt(e.target.value)}
                    placeholder="موضوع الاختبار (مثال: Atomic Radius and Electronegativity)"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-teal-300 text-xs"
                  />
                  <p className="text-[11px] text-teal-800">
                    سيقوم الذكاء الاصطناعي بتوليد 3 أسئلة بنظام MCQ مع الخيارات والشرح النموذجي لمدارس اللغات فوراً.
                  </p>
                </div>
              )}

              {examCreationMode === 'manual' && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <span className="font-bold text-slate-900 block">إدخال السؤال يدوياً:</span>
                  <input
                    type="text"
                    placeholder="نص السؤال..."
                    value={examManualQText}
                    onChange={(e) => setExamManualQText(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs"
                  />
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      placeholder="خيار أ"
                      value={examManualOptA}
                      onChange={(e) => setExamManualOptA(e.target.value)}
                      className="px-2 py-1.5 bg-white rounded-lg border text-xs"
                    />
                    <input
                      type="text"
                      placeholder="خيار ب"
                      value={examManualOptB}
                      onChange={(e) => setExamManualOptB(e.target.value)}
                      className="px-2 py-1.5 bg-white rounded-lg border text-xs"
                    />
                    <input
                      type="text"
                      placeholder="خيار ج"
                      value={examManualOptC}
                      onChange={(e) => setExamManualOptC(e.target.value)}
                      className="px-2 py-1.5 bg-white rounded-lg border text-xs"
                    />
                    <input
                      type="text"
                      placeholder="خيار د"
                      value={examManualOptD}
                      onChange={(e) => setExamManualOptD(e.target.value)}
                      className="px-2 py-1.5 bg-white rounded-lg border text-xs"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="الإجابة الصحيحة بالضبط (مطابقة لأحد الخيارات)..."
                    value={examManualCorrect}
                    onChange={(e) => setExamManualCorrect(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white rounded-xl border border-slate-300 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="تفسير الإجابة وشرح الحل..."
                    value={examManualExpl}
                    onChange={(e) => setExamManualExpl(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              )}

              {examCreationMode === 'upload' && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <span className="font-bold text-slate-900 block">رابط ورقة الاختبار أو ملف PDF:</span>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/exam-sheet.pdf"
                    value={examFileUrl}
                    onChange={(e) => setExamFileUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              )}

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer transition-all"
                >
                  نشر الاختبار للطلاب فوراً 🚀
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddExamModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: ADD STUDENT                                     */}
      {/* ========================================================= */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-black text-slate-900">
              تسجيل طالب جديد وإلحاقه بالمجموعة 👨‍🎓
            </h3>
            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">اسم الطالب الرباعي *</label>
                <input
                  type="text"
                  required
                  value={newStuName}
                  onChange={(e) => setNewStuName(e.target.value)}
                  placeholder="محمد أحمد إبراهيم"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">هاتف الطالب</label>
                  <input
                    type="tel"
                    value={newStuPhone}
                    onChange={(e) => setNewStuPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">الصف الدراسي</label>
                  <select
                    value={newStuGrade}
                    onChange={(e) => setNewStuGrade(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="Prep 2 - Languages / لغات">Prep 2 - Languages (تانية إعدادي لغات)</option>
                    <option value="Sec 1 - STEM & Languages">Sec 1 - STEM & Languages (أولى ثانوي لغات)</option>
                    <option value="الصف الثاني الإعدادي">الصف الثاني الإعدادي (عام)</option>
                    <option value="الصف الثالث الإعدادي">الصف الثالث الإعدادي (عام)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">اسم ولي الأمر</label>
                  <input
                    type="text"
                    value={newStuParentName}
                    onChange={(e) => setNewStuParentName(e.target.value)}
                    placeholder="أ. أحمد إبراهيم"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">هاتف ولي الأمر</label>
                  <input
                    type="tel"
                    value={newStuParentPhone}
                    onChange={(e) => setNewStuParentPhone(e.target.value)}
                    placeholder="011XXXXXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">إلحاق بالمجموعة الدراسية</label>
                <select
                  value={newStuGroupId}
                  onChange={(e) => setNewStuGroupId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  {groups.map((g: CourseGroup) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer transition-all"
                >
                  حفظ وتسجيل الطالب
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: UPLOAD MATERIAL                                 */}
      {/* ========================================================= */}
      {showAddMaterialModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-black text-slate-900">
              رفع مذكرة وماتريال تعليمية للطلاب 📚
            </h3>
            <form onSubmit={handleUploadMaterial} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">عنوان المذكرة *</label>
                <input
                  type="text"
                  required
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                  placeholder="مثال: Revision Sheet: Biology Unit 1 - Languages"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">نوع الملف</label>
                  <select
                    value={matType}
                    onChange={(e) => setMatType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="PDF">ملف PDF</option>
                    <option value="Word">مستند Word</option>
                    <option value="شيت مراجعة">شيت مراجعة</option>
                    <option value="فيديو توضيحي">فيديو توضيحي</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">مرتبط بالحصة</label>
                  <select
                    value={matSessionId}
                    onChange={(e) => setMatSessionId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="">عام للمجموعة</option>
                    {groupSessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        حصة {s.session_number}: {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">رابط الملف / التحميل</label>
                <input
                  type="url"
                  value={matUrl}
                  onChange={(e) => setMatUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer transition-all"
                >
                  رفع المذكرة ونشرها للطلاب
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMaterialModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: RECORD PAYMENT FOR SPECIFIC STUDENT              */}
      {/* ========================================================= */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-black text-slate-900">
              تسجيل تحصيل وسداد وإصدار سند قبض 💵
            </h3>
            <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              الطالب: <strong>{activeStudentProfile?.full_name}</strong> (#{activeStudentProfile?.id})
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">المبلغ المحصل (ج.م) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">طريقة السداد *</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="vodafone_cash">📱 فودافون كاش</option>
                    <option value="instapay">⚡ انستاباي Instapay</option>
                    <option value="cash">💵 نقدي بالسنتر</option>
                    <option value="bank_transfer">🏦 تحويل بنكي</option>
                    <option value="other">💳 أخرى</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">رقم العملية / رقم الإيصال</label>
                <input
                  type="text"
                  value={payRefNumber}
                  onChange={(e) => setPayRefNumber(e.target.value)}
                  placeholder="مثال: VF-98765432 أو رقم إيصال الدفتر"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ملاحظات التحصيل</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="مثال: تم الاستلام نقداً في الحصة وإصدار سند قبض"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer transition-all"
                >
                  تأكيد السداد وإصدار سند القبض
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
