import React, { useState, useEffect } from 'react';
import { db } from './services/mockDatabase';
import { Profile } from './types/database';
import { Header } from './components/layout/Header';
import { RoleSwitcherModal } from './components/common/RoleSwitcherModal';
import { LoginPage } from './components/auth/LoginPage';
import { StudentPortal } from './components/student/StudentPortal';
import { AssistantPortal } from './components/assistant/AssistantPortal';
import { TeacherPortal } from './components/teacher/TeacherPortal';
import { ParentPortal } from './components/parent/ParentPortal';
import { AdminPortal } from './components/admin/AdminPortal';
import { ArrowLeftRight, LogIn } from 'lucide-react';

export default function App() {
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(() => {
    return db.getCurrentProfile();
  });
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [, setTick] = useState(0);

  // Subscribe to db state changes
  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setTick((t) => t + 1);
      // Keep currentProfile synchronized with updated state
      if (currentProfile) {
        const updated = db.getProfileById(currentProfile.id);
        if (updated) {
          setCurrentProfile(updated);
        }
      }
    });
    return unsubscribe;
  }, [currentProfile?.id]);

  const handleSelectProfile = (profile: Profile) => {
    db.setCurrentProfile(profile.id);
    setCurrentProfile(profile);
    setIsRoleModalOpen(false);
  };

  const handleLogout = () => {
    db.logout();
    setCurrentProfile(null);
  };

  const handleResetData = () => {
    if (window.confirm('هل تريد بالتأكيد إعادة تعيين كل البيانات إلى الحالة الافتراضية التجريبية؟')) {
      db.reset();
      const first = db.getProfiles()[0];
      if (first) {
        db.setCurrentProfile(first.id);
        setCurrentProfile(first);
      }
    }
  };

  // If user is not logged in, show the comprehensive Login Page
  if (!currentProfile) {
    return (
      <LoginPage
        onLoginSuccess={(profile) => {
          db.setCurrentProfile(profile.id);
          setCurrentProfile(profile);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-blue-600 selection:text-white" dir="rtl">
      {/* Sticky Top Header */}
      <Header
        currentProfile={currentProfile}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        onResetData={handleResetData}
        onLogout={handleLogout}
      />

      {/* Main Role-Based Content Area */}
      <main className="flex-1 pb-16">
        {currentProfile.role === 'student' && (
          <StudentPortal
            currentStudent={currentProfile}
            onUpdateStudent={(s) => handleSelectProfile(s)}
          />
        )}

        {currentProfile.role === 'assistant' && (
          <AssistantPortal currentAssistant={currentProfile} />
        )}

        {currentProfile.role === 'teacher' && (
          <TeacherPortal currentTeacher={currentProfile} />
        )}

        {currentProfile.role === 'parent' && (
          <ParentPortal currentParent={currentProfile} />
        )}

        {currentProfile.role === 'admin' && (
          <AdminPortal currentAdmin={currentProfile} />
        )}
      </main>

      {/* Floating Quick Role Switcher Shortcut */}
      <div className="fixed bottom-5 left-5 z-40 flex items-center gap-2">
        <button
          onClick={() => setIsRoleModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 text-white text-xs font-bold shadow-xl shadow-slate-900/30 hover:bg-teal-600 hover:scale-105 transition-all duration-200 border border-slate-700/50 cursor-pointer"
          title="تبديل الحساب أو الصلاحية"
        >
          <ArrowLeftRight className="w-4 h-4 text-teal-400" />
          <span>تبديل الصلاحية (طالب / مساعد / معلم / ولي أمر / إدارة)</span>
        </button>

        <button
          onClick={handleLogout}
          className="p-2.5 rounded-full bg-slate-900 text-slate-300 hover:text-white hover:bg-rose-600 transition-all border border-slate-700/50 shadow-xl cursor-pointer"
          title="صفحة تسجيل الدخول"
        >
          <LogIn className="w-4 h-4" />
        </button>
      </div>

      {/* Role Switcher Modal */}
      {isRoleModalOpen && (
        <RoleSwitcherModal
          currentProfile={currentProfile}
          onSelectProfile={handleSelectProfile}
          onClose={() => setIsRoleModalOpen(false)}
        />
      )}
    </div>
  );
}
