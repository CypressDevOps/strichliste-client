// src/app/components/CategorySelector.tsx
import React from 'react';
import { ProductCategory } from '../../domain/models';

interface CategorySelectorProps {
  onSelectCategory: (category: ProductCategory) => void;
}

const CATEGORIES: { name: ProductCategory; icon: string; emoji?: string }[] = [
  { name: 'Bier', icon: '/icons/icon-helles.png' },
  { name: 'Schnaps', icon: '/icons/icon-schnapps-glas.png' },
  { name: 'Apfelwein / Sekt / Schaumwein', icon: '', emoji: '🍾🥂' },
  { name: 'Alkoholfreie Getränke', icon: '', emoji: '🥤' },
  { name: 'Snacks', icon: '', emoji: '🥨' },
];

export const CategorySelector: React.FC<CategorySelectorProps> = ({ onSelectCategory }) => {
  return (
    <div className='mt-6 px-4'>
      <h3 className='text-xl font-semibold mb-6 text-center text-gray-200'>Wähle eine Kategorie</h3>
      <div className='grid grid-cols-2 gap-4 max-w-4xl mx-auto'>
        {CATEGORIES.map((category) => (
          <button
            key={category.name}
            onClick={() => onSelectCategory(category.name)}
            className='
              group
              relative
              bg-gradient-to-br from-gray-800 to-gray-850
              text-white
              border-2 border-gray-700/50
              rounded-2xl px-6 py-4
              flex flex-col items-center justify-center gap-3
              hover:from-blue-700 hover:to-blue-800
              hover:border-blue-400
              hover:shadow-2xl hover:shadow-blue-500/30
              active:scale-95
              transition-all duration-300 ease-out
              min-h-[140px]
              cursor-pointer
              transform hover:scale-105
              before:absolute before:inset-0 before:rounded-2xl
              before:bg-gradient-to-br before:from-white/0 before:to-white/0
              hover:before:from-white/10 hover:before:to-transparent
              before:transition-all before:duration-300
              overflow-hidden
            '
          >
            <div className='relative z-10 flex flex-col items-center gap-3'>
              {category.emoji ? (
                <span className='text-5xl group-hover:scale-125 transition-transform duration-300 group-hover:animate-pulse'>
                  {category.emoji}
                </span>
              ) : category.icon ? (
                <img
                  src={category.icon}
                  alt={category.name}
                  className='w-14 h-14 object-contain opacity-90 group-hover:opacity-100 group-hover:scale-125 group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-300'
                />
              ) : null}
              <span className='text-base font-bold tracking-wide text-center group-hover:text-blue-100 transition-colors duration-300'>
                {category.name}
              </span>
            </div>

            {/* Puls-Ring beim Hover */}
            <div className='absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
              <div className='absolute inset-0 rounded-2xl border-2 border-blue-400 animate-ping opacity-20'></div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
