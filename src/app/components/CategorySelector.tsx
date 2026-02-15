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
      <h3 className='text-xl font-semibold mb-4 text-center text-gray-200'>Getränke & Snacks</h3>
      <div className='grid grid-cols-2 gap-3 max-w-4xl mx-auto'>
        {CATEGORIES.map((category) => (
          <button
            key={category.name}
            onClick={() => onSelectCategory(category.name)}
            className='
              bg-gray-800/95 text-white
              border border-gray-700/50
              rounded-xl px-4 py-3
              flex flex-col items-center justify-center gap-2
              hover:bg-gray-750 hover:border-gray-600
              active:scale-[0.99]
              transition-all duration-150
              shadow-sm hover:shadow-md
              backdrop-blur-sm
              min-h-[120px]
            '
          >
            {category.emoji ? (
              <span className='text-4xl opacity-90'>{category.emoji}</span>
            ) : category.icon ? (
              <img
                src={category.icon}
                alt={category.name}
                className='w-12 h-12 object-contain opacity-90'
              />
            ) : null}
            <span className='text-base font-semibold tracking-wide text-center'>
              {category.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
