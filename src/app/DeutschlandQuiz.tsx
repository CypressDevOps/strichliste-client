// src/app/DeutschlandQuiz.tsx
import React, { useState, useEffect } from 'react';
import { QuizQuestion, getRandomQuestions } from './quiz/deutschlandQuestions';

interface DeutschlandQuizProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeutschlandQuiz: React.FC<DeutschlandQuizProps> = ({ isOpen, onClose }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('deutschland_quiz_highscore');
    return saved ? parseInt(saved, 10) : 0;
  });

  const QUESTIONS_PER_ROUND = 10;

  // Functions defined before useEffect to avoid hoisting issues
  const startNewGame = () => {
    setQuestions(getRandomQuestions(QUESTIONS_PER_ROUND));
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setGameOver(false);
  };

  const handleAnswerClick = (answerIndex: number) => {
    if (showResult) return;

    setSelectedAnswer(answerIndex);
    setShowResult(true);

    if (answerIndex === questions[currentIndex].correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Game Over
      setGameOver(true);
      if (score + (selectedAnswer === questions[currentIndex].correctAnswer ? 1 : 0) > highScore) {
        const newHighScore =
          score + (selectedAnswer === questions[currentIndex].correctAnswer ? 1 : 0);
        setHighScore(newHighScore);
        localStorage.setItem('deutschland_quiz_highscore', newHighScore.toString());
      }
    }
  };

  const handleClose = () => {
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setGameOver(false);
    onClose();
  };

  useEffect(() => {
    if (isOpen && questions.length === 0) {
      // Use setTimeout to avoid cascading renders
      setTimeout(() => {
        startNewGame();
      }, 0);
    }
  }, [isOpen, questions.length]);

  if (!isOpen) return null;

  const currentQuestion = questions[currentIndex];

  return (
    <div className='fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] p-4'>
      <div className='bg-gradient-to-br from-green-800 via-emerald-800 to-teal-900 rounded-xl w-full max-w-2xl p-6 shadow-2xl text-white relative max-h-[90vh] overflow-y-auto'>
        {/* Close Button */}
        <button
          onClick={handleClose}
          className='absolute top-4 right-4 text-white/70 hover:text-white text-3xl font-bold z-10'
        >
          ×
        </button>

        {/* Header */}
        <div className='text-center mb-6'>
          <div className='text-5xl mb-3'>🇩🇪</div>
          <h2 className='text-3xl font-bold mb-2'>Deutschland-Quiz</h2>
          <p className='text-green-200 text-sm'>250 Fragen über Deutschland</p>
        </div>

        {!gameOver ? (
          <>
            {/* Progress & Score */}
            <div className='flex justify-between items-center mb-6'>
              <div className='bg-green-950/50 rounded-lg px-4 py-2'>
                <span className='text-green-300 text-sm'>
                  Frage {currentIndex + 1}/{QUESTIONS_PER_ROUND}
                </span>
              </div>
              <div className='bg-green-950/50 rounded-lg px-4 py-2'>
                <span className='text-yellow-400 font-bold'>{score} Punkte</span>
              </div>
              <div className='bg-green-950/50 rounded-lg px-4 py-2'>
                <span className='text-green-300 text-sm'>🏆 {highScore}</span>
              </div>
            </div>

            {currentQuestion && (
              <>
                {/* Category & Difficulty Badge */}
                <div className='flex gap-2 mb-4'>
                  <span className='bg-blue-600 text-white text-xs px-3 py-1 rounded-full'>
                    {currentQuestion.category}
                  </span>
                  <span
                    className={`text-xs px-3 py-1 rounded-full ${
                      currentQuestion.difficulty === 'easy'
                        ? 'bg-green-600'
                        : currentQuestion.difficulty === 'medium'
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                    } text-white`}
                  >
                    {currentQuestion.difficulty === 'easy'
                      ? 'Leicht'
                      : currentQuestion.difficulty === 'medium'
                        ? 'Mittel'
                        : 'Schwer'}
                  </span>
                </div>

                {/* Question */}
                <div className='bg-green-950/50 rounded-lg p-5 mb-6'>
                  <h3 className='text-xl font-semibold text-white'>{currentQuestion.question}</h3>
                </div>

                {/* Answer Options */}
                <div className='space-y-3 mb-6'>
                  {currentQuestion.options.map((option, index) => {
                    const isCorrect = index === currentQuestion.correctAnswer;
                    const isSelected = index === selectedAnswer;
                    const showCorrectAnswer = showResult && isCorrect;
                    const showWrongAnswer = showResult && isSelected && !isCorrect;

                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswerClick(index)}
                        disabled={showResult}
                        className={`w-full text-left p-4 rounded-lg font-semibold transition-all transform hover:scale-102 ${
                          showCorrectAnswer
                            ? 'bg-green-600 text-white ring-4 ring-green-400'
                            : showWrongAnswer
                              ? 'bg-red-600 text-white ring-4 ring-red-400'
                              : showResult
                                ? 'bg-gray-700 text-gray-400'
                                : 'bg-white/10 hover:bg-white/20 text-white'
                        } ${showResult ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        <div className='flex items-center justify-between'>
                          <span>{option}</span>
                          {showCorrectAnswer && <span className='text-2xl'>✅</span>}
                          {showWrongAnswer && <span className='text-2xl'>❌</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Next Button */}
                {showResult && (
                  <div className='text-center'>
                    <button
                      onClick={handleNext}
                      className='bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-lg transition-all transform hover:scale-105'
                    >
                      {currentIndex + 1 < questions.length ? 'Nächste Frage →' : 'Quiz beenden'}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          // Game Over Screen
          <div className='text-center py-8'>
            <div className='text-7xl mb-4'>
              {score === QUESTIONS_PER_ROUND
                ? '🏆'
                : score >= QUESTIONS_PER_ROUND * 0.8
                  ? '🎉'
                  : score >= QUESTIONS_PER_ROUND * 0.6
                    ? '👍'
                    : score >= QUESTIONS_PER_ROUND * 0.4
                      ? '😊'
                      : '😅'}
            </div>
            <h3 className='text-3xl font-bold mb-2'>
              {score === QUESTIONS_PER_ROUND
                ? 'PERFEKT!'
                : score >= QUESTIONS_PER_ROUND * 0.8
                  ? 'Exzellent!'
                  : score >= QUESTIONS_PER_ROUND * 0.6
                    ? 'Gut gemacht!'
                    : score >= QUESTIONS_PER_ROUND * 0.4
                      ? 'Nicht schlecht!'
                      : 'Weiter üben!'}
            </h3>
            <div className='text-5xl font-bold text-yellow-400 mb-4'>
              {score} / {QUESTIONS_PER_ROUND}
            </div>
            <div className='text-lg text-green-200 mb-2'>
              {((score / QUESTIONS_PER_ROUND) * 100).toFixed(0)}% richtig
            </div>

            {score > highScore && (
              <div className='bg-yellow-600/20 border-2 border-yellow-500 rounded-lg p-4 mb-6 animate-pulse'>
                <div className='text-2xl mb-1'>🏆 NEUER REKORD! 🏆</div>
                <div className='text-yellow-300'>Du hast deinen Highscore übertroffen!</div>
              </div>
            )}

            {highScore > 0 && (
              <div className='text-green-300 mb-6'>
                Dein Highscore: <span className='font-bold text-yellow-400'>{highScore}</span>{' '}
                Punkte
              </div>
            )}

            <div className='flex gap-3 justify-center'>
              <button
                onClick={startNewGame}
                className='bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105'
              >
                Nochmal spielen
              </button>
              <button
                onClick={handleClose}
                className='bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105'
              >
                Beenden
              </button>
            </div>
          </div>
        )}

        {/* Footer Info */}
        {!gameOver && (
          <div className='text-center text-green-300 text-xs mt-6 opacity-70'>
            Aus 250 Fragen über Geschichte, Geografie, Kultur, Politik, Sport & Wirtschaft
          </div>
        )}
      </div>
    </div>
  );
};
