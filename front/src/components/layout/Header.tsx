import React, { useState } from 'react';
import {
  GraduationCap,
  Users,
  Shield,
  UserCheck,
  Laptop,
  Bell,
  RefreshCw,
  ChevronDown,
  RotateCcw,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { Profile } from '../../types/database';
import { db } from '../../services/mockDatabase';
import { EduFlowLogo } from '../common/EduFlowLogo';

interface HeaderProps {
  currentProfile: Profile;
  onOpenRoleModal: () => void;
  onResetData: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProfile,
  onOpenRoleModal,
  onResetData,
  onLogout,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notifications = db.getNotifications(currentProfile.id);
  const unreadCount = db.getUnreadCount(currentProfile.id);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'student':
        return { label: 'بوابة الطالب', icon: GraduationCap, color: 'text-blue-700 bg-blue-50 border-blue-200' };
      case 'assistant':
        return { label: 'المساعد الإداري', icon: Laptop, color: 'text-teal-700 bg-teal-50 border-teal-200' };
      case 'teacher':
        return { label: 'لوحة المعلم', icon: Users, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      case 'parent':
        return { label: 'بوابة ولي الأمر', icon: UserCheck, color: 'text-amber-700 bg-amber-50 border-amber-200' };
      case 'admin':
        return { label: 'الإدارة العامة', icon: Shield, color: 'text-purple-700 bg-purple-50 border-purple-200' };
      default:
        return { label: role, icon: GraduationCap, color: 'text-slate-700 bg-slate-50 border-slate-200' };
    }
  };

  const badge = getRoleBadge(currentProfile.role);
  const RoleIcon = badge.icon;

  const handleMarkAllRead = () => {
    db.markAllNotificationsRead(currentProfile.id);
    setShowNotifications(false);
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Brand with 3D EduFlow Logo */}
        <EduFlowLogo size="md" />

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
              title="الإشعارات"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full text-[10px] font-black flex items-center justify-center ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute left-0 sm:right-auto sm:left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <span>الإشعارات ({notifications.length})</span>
                  </h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800"
                    >
                      تحديد الكل كمقروء
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto mt-2 space-y-2">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">
                      لا توجد إشعارات جديدة حالياً
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-xl border text-xs transition-colors ${
                          !n.is_read
                            ? 'bg-blue-50/60 border-blue-200 text-slate-900'
                            : 'bg-white border-slate-100 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-blue-900 mb-1">
                          <span>{n.title}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {new Date(n.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="leading-relaxed text-slate-600">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Reset Demo Data Button */}
          <button
            onClick={onResetData}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors hidden md:flex items-center gap-1.5 text-xs font-bold"
            title="إعادة تعيين البيانات الافتراضية"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة ضبط البيانات</span>
          </button>

          {/* Current Role Badge & Persona Switcher */}
          <button
            onClick={onOpenRoleModal}
            className={`flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border font-bold text-xs sm:text-sm cursor-pointer hover:shadow-xs transition-all ${badge.color}`}
            title="اضغط لتبديل الدور (طالب / مساعد / معلم / ولي أمر / إدارة)"
          >
            <RoleIcon className="w-4 h-4 shrink-0" />
            <div className="text-right">
              <div className="leading-none text-[13px]">{badge.label}</div>
              <div className="text-[10px] opacity-75 font-medium mt-0.5 max-w-[120px] truncate hidden sm:block">
                {currentProfile.full_name}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 opacity-60 mr-1" />
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="p-2 rounded-xl border border-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
            title="تسجيل الخروج من الحساب"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
