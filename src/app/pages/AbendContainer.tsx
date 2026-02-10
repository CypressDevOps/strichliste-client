// src/app/pages/AbendContainer.tsx
import React, { useState } from 'react';
import { DeckelUIState, DeckelStatus } from '../../domain/models';
import { closeEvening, Change, markEveningClosedNow } from '../../utils/closeEvening';
import { DeckelFooter } from '../components/DeckelFooter';
import { GuestList } from '../components/GuestList';

// Beispiel-API-Wrapper (ANPASSEN!)
const api = {
  batchUpdateDeckelStatus: async (items: { id: string; status: DeckelStatus }[]) => {
    const resp = await fetch('/api/deckel/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items),
    });

    if (!resp.ok) throw new Error('Batch update failed');
    return resp.json();
  },

  updateDeckelStatus: async (id: string, status: DeckelStatus) => {
    const resp = await fetch(`/api/deckel/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (!resp.ok) throw new Error('Update failed');
    return resp.json();
  },

  fetchDeckelList: async (): Promise<DeckelUIState[]> => {
    const resp = await fetch('/api/deckel');
    if (!resp.ok) throw new Error('Fetch failed');
    return resp.json();
  },
};

export const AbendContainer: React.FC = () => {
  const [deckelList, setDeckelList] = useState<DeckelUIState[]>([]); // initial befüllen
  const [isProcessing, setIsProcessing] = useState(false);

  // onStatusChange für einzelne manuelle Drags (GuestList nutzt das)
  const onStatusChange = async (id: string, status: DeckelStatus) => {
    // optional: optimistisches Update
    setDeckelList((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
    try {
      await api.updateDeckelStatus(id, status);
    } catch (err) {
      console.error('update failed', id, status, err);
      // rollback: refetch
      const fresh = await api.fetchDeckelList();
      setDeckelList(fresh);
    }
  };

  // Der zentrale Handler für "Abend abschließen" (Variante A)
  const handleAbendAbschliessen = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // 1) Berechne Änderungen (nur client-side)
      const changes: Change[] = closeEvening(deckelList);
      console.log('closeEvening computed changes:', changes);

      if (changes.length === 0) {
        console.log('Keine Änderungen nötig.');
        setIsProcessing(false);
        return;
      }

      // 2) Optimistisches lokales Update
      setDeckelList((prev) =>
        prev.map((d) => {
          const c = changes.find((x) => x.id === d.id);
          return c ? { ...d, status: c.to } : d;
        })
      );

      // 3) Sende Änderungen an Server: bevorzugt Batch, sonst sequentiell
      try {
        const payload = changes.map((c) => ({ id: c.id, status: c.to }));
        if (typeof api.batchUpdateDeckelStatus === 'function') {
          await api.batchUpdateDeckelStatus(payload);
        } else {
          for (const c of changes) {
            await api.updateDeckelStatus(c.id, c.to);
          }
        }

        // 4) Nach erfolgreichem Update: lade aktuellen Server‑State neu
        const fresh = await api.fetchDeckelList();
        setDeckelList(fresh);

        // 5) Setze localStorage Timestamp (Sperre bis 05:00)
        markEveningClosedNow();
      } catch (err) {
        console.error('Fehler beim Anwenden der Änderungen:', err);
        // Rollback: lade Server‑State
        const fresh = await api.fetchDeckelList();
        setDeckelList(fresh);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className='min-h-screen flex flex-col'>
      <main className='flex-1'>
        <GuestList
          deckelList={deckelList}
          selectedDeckelId={null}
          onSelect={() => {}}
          deckelBackground='/img/deckel-bg.jpg'
          paidDeckelBackground='/img/deckel-paid.jpg'
          onStatusChange={onStatusChange}
        />
      </main>

      <DeckelFooter
        isAbendGeschlossen={false}
        isSelectedPresent={false}
        selectedDeckel={null}
        isReadOnly={false}
        hasTransactions={false}
        darfDeckelGezahltWerden={false}
        darfKorrigieren={false}
        onAddGuest={() => {}}
        onDeleteGuest={() => {}}
        onOpenEinzahlung={() => {}}
        onPayDeckel={() => {}}
        onOpenCorrection={() => {}}
        onAbendAbschliessen={handleAbendAbschliessen}
      />
    </div>
  );
};
