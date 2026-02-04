import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css'; // Tailwind import
import { DeckelScreen } from './app/DeckelScreen';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DeckelScreen />
  </React.StrictMode>
);
