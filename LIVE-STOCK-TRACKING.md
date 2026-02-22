# Live Stock Tracking Feature

## Overview

This feature adds real-time stock tracking to the Deckel system, allowing users to:

- Toggle live stock display on/off from the three-dot menu
- See current stock quantities on product buttons with color-coded indicators
- Automatically decrement stock when products are sold
- Disable products when stock reaches zero

## Implementation Details

### 1. Stock Settings Service

**File**: `src/domain/stockSettingsService.ts`

- `isLiveStockTrackingEnabled()`: Reads toggle state from localStorage
- `setLiveStockTracking(enabled)`: Saves toggle state to localStorage

### 2. DeckelScreen Updates

**File**: `src/app/DeckelScreen.tsx`

**New Imports**:

```typescript
import { isLiveStockTrackingEnabled, setLiveStockTracking } from '../domain/stockSettingsService';
import { getStock, updateStock } from '../domain/stockService';
```

**New State**:

```typescript
const [liveStockEnabled, setLiveStockEnabled] = useState(isLiveStockTrackingEnabled());
```

**Menu Item**: Added "Bestand Live-Anzeige" toggle in the Bestand submenu with:

- Green/gray indicator dot showing current state
- Persists state to localStorage on toggle
- Closes menu after toggle

**Product Booking**: Modified `onAddProduct` handler to:

- Call `updateStock(productId, 'subtract', count, undefined, 'Verkauf')` when live tracking is enabled
- Decrement stock immediately after recording sale

### 3. ProductGrid Updates

**File**: `src/app/components/ProductGrid.tsx`

**New Props**:

- `liveStockEnabled?: boolean`: Whether live tracking is active
- `getStockQuantity?: (productId: string) => number`: Function to fetch current stock

**Color Logic**:

```typescript
const getStockColorClass = (quantity: number): string => {
  if (quantity > 50) return 'text-green-500'; // >50: Green
  if (quantity >= 30) return 'text-yellow-500'; // 30-50: Yellow
  return 'text-red-500'; // <30: Red
};
```

**UI Changes**:

- Stock quantity displayed below price when enabled
- Color-coded stock text (green/yellow/red)
- Product card opacity reduced when out of stock
- All product buttons disabled when stock ≤ 0
- Hover effects disabled for out-of-stock products

## User Flow

1. **Enable Live Tracking**:
   - Click three-dot menu (top right)
   - Expand "Bestand" submenu
   - Click "Bestand Live-Anzeige" (indicator turns green)

2. **View Stock on Products**:
   - Select a guest/Deckel
   - Choose product category
   - Stock quantities appear below prices with color coding

3. **Book Products**:
   - Click product count button (1-5)
   - Transaction recorded on Deckel
   - Stock automatically decremented
   - UI updates to show new quantity

4. **Out of Stock**:
   - Product card becomes semi-transparent
   - All count buttons disabled
   - Hover effects removed
   - Cannot add to Deckel

## Testing Checklist

- [ ] Toggle appears in Bestand submenu
- [ ] Toggle state persists after page reload
- [ ] Stock quantities visible when enabled
- [ ] Colors correct: >50 green, 30-50 yellow, <30 red
- [ ] Stock decrements on product sale
- [ ] Product disabled at 0 stock
- [ ] Multiple products with different stock levels
- [ ] Toggle off hides stock info
- [ ] Works across different categories

## Technical Notes

- Stock data sourced from `product_stocks` in localStorage (inventory management)
- Uses existing `stockService` for all stock operations
- No backend integration required (localStorage persistence)
- Compatible with existing stock import/overview features
- Stock history maintained via `updateStock` reason parameter ("Verkauf")
