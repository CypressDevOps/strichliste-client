// src/app/Game2048.tsx
import React, { useState, useEffect, useCallback } from 'react';

type Cell = number;
type Grid = Cell[][];

interface Game2048Props {
  isOpen: boolean;
  onClose: () => void;
}

const GRID_SIZE = 4;

const createEmptyGrid = (): Grid => {
  return Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(0));
};

const addRandomTile = (grid: Grid): Grid => {
  const emptyCells: [number, number][] = [];
  grid.forEach((row, i) => {
    row.forEach((cell, j) => {
      if (cell === 0) emptyCells.push([i, j]);
    });
  });

  if (emptyCells.length === 0) return grid;

  const [i, j] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const newGrid = grid.map((row) => [...row]);
  newGrid[i][j] = Math.random() < 0.9 ? 2 : 4;
  return newGrid;
};

const initGrid = (): Grid => {
  let grid = createEmptyGrid();
  grid = addRandomTile(grid);
  grid = addRandomTile(grid);
  return grid;
};

const moveLeft = (grid: Grid): { grid: Grid; moved: boolean; score: number } => {
  let moved = false;
  let scoreGained = 0;
  const newGrid = grid.map((row) => {
    const filtered = row.filter((cell) => cell !== 0);
    const merged: number[] = [];
    let i = 0;

    while (i < filtered.length) {
      if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
        const mergedValue = filtered[i] * 2;
        merged.push(mergedValue);
        scoreGained += mergedValue;
        i += 2;
      } else {
        merged.push(filtered[i]);
        i += 1;
      }
    }

    while (merged.length < GRID_SIZE) {
      merged.push(0);
    }

    if (JSON.stringify(merged) !== JSON.stringify(row)) {
      moved = true;
    }

    return merged;
  });

  return { grid: newGrid, moved, score: scoreGained };
};

const rotateGrid = (grid: Grid): Grid => {
  const newGrid = createEmptyGrid();
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      newGrid[j][GRID_SIZE - 1 - i] = grid[i][j];
    }
  }
  return newGrid;
};

const move = (
  grid: Grid,
  direction: 'left' | 'right' | 'up' | 'down'
): { grid: Grid; moved: boolean; score: number } => {
  let tempGrid = grid;
  let rotations = 0;

  if (direction === 'right') rotations = 2;
  if (direction === 'up') rotations = 3;
  if (direction === 'down') rotations = 1;

  for (let i = 0; i < rotations; i++) {
    tempGrid = rotateGrid(tempGrid);
  }

  const result = moveLeft(tempGrid);

  for (let i = 0; i < (4 - rotations) % 4; i++) {
    result.grid = rotateGrid(result.grid);
  }

  return result;
};

const canMove = (grid: Grid): boolean => {
  // Check for empty cells
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (grid[i][j] === 0) return true;
    }
  }

  // Check for adjacent equal cells
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const current = grid[i][j];
      if (j < GRID_SIZE - 1 && current === grid[i][j + 1]) return true;
      if (i < GRID_SIZE - 1 && current === grid[i + 1][j]) return true;
    }
  }

  return false;
};

export const Game2048: React.FC<Game2048Props> = ({ isOpen, onClose }) => {
  const [grid, setGrid] = useState<Grid>(initGrid);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem('2048_best_score');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const handleMove = useCallback(
    (direction: 'left' | 'right' | 'up' | 'down') => {
      if (gameOver) return;

      const result = move(grid, direction);

      if (result.moved) {
        const newGrid = addRandomTile(result.grid);
        setGrid(newGrid);

        const newScore = score + result.score;
        setScore(newScore);

        if (newScore > bestScore) {
          setBestScore(newScore);
          localStorage.setItem('2048_best_score', newScore.toString());
        }

        // Check for 2048
        const has2048 = newGrid.some((row) => row.some((cell) => cell === 2048));
        if (has2048 && !won) {
          setWon(true);
        }

        // Check game over
        if (!canMove(newGrid)) {
          setGameOver(true);
        }
      }
    },
    [grid, score, bestScore, gameOver, won]
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowLeft':
          handleMove('left');
          break;
        case 'ArrowRight':
          handleMove('right');
          break;
        case 'ArrowUp':
          handleMove('up');
          break;
        case 'ArrowDown':
          handleMove('down');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleMove]);

  const resetGame = () => {
    setGrid(initGrid());
    setScore(0);
    setGameOver(false);
    setWon(false);
  };

  const getTileColor = (value: number): string => {
    const colors: Record<number, string> = {
      0: 'bg-gray-700/50',
      2: 'bg-blue-200 text-gray-800',
      4: 'bg-blue-300 text-gray-800',
      8: 'bg-orange-400 text-white',
      16: 'bg-orange-500 text-white',
      32: 'bg-red-500 text-white',
      64: 'bg-red-600 text-white',
      128: 'bg-yellow-400 text-white',
      256: 'bg-yellow-500 text-white',
      512: 'bg-yellow-600 text-white',
      1024: 'bg-purple-500 text-white',
      2048: 'bg-purple-600 text-white',
    };
    return colors[value] || 'bg-pink-600 text-white';
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] p-4'>
      <div className='bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl w-full max-w-lg p-6 shadow-2xl text-white relative'>
        {/* Close Button */}
        <button
          onClick={onClose}
          className='absolute top-4 right-4 text-white/70 hover:text-white text-3xl font-bold z-10'
        >
          ×
        </button>

        {/* Header */}
        <div className='text-center mb-4'>
          <h2 className='text-4xl font-bold mb-2'>2048</h2>
          <p className='text-gray-400 text-sm'>Kombiniere Zahlen mit Pfeiltasten!</p>
        </div>

        {/* Score Board */}
        <div className='flex gap-4 mb-4'>
          <div className='flex-1 bg-gray-700 rounded-lg p-3 text-center'>
            <div className='text-gray-400 text-xs mb-1'>Punkte</div>
            <div className='text-2xl font-bold text-yellow-400'>{score}</div>
          </div>
          <div className='flex-1 bg-gray-700 rounded-lg p-3 text-center'>
            <div className='text-gray-400 text-xs mb-1'>Bester</div>
            <div className='text-2xl font-bold text-green-400'>{bestScore}</div>
          </div>
        </div>

        {/* Game Grid */}
        <div className='bg-gray-700 rounded-lg p-2 mb-4 relative'>
          {/* Win/GameOver Overlay */}
          {(won || gameOver) && (
            <div className='absolute inset-0 bg-black/80 rounded-lg flex items-center justify-center z-10'>
              <div className='text-center'>
                <div className='text-6xl mb-4'>{won ? '🎉' : '😔'}</div>
                <div className='text-3xl font-bold mb-2'>
                  {won ? 'Du hast gewonnen!' : 'Game Over!'}
                </div>
                <div className='text-xl mb-4'>Punkte: {score}</div>
                <button
                  onClick={resetGame}
                  className='bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg'
                >
                  Nochmal spielen
                </button>
              </div>
            </div>
          )}

          <div className='grid grid-cols-4 gap-2'>
            {grid.map((row, i) =>
              row.map((cell, j) => (
                <div
                  key={`${i}-${j}`}
                  className={`${getTileColor(cell)} rounded-lg h-20 flex items-center justify-center text-2xl font-bold transition-all transform`}
                >
                  {cell !== 0 && cell}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Controls */}
        <div className='flex gap-2'>
          <button
            onClick={resetGame}
            className='flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition'
          >
            Neues Spiel
          </button>
        </div>

        {/* Instructions */}
        <div className='text-center text-gray-400 text-xs mt-4'>
          ⬅️ ➡️ ⬆️ ⬇️ Pfeiltasten zum Bewegen
        </div>
      </div>
    </div>
  );
};
