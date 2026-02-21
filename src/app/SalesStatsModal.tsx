// src/app/SalesStatsModal.tsx
import React, { useState, useMemo } from 'react';
import {
  getSalesByPeriod,
  getTopProducts,
  aggregateByMonth,
  getStatsSummary,
  exportAsCSV,
  exportAggregateAsCSV,
  exportAsJSON,
  downloadFile,
  SaleAggregate,
} from '../services/salesStatsService';

interface SalesStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SalesStatsModal: React.FC<SalesStatsModalProps> = ({ isOpen, onClose }) => {
  const [viewMode, setViewMode] = useState<'overview' | 'products' | 'timeline'>('overview');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [topN, setTopN] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Daten laden
  const filteredSales = useMemo(() => {
    return getSalesByPeriod(startDate || undefined, endDate || undefined);
  }, [startDate, endDate]);

  const topProducts = useMemo(() => {
    return getTopProducts(topN, startDate || undefined, endDate || undefined);
  }, [topN, startDate, endDate]);

  const monthlyData = useMemo(() => {
    return aggregateByMonth();
  }, []);

  const summary = useMemo(() => {
    return getStatsSummary(startDate || undefined, endDate || undefined);
  }, [startDate, endDate]);

  // Gefilterte Top-Produkte nach Suchbegriff
  const filteredTopProducts = useMemo(() => {
    if (!searchTerm) return topProducts;
    return topProducts.filter((p) =>
      p.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [topProducts, searchTerm]);

  // Export-Funktionen
  const handleExportCSV = () => {
    if (viewMode === 'products') {
      const csv = exportAggregateAsCSV(filteredTopProducts);
      downloadFile(csv, 'verkaufsstatistik_produkte.csv', 'text/csv;charset=utf-8;');
    } else {
      const csv = exportAsCSV(filteredSales);
      downloadFile(csv, 'verkaufsstatistik_details.csv', 'text/csv;charset=utf-8;');
    }
  };

  const handleExportJSON = () => {
    const json = exportAsJSON(filteredSales);
    downloadFile(json, 'verkaufsstatistik.json', 'application/json');
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4'>
      <div className='bg-gray-800 rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center'>
          <h2 className='text-2xl font-bold text-white flex items-center gap-2'>
            📊 Verkaufsstatistik
          </h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-white text-3xl leading-none'
          >
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div className='bg-gray-750 px-6 py-3 border-b border-gray-700 flex gap-2'>
          <button
            onClick={() => setViewMode('overview')}
            className={`px-4 py-2 rounded font-semibold transition ${
              viewMode === 'overview'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            📈 Übersicht
          </button>
          <button
            onClick={() => setViewMode('products')}
            className={`px-4 py-2 rounded font-semibold transition ${
              viewMode === 'products'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            🏆 Top Produkte
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2 rounded font-semibold transition ${
              viewMode === 'timeline'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            📅 Zeitverlauf
          </button>
        </div>

        {/* Filter-Bar */}
        <div className='bg-gray-750 px-6 py-4 border-b border-gray-700'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
            <div>
              <label className='block text-sm text-gray-300 mb-1'>Von Datum</label>
              <input
                type='date'
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className='w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none'
              />
            </div>
            <div>
              <label className='block text-sm text-gray-300 mb-1'>Bis Datum</label>
              <input
                type='date'
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className='w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none'
              />
            </div>
            {viewMode === 'products' && (
              <>
                <div>
                  <label className='block text-sm text-gray-300 mb-1'>Produktsuche</label>
                  <input
                    type='text'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder='Produktname...'
                    className='w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none'
                  />
                </div>
                <div>
                  <label className='block text-sm text-gray-300 mb-1'>Top N</label>
                  <input
                    type='number'
                    value={topN}
                    onChange={(e) => setTopN(Number(e.target.value))}
                    min='5'
                    max='50'
                    className='w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none'
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto p-6'>
          {viewMode === 'overview' && <OverviewView summary={summary} />}
          {viewMode === 'products' && <ProductsView products={filteredTopProducts} />}
          {viewMode === 'timeline' && <TimelineView monthlyData={monthlyData} />}
        </div>

        {/* Footer - Export Buttons */}
        <div className='sticky bottom-0 bg-gray-800 border-t border-gray-700 px-6 py-4 flex gap-3 justify-end'>
          <button
            onClick={handleExportCSV}
            className='px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition'
          >
            📥 Export CSV
          </button>
          <button
            onClick={handleExportJSON}
            className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition'
          >
            📥 Export JSON
          </button>
          <button
            onClick={onClose}
            className='px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-semibold transition'
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};

// Übersicht View
const OverviewView: React.FC<{ summary: ReturnType<typeof getStatsSummary> }> = ({ summary }) => {
  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <KPICard title='Gesamt Verkäufe' value={summary.total_sales} icon='🛒' color='blue' />
        <KPICard
          title='Verkaufte Artikel'
          value={summary.total_items_sold}
          icon='📦'
          color='green'
        />
        <KPICard
          title='Gesamtumsatz'
          value={`€${summary.total_revenue.toFixed(2)}`}
          icon='💰'
          color='yellow'
        />
        <KPICard title='Top Produkt' value={summary.top_product} icon='🏆' color='purple' />
      </div>

      {summary.date_range && (
        <div className='bg-gray-750 rounded-lg p-4'>
          <h3 className='text-lg font-semibold text-white mb-2'>Zeitraum</h3>
          <p className='text-gray-300'>
            Von <span className='font-bold'>{summary.date_range.from}</span> bis{' '}
            <span className='font-bold'>{summary.date_range.to}</span>
          </p>
        </div>
      )}
    </div>
  );
};

// Top Produkte View
const ProductsView: React.FC<{ products: SaleAggregate[] }> = ({ products }) => {
  const maxRevenue = Math.max(...products.map((p) => p.total_revenue), 1);

  return (
    <div className='space-y-4'>
      <h3 className='text-xl font-bold text-white mb-4'>🏆 Top Produkte nach Umsatz</h3>

      {products.length === 0 ? (
        <p className='text-gray-400 text-center py-8'>Keine Daten verfügbar</p>
      ) : (
        <div className='space-y-3'>
          {products.map((product, index) => {
            const percentage = (product.total_revenue / maxRevenue) * 100;

            return (
              <div key={product.product_name} className='bg-gray-750 rounded-lg p-4'>
                <div className='flex items-center justify-between mb-2'>
                  <div className='flex items-center gap-3'>
                    <span className='text-2xl font-bold text-gray-400'>#{index + 1}</span>
                    <span className='text-lg font-semibold text-white'>{product.product_name}</span>
                  </div>
                  <div className='text-right'>
                    <div className='text-green-400 font-bold text-lg'>
                      €{product.total_revenue.toFixed(2)}
                    </div>
                    <div className='text-gray-400 text-sm'>{product.total_quantity}x verkauft</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className='w-full bg-gray-700 rounded-full h-3 overflow-hidden'>
                  <div
                    className='bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-500 rounded-full'
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>

                <div className='mt-2 text-sm text-gray-400'>
                  Durchschnitt: €{(product.total_revenue / product.sale_count).toFixed(2)} pro
                  Verkauf
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Zeitverlauf View
const TimelineView: React.FC<{
  monthlyData: ReturnType<typeof aggregateByMonth>;
}> = ({ monthlyData }) => {
  const maxRevenue = Math.max(...monthlyData.map((m) => m.total_revenue), 1);

  return (
    <div className='space-y-4'>
      <h3 className='text-xl font-bold text-white mb-4'>📅 Monatlicher Umsatzverlauf</h3>

      {monthlyData.length === 0 ? (
        <p className='text-gray-400 text-center py-8'>Keine Daten verfügbar</p>
      ) : (
        <div className='space-y-3'>
          {monthlyData.map((month) => {
            const percentage = (month.total_revenue / maxRevenue) * 100;
            const [year, monthNum] = month.period.split('-');
            const monthName = new Date(Number(year), Number(monthNum) - 1).toLocaleDateString(
              'de-DE',
              { month: 'long', year: 'numeric' }
            );

            return (
              <div key={month.period} className='bg-gray-750 rounded-lg p-4'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-lg font-semibold text-white'>{monthName}</span>
                  <div className='text-right'>
                    <div className='text-blue-400 font-bold text-lg'>
                      €{month.total_revenue.toFixed(2)}
                    </div>
                    <div className='text-gray-400 text-sm'>{month.total_quantity} Artikel</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className='w-full bg-gray-700 rounded-full h-3 overflow-hidden'>
                  <div
                    className='bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-500 rounded-full'
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>

                <div className='mt-2 text-sm text-gray-400'>
                  Top 3:{' '}
                  {month.products
                    .slice(0, 3)
                    .map((p) => p.product_name)
                    .join(', ')}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// KPI Card Component
const KPICard: React.FC<{
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}> = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'from-blue-600 to-blue-700',
    green: 'from-green-600 to-green-700',
    yellow: 'from-yellow-600 to-yellow-700',
    purple: 'from-purple-600 to-purple-700',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-lg p-4 text-white shadow-lg`}>
      <div className='flex items-center justify-between mb-2'>
        <span className='text-3xl'>{icon}</span>
        <div className='text-right'>
          <div className='text-2xl font-bold'>{value}</div>
        </div>
      </div>
      <div className='text-sm opacity-90'>{title}</div>
    </div>
  );
};
