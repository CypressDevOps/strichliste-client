// src/app/components/GuestList.tsx
import React, { useMemo, useState } from 'react';
import { DECKEL_STATUS, DeckelUIState, DeckelStatus } from '../../domain/models';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
  useDraggable,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { getTotalValue } from '../../utils/closeEvening';

interface GuestListProps {
  deckelList: DeckelUIState[];
  selectedDeckelId: string | null;
  onSelect: (id: string) => void;
  deckelBackground: string;
  paidDeckelBackground: string;
  onStatusChange?: (id: string, status: DeckelStatus) => void;
}

/**
 * DroppableColumn
 */
const DroppableColumn: React.FC<{
  id: string;
  title: string;
  children: React.ReactNode;
  bgColor?: string;
  deckels?: DeckelUIState[];
}> = ({ id, title, children, bgColor, deckels = [] }) => {
  const { setNodeRef } = useDroppable({ id });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div
      ref={setNodeRef}
      className='mb-6 border-b border-gray-700/40 pb-4 rounded-md'
      style={{
        background: bgColor ?? 'transparent',
        paddingTop: '0.25rem',
        paddingBottom: '0.75rem',
      }}
    >
      <div className='flex items-center justify-between pl-4 pr-4 mb-3'>
        <h3 className='text-xl font-bold text-gray-200'>{title}</h3>

        {deckels.length > 0 && (
          <div className='relative'>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className='text-gray-300 hover:text-white text-sm bg-gray-700/50 hover:bg-gray-700 px-3 py-1 rounded-md flex items-center gap-2 transition'
            >
              <span>
                {deckels.length} {deckels.length === 1 ? 'Deckel' : 'Deckel'}
              </span>
              <span
                className={`transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              >
                ▼
              </span>
            </button>

            {isDropdownOpen && (
              <div className='absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50 max-h-80 overflow-y-auto'>
                {deckels.map((deckel) => {
                  const total = deckel.transactions?.reduce((acc, t) => acc + (t.sum ?? 0), 0) ?? 0;
                  return (
                    <div
                      key={deckel.id}
                      className='px-4 py-2 hover:bg-gray-700 border-b border-gray-700/50 last:border-b-0'
                    >
                      <div className='flex justify-between items-center'>
                        <span className='text-white font-medium'>{deckel.name}</span>
                        <span
                          className={`text-sm ${total < 0 ? 'text-red-400' : total > 0 ? 'text-green-400' : 'text-gray-400'}`}
                        >
                          {total.toFixed(2).replace('.', ',')} €
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      {children}
    </div>
  );
};

const DraggableGuest: React.FC<{
  deckel: DeckelUIState;
  isSelected: boolean;
  deckelBackground: string;
  paidDeckelBackground: string;
  onSelect: (id: string) => void;
}> = ({ deckel, isSelected, deckelBackground, paidDeckelBackground, onSelect }) => {
  const isDraggable = deckel.status !== DECKEL_STATUS.BEZAHLT;

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: deckel.id,
    disabled: !isDraggable,
  });

  const handleStyle = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  const isDimmed = !isSelected;

  return (
    <li
      className='flex flex-col items-start cursor-pointer'
      onClick={() => onSelect(deckel.id)}
      role='button'
      aria-pressed={isSelected}
    >
      <div className='pl-4 w-fit'>
        <span className='mb-2 text-yellow-300 text-xl font-semibold block'>{deckel.name}</span>

        <div
          className='relative w-[120px] h-[120px] md:w-[150px] md:h-[150px] rounded-lg overflow-hidden flex-shrink-0 transition'
          style={{
            backgroundImage: `url(${
              deckel.status === DECKEL_STATUS.BEZAHLT ? paidDeckelBackground : deckelBackground
            })`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {isDimmed && (
            <div className='absolute inset-0 bg-black/60 rounded-lg pointer-events-none' />
          )}

          {isDraggable && (
            <div
              ref={setNodeRef}
              style={{
                ...handleStyle,
                touchAction: 'none',
              }}
              {...attributes}
              {...listeners}
              className='absolute bottom-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-xs text-white cursor-grab active:cursor-grabbing z-10'
              onClick={(e) => e.stopPropagation()}
              aria-label='Drag handle'
            >
              ⇅
            </div>
          )}
        </div>
      </div>
    </li>
  );
};

export const GuestList: React.FC<GuestListProps> = ({
  deckelList,
  selectedDeckelId,
  onSelect,
  deckelBackground,
  paidDeckelBackground,
  onStatusChange,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const offen = deckelList.filter((d) => d.status === DECKEL_STATUS.OFFEN);
  const gone = deckelList.filter((d) => d.status === DECKEL_STATUS.GONE);
  const bezahlt = deckelList.filter((d) => d.status === DECKEL_STATUS.BEZAHLT);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    })
  );

  const renderList = (list: DeckelUIState[]) => (
    <ul className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4'>
      {list.map((deckel) => (
        <DraggableGuest
          key={deckel.id}
          deckel={deckel}
          isSelected={selectedDeckelId === deckel.id}
          deckelBackground={deckelBackground}
          paidDeckelBackground={paidDeckelBackground}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  /**
   * Korrigierte handleDragEnd:
   * - Verschiebt nur das aktive Element.
   * - Verschieben nach BEZAHLT nur erlaubt, wenn total === 0.
   * - Wenn in GONE gedroppt: nur aktives Element -> GONE (keine Massenverschiebung).
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;
    if (!onStatusChange) return;

    const targetId = String(over.id) as DeckelStatus;
    const activeIdStr = active?.id ? String(active.id) : null;
    if (!activeIdStr) return;

    const activeDeckel = deckelList.find((d) => d.id === activeIdStr);
    if (!activeDeckel) return;

    // 1) Versuch, nach BEZAHLT zu verschieben: nur erlaubt, wenn total === 0
    if (targetId === DECKEL_STATUS.BEZAHLT) {
      const total = getTotalValue(activeDeckel);
      if (total === null || total !== 0) {
        // nicht erlaubt: ignoriere den Drop
        console.warn(
          `Verschieben nach BEZAHLT nicht erlaubt (Deckel ${activeIdStr} hat total=${total})`
        );
        return;
      }
      if (activeDeckel.status !== DECKEL_STATUS.BEZAHLT) {
        onStatusChange(activeIdStr, DECKEL_STATUS.BEZAHLT);
      }
      return;
    }

    // 2) Wenn in GONE gedroppt wurde: nur aktives Element -> GONE
    if (targetId === DECKEL_STATUS.GONE) {
      if (activeDeckel.status !== DECKEL_STATUS.GONE) {
        onStatusChange(activeIdStr, DECKEL_STATUS.GONE);
      }
      return;
    }

    // 3) Standardfall: OFFEN (oder andere Spalten) — verschiebe aktives Element, falls nötig
    if (targetId === DECKEL_STATUS.OFFEN) {
      if (activeDeckel.status !== DECKEL_STATUS.OFFEN) {
        onStatusChange(activeIdStr, DECKEL_STATUS.OFFEN);
      }
      return;
    }

    // Fallback: ignoriere
  };

  const activeDeckel = useMemo(
    () => deckelList.find((d) => d.id === activeId) ?? null,
    [deckelList, activeId]
  );

  const columnColors: Record<string, string> = {
    [DECKEL_STATUS.OFFEN]:
      'linear-gradient(180deg, rgba(255, 255, 255, 0), rgba(8, 160, 21, 0.81))',
    [DECKEL_STATUS.GONE]:
      'linear-gradient(180deg, rgba(133, 20, 12, 0.04), rgba(216, 160, 5, 0.74))',
    [DECKEL_STATUS.BEZAHLT]:
      'linear-gradient(180deg, rgba(16,185,129,0.04), rgba(185, 16, 16, 0.58))',
  };

  return (
    <div className='w-full lg:w-1/3 overflow-y-auto h-[calc(100dvh-140px)]'>
      {deckelList.length === 0 ? (
        <p className='text-gray-300 text-center mt-80 text-3xl font-semibold'>
          Kein Gast im Schützenverein 🎯
        </p>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <DroppableColumn
            id={DECKEL_STATUS.OFFEN}
            title='Gast ist da'
            bgColor={columnColors[DECKEL_STATUS.OFFEN]}
            deckels={offen}
          >
            {renderList(offen)}
          </DroppableColumn>

          <DroppableColumn
            id={DECKEL_STATUS.GONE}
            title='Gast ist gegangen'
            bgColor={columnColors[DECKEL_STATUS.GONE]}
            deckels={gone}
          >
            {renderList(gone)}
          </DroppableColumn>

          <DroppableColumn
            id={DECKEL_STATUS.BEZAHLT}
            title='Gast hat bezahlt'
            bgColor={columnColors[DECKEL_STATUS.BEZAHLT]}
            deckels={bezahlt}
          >
            {renderList(bezahlt)}
          </DroppableColumn>

          <DragOverlay>
            {activeDeckel ? (
              <div className='w-[120px] h-[120px] md:w-[150px] md:h-[150px] rounded-lg overflow-hidden shadow-lg'>
                <div
                  className='w-full h-full bg-cover bg-center'
                  style={{
                    backgroundImage: `url(${
                      activeDeckel.status === DECKEL_STATUS.BEZAHLT
                        ? paidDeckelBackground
                        : deckelBackground
                    })`,
                  }}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
};
