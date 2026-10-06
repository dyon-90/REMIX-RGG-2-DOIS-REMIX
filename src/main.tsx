import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { purgePrincipalDataFromStorage } from './services/storageCleanup';

// Executa limpeza preventiva antes da montagem para garantir que o banco central na nuvem
// seja a única e exclusiva fonte de dados em todos os dispositivos, com zero persistência local de entidades
purgePrincipalDataFromStorage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
