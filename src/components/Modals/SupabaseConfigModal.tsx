import React from 'react';
import { DatabaseStatusModal } from './DatabaseStatusModal';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

/**
 * Componente de compatibilidade para o Modal do Banco de Dados
 * Toda a persistência foi migrada para a API REST PHP 8.x + MySQL da Hostinger.
 */
export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = (props) => {
  return <DatabaseStatusModal {...props} />;
};

export default SupabaseConfigModal;
