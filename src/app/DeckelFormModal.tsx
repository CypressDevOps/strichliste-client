import React, { useState, useEffect, useRef } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

export const DeckelFormModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Fokus setzen, wenn Modal geöffnet wird
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!name.trim()) {
      setError("Der Name darf nicht leer sein.");
      return;
    }
    onSave(name.trim());
    setName("");
    setError("");
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave(); // Enter → speichern
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Neuen Deckel anlegen</h2>

        <label className="block mb-2">
          Name des Deckels
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            ref={inputRef}            // <-- Fokus
            onKeyDown={handleKeyDown} // <-- Enter speichert
            className="border w-full p-2 mt-1 rounded"
            placeholder="Tischnummer oder Gastname"
          />
        </label>
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">
            Abbrechen
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
};
