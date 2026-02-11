// src/domain/productService.ts
import { Product } from './models';

const STORAGE_KEY = 'products';

const DEFAULT_PRODUCTS: Product[] = [
  // Bier
  {
    id: 'stubbi',
    name: 'Stubbi (0,3L)',
    price: 1.0,
    icon: '/public/icons/icon-stubbi.png',
    category: 'Bier',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'alkoholfrei-03',
    name: 'Alkoholfrei (0,3L)',
    price: 1.0,
    icon: '/public/icons/icon-alkoholfrei.png',
    category: 'Bier',
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'alkoholfrei-05',
    name: 'Alkoholfrei (0,5L)',
    price: 1.5,
    icon: '/public/icons/icon-alkoholfrei.png',
    category: 'Bier',
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 'radler',
    name: 'Radler (0,3L)',
    price: 1.0,
    icon: '/public/icons/icon-radler.png',
    category: 'Bier',
    sortOrder: 4,
    isActive: true,
  },
  {
    id: 'weizen',
    name: 'Weizen (0,5L)',
    price: 1.5,
    icon: '/public/icons/icon-weizen.png',
    category: 'Bier',
    sortOrder: 5,
    isActive: true,
  },
  {
    id: 'helles',
    name: 'Helles (0,5L)',
    price: 1.5,
    icon: '/public/icons/icon-helles.png',
    category: 'Bier',
    sortOrder: 6,
    isActive: true,
  },
  // Alkoholfreie Getränke
  {
    id: 'limo',
    name: 'Limo (0,3L)',
    price: 1.0,
    icon: '/public/icons/icon-limo.png',
    category: 'Alkoholfreie Getränke',
    sortOrder: 7,
    isActive: true,
  },
  {
    id: 'apfelsaftschorle',
    name: 'Apfel-w.Sch. (0,3L)',
    price: 1.5,
    icon: '/public/icons/icon-apfelsaftschorle.png',
    category: 'Alkoholfreie Getränke',
    sortOrder: 8,
    isActive: true,
  },
  {
    id: 'wasser',
    name: 'Wasser (0,5L)',
    price: 1.0,
    icon: '/public/icons/icon-wasser.png',
    category: 'Alkoholfreie Getränke',
    sortOrder: 9,
    isActive: true,
  },
  // Sekt / Schaumwein
  {
    id: 'piccolo',
    name: 'Piccolo (0,2L)',
    price: 2.5,
    icon: '',
    emoji: '🍾',
    category: 'Sekt / Schaumwein',
    sortOrder: 10,
    isActive: true,
  },
  // Schnaps
  {
    id: 'jack-weiler-fischer-geist',
    name: 'Jack Weiler / Fischer Geist',
    price: 1.5,
    icon: '/public/icons/icon-schnapps-glas.png',
    category: 'Schnaps',
    sortOrder: 11,
    isActive: true,
  },
  {
    id: 'schnaps-andere',
    name: 'Andere Schnäpse',
    price: 1.0,
    icon: '/public/icons/icon-schnapps.png',
    category: 'Schnaps',
    sortOrder: 12,
    isActive: true,
  },
  // Snacks
  {
    id: 'erdnuesse',
    name: 'Erdnüsse',
    price: 1.5,
    icon: '',
    emoji: '🥜',
    category: 'Snacks',
    sortOrder: 13,
    isActive: true,
  },
  {
    id: 'brezel',
    name: 'Brezel',
    price: 1.5,
    icon: '',
    emoji: '🥨',
    category: 'Snacks',
    sortOrder: 14,
    isActive: true,
  },
  {
    id: 'asia-mix',
    name: 'Asia Mix',
    price: 2.0,
    icon: '/public/icons/icon-asian-mix.png',
    category: 'Snacks',
    sortOrder: 15,
    isActive: true,
  },
  {
    id: 'wurst',
    name: 'Wurst',
    price: 2.5,
    icon: '',
    emoji: '🌭',
    category: 'Snacks',
    sortOrder: 16,
    isActive: true,
  },
];

export const productService = {
  /**
   * Load products from localStorage. If none exist, initialize with defaults.
   */
  loadProducts(): Product[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PRODUCTS;
      }
      // Initialize with defaults
      this.saveProducts(DEFAULT_PRODUCTS);
      return DEFAULT_PRODUCTS;
    } catch (err) {
      console.error('Failed to load products', err);
      return DEFAULT_PRODUCTS;
    }
  },

  /**
   * Save products to localStorage
   */
  saveProducts(products: Product[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (err) {
      console.error('Failed to save products', err);
    }
  },

  /**
   * Get all active products sorted by sortOrder
   */
  getActiveProducts(): Product[] {
    return this.loadProducts()
      .filter((p) => p.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },

  /**
   * Update an existing product
   */
  updateProduct(id: string, updates: Partial<Omit<Product, 'id'>>): Product[] {
    const products = this.loadProducts();
    const updated = products.map((p) => (p.id === id ? { ...p, ...updates } : p));
    this.saveProducts(updated);
    return updated;
  },

  /**
   * Add a new product
   */
  addProduct(product: Omit<Product, 'id' | 'sortOrder'>): Product[] {
    const products = this.loadProducts();
    const maxSort = Math.max(0, ...products.map((p) => p.sortOrder));
    const newProduct: Product = {
      ...product,
      id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sortOrder: maxSort + 1,
    };
    const updated = [...products, newProduct];
    this.saveProducts(updated);
    return updated;
  },

  /**
   * Delete a product (soft delete by setting isActive=false)
   */
  deleteProduct(id: string): Product[] {
    return this.updateProduct(id, { isActive: false });
  },

  /**
   * Permanently delete a product from storage
   */
  permanentlyDeleteProduct(id: string): Product[] {
    const products = this.loadProducts();
    const filtered = products.filter((p) => p.id !== id);
    this.saveProducts(filtered);
    return filtered;
  },

  /**
   * Reset products to defaults
   */
  resetToDefaults(): Product[] {
    this.saveProducts(DEFAULT_PRODUCTS);
    return DEFAULT_PRODUCTS;
  },
};
