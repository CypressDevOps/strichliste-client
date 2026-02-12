// src/app/GameMenu.tsx
import React from 'react';

interface GameMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBeerClicker: () => void;
  onSelect2048: () => void;
  onSelectDeutschlandQuiz: () => void;
}

export const GameMenu: React.FC<GameMenuProps> = ({
  isOpen,
  onClose,
  onSelectBeerClicker,
  onSelect2048,
  onSelectDeutschlandQuiz,
}) => {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] p-4'>
      <div className='bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-xl w-full max-w-lg p-8 shadow-2xl text-white relative'>
        {/* Close Button */}
        <button
          onClick={onClose}
          className='absolute top-4 right-4 text-white/70 hover:text-white text-3xl font-bold'
        >
          ×
        </button>

        {/* Title */}
        <div className='text-center mb-8'>
          <div className='text-5xl mb-4 animate-bounce'>🎮</div>
          <h2 className='text-3xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-pink-500 bg-clip-text text-transparent'>
            Easter Egg Zone
          </h2>
          <p className='text-purple-200 text-sm'>3 geheime Spiele für dich!</p>
        </div>

        {/* Game Cards */}
        <div className='space-y-4'>
          {/* Beer Clicker */}
          <button
            onClick={() => {
              onSelectBeerClicker();
              onClose();
            }}
            className='w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 rounded-lg p-5 transition-all transform hover:scale-105 shadow-lg text-left'
          >
            <div className='flex items-center gap-4'>
              <div className='text-5xl'>🍺</div>
              <div>
                <div className='text-xl font-bold mb-1'>Schnellzapf-Challenge</div>
                <div className='text-amber-100 text-sm'>
                  Zapfe so viele Biere wie möglich in 10 Sekunden!
                </div>
              </div>
            </div>
          </button>

          {/* 2048 */}
          <button
            onClick={() => {
              onSelect2048();
              onClose();
            }}
            className='w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-lg p-5 transition-all transform hover:scale-105 shadow-lg text-left'
          >
            <div className='flex items-center gap-4'>
              <div className='text-5xl'>🔢</div>
              <div>
                <div className='text-xl font-bold mb-1'>2048</div>
                <div className='text-blue-100 text-sm'>
                  Der Klassiker! Kombiniere Zahlen bis zur 2048.
                </div>
              </div>
            </div>
          </button>

          {/* Deutschland Quiz */}
          <button
            onClick={() => {
              onSelectDeutschlandQuiz();
              onClose();
            }}
            className='w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 rounded-lg p-5 transition-all transform hover:scale-105 shadow-lg text-left'
          >
            <div className='flex items-center gap-4'>
              <div className='text-5xl'>🇩🇪</div>
              <div>
                <div className='text-xl font-bold mb-1'>Deutschland-Quiz</div>
                <div className='text-green-100 text-sm'>
                  250 Fragen über Deutschland – Teste dein Wissen!
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className='text-center mt-6 text-purple-300 text-xs'>
          Tipp: 8x schnell auf das Datum tippen! 🤫
        </div>
      </div>
    </div>
  );
};
