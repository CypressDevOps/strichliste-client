import React, { useEffect, useState } from 'react';
import { DeckelUIState, DECKEL_STATUS } from '../domain/models';
import ReactDOM from 'react-dom';

type Props = {
  candidates: DeckelUIState[];
  sourceId: string;
  onMerge: (targetId: string, options?: { note?: string }) => void;
  onCreateNew: (name: string) => void;
  onCancel: () => void;
};

export const MergeCorrectionModal: React.FC<Props> = ({
  candidates,
  sourceId,
  onMerge,
  onCreateNew,
  onCancel,
}) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [isMerging, setIsMerging] = useState(false);

  useEffect(() => {
    // focus first item for a11y
    if (candidates.length > 0) setSelected(candidates[0].id);
  }, [candidates]);

  const handleMerge = () => {
    if (!selected) return;
    const target = candidates.find((c) => c.id === selected);
    if (!target) return;
    if (target.status === DECKEL_STATUS.BEZAHLT) return; // blocked
    setIsMerging(true);
    onMerge(selected, { note: 'Korrektur Merge' });
  };

  const modalContent = (
    <div
      role='dialog'
      aria-modal='true'
      aria-labelledby='merge-title'
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
        zIndex: 2000,
      }}
    >
      <div
        style={{
          background: '#0b1220',
          color: 'white',
          padding: 20,
          borderRadius: 8,
          width: 'min(880px, 95%)',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
      >
        <h2 id='merge-title'>Korrektur: In welchen Deckel zusammenführen?</h2>

        <div style={{ marginTop: 12 }}>
          {candidates.length === 0 && <p>Keine Ziel‑Deckel mit gleichem Namen gefunden.</p>}
          {candidates
            .sort((a, b) => {
              const aActive = a.isActive ? 0 : 1;
              const bActive = b.isActive ? 0 : 1;
              if (aActive !== bActive) return aActive - bActive;
              return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
            })
            .map((c) => (
              <div
                key={c.id}
                onClick={() => setSelected(c.id)}
                role='button'
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' ? setSelected(c.id) : null)}
                aria-pressed={selected === c.id}
                style={{
                  padding: 10,
                  borderRadius: 6,
                  background: selected === c.id ? 'rgba(255,255,255,0.04)' : 'transparent',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                  cursor: 'pointer',
                }}
              >
                <div>
                  <strong>{c.name}</strong>
                  <div style={{ opacity: 0.8, fontSize: 12 }}>
                    {c.status} — {c.ownerId}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 13 }}>
                  <div>Letzte Aktivität: {new Date(c.lastActivity).toLocaleString()}</div>
                  <div>Saldo: {(c.transactions ?? []).reduce((s, t) => s + t.sum, 0)} €</div>
                  {c.status === DECKEL_STATUS.BEZAHLT && (
                    <div style={{ color: '#ffb4b4' }}>Ziel ist bezahlt — Merge blockiert</div>
                  )}
                </div>
              </div>
            ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
          <button
            onClick={handleMerge}
            disabled={
              !selected ||
              isMerging ||
              candidates.find((c) => c.id === selected)?.status === DECKEL_STATUS.BEZAHLT
            }
            style={{
              flex: '1 1 auto',
              minWidth: 180,
              padding: '12px 16px',
              background:
                !selected ||
                isMerging ||
                candidates.find((c) => c.id === selected)?.status === DECKEL_STATUS.BEZAHLT
                  ? '#555'
                  : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor:
                !selected ||
                isMerging ||
                candidates.find((c) => c.id === selected)?.status === DECKEL_STATUS.BEZAHLT
                  ? 'not-allowed'
                  : 'pointer',
              opacity:
                !selected ||
                isMerging ||
                candidates.find((c) => c.id === selected)?.status === DECKEL_STATUS.BEZAHLT
                  ? 0.6
                  : 1,
              transition: 'all 0.2s',
            }}
          >
            {isMerging ? 'Wird zusammengeführt...' : 'Zusammenführen'}
          </button>
          <button
            onClick={() => onCreateNew('')}
            style={{
              flex: '1 1 auto',
              minWidth: 150,
              padding: '12px 16px',
              background: '#1e40af',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = '#1e3a8a')}
            onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = '#1e40af')}
          >
            Neuer Deckel
          </button>
          <button
            onClick={onCancel}
            style={{
              padding: '12px 16px',
              background: '#666',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = '#777')}
            onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = '#666')}
          >
            Abbrechen
          </button>
        </div>

        {/* TODO: Improve ARIA attributes and i18n keys. Ensure Enter/Esc keyboard handling globally. */}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default MergeCorrectionModal;
