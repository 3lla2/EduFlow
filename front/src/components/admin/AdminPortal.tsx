import React, { useState } from 'react';
import {
  Shield,
  Users,
  CreditCard,
  DollarSign,
  LifeBuoy,
  Cpu,
  CheckCircle,
  AlertTriangle,
  Play,
  Check,
  X,
  RefreshCw,
  Search,
  Filter,
  Send,
  Zap,
} from 'lucide-react';
import { Profile, StudentPayment } from '../../types/database';
import { db } from '../../services/mockDatabase';

interface AdminPortalProps {
  currentAdmin: Profile;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ currentAdmin }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'billing' | 'teachers' | 'complaints' | 'automation'>('overview');

  // Search & filter
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');

  // Payment Recording Modal / Form
  const [recordPaymentId, setRecordPaymentId] = useState('');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'cash' | 'instapay' | 'vodafone_cash' | 'bank_transfer' | 'other'>('instapay');
  const [payNotes, setPayNotes] = useState('');
  const [paySuccessMsg, setPaySuccessMsg] = useState('');

  // Waive Modal / Form
  const [waivePaymentId, setWaivePaymentId] = useState('');
  const [waiveReason, setWaiveReason] = useState('');
  const [waiveSuccessMsg, setWaiveSuccessMsg] = useState('');

  // Complaint Resolution
  const [selectedComplaintId, setSelectedComplaintId] = useState('');
  const [adminResponseText, setAdminResponseText] = useState('');
  const [complaintStatus, setComplaintStatus] = useState<'in_progress' | 'resolved' | 'closed'>('resolved');
  const [complaintSuccessMsg, setComplaintSuccessMsg] = useState('');

  // Automation Simulation
  const [automationLogs, setAutomationLogs] = useState(() => db.getAutomationLogs());
  const [autoSimMsg, setAutoSimMsg] = useState('');

  // Database queries
  const allProfiles = db.getProfiles();
  const allPayments = db.getStudentPayments();
  const allEarnings = db.getTeacherEarnings();
  const allComplaints = db.getComplaints();
  const allGroups = db.getGroups();
  const allCourses = db.getCourses();

  // Metrics
  const studentsCount = allProfiles.filter((p) => p.role === 'student').length;
  const teachersCount = allProfiles.filter((p) => p.role === 'teacher').length;
  const parentsCount = allProfiles.filter((p) => p.role === 'parent').length;
  const totalInvoiced = allPayments.reduce((acc, p) => acc + p.amount, 0);
  const totalCollected = allPayments.reduce((acc, p) => acc + (p.paid_amount || 0), 0);
  const totalRemaining = totalInvoiced - totalCollected;

  // Filtered users
  const filteredUsers = allProfiles.filter((p) => {
    if (userRoleFilter !== 'all' && p.role !== userRoleFilter) return false;
    if (userSearch) {
      const q = userSearch.toLowerCase();
      return p.full_name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || (p.phone && p.phone.includes(q));
    }
    return true;
  });

  // Handle Record Payment
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordPaymentId || payAmount <= 0) return;

    const res = db.recordStudentPayment(recordPaymentId, payAmount, payMethod, currentAdmin.id, payNotes);
    if (res.success) {
      setPaySuccessMsg(res.message);
      setRecordPaymentId('');
      setPayAmount(0);
      setPayNotes('');
      setTimeout(() => setPaySuccessMsg(''), 4000);
    } else {
      alert(res.message);
    }
  };

  // Handle Waive Payment
  const handleWaivePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waivePaymentId || !waiveReason.trim()) return;

    const res = db.waiveStudentPayment(waivePaymentId, waiveReason, currentAdmin.id);
    if (res.success) {
      setWaiveSuccessMsg(res.message);
      setWaivePaymentId('');
      setWaiveReason('');
      setTimeout(() => setWaiveSuccessMsg(''), 4000);
    } else {
      alert(res.message);
    }
  };

  // Handle Resolve Complaint
  const handleResolveComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaintId) return;

    db.updateComplaint(selectedComplaintId, complaintStatus, adminResponseText, currentAdmin.id);
    setComplaintSuccessMsg('تم تحديث حالة الشكوى وحفظ الرد الرسمي وإشعار مقدم الطلب! ✉️');
    setSelectedComplaintId('');
    setAdminResponseText('');
    setTimeout(() => setComplaintSuccessMsg(''), 4000);
  };

  // Trigger Automation Test
  const handleSimulateWebhook = () => {
    db.addAutomationLog({
      trigger_name: 'Test Webhook: n8n Pipeline Sync & Report Run',
      source: 'n8n',
      payload_summary: 'فحص دوري لكافة درجات الطلاب ومزامنة بيانات الغياب والمصروفات مع جداول Google Sheets',
      status: 'success',
    });
    setAutomationLogs(db.getAutomationLogs());
    setAutoSimMsg('تم تشغيل سيناريو الأتمتة بنجاح وتوثيق الحدث في سجل n8n! ⚡');
    setTimeout(() => setAutoSimMsg(''), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Admin Header */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 border-2 border-purple-200 flex items-center justify-center text-3xl shadow-sm shrink-0">
            {currentAdmin.avatar || '⚡'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                {currentAdmin.full_name}
              </h2>
              <span className="bg-purple-50 text-purple-800 border border-purple-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                إدارة النظام العليا
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              التحكم الشامل في المستخدمين، الفوترة، مستحقات المعلمين، الشكاوى، وخطوط الأتمتة
            </p>
          </div>
        </div>

        <button
          onClick={handleSimulateWebhook}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
        >
          <Zap className="w-4 h-4" />
          <span>تشغيل اختبار أتمتة n8n</span>
        </button>
      </div>

      {autoSimMsg && (
        <div className="p-3 bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold rounded-xl animate-in fade-in">
          {autoSimMsg}
        </div>
      )}

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 block mb-1">إجمالي الطلاب</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-600">{studentsCount}</span>
            <Users className="w-5 h-5 text-blue-500/50" />
          </div>
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 block mb-1">المعلمون المعتمدون</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600">{teachersCount}</span>
            <Users className="w-5 h-5 text-emerald-500/50" />
          </div>
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 block mb-1">المحصل من المصروفات</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600">{totalCollected} EGP</span>
            <CreditCard className="w-5 h-5 text-emerald-500/50" />
          </div>
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 block mb-1">المتبقي للتحصيل</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-red-600">{totalRemaining} EGP</span>
            <AlertTriangle className="w-5 h-5 text-red-500/50" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'overview', label: '📊 ملخص المنظومة', icon: Shield },
          { id: 'users', label: '👥 إدارة المستخدمين والصلاحيات', icon: Users },
          { id: 'billing', label: '💵 الفوترة وتحصيل المدفوعات', icon: CreditCard },
          { id: 'teachers', label: '💼 صرف مستحقات المعلمين', icon: DollarSign },
          { id: 'complaints', label: `🎫 مكتب الشكاوى (${allComplaints.filter((c) => c.status !== 'resolved').length})`, icon: LifeBuoy },
          { id: 'automation', label: '⚙️ مركز الأتمتة و n8n', icon: Cpu },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <TabIcon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: System Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900">
              🏫 الكورسات والمجموعات الدراسية النشطة
            </h3>
            <div className="space-y-3">
              {allGroups.map((g) => (
                <div key={g.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900">{g.name}</h4>
                    <span className="text-slate-500">المعلم: {g.teacher_name}</span>
                  </div>
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-bold">
                    نشط • {g.active_students || 2} طلاب
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900">
              ⚡ تكامل الأتمتة والذكاء الاصطناعي (Active Webhooks)
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <span>Webhook: كويز مجتاز ➔ إشعار ولي الأمر بـ Gmail</span>
                <span className="text-emerald-700 font-bold">متصل بـ n8n 🟢</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <span>Sync: رصد الدرجات ➔ شيت الكنترول المركزي Google Sheets</span>
                <span className="text-emerald-700 font-bold">مفعل 🟢</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <span>RAG Service: توليد الفهارس المتجهة للمذكرات</span>
                <span className="text-blue-700 font-bold">Gemini Flash 🟢</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <span>Billing: كشف المتأخرات وإنشاء الفواتير الآلية</span>
                <span className="text-emerald-700 font-bold">مجدول يومياً 🟢</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Users Management */}
      {activeTab === 'users' && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                👥 سجل المستخدمين والصلاحيات
              </h3>
              <p className="text-xs text-slate-500">
                إدارة حسابات الطلاب والمعلمين وأولياء الأمور
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="بحث بالاسم أو البريد..."
                  className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                <option value="all">جميع الصلاحيات</option>
                <option value="student">طلاب</option>
                <option value="teacher">معلمون</option>
                <option value="parent">أولياء أمور</option>
                <option value="admin">إدارة</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold">
                  <th className="pb-3">المستخدم</th>
                  <th className="pb-3">البريد الإلكتروني</th>
                  <th className="pb-3">الهاتف</th>
                  <th className="pb-3">الصلاحية</th>
                  <th className="pb-3">المرحلة / البيانات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm">
                        {u.avatar || '👤'}
                      </span>
                      <span>{u.full_name}</span>
                    </td>
                    <td className="py-3.5 text-slate-600">{u.email}</td>
                    <td className="py-3.5 text-slate-500">{u.phone || 'غير مسجل'}</td>
                    <td className="py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          u.role === 'student'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : u.role === 'teacher'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : u.role === 'parent'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {u.role === 'student'
                          ? 'طالب'
                          : u.role === 'teacher'
                          ? 'معلم'
                          : u.role === 'parent'
                          ? 'ولي أمر'
                          : 'إدارة'}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-500">{u.grade_level || 'مسجل بالنظام'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Billing & Payments */}
      {activeTab === 'billing' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-1">
                💵 سجل الفواتير والمصروفات المدرسية
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                سجل فواتير الطلاب مع إمكانية تحصيل المبالغ أو إعفاء الحالات الإنسانية
              </p>

              {paySuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl mb-4">
                  {paySuccessMsg}
                </div>
              )}
              {waiveSuccessMsg && (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold rounded-xl mb-4">
                  {waiveSuccessMsg}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold">
                      <th className="pb-3">الطالب</th>
                      <th className="pb-3">البيان</th>
                      <th className="pb-3">المبلغ</th>
                      <th className="pb-3">المسدد</th>
                      <th className="pb-3">المتبقي</th>
                      <th className="pb-3">الحالة</th>
                      <th className="pb-3">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 font-bold text-slate-900">{p.student_name}</td>
                        <td className="py-3.5 text-slate-600">{p.period_label}</td>
                        <td className="py-3.5 font-bold">{p.amount} {p.currency}</td>
                        <td className="py-3.5 text-emerald-700 font-bold">{p.paid_amount || 0}</td>
                        <td className="py-3.5 text-red-600 font-bold">{p.remaining_amount || 0}</td>
                        <td className="py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              p.status === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : p.status === 'partially_paid'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : p.status === 'overdue'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : p.status === 'waived'
                                ? 'bg-slate-100 text-slate-700 border border-slate-300'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {p.status === 'paid'
                              ? 'مسدد بالكامل'
                              : p.status === 'partially_paid'
                              ? 'مسدد جزئياً'
                              : p.status === 'overdue'
                              ? 'متأخر'
                              : p.status === 'waived'
                              ? 'معفى'
                              : 'غير مسدد'}
                          </span>
                        </td>
                        <td className="py-3.5">
                          {p.status !== 'paid' && p.status !== 'waived' && (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => {
                                  setRecordPaymentId(p.id);
                                  setPayAmount(p.remaining_amount || p.amount);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px]"
                              >
                                تحصيل
                              </button>
                              <button
                                onClick={() => setWaivePaymentId(p.id)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px]"
                              >
                                إعفاء
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Payment Actions Box */}
          <div className="space-y-4">
            {/* Record Payment Box */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm">
              <h4 className="font-black text-slate-900 text-sm mb-1">
                💳 تسجيل تحصيل دفعة مالية
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                توثيق المعاملة وإصدار إشعار للطالب
              </p>

              <form onSubmit={handleRecordPayment} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">اختر الفاتورة:</label>
                  <select
                    required
                    value={recordPaymentId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setRecordPaymentId(id);
                      const f = allPayments.find((p) => p.id === id);
                      if (f) setPayAmount(f.remaining_amount || f.amount);
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="">-- اختر فاتورة مستحقة --</option>
                    {allPayments
                      .filter((p) => p.status !== 'paid' && p.status !== 'waived')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.student_name} - {p.period_label} ({p.remaining_amount || p.amount} EGP)
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">المبلغ المحصل:</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">طريقة الدفع:</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as typeof payMethod)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="instapay">إنستاباي (Instapay)</option>
                    <option value="vodafone_cash">فودافون كاش (Vodafone Cash)</option>
                    <option value="cash">نقدي بالخزينة (Cash)</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">ملاحظات التحصيل:</label>
                  <input
                    type="text"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="رقم العملية / كود الإيصال..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  توثيق السداد
                </button>
              </form>
            </div>

            {/* Waive Payment Box */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm">
              <h4 className="font-black text-slate-900 text-sm mb-1">
                ⚖️ إعفاء فاتورة (Waiver)
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                يتطلب إدخال سبب رسمي ملزم وفق قواعد الحوكمة
              </p>

              <form onSubmit={handleWaivePayment} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">اختر الفاتورة:</label>
                  <select
                    required
                    value={waivePaymentId}
                    onChange={(e) => setWaivePaymentId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="">-- اختر فاتورة للإعفاء --</option>
                    {allPayments
                      .filter((p) => p.status !== 'paid' && p.status !== 'waived')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.student_name} - {p.period_label}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">سبب الإعفاء (إلزامي):</label>
                  <input
                    type="text"
                    required
                    value={waiveReason}
                    onChange={(e) => setWaiveReason(e.target.value)}
                    placeholder="مثال: منحة تفوق دراسي / خصم أبناء عاملين..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  اعتماد الإعفاء الرسمي
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Teacher Earnings Approval */}
      {activeTab === 'teachers' && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              💼 مستحقات وأرباح المعلمين
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              مراجعة الحصص المنفذة واعتماد صرف المستحقات المالية
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold">
                    <th className="pb-3">المعلم</th>
                    <th className="pb-3">بيان الحصة</th>
                    <th className="pb-3">المجموعة</th>
                    <th className="pb-3">المبلغ</th>
                    <th className="pb-3">الحالة</th>
                    <th className="pb-3">إجراء الصرف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allEarnings.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/50">
                      <td className="py-4 font-bold text-slate-900">{e.teacher_name}</td>
                      <td className="py-4 text-slate-700">{e.description}</td>
                      <td className="py-4 text-slate-500">{e.group_name}</td>
                      <td className="py-4 font-black text-purple-700">{e.amount} {e.currency}</td>
                      <td className="py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            e.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : e.status === 'approved'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {e.status === 'paid' ? 'تم الصرف' : e.status === 'approved' ? 'معتمد' : 'معلق'}
                        </span>
                      </td>
                      <td className="py-4">
                        {e.status === 'pending' && (
                          <button
                            onClick={() => db.approveTeacherEarning(e.id)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs"
                          >
                            اعتماد
                          </button>
                        )}
                        {e.status === 'approved' && (
                          <button
                            onClick={() => db.payTeacherEarning(e.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
                          >
                            صرف وتحويل
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Complaints Desk */}
      {activeTab === 'complaints' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-1">
                🎫 مكتب الشكاوى والاستفسارات المركزية
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                استقبال طلبات وملاحظات الطلاب وأولياء الأمور والرد الرسمي عليها
              </p>

              {complaintSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl mb-4">
                  {complaintSuccessMsg}
                </div>
              )}

              <div className="space-y-4">
                {allComplaints.map((c) => (
                  <div
                    key={c.id}
                    className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/50 space-y-3"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <strong className="text-slate-900 text-sm">{c.submitter_name}</strong>
                        <span className="text-slate-400 mr-2">({c.category})</span>
                      </div>
                      <span
                        className={`px-3 py-0.5 rounded-full font-bold ${
                          c.status === 'resolved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : c.status === 'in_progress'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {c.status === 'resolved' ? 'تم الحل والرد ✓' : c.status === 'in_progress' ? 'قيد المعالجة' : 'مفتوحة'}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm">{c.subject}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{c.description}</p>

                    {c.admin_response ? (
                      <div className="p-3 bg-white border border-emerald-200 rounded-xl text-xs space-y-1">
                        <strong className="text-emerald-800">الرد الرسمي المعتمد:</strong>
                        <p className="text-slate-700">{c.admin_response}</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedComplaintId(c.id)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg"
                      >
                        الرد على الشكوى ✍️
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Response Form */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm h-fit">
            <h4 className="font-black text-slate-900 text-base mb-1">
              ✍️ نموذج الرد الإداري
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              سيصل الرد مباشرة لمقدم الشكوى في حسابه
            </p>

            <form onSubmit={handleResolveComplaint} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">اختر التذكرة:</label>
                <select
                  required
                  value={selectedComplaintId}
                  onChange={(e) => setSelectedComplaintId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="">-- اختر شكوى للرد --</option>
                  {allComplaints.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.submitter_name} - {c.subject}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">تحديث الحالة:</label>
                <select
                  value={complaintStatus}
                  onChange={(e) => setComplaintStatus(e.target.value as typeof complaintStatus)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="resolved">تم الحل والرد (Resolved)</option>
                  <option value="in_progress">قيد المتابعة الفنية (In Progress)</option>
                  <option value="closed">إغلاق التذكرة (Closed)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">نص الرد الرسمي:</label>
                <textarea
                  required
                  rows={4}
                  value={adminResponseText}
                  onChange={(e) => setAdminResponseText(e.target.value)}
                  placeholder="اكتب الرد الرسمي والحل المتخذ..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold resize-y"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                اعتماد الرد وإشعار المستخدم
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 6: Automation & n8n */}
      {activeTab === 'automation' && (
        <div className="space-y-6">
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>⚙️ مركز تحكم خطوط الأتمتة (n8n & Gemini Automation Engine)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  مراقبة سجل الأحداث التلقائية والـ Webhooks المنفذة لحظياً
                </p>
              </div>

              <button
                onClick={handleSimulateWebhook}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>إطلاق تجربة فورية للأتمتة</span>
              </button>
            </div>

            <div className="space-y-3">
              {automationLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded text-[11px]">
                        {log.source.toUpperCase()}
                      </span>
                      <strong className="text-slate-900 text-sm">{log.trigger_name}</strong>
                    </div>
                    <p className="text-slate-600">{log.payload_summary}</p>
                  </div>

                  <div className="text-left shrink-0">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-bold">
                      نجاح ✓
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {new Date(log.timestamp).toLocaleTimeString('ar-EG')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
