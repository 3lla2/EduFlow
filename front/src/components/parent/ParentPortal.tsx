import React, { useState } from 'react';
import {
  Users,
  Award,
  CalendarCheck,
  CreditCard,
  MessageSquare,
  LifeBuoy,
  CheckCircle,
  AlertCircle,
  FileText,
  Clock,
  Phone,
  Mail,
} from 'lucide-react';
import { Profile } from '../../types/database';
import { db } from '../../services/mockDatabase';

interface ParentPortalProps {
  currentParent: Profile;
}

export const ParentPortal: React.FC<ParentPortalProps> = ({ currentParent }) => {
  // Find linked children
  const linkedStudentIds = db.state.parentLinks
    .filter((l) => l.parent_id === currentParent.id && l.status === 'approved')
    .map((l) => l.student_id);

  const children = db.getStudents().filter((s) => linkedStudentIds.includes(s.id));
  const [selectedChildId, setSelectedChildId] = useState(children[0]?.id || 'stu-1');
  const activeChild = children.find((c) => c.id === selectedChildId) || children[0];

  const [activeTab, setActiveTab] = useState<'exams' | 'attendance' | 'payments' | 'notes' | 'complaints'>('exams');

  // Child data
  const childAttempts = db.getExamAttempts(activeChild?.id);
  const childAttendance = db.getAttendance(undefined, activeChild?.id);
  const childPayments = db.getStudentPayments(activeChild?.id);
  const childNotes = db.getStudentNotes(activeChild?.id);
  const parentComplaints = db.getComplaints(currentParent.id);

  // Performance calculations
  const totalScore = childAttempts.reduce((acc, a) => acc + a.score, 0);
  const maxScore = childAttempts.reduce((acc, a) => acc + a.total_score, 0);
  const avgExamPct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 100;

  const presentCount = childAttendance.filter((a) => a.status === 'present').length;
  const lateCount = childAttendance.filter((a) => a.status === 'late').length;
  const attRate = childAttendance.length > 0 ? Math.round(((presentCount + lateCount) / childAttendance.length) * 100) : 100;

  const pendingPaymentsAmount = childPayments
    .filter((p) => p.status === 'unpaid' || p.status === 'partially_paid' || p.status === 'overdue')
    .reduce((acc, p) => acc + (p.remaining_amount ?? p.amount), 0);

  // Complaint Form
  const [subject, setSubject] = useState('');
  const [desc, setDesc] = useState('');
  const [complaintSuccess, setComplaintSuccess] = useState('');

  const handleSubmitComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !desc.trim()) return;

    db.submitComplaint({
      submitted_by: currentParent.id,
      subject,
      description: desc,
      category: 'استفسار ومتابعة ولي أمر',
      priority: 'normal',
    });

    setComplaintSuccess('تم إرسال طلبكم لإدارة المنظومة بنجاح وسيتم التواصل معكم. 📩');
    setSubject('');
    setDesc('');
    setTimeout(() => setComplaintSuccess(''), 4000);
  };

  if (!activeChild) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center text-slate-500">
        لا يوجد أبناء مرتبطين بهذا الحساب حالياً.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Parent Header */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700 border-2 border-amber-200 flex items-center justify-center text-3xl shadow-sm shrink-0">
            {currentParent.avatar || '👨‍💼'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                {currentParent.full_name}
              </h2>
              <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                بوابة ولي الأمر المعتمدة
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              متابعة المستوى الأكاديمي، الحضور والغياب، المصروفات، وملاحظات المعلمين
            </p>
          </div>
        </div>

        {/* Children Switcher (if multiple) */}
        {children.length > 1 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500 shrink-0">اختر الابن:</span>
            <div className="flex gap-2">
              {children.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedChildId(c.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    c.id === selectedChildId
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {c.full_name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected Child KPI Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl shrink-0">
              {activeChild.avatar || '👨‍🎓'}
            </div>
            <div>
              <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">
                تقرير متابعة الطالب
              </span>
              <h3 className="text-2xl font-black mt-0.5">{activeChild.full_name}</h3>
              <p className="text-xs text-blue-200 mt-1">
                {activeChild.grade_level} • كود الطالب: #{activeChild.id}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 text-center border border-white/10">
              <span className="text-[11px] text-blue-200 block mb-0.5">نسبة الحضور</span>
              <span className="text-xl font-black text-white">{attRate}%</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 text-center border border-white/10">
              <span className="text-[11px] text-blue-200 block mb-0.5">متوسط الامتحانات</span>
              <span className="text-xl font-black text-emerald-300">{avgExamPct}%</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 text-center border border-white/10">
              <span className="text-[11px] text-blue-200 block mb-0.5">الاختبارات المنجزة</span>
              <span className="text-xl font-black text-white">{childAttempts.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 text-center border border-white/10">
              <span className="text-[11px] text-blue-200 block mb-0.5">المستحقات المعلقة</span>
              <span className="text-xl font-black text-amber-300">{pendingPaymentsAmount} EGP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'exams', label: '📈 نتائج الامتحانات', icon: Award },
          { id: 'attendance', label: '📅 سجل الحضور والغياب', icon: CalendarCheck },
          { id: 'payments', label: '💳 المصروفات والمدفوعات', icon: CreditCard },
          { id: 'notes', label: '📝 ملاحظات المعلمين', icon: FileText },
          { id: 'complaints', label: '📩 التواصل مع الإدارة', icon: LifeBuoy },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <TabIcon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Exams */}
      {activeTab === 'exams' && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              📈 نتائج وتقارير اختبارات الطالب
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              سجل تفصيلي بالاختبارات والدرجات والنسب المئوية المحققة
            </p>

            <div className="space-y-4">
              {childAttempts.map((att) => {
                const pct = Math.round((att.score / (att.total_score || 1)) * 100);
                return (
                  <div
                    key={att.id}
                    className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4 flex-wrap"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold mb-1">
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                          {att.subject || 'اختبار تقييمي'}
                        </span>
                        <span className="text-slate-400">
                          تاريخ التسليم: {new Date(att.submitted_at || att.started_at).toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-base">{att.exam_title}</h4>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-black text-slate-900">
                          {att.score} / {att.total_score}
                        </div>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            att.passed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {att.passed ? `اجتياز بتفوق (${pct}%) ✓` : `لم يجتز (${pct}%)`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Attendance */}
      {activeTab === 'attendance' && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-4">
            📅 سجل حضور وغياب الابن بالحصة
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold">
                  <th className="pb-3">الحصة</th>
                  <th className="pb-3">التاريخ</th>
                  <th className="pb-3">حالة الحضور</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {childAttendance.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 font-bold text-slate-900">{a.session_title || `حصة ${a.session_number}`}</td>
                    <td className="py-3.5 text-slate-500">
                      {new Date(a.recorded_at).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`px-3 py-1 rounded-full font-bold text-[11px] ${
                          a.status === 'present'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : a.status === 'late'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {a.status === 'present' ? 'حاضر ✓' : a.status === 'late' ? 'حاضر بتأخير' : 'غائب ✗'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Payments */}
      {activeTab === 'payments' && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-1">
            💳 المصروفات والمدفوعات للأبناء
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            بيان الاشتراكات الشهرية والفواتير المستحقة والمسددة
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold">
                  <th className="pb-3">البيان</th>
                  <th className="pb-3">القيمة</th>
                  <th className="pb-3">المسدد</th>
                  <th className="pb-3">المتبقي</th>
                  <th className="pb-3">تاريخ الاستحقاق</th>
                  <th className="pb-3">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {childPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 font-bold text-slate-900">{p.period_label || 'اشتراك شهري'}</td>
                    <td className="py-3.5 font-bold">{p.amount} {p.currency}</td>
                    <td className="py-3.5 text-emerald-700 font-bold">{p.paid_amount || 0} {p.currency}</td>
                    <td className="py-3.5 text-red-600 font-bold">{p.remaining_amount || 0} {p.currency}</td>
                    <td className="py-3.5 text-slate-500">{p.due_date}</td>
                    <td className="py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          p.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.status === 'partially_paid'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {p.status === 'paid' ? 'مسدد بالكامل ✓' : p.status === 'partially_paid' ? 'مسدد جزئياً' : 'مستحق السداد'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Notes */}
      {activeTab === 'notes' && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-black text-slate-900 mb-1">
            📝 تقارير وملاحظات المعلم الدورية
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            تقييمات المستوى والتفاعل داخل الحصة
          </p>

          {childNotes.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
              لا توجد ملاحظات مسجلة حتى الآن.
            </div>
          ) : (
            <div className="space-y-3">
              {childNotes.map((n) => (
                <div key={n.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span className="font-bold text-slate-800">✍️ {n.teacher_name || 'معلم المادة'}</span>
                    <span>{new Date(n.created_at).toLocaleDateString('ar-EG')}</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">"{n.note}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Complaints */}
      {activeTab === 'complaints' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-1">
                📬 تذاكر واستفسارات ولي الأمر
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                سجل المراسلات والردود الرسمية من إدارة EduFlow
              </p>

              <div className="space-y-4">
                {parentComplaints.map((c) => (
                  <div key={c.id} className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-bold">
                        {c.category}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold ${
                          c.status === 'resolved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {c.status === 'resolved' ? 'تم الرد والحل ✓' : 'قيد المتابعة'}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm">{c.subject}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{c.description}</p>

                    {c.admin_response && (
                      <div className="p-3 bg-white border border-emerald-200 rounded-xl text-xs space-y-1">
                        <strong className="text-emerald-800">رد الإدارة:</strong>
                        <p className="text-slate-700">{c.admin_response}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm h-fit">
            <h4 className="font-black text-slate-900 text-base mb-1">
              📩 إرسال استفسار أو طلب
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              يصل مباشرة للإدارة لمتابعته
            </p>

            {complaintSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl mb-4">
                {complaintSuccess}
              </div>
            )}

            <form onSubmit={handleSubmitComplaint} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">موضوع الطلب:</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="عنوان مختصر..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">تفاصيل الرسالة:</label>
                <textarea
                  required
                  rows={4}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="اكتب استفسارك أو ملاحظتك للإدارة..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold resize-y"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                إرسال الطلب الآن
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
