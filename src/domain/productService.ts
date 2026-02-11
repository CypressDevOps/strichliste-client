// src/domain/productService.ts
import { Product } from './models';

const STORAGE_KEY = 'products';

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'stubbi',
    name: 'Stubbi',
    price: 1.5,
    icon: '/images/strichliste-icons/icon-stubbi.png',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'helles',
    name: 'Helles',
    price: 2.0,
    icon: '/images/strichliste-icons/icon-helles.png',
    sortOrder: 2,
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
