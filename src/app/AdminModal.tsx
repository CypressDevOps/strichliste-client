// src/app/AdminModal.tsx
import React, { useState, useEffect } from 'react';
import { Product, ProductCategory } from '../domain/models';
import { productService } from '../domain/productService';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    price: 0,
    icon: '',
    category: 'Bier' as ProductCategory,
  });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newForm, setNewForm] = useState({
    name: '',
    price: 0,
    icon: '',
    category: 'Bier' as ProductCategory,
  });

  const CATEGORIES: ProductCategory[] = [
    'Bier',
    'Alkoholfreie Getränke',
    'Schnaps',
    'Apfelwein / Sekt / Schaumwein',
    'Snacks',
  ];

  useEffect(() => {
    if (!isOpen) return;

    // Load products asynchronously to avoid cascading renders
    Promise.resolve().then(() => {
      setProducts(productService.loadProducts());
    });
  }, [isOpen]);

  const loadProducts = () => {
    setProducts(productService.loadProducts());
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      price: product.price,
      icon: product.icon,
      category: product.category,
    });
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    productService.updateProduct(editingId, editForm);
    setEditingId(null);
    loadProducts();
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewForm({ ...newForm, icon: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleImageUploadEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditForm({ ...editForm, icon: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleAddNew = () => {
    if (!newForm.name || newForm.price <= 0) {
      alert('Bitte Name und gültigen Preis eingeben');
      return;
    }
    productService.addProduct({
      name: newForm.name,
      price: newForm.price,
      icon: newForm.icon,
      category: newForm.category,
      isActive: true,
    });
    setNewForm({ name: '', price: 0, icon: '', category: 'Bier' });
    setIsAddingNew(false);
    loadProducts();
  };

  const handleDeactivate = (id: string) => {
    if (confirm('Produkt wirklich deaktivieren?')) {
      productService.deleteProduct(id);
      loadProducts();
    }
  };

  const handlePermanentDelete = (id: string) => {
    if (confirm('Produkt wirklich löschen?')) {
      productService.permanentlyDeleteProduct(id);
      loadProducts();
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4'>
      <div className='bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
        <div className='sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center'>
          <h2 className='text-2xl font-bold text-white'>Produktverwaltung</h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-white text-3xl leading-none'
          >
            &times;
          </button>
        </div>

        <div className='p-6'>
          {/* Product Table */}
          <div className='mb-6 overflow-x-auto'>
            <table className='w-full text-left text-white'>
              <thead className='bg-gray-700'>
                <tr>
                  <th className='px-4 py-3'>Name</th>
                  <th className='px-4 py-3'>Preis (€)</th>
                  <th className='px-4 py-3'>Kategorie</th>
                  <th className='px-4 py-3'>Icon</th>
                  <th className='px-4 py-3'>Status</th>
                  <th className='px-4 py-3'>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className='border-b border-gray-700 hover:bg-gray-750'>
                    {editingId === product.id ? (
                      <>
                        <td className='px-4 py-3'>
                          <input
                            type='text'
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className='bg-gray-900 text-white px-2 py-1 rounded w-full'
                          />
                        </td>
                        <td className='px-4 py-3'>
                          <input
                            type='number'
                            step='0.1'
                            value={editForm.price}
                            onChange={(e) =>
                              setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })
                            }
                            className='bg-gray-900 text-white px-2 py-1 rounded w-24'
                          />
                        </td>
                        <td className='px-4 py-3'>
                          <select
                            value={editForm.category}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                category: e.target.value as ProductCategory,
                              })
                            }
                            className='bg-gray-900 text-white px-2 py-1 rounded w-full text-sm'
                          >
                            {CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className='px-4 py-3'>
                          <div className='flex items-center gap-2'>
                            {editForm.icon && (
                              <img src={editForm.icon} alt='Vorschau' className='w-8 h-8' />
                            )}
                            <input
                              type='file'
                              accept='image/*'
                              onChange={handleImageUploadEdit}
                              className='text-white text-xs'
                            />
                            {editForm.icon && (
                              <button
                                onClick={() => setEditForm({ ...editForm, icon: '' })}
                                className='text-red-400 hover:text-red-300 text-xs'
                                title='Icon entfernen'
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </td>
                        <td className='px-4 py-3'>
                          <span className='text-yellow-400'>Bearbeiten...</span>
                        </td>
                        <td className='px-4 py-3 flex gap-2'>
                          <button
                            onClick={handleSaveEdit}
                            className='bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm'
                          >
                            Speichern
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className='bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm'
                          >
                            Abbrechen
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className='px-4 py-3 font-medium'>{product.name}</td>
                        <td className='px-4 py-3'>{product.price.toFixed(2)}</td>
                        <td className='px-4 py-3'>
                          <span className='text-sm text-gray-300'>{product.category}</span>
                        </td>
                        <td className='px-4 py-3'>
                          {product.emoji ? (
                            <span className='text-2xl'>{product.emoji}</span>
                          ) : product.icon ? (
                            <img src={product.icon} alt={product.name} className='w-8 h-8' />
                          ) : (
                            <span className='text-gray-500 text-xs'>-</span>
                          )}
                        </td>
                        <td className='px-4 py-3'>
                          {product.isActive ? (
                            <span className='text-green-400'>Aktiv</span>
                          ) : (
                            <span className='text-red-400'>Inaktiv</span>
                          )}
                        </td>
                        <td className='px-4 py-3 flex gap-2'>
                          <button
                            onClick={() => handleEdit(product)}
                            className='bg-green-800 hover:bg-green-700 px-3 py-1 rounded text-sm'
                          >
                            Bearbeiten
                          </button>
                          {product.isActive && (
                            <button
                              onClick={() => handleDeactivate(product.id)}
                              className='bg-blue-800 hover:bg-blue-700 px-3 py-1 rounded text-sm'
                            >
                              Deaktivieren
                            </button>
                          )}
                          <button
                            onClick={() => handlePermanentDelete(product.id)}
                            className='bg-red-800 hover:bg-red-700 px-3 py-1 rounded text-sm'
                          >
                            Löschen
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add New Product */}
          <div className='mb-6'>
            {!isAddingNew ? (
              <button
                onClick={() => setIsAddingNew(true)}
                className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold'
              >
                + Neues Produkt hinzufügen
              </button>
            ) : (
              <div className='bg-gray-700 p-4 rounded'>
                <h3 className='text-lg font-bold text-white mb-3'>Neues Produkt</h3>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-4'>
                  <div>
                    <label className='block text-sm text-gray-300 mb-1'>Name</label>
                    <input
                      type='text'
                      value={newForm.name}
                      onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                      className='bg-gray-900 text-white px-3 py-2 rounded w-full'
                      placeholder='z.B. Cola'
                    />
                  </div>
                  <div>
                    <label className='block text-sm text-gray-300 mb-1'>Preis (€)</label>
                    <input
                      type='number'
                      step='0.1'
                      value={newForm.price || ''}
                      onChange={(e) =>
                        setNewForm({ ...newForm, price: parseFloat(e.target.value) || 0 })
                      }
                      className='bg-gray-900 text-white px-3 py-2 rounded w-full'
                      placeholder='0.00'
                    />
                  </div>
                  <div>
                    <label className='block text-sm text-gray-300 mb-1'>Kategorie</label>
                    <select
                      value={newForm.category}
                      onChange={(e) =>
                        setNewForm({ ...newForm, category: e.target.value as ProductCategory })
                      }
                      className='bg-gray-900 text-white px-3 py-2 rounded w-full'
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className='block text-sm text-gray-300 mb-1'>
                      Icon/Emoji (optional)
                    </label>
                    <div className='flex items-center gap-3'>
                      {newForm.icon && (
                        <img src={newForm.icon} alt='Vorschau' className='w-12 h-12 rounded' />
                      )}
                      <div className='flex-1'>
                        <input
                          type='file'
                          accept='image/*'
                          onChange={handleImageUpload}
                          className='bg-gray-900 text-white px-3 py-2 rounded w-full text-sm'
                        />
                      </div>
                      {newForm.icon && (
                        <button
                          onClick={() => setNewForm({ ...newForm, icon: '' })}
                          className='bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs'
                        >
                          Entfernen
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className='flex gap-2'>
                  <button
                    onClick={handleAddNew}
                    className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded'
                  >
                    Hinzufügen
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingNew(false);
                      setNewForm({ name: '', price: 0, icon: '', category: 'Bier' });
                    }}
                    className='bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded'
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
