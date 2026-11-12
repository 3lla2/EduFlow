import React from 'react';
import { X, Play, AlertTriangle, CheckCircle, Video } from 'lucide-react';
import { Session } from '../../types/database';

interface VideoPlayerModalProps {
  session: Session | null;
  remainingPlays: number;
  playNumber: number;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  session,
  remainingPlays,
  playNumber,
  onClose,
}) => {
  if (!session) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base line-clamp-1">
                {session.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5">
                <span className="bg-white/10 px-2 py-0.5 rounded text-[11px]">
                  مشاهدة رقم {playNumber} من أصل 3
                </span>
                <span>•</span>
                <span className="text-amber-300">
                  متبقي {remainingPlays} {remainingPlays === 1 ? 'مشاهدة واحدة' : 'مشاهدات'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Player */}
        <div className="bg-black relative aspect-video flex items-center justify-center">
          <video
            controls
            autoPlay
            className="w-full h-full object-contain"
            src={session.video_url}
          >
            عذراً، متصفحك لا يدعم تشغيل الفيديو.
          </video>
        </div>

        {/* Info & Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <h4 className="font-bold text-slate-900 text-sm">
              معلومات الحصة والتنبيهات الأكاديمية
            </h4>
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>جاري توثيق وقت المشاهدة للطالب</span>
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            {session.description || 'حصة شرح تفاعلي مصحوبة بالأمثلة والتطبيقات العلمية.'}
          </p>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>سياسة المشاهدات المعتمدة:</strong> يُسمح لكل طالب بمشاهدة تسجيل الحصة حتى <strong>3 مرات كحد أقصى</strong> حرصاً على التركيز والالتزام، كما لا يمكنك فتح الحصة التالية إلا بعد اجتياز اختبار هذه الحصة بنجاح.
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            إنهاء المشاهدة والعودة
          </button>
        </div>
      </div>
    </div>
  );
};
