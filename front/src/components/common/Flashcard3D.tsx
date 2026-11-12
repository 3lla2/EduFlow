import React, { useState } from 'react';
import { RotateCw } from 'lucide-react';
import { Flashcard } from '../../types/database';

interface Flashcard3DProps {
  card: Flashcard;
  index: number;
}

export const Flashcard3D: React.FC<Flashcard3DProps> = ({ card, index }) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="perspective-1000 h-56 cursor-pointer select-none group"
      onClick={() => setFlipped(!flipped)}
      title="اضغط لقلب البطاقة"
    >
      <div
        className={`w-full h-full relative transform-style-3d transition-transform duration-500 rounded-2xl ${
          flipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden bg-white border-2 border-blue-100 hover:border-blue-400 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs text-blue-600 font-bold">
            <span className="bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              بطاقة استذكار #{index + 1}
            </span>
            <span className="flex items-center gap-1 text-slate-400 group-hover:text-blue-600 transition-colors">
              <RotateCw className="w-3.5 h-3.5" />
              <span>اضغط للقلب</span>
            </span>
          </div>

          <div className="my-auto text-center">
            <p className="text-slate-800 font-bold text-base leading-relaxed">
              {card.front}
            </p>
          </div>

          <div className="text-center text-[11px] text-slate-400 font-medium">
            💡 اضغط لرؤية التفسير والإجابة
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-6 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold text-blue-100">
            <span className="bg-white/20 px-2.5 py-1 rounded-full">
              التفسير العلمي ✨
            </span>
            <span className="flex items-center gap-1 text-blue-200">
              <RotateCw className="w-3.5 h-3.5" />
              <span>العودة للوجه</span>
            </span>
          </div>

          <div className="my-auto text-center">
            <p className="text-white font-bold text-sm leading-relaxed">
              {card.back}
            </p>
          </div>

          <div className="text-center text-[11px] text-blue-200">
            ✓ تم حفظ المفهوم
          </div>
        </div>
      </div>
    </div>
  );
};
