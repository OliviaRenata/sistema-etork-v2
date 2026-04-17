// src/pages/admin/Downloads.tsx
import { useAuth } from '../../context/AuthContext';
import DownloadsPage from '../DownloadsPage';

export default function AdminDownloads() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <h2>Acesso negado</h2>
        <p>Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  // O DownloadsPage já verifica isAdmin internamente
  return <DownloadsPage />;
}