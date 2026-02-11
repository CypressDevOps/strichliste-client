// src/app/components/ProductGrid.tsx
import React from 'react';
import { Product, ProductCategory } from '../../domain/models';

interface ProductGridProps {
  products: Product[];
  category: ProductCategory;
  onAddProduct: (product: Product, count: number) => void;
  onBack: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  category,
  onAddProduct,
  onBack,
}) => {
  return (
    <div className='mt-6'>
      <div className='flex items-center justify-between mb-4 px-4'>
        <button
          onClick={onBack}
          className='text-gray-300 hover:text-white flex items-center gap-2 text-lg font-semibold transition'
        >
          ← Zurück
        </button>
        <h3 className='text-xl font-semibold text-gray-200'>{category}</h3>
        <div className='w-24'></div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 px-4'>
        {products.map((product) => (
          <div
            key={product.id}
            className='bg-gray-800 rounded-lg p-4 shadow-md hover:shadow-lg transition'
          >
            <div className='flex items-center gap-4 mb-3'>
              {product.emoji ? (
                <span className='text-5xl'>{product.emoji}</span>
              ) : product.icon ? (
                <img
                  src={product.icon}
                  alt={product.name}
                  className='w-16 h-16 object-contain opacity-90'
                />
              ) : null}
              <div className='flex-1'>
                <h4 className='text-lg font-semibold text-white'>{product.name}</h4>
                <p className='text-green-400 font-bold text-xl'>{product.price.toFixed(2)} €</p>
              </div>
            </div>

            <div className='flex gap-2 justify-center'>
              {[1, 2, 3, 4, 5].map((count) => (
                <button
                  key={count}
                  onClick={() => onAddProduct(product, count)}
                  className='w-16 h-16 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center transition hover:scale-105 active:scale-95'
                >
                  <img
                    src={`/images/strichliste-icons/strich-${count}.png`}
                    alt={`${count}x`}
                    className='w-12 h-12'
                  />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
