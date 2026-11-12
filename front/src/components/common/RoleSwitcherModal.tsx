import React from 'react';
import { X, Check, Users, Shield, GraduationCap, UserCheck, Laptop } from 'lucide-react';
import { Profile } from '../../types/database';
import { db } from '../../services/mockDatabase';

interface RoleSwitcherModalProps {
  currentProfile: Profile;
  onSelectProfile: (profile: Profile) => void;
  onClose: () => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  currentProfile,
  onSelectProfile,
  onClose,
}) => {
  const profiles = db.getProfiles();

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'student':
        return { label: 'طالب', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: GraduationCap };
      case 'assistant':
        return { label: 'مساعد إداري (أسستنت)', bg: 'bg-teal-50 text-teal-800 border-teal-200', icon: Laptop };
      case 'teacher':
        return { label: 'معلم', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Users };
      case 'parent':
        return { label: 'ولي أمر', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: UserCheck };
      case 'admin':
        return { label: 'إدارة المنظومة', bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: Shield };
      default:
        return { label: role, bg: 'bg-slate-50 text-slate-700 border-slate-200', icon: Users };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-slate-900 text-lg">
              تبديل حساب المستخدم والصلاحية 🔄
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              استكشف منصة EduFlow من منظور جميع أطراف العملية التعليمية:
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5">
          {profiles.map((p) => {
            const isSelected = p.id === currentProfile.id;
            const roleBadge = getRoleLabel(p.role);
            const RoleIcon = roleBadge.icon;

            return (
              <div
                key={p.id}
                onClick={() => {
                  onSelectProfile(p);
                  onClose();
                }}
                className={`p-3.5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl shrink-0">
                    {p.avatar || '👤'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">
                        {p.full_name}
                      </h4>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{p.email}</span>
                      {p.grade_level && (
                        <>
                          <span>•</span>
                          <span className="text-blue-600 font-semibold">{p.grade_level}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${roleBadge.bg}`}
                  >
                    <RoleIcon className="w-3 h-3" />
                    <span>{roleBadge.label}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
          💡 يمكنك التبديل بحرية في أي وقت لاختبار وظائف كل دور بالكامل.
        </div>
      </div>
    </div>
  );
};
