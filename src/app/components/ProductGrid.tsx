// src/app/components/ProductGrid.tsx
import React from 'react';
import { Product, ProductCategory } from '../../domain/models';

interface ProductGridProps {
  products: Product[];
  category: ProductCategory;
  onAddProduct: (product: Product, count: number) => void;
  onBack: () => void;
  liveStockEnabled?: boolean;
  getStockQuantity?: (productId: string) => number;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  category,
  onAddProduct,
  onBack,
  liveStockEnabled = false,
  getStockQuantity,
}) => {
  const getStockColorClass = (quantity: number): string => {
    if (quantity > 50) return 'text-green-500';
    if (quantity >= 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className='mt-6'>
      <div className='flex items-center justify-between mb-6 px-4'>
        <button
          onClick={onBack}
          className='
            px-4 py-2 
            bg-gradient-to-r from-gray-700 to-gray-800
            hover:from-blue-600 hover:to-blue-700
            text-gray-300 hover:text-white 
            flex items-center gap-2 
            text-lg font-semibold 
            rounded-lg
            border-2 border-gray-600/50 hover:border-blue-400
            transition-all duration-300
            hover:scale-105 active:scale-95
            hover:shadow-lg hover:shadow-blue-500/30
          '
        >
          ← Zurück
        </button>
        <h3 className='text-xl font-bold text-gray-200 px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50'>
          {category}
        </h3>
        <div className='w-32'></div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 px-4'>
        {products.map((product) => {
          const stockQuantity =
            liveStockEnabled && getStockQuantity ? getStockQuantity(product.id) : null;
          const isOutOfStock = stockQuantity !== null && stockQuantity <= 0;
          const stockColorClass = stockQuantity !== null ? getStockColorClass(stockQuantity) : '';

          return (
            <div
              key={product.id}
              className={`bg-gray-800 rounded-lg p-4 shadow-md hover:shadow-lg transition ${isOutOfStock ? 'opacity-50' : ''}`}
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
                  {liveStockEnabled && stockQuantity !== null && (
                    <p className={`text-sm font-semibold mt-1 ${stockColorClass}`}>
                      Bestand: {stockQuantity} Stück
                    </p>
                  )}
                </div>
              </div>

              <div className='flex gap-3 justify-center'>
                {[1, 2, 3, 4, 5].map((count) => (
                  <button
                    key={count}
                    onClick={() => !isOutOfStock && onAddProduct(product, count)}
                    disabled={isOutOfStock}
                    className={`
                    group/btn
                    relative
                    w-16 h-16 
                    bg-gradient-to-br from-gray-700 to-gray-800
                    ${
                      !isOutOfStock
                        ? 'hover:from-green-600 hover:to-green-700 cursor-pointer hover:rotate-3 hover:shadow-2xl hover:shadow-green-500/50'
                        : 'cursor-not-allowed'
                    }
                    rounded-xl 
                    flex items-center justify-center 
                    transition-all duration-300 
                    ${!isOutOfStock ? 'hover:scale-125 active:scale-90' : ''}
                    border-2 border-gray-600/50 
                    ${!isOutOfStock ? 'hover:border-green-400' : ''}
                    overflow-hidden
                    before:absolute before:inset-0 before:rounded-xl
                    before:bg-gradient-to-br before:from-white/0 before:to-white/0
                    ${!isOutOfStock ? 'hover:before:from-white/20 hover:before:to-transparent' : ''}
                    before:transition-all before:duration-300
                  `}
                  >
                    <img
                      src={`/images/strichliste-icons/strich-${count}.png`}
                      alt={`${count}x`}
                      className={`w-12 h-12 relative z-10 ${!isOutOfStock ? 'group-hover/btn:brightness-125 group-hover/btn:drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]' : ''} transition-all duration-300`}
                    />

                    {/* Puls-Effekt beim Hover */}
                    {!isOutOfStock && (
                      <div className='absolute inset-0 rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300'>
                        <div className='absolute inset-0 rounded-xl border-2 border-green-400 animate-ping opacity-30'></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
