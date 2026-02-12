// src/app/BeerClickerGame.tsx
import React, { useState, useEffect, useRef } from 'react';

interface BeerClickerGameProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BeerClickerGame: React.FC<BeerClickerGameProps> = ({ isOpen, onClose }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('beer_clicker_highscore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [gameOver, setGameOver] = useState(false);
  const [clickAnimation, setClickAnimation] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Functions defined before useEffect to avoid hoisting issues
  const endGame = () => {
    setIsPlaying(false);
    setGameOver(true);
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('beer_clicker_highscore', score.toString());
    }
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(10);
    setIsPlaying(true);
    setGameOver(false);
  };

  const handleBeerClick = () => {
    if (!isPlaying) return;
    setScore(score + 1);
    setClickAnimation(true);
    setTimeout(() => setClickAnimation(false), 300);
  };

  const handleClose = () => {
    setIsPlaying(false);
    setGameOver(false);
    setScore(0);
    setTimeLeft(10);
    onClose();
  };

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isPlaying) {
      // Use setTimeout to avoid cascading renders
      setTimeout(() => {
        endGame();
      }, 0);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, timeLeft, score, highScore]);

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/90 flex items-center justify-center z-[9999]'>
      <div className='bg-gradient-to-b from-amber-800 to-amber-900 rounded-lg w-11/12 max-w-md p-6 shadow-2xl text-white relative overflow-hidden'>
        {/* Decorative Beer Bubbles */}
        <div className='absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-20'>
          <div className='absolute top-10 left-10 w-4 h-4 bg-white rounded-full animate-bounce'></div>
          <div className='absolute top-20 right-20 w-3 h-3 bg-white rounded-full animate-bounce delay-100'></div>
          <div className='absolute bottom-20 left-20 w-5 h-5 bg-white rounded-full animate-bounce delay-200'></div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className='absolute top-4 right-4 text-white/70 hover:text-white text-2xl font-bold z-10'
        >
          ×
        </button>

        {/* Title */}
        <div className='text-center mb-6 relative z-10'>
          <h2 className='text-3xl font-bold text-amber-100 mb-2'>🍺 Schnellzapf-Challenge 🍺</h2>
          <p className='text-amber-200 text-sm'>Zapfe so viele Biere wie möglich in 10 Sekunden!</p>
        </div>

        {/* Stats */}
        <div className='flex justify-between mb-6 text-center relative z-10'>
          <div className='bg-amber-950/50 rounded-lg px-4 py-3 flex-1 mr-2'>
            <div className='text-amber-300 text-xs mb-1'>Gezapft</div>
            <div className='text-3xl font-bold text-yellow-400'>{score}</div>
          </div>
          <div className='bg-amber-950/50 rounded-lg px-4 py-3 flex-1 ml-2'>
            <div className='text-amber-300 text-xs mb-1'>Zeit</div>
            <div
              className={`text-3xl font-bold ${timeLeft <= 3 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}
            >
              {timeLeft}s
            </div>
          </div>
        </div>

        {/* Beer Keg / Game Area */}
        {!isPlaying && !gameOver && (
          <div className='text-center mb-6 relative z-10'>
            <div className='text-6xl mb-4 animate-bounce'>🍺</div>
            <button
              onClick={startGame}
              className='bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg text-xl transition-all transform hover:scale-105'
            >
              Start!
            </button>
            {highScore > 0 && (
              <div className='mt-4 text-amber-200'>
                🏆 Highscore: <span className='font-bold text-yellow-400'>{highScore}</span> Biere
              </div>
            )}
          </div>
        )}

        {isPlaying && (
          <div className='text-center mb-6 relative z-10'>
            <button
              onClick={handleBeerClick}
              className={`text-9xl transition-transform transform ${
                clickAnimation ? 'scale-90' : 'scale-100 hover:scale-110'
              } cursor-pointer active:scale-95 select-none`}
            >
              🍺
            </button>
            <div className='text-2xl font-bold text-yellow-300 mt-2'>KLICK! KLICK! KLICK!</div>
          </div>
        )}

        {gameOver && (
          <div className='text-center mb-6 relative z-10'>
            <div className='text-6xl mb-4'>
              {score > highScore ? '🎉' : score >= 20 ? '🍻' : score >= 10 ? '🍺' : '😅'}
            </div>
            <div className='text-2xl font-bold mb-2 text-yellow-300'>
              {score > highScore ? 'NEUER REKORD!' : 'Zeit abgelaufen!'}
            </div>
            <div className='text-3xl font-bold text-green-400 mb-4'>{score} Biere gezapft!</div>

            <div className='mb-4 text-amber-100'>
              {score >= 50 && '⭐⭐⭐ ZAPFMEISTER! Du bist eine Legende!'}
              {score >= 30 && score < 50 && '⭐⭐ Beeindruckend! Fast Profi-Level!'}
              {score >= 20 && score < 30 && '⭐ Gut gemacht! Solide Zapfleistung!'}
              {score >= 10 && score < 20 && 'Nicht schlecht! Aber da geht noch mehr!'}
              {score < 10 && 'Übung macht den Meister! Versuch es nochmal!'}
            </div>

            {highScore > 0 && (
              <div className='text-amber-200 mb-4'>
                🏆 Highscore: <span className='font-bold text-yellow-400'>{highScore}</span>
              </div>
            )}

            <button
              onClick={startGame}
              className='bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105'
            >
              Nochmal!
            </button>
          </div>
        )}

        {/* Footer */}
        <div className='text-center text-amber-300 text-xs opacity-70 relative z-10'>
          Easter Egg gefunden! 🎮
        </div>
      </div>
    </div>
  );
};
