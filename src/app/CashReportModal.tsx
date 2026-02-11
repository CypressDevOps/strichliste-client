// src/app/CashReportModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  getReportsByMonth,
  getCurrentYearMonth,
  getAvailableYears,
  DailyRevenue,
} from '../domain/cashReportService';

interface CashReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashReportModal: React.FC<CashReportModalProps> = ({ isOpen, onClose }) => {
  const { year: currentYear, month: currentMonth } = getCurrentYearMonth();

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [reports, setReports] = useState<DailyRevenue[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const wasOpen = useRef(false);

  const loadReports = (year: number, month: number) => {
    const filtered = getReportsByMonth(year, month);
    setReports(filtered);
  };

  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      // Reset to current month when opening
      wasOpen.current = true;

      // Use queueMicrotask to avoid cascading renders warning
      queueMicrotask(() => {
        setSelectedYear(currentYear);
        setSelectedMonth(currentMonth);

        const years = getAvailableYears();
        setAvailableYears(years.length > 0 ? years : [currentYear]);

        loadReports(currentYear, currentMonth);
      });
    } else if (!isOpen && wasOpen.current) {
      wasOpen.current = false;
    }
  }, [isOpen, currentYear, currentMonth]);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    loadReports(year, selectedMonth);
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    loadReports(selectedYear, month);
  };

  const totalRevenue = reports.reduce((sum, r) => sum + r.revenue, 0);

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

  return (
    <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-50'>
      <div className='bg-gray-800 p-6 rounded-lg w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto text-white'>
        <h2 className='text-2xl font-bold mb-6'>Kassenbericht</h2>

        {/* Filter Section */}
        <div className='flex gap-4 mb-6'>
          <div className='flex-1'>
            <label className='block text-sm mb-2'>Jahr</label>
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              className='w-full p-2 rounded bg-gray-700 text-white border border-gray-600'
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className='flex-1'>
            <label className='block text-sm mb-2'>Monat</label>
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(Number(e.target.value))}
              className='w-full p-2 rounded bg-gray-700 text-white border border-gray-600'
            >
              {months.map((month, index) => (
                <option key={index + 1} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Einzelne Tage */}
        {reports.length === 0 ? (
          <div className='text-center text-gray-400 py-8'>
            Keine Einträge für {months[selectedMonth - 1]} {selectedYear}
          </div>
        ) : (
          <>
            <div className='space-y-3 mb-6'>
              {reports.map((report, index) => {
                const date = new Date(report.date);
                const timestamp = new Date(report.timestamp);
                return (
                  <div
                    key={index}
                    className='bg-gray-700 p-4 rounded-lg flex justify-between items-center hover:bg-gray-650 transition'
                  >
                    <div>
                      <div className='font-semibold text-lg'>
                        {date.toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </div>
                      <div className='text-sm text-gray-400'>
                        Abgeschlossen um{' '}
                        {timestamp.toLocaleTimeString('de-DE', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        Uhr
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-sm text-gray-400'>Umsatz</div>
                      <div className='text-2xl font-bold text-green-400'>
                        {report.revenue.toFixed(2)} €
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Gesamtumsatz unten */}
            <div className='bg-green-700 p-5 rounded-lg border-2 border-green-500'>
              <div className='flex justify-between items-center'>
                <div>
                  <div className='text-sm text-green-200 uppercase tracking-wide'>
                    Gesamtumsatz {months[selectedMonth - 1]} {selectedYear}
                  </div>
                  <div className='text-sm text-green-200 mt-1'>{reports.length} Tage</div>
                </div>
                <div className='text-4xl font-bold'>{totalRevenue.toFixed(2)} €</div>
              </div>
            </div>
          </>
        )}

        {/* Close Button */}
        <div className='mt-6 flex justify-end'>
          <button
            onClick={onClose}
            className='px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded transition'
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
