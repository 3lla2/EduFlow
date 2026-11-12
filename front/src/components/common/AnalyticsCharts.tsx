import React from 'react';
import { CheckCircle2, AlertCircle, Clock, Video, FileText, Award } from 'lucide-react';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  subLabel?: string;
  color?: 'blue' | 'emerald' | 'amber' | 'purple' | 'cyan';
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 110,
  strokeWidth = 9,
  label,
  subLabel,
  color = 'blue',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percentage));
  const offset = circumference - (clamped / 100) * circumference;

  const colorGradients = {
    blue: {
      from: '#2563eb',
      to: '#06b6d4',
      bg: '#e2e8f0',
      text: 'text-blue-600',
    },
    emerald: {
      from: '#059669',
      to: '#10b981',
      bg: '#d1fae5',
      text: 'text-emerald-600',
    },
    amber: {
      from: '#d97706',
      to: '#f59e0b',
      bg: '#fef3c7',
      text: 'text-amber-600',
    },
    purple: {
      from: '#7c3aed',
      to: '#a855f7',
      bg: '#ede9fe',
      text: 'text-purple-600',
    },
    cyan: {
      from: '#0891b2',
      to: '#06b6d4',
      bg: '#cffafe',
      text: 'text-cyan-600',
    },
  };

  const scheme = colorGradients[color];
  const gradId = `circle-grad-${color}-${Math.floor(Math.random() * 10000)}`;

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={scheme.from} />
              <stop offset="100%" stopColor={scheme.to} />
            </linearGradient>
          </defs>

          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={scheme.bg}
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${gradId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="none"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`text-xl font-black ${scheme.text} leading-none tracking-tight`}>
            {clamped}%
          </span>
          {subLabel && (
            <span className="text-[10px] text-slate-400 font-medium mt-0.5">
              {subLabel}
            </span>
          )}
        </div>
      </div>

      {label && (
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2 text-center">
          {label}
        </span>
      )}
    </div>
  );
};

interface VideoPlayTrackerBadgeProps {
  playCount: number;
  maxPlays?: number;
}

export const VideoPlayTrackerBadge: React.FC<VideoPlayTrackerBadgeProps> = ({
  playCount,
  maxPlays = 3,
}) => {
  const isExhausted = playCount >= maxPlays;
  const isUnwatched = playCount === 0;

  if (isUnwatched) {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg font-bold">
        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        <span>لم يشاهد الحصة (0/{maxPlays})</span>
      </div>
    );
  }

  if (isExhausted) {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-lg font-bold">
        <Video className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span>استهلك كل المشاهدات ({playCount}/{maxPlays})</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 text-xs text-cyan-800 bg-cyan-50 border border-cyan-200 px-2.5 py-1 rounded-lg font-bold">
      <Video className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
      <span>شاهد {playCount} من {maxPlays} مرات</span>
    </div>
  );
};

interface ExamTrackerBadgeProps {
  examTaken: boolean;
  score?: number;
  total?: number;
  passed?: boolean;
}

export const ExamTrackerBadge: React.FC<ExamTrackerBadgeProps> = ({
  examTaken,
  score,
  total,
  passed,
}) => {
  if (!examTaken) {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg font-bold">
        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>لم يدخل الامتحان بعد ⚠️</span>
      </div>
    );
  }

  const pct = total && total > 0 ? Math.round(((score || 0) / total) * 100) : 100;

  return (
    <div
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-bold border ${
        passed
          ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
          : 'text-rose-800 bg-rose-50 border-rose-200'
      }`}
    >
      {passed ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      ) : (
        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
      )}
      <span>
        امتحن: {score}/{total} ({pct}%) {passed ? '✓ اجتياز' : 'يحتاج إعادة'}
      </span>
    </div>
  );
};

interface AssignmentTrackerBadgeProps {
  submitted: boolean;
  score?: number;
  maxScore?: number;
}

export const AssignmentTrackerBadge: React.FC<AssignmentTrackerBadgeProps> = ({
  submitted,
  score,
  maxScore,
}) => {
  if (!submitted) {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg font-bold">
        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        <span>لم يسلّم الواجب ⚠️</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 text-xs text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg font-bold">
      <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
      <span>
        تم التسليم {score !== undefined ? `(${score}/${maxScore ?? 10})` : 'بانتظار الرصد'} ✓
      </span>
    </div>
  );
};
