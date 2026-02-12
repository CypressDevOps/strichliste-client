// src/app/MonthlyReportModal.tsx
import React, { useState } from 'react';
import { generateMonthlyReportPDF } from '../utils/pdfExportService';

interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({ isOpen, onClose }) => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth()); // 0-11
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const months = [
    'Januar',
    'Februar',
    'März',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember',
  ];

  // Generate year options (current year and past 3 years)
  const years = Array.from({ length: 4 }, (_, i) => currentDate.getFullYear() - i);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateMonthlyReportPDF(selectedYear, selectedMonth);
      onClose();
    } catch (error) {
      console.error('Fehler beim Generieren des PDF:', error);
      alert('Fehler beim Erstellen des Monatsabschlusses');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-gray-800 rounded-lg shadow-2xl w-96 border border-gray-700'>
        <div className='px-6 py-4 border-b border-gray-700 flex justify-between items-center'>
          <h2 className='text-xl font-bold text-white'>📄 Monatsabschluss</h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-white text-2xl font-bold'
            disabled={isGenerating}
          >
            ×
          </button>
        </div>

        <div className='p-6 space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-300 mb-2'>Monat</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className='w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-green-500'
              disabled={isGenerating}
            >
              {months.map((month, index) => (
                <option key={index} value={index}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-300 mb-2'>Jahr</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className='w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-green-500'
              disabled={isGenerating}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className='pt-4 flex gap-3'>
            <button
              onClick={onClose}
              className='flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition'
              disabled={isGenerating}
            >
              Abbrechen
            </button>
            <button
              onClick={handleGenerate}
              className='flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2'
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <div className='inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white'></div>
                  Erstelle...
                </>
              ) : (
                <>
                  <span>📥</span>
                  PDF erstellen
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
