// src/app/components/DailySalesOverview.tsx
import React, { useMemo } from 'react';
import { DeckelUIState, DECKEL_STATUS } from '../../domain/models';

interface ProductSale {
  name: string;
  count: number;
  totalPrice: number;
}

interface DailySalesOverviewProps {
  deckelList: DeckelUIState[];
}

export const DailySalesOverview: React.FC<DailySalesOverviewProps> = ({ deckelList }) => {
  const salesData = useMemo(() => {
    const productMap = new Map<string, ProductSale>();
    let totalRevenue = 0;

    // Durchlaufe nur bezahlte Deckel und ihre Transaktionen
    deckelList
      .filter((deckel) => deckel.status === DECKEL_STATUS.BEZAHLT)
      .forEach((deckel) => {
        deckel.transactions?.forEach((tx) => {
          // Nur negative Summen sind Produktverkäufe (positive sind Zahlungen)
          // Ausschluss: Rückgeld und Trinkgeld
          if (
            tx.sum < 0 &&
            tx.description !== 'Korrektur' &&
            tx.description !== 'Rückgeld' &&
            !tx.isTip
          ) {
            const productName = tx.description;
            const count = tx.count || 1;
            const price = Math.abs(tx.sum);

            if (productMap.has(productName)) {
              const existing = productMap.get(productName)!;
              existing.count += count;
              existing.totalPrice += price;
            } else {
              productMap.set(productName, {
                name: productName,
                count,
                totalPrice: price,
              });
            }

            totalRevenue += price;
          }
        });
      });

    // Sortiere nach Anzahl (meistverkauft zuerst)
    const sortedProducts = Array.from(productMap.values()).sort((a, b) => b.count - a.count);

    return { products: sortedProducts, totalRevenue };
  }, [deckelList]);

  if (salesData.products.length === 0) {
    return (
      <div className='p-6 text-center'>
        <p className='text-gray-400 text-lg'>Noch keine Verkäufe heute</p>
      </div>
    );
  }

  return (
    <div className='p-6 overflow-auto'>
      <h2 className='text-2xl font-bold mb-6 text-green-600'>Tagesumsatz - Übersicht</h2>

      <div className='bg-gray-800 rounded-lg overflow-hidden'>
        <table className='w-full'>
          <thead>
            <tr className='bg-gray-700 border-b border-gray-600'>
              <th className='text-left py-3 px-4 text-gray-300'>Produkt</th>
              <th className='text-center py-3 px-4 text-gray-300'>Anzahl</th>
              <th className='text-right py-3 px-4 text-gray-300'>Einzelpreis</th>
              <th className='text-right py-3 px-4 text-gray-300'>Gesamt</th>
            </tr>
          </thead>
          <tbody>
            {salesData.products.map((product, index) => {
              const unitPrice = product.totalPrice / product.count;
              return (
                <tr key={index} className='border-b border-gray-700 hover:bg-gray-750 transition'>
                  <td className='py-3 px-4 font-semibold'>{product.name}</td>
                  <td className='text-center py-3 px-4 text-gray-300'>{product.count}×</td>
                  <td className='text-right py-3 px-4 text-gray-400'>{unitPrice.toFixed(2)} €</td>
                  <td className='text-right py-3 px-4 font-bold text-green-400'>
                    {product.totalPrice.toFixed(2)} €
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className='bg-green-700 border-t-2 border-green-500'>
              <td colSpan={3} className='py-4 px-4 text-lg font-bold'>
                Gesamtumsatz
              </td>
              <td className='text-right py-4 px-4 text-2xl font-bold'>
                {salesData.totalRevenue.toFixed(2)} €
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className='mt-4 text-sm text-gray-400 text-center'>
        {salesData.products.length} verschiedene Produkte •{' '}
        {salesData.products.reduce((sum, p) => sum + p.count, 0)} Artikel verkauft
      </div>
    </div>
  );
};
