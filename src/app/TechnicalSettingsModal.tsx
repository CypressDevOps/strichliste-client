// src/app/TechnicalSettingsModal.tsx
import React, { useState } from 'react';
import {
  getTechnicalSettings,
  setBackupPath,
  setDebugMode,
  getDebugInfo,
} from '../domain/technicalSettingsService';

interface TechnicalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TechnicalSettingsModal: React.FC<TechnicalSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [settings, setSettings] = useState(getTechnicalSettings());
  const [activeTab, setActiveTab] = useState<'backup' | 'debug'>('backup');
  const [debugInfo, setDebugInfo] = useState(getDebugInfo());

  const handleBackupPathChange = (platform: keyof typeof settings.backupPath, newPath: string) => {
    setBackupPath(platform, newPath);
    const updated = getTechnicalSettings();
    setSettings(updated);
  };

  const handleDebugModeToggle = () => {
    const newValue = !settings.debugMode;
    setDebugMode(newValue);
    const updated = getTechnicalSettings();
    setSettings(updated);
    // Aktualisiere Debug-Info
    setDebugInfo(getDebugInfo());
  };

  const handleCopyDebugInfo = () => {
    const json = JSON.stringify(debugInfo, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      alert('Debug-Info in Zwischenablage kopiert');
    });
  };

  const handleExportDebugInfo = () => {
    const json = JSON.stringify(debugInfo, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `debug-info_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4'>
      <div className='bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center'>
          <h2 className='text-2xl font-bold text-white flex items-center gap-2'>
            🔧 Technische Einstellungen
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
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2 rounded font-semibold transition ${
              activeTab === 'backup'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            💾 Backup-Pfade
          </button>
          <button
            onClick={() => setActiveTab('debug')}
            className={`px-4 py-2 rounded font-semibold transition ${
              activeTab === 'debug'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            🐛 Debug-Infos
          </button>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto p-6 space-y-4'>
          {activeTab === 'backup' && (
            <>
              <div className='bg-gray-700 p-4 rounded-lg border border-gray-600'>
                <h3 className='text-lg font-semibold text-white mb-4'>Backup-Speicherpfade</h3>

                {/* Windows */}
                <div className='mb-4'>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>🪟 Windows</label>
                  <input
                    type='text'
                    value={settings.backupPath.windows || ''}
                    onChange={(e) => handleBackupPathChange('windows', e.target.value)}
                    className='w-full px-3 py-2 bg-gray-900 text-white rounded border border-gray-600 text-sm'
                    placeholder='z.B. C:\Users\Username\Downloads'
                  />
                </div>

                {/* Android */}
                <div className='mb-4'>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>🤖 Android</label>
                  <input
                    type='text'
                    value={settings.backupPath.android || ''}
                    onChange={(e) => handleBackupPathChange('android', e.target.value)}
                    className='w-full px-3 py-2 bg-gray-900 text-white rounded border border-gray-600 text-sm'
                    placeholder='z.B. /Download'
                  />
                </div>

                {/* iOS */}
                <div className='mb-4'>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>🍎 iOS</label>
                  <input
                    type='text'
                    value={settings.backupPath.ios || ''}
                    onChange={(e) => handleBackupPathChange('ios', e.target.value)}
                    className='w-full px-3 py-2 bg-gray-900 text-white rounded border border-gray-600 text-sm'
                    placeholder='z.B. iCloud Drive / Files App'
                  />
                </div>

                {/* macOS */}
                <div className='mb-4'>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>🍎 macOS</label>
                  <input
                    type='text'
                    value={settings.backupPath.macos || ''}
                    onChange={(e) => handleBackupPathChange('macos', e.target.value)}
                    className='w-full px-3 py-2 bg-gray-900 text-white rounded border border-gray-600 text-sm'
                    placeholder='z.B. ~/Downloads'
                  />
                </div>

                {/* Linux */}
                <div className='mb-4'>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>🐧 Linux</label>
                  <input
                    type='text'
                    value={settings.backupPath.linux || ''}
                    onChange={(e) => handleBackupPathChange('linux', e.target.value)}
                    className='w-full px-3 py-2 bg-gray-900 text-white rounded border border-gray-600 text-sm'
                    placeholder='z.B. ~/Downloads'
                  />
                </div>

                {/* Web */}
                <div className='mb-4'>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>🌐 Web</label>
                  <input
                    type='text'
                    value={settings.backupPath.web || ''}
                    onChange={(e) => handleBackupPathChange('web', e.target.value)}
                    className='w-full px-3 py-2 bg-gray-900 text-white rounded border border-gray-600 text-sm'
                    placeholder='Browser Download Verzeichnis'
                  />
                </div>

                {/* Backup-Status */}
                <div className='mt-6 pt-4 border-t border-gray-600'>
                  <p className='text-xs text-gray-400 mb-2'>📊 Backup-Status:</p>
                  {settings.lastBackupDate && (
                    <p className='text-sm text-gray-300'>
                      Letztes Backup: {new Date(settings.lastBackupDate).toLocaleString('de-DE')}
                    </p>
                  )}
                  {settings.lastBackupSize && (
                    <p className='text-sm text-gray-300'>
                      Größe: {(settings.lastBackupSize / 1024).toFixed(2)} KB
                    </p>
                  )}
                  {!settings.lastBackupDate && (
                    <p className='text-sm text-gray-400'>Noch kein Backup erstellt</p>
                  )}
                </div>
              </div>

              <div className='bg-yellow-900/30 border border-yellow-700 p-4 rounded-lg'>
                <p className='text-sm text-yellow-200'>
                  ℹ️ Die Pfade werden automatisch je nach Plattform angewendet. Aktualisiere sie mit
                  deinen tatsächlichen Speicherorten.
                </p>
              </div>
            </>
          )}

          {activeTab === 'debug' && (
            <>
              <div className='bg-gray-700 p-4 rounded-lg border border-gray-600'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-white'>Debug-Modus</h3>
                  <button
                    onClick={handleDebugModeToggle}
                    className={`px-3 py-1 rounded text-sm font-semibold transition ${
                      settings.debugMode
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    {settings.debugMode ? '🔴 AKTIV' : '⚪ Inaktiv'}
                  </button>
                </div>

                <div className='bg-gray-900 p-3 rounded border border-gray-600 mb-4'>
                  <p className='text-xs text-gray-400 mb-3 font-mono'>Debug-Informationen:</p>
                  <pre className='text-xs text-green-400 overflow-auto max-h-64 font-mono'>
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>

                <div className='flex gap-2'>
                  <button
                    onClick={handleCopyDebugInfo}
                    className='flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition'
                  >
                    📋 In Zwischenablage
                  </button>
                  <button
                    onClick={handleExportDebugInfo}
                    className='flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition'
                  >
                    💾 Exportieren
                  </button>
                </div>
              </div>

              <div className='bg-blue-900/30 border border-blue-700 p-4 rounded-lg'>
                <p className='text-sm text-blue-200'>
                  ℹ️ Debug-Infos helfen bei der Fehlerbehebung. Diese Informationen enthalten
                  System- und Speicherdaten.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className='sticky bottom-0 bg-gray-800 border-t border-gray-700 px-6 py-4 flex gap-3 justify-end'>
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
