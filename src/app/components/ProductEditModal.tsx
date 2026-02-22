import React, { useState } from 'react';
import { Product, ProductCategory } from '../../domain/models';

interface ProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  existingProduct?: Product;
}

const TAX_RATES = [19, 7, 0];

export const ProductEditModal: React.FC<ProductEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingProduct,
}) => {
  const [name, setName] = useState(existingProduct?.name || '');
  const [price, setPrice] = useState(existingProduct?.price || 0);
  const [category, setCategory] = useState<ProductCategory>(existingProduct?.category || 'Bier');
  const [icon, setIcon] = useState(existingProduct?.icon || '');
  const [emoji, setEmoji] = useState(existingProduct?.emoji || '');
  const [taxRate, setTaxRate] = useState(existingProduct?.taxRate ?? 19);

  const handleSave = () => {
    const product: Product = {
      id: existingProduct?.id || name.toLowerCase().replace(/\s+/g, '-'),
      name,
      price,
      icon,
      emoji,
      category,
      sortOrder: existingProduct?.sortOrder || 1,
      isActive: true,
      taxRate,
    };
    onSave(product);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-lg p-6 w-full max-w-md'>
        <h2 className='text-xl font-bold mb-4'>Produkt bearbeiten</h2>
        <div className='mb-3'>
          <label className='block text-sm font-medium mb-1'>Name</label>
          <input
            type='text'
            value={name}
            onChange={(e) => setName(e.target.value)}
            className='w-full border rounded px-2 py-1'
          />
        </div>
        <div className='mb-3'>
          <label className='block text-sm font-medium mb-1'>Preis (€)</label>
          <input
            type='number'
            value={price}
            min={0}
            step={0.01}
            onChange={(e) => setPrice(Number(e.target.value))}
            className='w-full border rounded px-2 py-1'
          />
        </div>
        <div className='mb-3'>
          <label className='block text-sm font-medium mb-1'>Kategorie</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ProductCategory)}
            className='w-full border rounded px-2 py-1'
          >
            <option value='Bier'>Bier</option>
            <option value='Alkoholfreie Getränke'>Alkoholfreie Getränke</option>
            <option value='Apfelwein / Sekt / Schaumwein'>Apfelwein / Sekt / Schaumwein</option>
            <option value='Schnaps'>Schnaps</option>
            <option value='Snacks'>Snacks</option>
          </select>
        </div>
        <div className='mb-3'>
          <label className='block text-sm font-medium mb-1'>Icon-URL</label>
          <input
            type='text'
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className='w-full border rounded px-2 py-1'
          />
        </div>
        <div className='mb-3'>
          <label className='block text-sm font-medium mb-1'>Emoji</label>
          <input
            type='text'
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className='w-full border rounded px-2 py-1'
          />
        </div>
        <div className='mb-3'>
          <label className='block text-sm font-medium mb-1'>MwSt.-Satz</label>
          <select
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value))}
            className='w-full border rounded px-2 py-1'
          >
            {TAX_RATES.map((rate) => (
              <option key={rate} value={rate}>
                {rate} %
              </option>
            ))}
          </select>
        </div>
        <div className='flex justify-end gap-2 mt-4'>
          <button onClick={onClose} className='px-4 py-2 bg-gray-300 rounded hover:bg-gray-400'>
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            className='px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600'
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
};
