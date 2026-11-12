import React from 'react';

interface EduFlowLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showSubtitle?: boolean;
  className?: string;
  theme?: 'dark' | 'light' | 'auto';
}

export const EduFlowLogo: React.FC<EduFlowLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
  theme = 'auto',
}) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    hero: 'w-20 h-20',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    hero: 'text-4xl',
  };

  const isDark = theme === 'dark';

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* 3D Geometric EduFlow Emblem */}
      <div className={`relative ${iconSizes[size]} shrink-0 transition-transform duration-300 hover:scale-105`}>
        {/* Ambient Glow */}
        <div className="absolute -inset-1 bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 rounded-2xl blur-md opacity-40 group-hover:opacity-75 transition-opacity duration-300" />

        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative w-full h-full drop-shadow-xl"
        >
          <defs>
            {/* Primary Diamond/Shield Gradient */}
            <linearGradient id="efBaseGrad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>

            {/* Glowing Accent Gradient */}
            <linearGradient id="efAccentGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>

            {/* Inner Ring Glow */}
            <linearGradient id="efRingGrad" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.1" />
            </linearGradient>

            {/* Shadow Filter */}
            <filter id="ef3dShadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#1e3a8a" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Rounded Hexagon Base (3D Depth) */}
          <rect
            x="8"
            y="8"
            width="84"
            height="84"
            rx="24"
            fill="url(#efBaseGrad)"
            filter="url(#ef3dShadow)"
          />

          {/* Inner Highlight Border */}
          <rect
            x="10"
            y="10"
            width="80"
            height="80"
            rx="22"
            stroke="url(#efRingGrad)"
            strokeWidth="2"
            fill="none"
          />

          {/* Quantum / STEM Orbital Ring (Languages & Science Symbol) */}
          <ellipse
            cx="50"
            cy="50"
            rx="32"
            ry="13"
            transform="rotate(-28 50 50)"
            stroke="url(#efAccentGrad)"
            strokeWidth="3.5"
            strokeDasharray="4 2"
            strokeLinecap="round"
            className="animate-[spin_12s_linear_infinite]"
          />

          {/* Central 3D Graduation Diamond Node */}
          <path
            d="M50 26L74 38L50 50L26 38L50 26Z"
            fill="#ffffff"
            filter="url(#ef3dShadow)"
          />

          {/* Academic Cap Body */}
          <path
            d="M34 44.5V57C34 65 66 65 66 57V44.5L50 52.5L34 44.5Z"
            fill="#e0f2fe"
            opacity="0.95"
          />

          {/* Golden / Cyan Smart Automation Node */}
          <circle cx="50" cy="50" r="4.5" fill="#f59e0b" />
          <circle cx="50" cy="50" r="2.5" fill="#ffffff" />

          {/* Academic Tassel Streamer */}
          <path
            d="M71 40V61C71 63 68 64 68 64"
            stroke="#fbbf24"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col text-right">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-black tracking-tight ${textSizes[size]} ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Edu<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500">Flow</span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            لغات • STEM
          </span>
        </div>

        {showSubtitle && (
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 tracking-tight flex items-center gap-1">
            <span>منصة اللغات والتعليم الذكي</span>
            <span aria-hidden="true">·</span>
            <span>2026</span>
          </span>
        )}
      </div>
    </div>
  );
};
