// src/app/components/CategorySelector.tsx
import React from 'react';
import { ProductCategory } from '../../domain/models';

interface CategorySelectorProps {
  onSelectCategory: (category: ProductCategory) => void;
}

const CATEGORIES: { name: ProductCategory; icon: string; emoji?: string }[] = [
  { name: 'Bier', icon: '/icons/icon-helles.png' },
  { name: 'Schnaps', icon: '/icons/icon-schnapps-glas.png' },
  { name: 'Sekt / Schaumwein', icon: '', emoji: '🍾🥂' },
  { name: 'Alkoholfreie Getränke', icon: '', emoji: '🥤' },
  { name: 'Snacks', icon: '', emoji: '🥨' },
];

export const CategorySelector: React.FC<CategorySelectorProps> = ({ onSelectCategory }) => {
  return (
    <div className='mt-6 px-4'>
      <h3 className='text-xl font-semibold mb-4 text-center text-gray-200'>Getränke & Snacks</h3>
      <div className='flex flex-col gap-2.5 max-w-2xl mx-auto'>
        {CATEGORIES.map((category) => (
          <button
            key={category.name}
            onClick={() => onSelectCategory(category.name)}
            className='
              bg-gray-800/95 text-white
              border border-gray-700/50
              rounded-xl px-5 py-4
              flex items-center justify-between
              hover:bg-gray-750 hover:border-gray-600
              active:scale-[0.99]
              transition-all duration-150
              shadow-sm hover:shadow-md
              backdrop-blur-sm
            '
          >
            <span className='text-lg font-semibold tracking-wide'>{category.name}</span>
            {category.emoji ? (
              <span className='text-5xl opacity-90'>{category.emoji}</span>
            ) : category.icon ? (
              <img
                src={category.icon}
                alt={category.name}
                className='w-16 h-16 object-contain opacity-90'
              />
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
};
