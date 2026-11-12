import React from 'react';
import { X, Check } from 'lucide-react';
import { Profile } from '../../types/database';
import { db } from '../../services/mockDatabase';

interface StudentSwitcherModalProps {
  currentStudent: Profile;
  onSelectStudent: (student: Profile) => void;
  onClose: () => void;
}

export const StudentSwitcherModal: React.FC<StudentSwitcherModalProps> = ({
  currentStudent,
  onSelectStudent,
  onClose,
}) => {
  const students = db.getStudents();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-blue-950 text-base">
              👨‍🎓 اختيار حساب الطالب المعتمد
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              اختر حساب الطالب الذي يؤدي الاختبار، ليتم ربط درجاته وإرسال التقرير لولي أمره آلياً:
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2 overflow-y-auto">
          {students.map((s) => {
            const isSelected = s.id === currentStudent.id;
            return (
              <div
                key={s.id}
                onClick={() => {
                  onSelectStudent(s);
                  onClose();
                }}
                className={`p-3.5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/80 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center text-xl shrink-0">
                    {s.avatar || '👨‍🎓'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {s.full_name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {s.grade_level} • #{s.id}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  {isSelected ? 'المحدد الآن ✓' : 'اختيار'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
