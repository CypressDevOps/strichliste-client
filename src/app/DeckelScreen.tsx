import React, { useState, useEffect } from 'react';
import { useDeckelState } from '../domain/deckelService';
import { DeckelFormModal } from './DeckelFormModal';
import deckelBackground from '../assets/Deckelhintergrund.png';

export const DeckelScreen: React.FC = () => {
  const { getSortedDeckel, addDeckel, selectDeckel } = useDeckelState();
  const [isModalOpen, setModalOpen] = useState(false);
  const [deckelList, setDeckelList] = useState([] as ReturnType<typeof getSortedDeckel>);

  // Aktualisiere die Deckel-Liste, wenn sich der State ändert
  useEffect(() => {
    setDeckelList(getSortedDeckel());
  }, [getSortedDeckel]);

  return (
    <div className='min-h-screen p-4 bg-gray-50'>
      {/* Button oben rechts */}
      <div className='relative z-20 flex justify-end mb-4 max-w-6xl mx-auto'>
        <button
          onClick={() => setModalOpen(true)}
          className='px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 transition'
          title='Neuen Deckel für einen Gast anlegen'
        >
          Neuen Deckel anlegen
        </button>
      </div>

      {/* Modal */}
      <DeckelFormModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSave={(deckel) => {
          addDeckel(deckel);
          setModalOpen(false);
        }}
      />

      {/* Deckel-Grid */}
      <ul
        className='list-none relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 
                gap-6 max-w-6xl mx-auto justify-items-center'
      >
        {deckelList.map((deckel) => {
          const isActive = deckel.isActive && deckel.status === 'OFFEN';

          return (
            <li
              key={deckel.id}
              className={`
    relative cursor-pointer overflow-hidden rounded-lg
    w-[150px] aspect-square flex flex-col justify-center items-center
    text-center p-4
    ${deckel.status === 'BEZAHLT' ? 'bg-gray-100 text-gray-500' : 'bg-white'}
    ${isActive ? 'shadow-lg scale-105 animate-pulse border-4 border-blue-400' : ''}
    transition transform
  `}
              style={{
                backgroundImage: `url(${deckelBackground})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundBlendMode: isActive ? 'multiply' : 'normal',
              }}
              onClick={() => selectDeckel(deckel.id)}
            >
              {/* Name + ✔-Icon */}
              <div
                className={`relative z-10 ${deckel.status === 'BEZAHLT' ? 'opacity-70' : 'opacity-100'}`}
              >
                <span className='text-lg font-semibold'>{deckel.name}</span>
                {deckel.status === 'BEZAHLT' && (
                  <span className='text-green-700 font-bold ml-2'>✔</span>
                )}
              </div>

              {/* Aktiv Overlay */}
              {isActive && (
                <div className='absolute inset-0 border-4 border-blue-400 rounded-lg pointer-events-none'></div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
