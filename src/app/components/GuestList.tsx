// src/app/components/GuestList.tsx
import React from 'react';
import { DECKEL_STATUS, DeckelUIState } from '../../domain/models';
import { formatPossessiveCompound } from '../../utils/nameUtils';

interface GuestListProps {
  deckelList: DeckelUIState[];
  selectedDeckelId: string | null;
  onSelect: (id: string) => void;
  deckelBackground: string;
  paidDeckelBackground: string;
}

export const GuestList: React.FC<GuestListProps> = ({
  deckelList,
  selectedDeckelId,
  onSelect,
  deckelBackground,
  paidDeckelBackground,
}) => {
  return (
    <div className='w-full lg:w-1/3 overflow-y-auto h-[calc(100dvh-140px)]'>
      <h2 className='text-lg font-semibold mb-4 pl-4'></h2>

      {deckelList.length === 0 ? (
        <p className='text-gray-300 text-center mt-80 text-3xl font-semibold'>
          Kein Gast im Schützenverein 🎯
        </p>
      ) : (
        <ul className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {deckelList.map((deckel) => {
            const isSelected = selectedDeckelId === deckel.id;
            const isDimmed = !isSelected;

            return (
              <li
                key={deckel.id}
                className='flex flex-col items-start cursor-pointer'
                onClick={() => onSelect(deckel.id)}
              >
                <div className='pl-4'>
                  <span className='mb-2 text-yellow-300 text-xl font-semibold'>
                    {formatPossessiveCompound(deckel.name)}
                  </span>

                  <div
                    className={`w-[120px] h-[120px] md:w-[150px] md:h-[150px] rounded-lg overflow-hidden relative flex-shrink-0 transition`}
                    style={{
                      backgroundImage: `url(${
                        deckel.status === DECKEL_STATUS.BEZAHLT
                          ? paidDeckelBackground
                          : deckelBackground
                      })`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }}
                  >
                    {isDimmed && (
                      <div className='absolute inset-0 bg-black/60 rounded-lg pointer-events-none'></div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
