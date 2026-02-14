// src/app/BusinessInfoModal.tsx
import React, { useState } from 'react';
import { BusinessData } from '../domain/models';
import {
  loadBusinessInfo,
  saveBusinessInfo,
  resetBusinessInfo,
} from '../domain/businessInfoService';

interface BusinessInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BusinessInfoModal: React.FC<BusinessInfoModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<BusinessData>(loadBusinessInfo());

  const handleSave = () => {
    saveBusinessInfo(formData);
    onClose();
  };

  const handleReset = () => {
    if (confirm('Betriebsinformationen auf Standardwerte zurücksetzen?')) {
      const defaults = resetBusinessInfo();
      setFormData(defaults);
      alert('Auf Standardwerte zurückgesetzt!');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Prüfe ob es ein Bild ist
    if (!file.type.startsWith('image/')) {
      alert('Bitte wählen Sie eine Bilddatei aus (PNG, JPG, etc.)');
      return;
    }

    // Prüfe Dateigröße (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Bild ist zu groß. Maximale Größe: 2MB');
      return;
    }

    // Konvertiere zu Data URL (base64) für localStorage
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormData({ ...formData, logoPath: dataUrl });
    };
    reader.onerror = () => {
      alert('Fehler beim Laden des Bildes');
    };
    reader.readAsDataURL(file);
  };

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Prüfe ob es ein Bild ist
    if (!file.type.startsWith('image/')) {
      alert('Bitte wählen Sie eine Bilddatei aus (PNG, JPG, etc.)');
      return;
    }

    // Prüfe Dateigröße (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Bild ist zu groß. Maximale Größe: 2MB');
      return;
    }

    // Konvertiere zu Data URL (base64) für localStorage
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormData({ ...formData, backgroundPath: dataUrl });
    };
    reader.onerror = () => {
      alert('Fehler beim Laden des Bildes');
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto'>
        <h2 className='text-2xl font-bold mb-6 text-gray-800'>Betriebsinformationen</h2>

        <div className='space-y-4'>
          {/* Firmenname */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Firmenname *</label>
            <input
              type='text'
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white'
              placeholder='z.B. Kostas Beleg'
            />
          </div>

          {/* Adresse */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Adresse * (Mehrzeilig möglich)
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white'
              placeholder='z.B.&#10;Hauptstraße 45&#10;12345 Teststadt'
            />
          </div>

          {/* Steuernummer */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Steuernummer</label>
            <input
              type='text'
              value={formData.taxNumber || ''}
              onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white'
              placeholder='z.B. 12 345 678 901'
            />
          </div>

          {/* Umsatzsteuer-ID */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Umsatzsteuer-ID</label>
            <input
              type='text'
              value={formData.vatId || ''}
              onChange={(e) => setFormData({ ...formData, vatId: e.target.value })}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white'
              placeholder='z.B. DE123456789'
            />
          </div>

          {/* Telefon */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Telefon (optional)
            </label>
            <input
              type='text'
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white'
              placeholder='z.B. 030 123456'
            />
          </div>

          {/* Email */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Email (optional)</label>
            <input
              type='email'
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white'
              placeholder='z.B. info@example.de'
            />
          </div>

          {/* Logo-Pfad */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Logo (optional)</label>

            {/* Verstecktes File Input */}
            <input
              type='file'
              id='logo-upload'
              accept='image/*'
              onChange={handleImageUpload}
              className='hidden'
            />

            {/* Upload Button */}
            <button
              type='button'
              onClick={() => document.getElementById('logo-upload')?.click()}
              className='mb-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition flex items-center justify-center gap-2'
            >
              📁 Bild auswählen
            </button>

            {/* Aktueller Pfad/Vorschau */}
            {formData.logoPath && (
              <div className='mt-2 p-3 bg-gray-50 rounded border border-gray-300'>
                <p className='text-xs text-gray-600 mb-2'>Aktuelles Logo:</p>
                <div className='flex items-center gap-3'>
                  <img
                    src={formData.logoPath}
                    alt='Logo Vorschau'
                    className='h-16 w-auto object-contain bg-white border border-gray-200 rounded'
                    onError={(e) => {
                      // Wenn Bild nicht geladen werden kann, zeige Platzhalter
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className='flex-1 min-w-0'>
                    <p className='text-xs text-gray-500 truncate'>
                      {formData.logoPath.startsWith('data:')
                        ? 'Hochgeladenes Bild (Base64)'
                        : formData.logoPath}
                    </p>
                  </div>
                  <button
                    type='button'
                    onClick={() => setFormData({ ...formData, logoPath: '' })}
                    className='text-red-600 hover:text-red-800 text-sm'
                    title='Logo entfernen'
                  >
                    ❌
                  </button>
                </div>
              </div>
            )}

            <p className='text-xs text-gray-500 mt-2'>
              Wählen Sie ein Bild aus (max. 2MB) oder geben Sie einen Pfad ein (z.B.
              /images/logo.png)
            </p>

            {/* Manueller Pfad-Input */}
            <input
              type='text'
              value={formData.logoPath || ''}
              onChange={(e) => setFormData({ ...formData, logoPath: e.target.value })}
              className='mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white'
              placeholder='/images/logo.png oder data:image/...'
            />
          </div>

          {/* Deckel-Hintergrund */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Deckel-Hintergrund (optional)
            </label>

            {/* Verstecktes File Input */}
            <input
              type='file'
              id='background-upload'
              accept='image/*'
              onChange={handleBackgroundUpload}
              className='hidden'
            />

            {/* Upload Button */}
            <button
              type='button'
              onClick={() => document.getElementById('background-upload')?.click()}
              className='mb-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition flex items-center justify-center gap-2'
            >
              📁 Hintergrund auswählen
            </button>

            {/* Aktueller Pfad/Vorschau */}
            {formData.backgroundPath && (
              <div className='mt-2 p-3 bg-gray-50 rounded border border-gray-300'>
                <p className='text-xs text-gray-600 mb-2'>Aktueller Hintergrund:</p>
                <div className='flex items-center gap-3'>
                  <img
                    src={formData.backgroundPath}
                    alt='Hintergrund Vorschau'
                    className='h-16 w-auto object-contain bg-white border border-gray-200 rounded'
                    onError={(e) => {
                      // Wenn Bild nicht geladen werden kann, zeige Platzhalter
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className='flex-1 min-w-0'>
                    <p className='text-xs text-gray-500 truncate'>
                      {formData.backgroundPath.startsWith('data:')
                        ? 'Hochgeladenes Bild (Base64)'
                        : formData.backgroundPath}
                    </p>
                  </div>
                  <button
                    type='button'
                    onClick={() => setFormData({ ...formData, backgroundPath: '' })}
                    className='text-red-600 hover:text-red-800 text-sm'
                    title='Hintergrund entfernen'
                  >
                    ❌
                  </button>
                </div>
              </div>
            )}

            <p className='text-xs text-gray-500 mt-2'>
              Wählen Sie ein Bild aus (max. 2MB) oder geben Sie einen Pfad ein (z.B.
              /assets/Deckelhintergrund.png)
            </p>

            {/* Manueller Pfad-Input */}
            <input
              type='text'
              value={formData.backgroundPath || ''}
              onChange={(e) => setFormData({ ...formData, backgroundPath: e.target.value })}
              className='mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white'
              placeholder='/assets/Deckelhintergrund.png oder data:image/...'
            />
          </div>
        </div>

        {/* Buttons */}
        <div className='flex gap-3 mt-6'>
          <button
            onClick={handleSave}
            className='flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition'
          >
            💾 Speichern
          </button>
          <button
            onClick={handleReset}
            className='flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded transition'
          >
            🔄 Zurücksetzen
          </button>
          <button
            onClick={onClose}
            className='flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded transition'
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
