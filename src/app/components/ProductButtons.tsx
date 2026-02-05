// src/app/components/ProductButtons.tsx
import React from 'react';

interface ProductButtonsProps {
  label: string;
  icon: string;
  onAdd: (count: number) => void;
}

export const ProductButtons: React.FC<ProductButtonsProps> = ({ label, icon, onAdd }) => {
  return (
    <div className='flex flex-col items-center gap-2 mt-4'>
      <div className='text-xl font-bold'>{label}</div>

      <div className='flex gap-3 items-center'>
        {/* Produkt-Icon */}
        <div className='w-20 h-20 flex items-center justify-center'>
          <img src={icon} alt={`${label} Produkt Icon`} className='w-20 h-20 opacity-90' />
        </div>

        {/* 5 klickbare Icons */}
        {[1, 2, 3, 4, 5].map((count) => (
          <button
            key={count}
            onClick={() => onAdd(count)}
            className='w-20 h-20 bg-transparent rounded flex items-center justify-center hover:scale-105 active:scale-95 transition'
          >
            <img
              src={`/images/strichliste-icons/strich-${count}.png`}
              alt={`${label} ${count}`}
              className='w-16 h-16'
            />
          </button>
        ))}
      </div>
    </div>
  );
};
