import React, { useState } from 'react';
import {
  GraduationCap,
  Users,
  UserCheck,
  Shield,
  Laptop,
  ArrowRight,
  Lock,
  Mail,
  User,
  Phone,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Profile, CourseGroup } from '../../types/database';
import { db } from '../../services/mockDatabase';

import { EduFlowLogo } from '../common/EduFlowLogo';

interface LoginPageProps {
  onLoginSuccess: (profile: Profile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [identifier, setIdentifier] = useState('omar.hazem@eduflow.edu');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regGrade, setRegGrade] = useState('Prep 2 - Languages / لغات');
  const [regParentName, setRegParentName] = useState('');
  const [regParentPhone, setRegParentPhone] = useState('');
  const [regGroupId, setRegGroupId] = useState('g-1');
  const [regSuccess, setRegSuccess] = useState('');

  const groups = db.getGroups();

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    setTimeout(() => {
      const res = db.login(identifier, password);
      setIsLoading(false);
      if (res.success && res.profile) {
        onLoginSuccess(res.profile);
      } else {
        setLoginError(res.error || 'فشل تسجيل الدخول. يرجى التحقق من صحة البيانات.');
      }
    }, 250);
  };

  const handleQuickLogin = (userId: string) => {
    const profile = db.getProfileById(userId);
    if (profile) {
      db.setCurrentUser(profile.id);
      onLoginSuccess(profile);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      setLoginError('يرجى كتابة الاسم الكامل للطالب');
      return;
    }

    const email = regEmail.trim() || `stu.${Date.now()}@eduflow.edu`;
    const newStudent = db.registerStudentByAssistant({
      full_name: regName.trim(),
      email,
      phone: regPhone.trim(),
      grade_level: regGrade,
      parent_name: regParentName.trim(),
      parent_phone: regParentPhone.trim(),
      group_id: regGroupId,
    });

    setRegSuccess(`تم إنشاء حساب الطالب (${newStudent.full_name}) بنجاح! يتم الدخول الآن...`);
    setTimeout(() => {
      db.setCurrentUser(newStudent.id);
      onLoginSuccess(newStudent);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl relative z-10">
        {/* Brand Header with 3D EduFlow Logo */}
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <EduFlowLogo size="hero" theme="dark" showSubtitle={true} className="mb-2" />
          <p className="text-slate-400 text-xs sm:text-sm mt-3 max-w-lg mx-auto leading-relaxed">
            المنظومة التعليمية الذكية لمدارس اللغات والتعليم العام • ربط مباشر بين الطالب، المعلم، المساعد الإداري، وولي الأمر.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Auth Card (7 cols) */}
          <div className="lg:col-span-7 bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            {/* Tabs */}
            <div className="flex p-1 bg-slate-900/60 rounded-2xl mb-6 border border-slate-700/50">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setLoginError('');
                }}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-150 ${
                  activeTab === 'login'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                تسجيل الدخول
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setLoginError('');
                }}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-150 ${
                  activeTab === 'register'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                تسجيل طالب جديد
              </button>
            </div>

            {/* Error / Success messages */}
            {loginError && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in duration-150">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            {regSuccess && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in duration-150">
                <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
                <span>{regSuccess}</span>
              </div>
            )}

            {/* LOGIN FORM */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    البريد الإلكتروني / رقم الهاتف / كود المستخدم
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="مثال: omar.hazem@eduflow.edu أو 01012345678"
                      className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      كلمة المرور
                    </label>
                    <span className="text-[11px] text-slate-400">
                      (أي كلمة سر للتجربة: 123456)
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pr-10 pl-10 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>الدخول إلى لوحة التحكم</span>
                        <ArrowRight className="w-4 h-4 rotate-180" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* REGISTER STUDENT FORM */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    الاسم الرباعي للطالب *
                  </label>
                  <div className="relative">
                    <User className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="مثال: يوسف حسام الدين السيد"
                      className="w-full pr-10 pl-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      هاتف الطالب
                    </label>
                    <div className="relative">
                      <Phone className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="010XXXXXXXX"
                        className="w-full pr-10 pl-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      الصف الدراسي
                    </label>
                    <select
                      value={regGrade}
                      onChange={(e) => setRegGrade(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="الصف الأول الإعدادي">الصف الأول الإعدادي</option>
                      <option value="الصف الثاني الإعدادي">الصف الثاني الإعدادي</option>
                      <option value="الصف الثالث الإعدادي">الصف الثالث الإعدادي</option>
                      <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                      <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      اسم ولي الأمر
                    </label>
                    <input
                      type="text"
                      value={regParentName}
                      onChange={(e) => setRegParentName(e.target.value)}
                      placeholder="أ. حسام الدين السيد"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      هاتف ولي الأمر
                    </label>
                    <input
                      type="tel"
                      value={regParentPhone}
                      onChange={(e) => setRegParentPhone(e.target.value)}
                      placeholder="011XXXXXXXX"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    المجموعة الدراسية المطلوب الانضمام لها
                  </label>
                  <select
                    value={regGroupId}
                    onChange={(e) => setRegGroupId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {groups.map((g: CourseGroup) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>إنهاء التسجيل وتفعيل الحساب فوراً</span>
                    <CheckCircle className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Quick Persona Demo Switcher (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                  دخول تجريبي سريع للشخصيات (One-Click)
                </h3>
              </div>
              <p className="text-slate-400 text-xs mb-4 leading-relaxed">
                اضغط على أي حساب لاستكشاف الواجهة والصلاحيات المخصصة له مباشرة:
              </p>

              <div className="space-y-2.5">
                {/* 1. Student */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('stu-1')}
                  className="w-full text-right p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-700/80 hover:border-blue-500/60 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👨‍🎓</span>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                        عمر حازم السيد
                      </h4>
                      <div className="text-[11px] text-slate-400">
                        طالب • الصف الثاني الإعدادي
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    طالب
                  </span>
                </button>

                {/* 1.B Languages Student */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('stu-4')}
                  className="w-full text-right p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-700/80 hover:border-cyan-500/60 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👩‍🔬</span>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                        جودي كريم الشناوي (Judy Karim)
                      </h4>
                      <div className="text-[11px] text-slate-400">
                        طالبة • Sec 1 STEM & Languages (لغات)
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    طالبة لغات
                  </span>
                </button>

                {/* 2. Assistant / Coordinator (CRITICAL NEW ROLE) */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('ast-1')}
                  className="w-full text-right p-3 rounded-2xl bg-gradient-to-r from-teal-950/40 to-slate-900/80 hover:bg-slate-900 border border-teal-600/40 hover:border-teal-400 transition-all flex items-center justify-between group cursor-pointer shadow-sm shadow-teal-500/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🧑‍💻</span>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors flex items-center gap-1.5">
                        <span>أ. كريم نبيل</span>
                        <span className="text-[10px] text-teal-400 bg-teal-900/60 px-1.5 py-0.5 rounded">الأسستنت</span>
                      </h4>
                      <div className="text-[11px] text-slate-400">
                        حلقة الوصل • تسجيل وماتريال وحضور ومدفوعات
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    مساعد إداري
                  </span>
                </button>

                {/* 3. Teacher */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('tea-1')}
                  className="w-full text-right p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-700/80 hover:border-emerald-500/60 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👨‍🏫</span>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                        أ. أحمد رضوان
                      </h4>
                      <div className="text-[11px] text-slate-400">
                        معلم أول • خبير مادة العلوم
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    معلم
                  </span>
                </button>

                {/* 4. Parent */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('par-1')}
                  className="w-full text-right p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-700/80 hover:border-amber-500/60 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👨‍💼</span>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                        أ. وليد حازم
                      </h4>
                      <div className="text-[11px] text-slate-400">
                        ولي أمر • متابعة الأبناء والدرجات
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    ولي أمر
                  </span>
                </button>

                {/* 5. Super Admin */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('adm-1')}
                  className="w-full text-right p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-700/80 hover:border-purple-500/60 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
                        م. سيف عمرو
                      </h4>
                      <div className="text-[11px] text-slate-400">
                        مدير المنظومة • الإدارة العليا والقرارات
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    إدارة عامة
                  </span>
                </button>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 text-xs text-slate-400 space-y-2">
              <div className="font-semibold text-slate-300">💡 ماذا يميز دور المساعد الإداري (الأسستنت)؟</div>
              <p>
                المساعد هو همزة الوصل الميدانية: يسجل حضور الطلاب، يرفع المذكرات والماتريال، يسجل دفع المصروفات بفودافون كاش أو انستاباي، ويحل شكاوى الطلاب وأولياء الأمور دون المساس بالقرارات السيادية للإدارة العامة.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
