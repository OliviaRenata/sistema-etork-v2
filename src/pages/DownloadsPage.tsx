import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
// Importação dos ícones do Lucide
import { 
  Download, 
  Trash2, 
  FileText, 
  Plus, 
  Search, 
  FileArchive, 
  HardDrive 
} from 'lucide-react';

// Casting para evitar erros de JSX do React
const DownloadIcon = Download as any;
const TrashIcon = Trash2 as any;
const FileIcon = FileText as any;
const PlusIcon = Plus as any;
const SearchIcon = Search as any;
const SoftwareIcon = FileArchive as any;
const DriverIcon = HardDrive as any;

interface DownloadFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  description: string;
  category: string;
  version: string;
  downloads_count: number;
  is_active: boolean;
  created_at: string;
}

export default function DownloadsPage() {
  const { isAdmin } = useAuth();
  const { theme: currentTheme } = useTheme();
  const isDark = currentTheme === 'dark';
  
  const [files, setFiles] = useState<DownloadFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    file_name: '',
    description: '',
    category: 'software',
    version: '1.0',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const colors = {
    text: isDark ? '#e0e0e0' : '#1a1a1a',
    textMuted: isDark ? '#888888' : '#666666',
    surface: isDark ? '#111111' : '#ffffff',
    border: isDark ? '#222222' : '#e0e0e0',
    accent: '#e6b800',
    inputBg: isDark ? '#0d0d0d' : '#f5f5f5',
    error: '#f87171',
    success: '#4ade80'
  };

  const categories = [
    { value: 'todos', label: 'Todos' },
    { value: 'instalador', label: 'Instaladores' },
    { value: 'software', label: 'Software' },
    { value: 'drivers', label: 'Drivers' },
    { value: 'documentos', label: 'Documentos' },
  ];

  useEffect(() => {
    loadFiles();
  }, []);

  async function loadFiles() {
    setLoading(true);
    const { data, error } = await supabase
      .from('download_files')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error) setFiles(data || []);
    setLoading(false);
  }

  async function handleDownload(file: DownloadFile) {
    try {
      // Incrementar contador
      await supabase.rpc('increment_download_count', { row_id: file.id });

      const { data, error } = await supabase.storage
        .from('downloads')
        .createSignedUrl(file.file_path, 60);

      if (error) throw error;
      window.location.href = data.signedUrl;
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao processar download.' });
    }
  }

  async function handleUpload() {
    if (!selectedFile) return setMessage({ type: 'error', text: 'Selecione um arquivo.' });

    setUploading(true);
    try {
      const filePath = `files/${Date.now()}-${selectedFile.name}`;
      const { error: storageError } = await supabase.storage
        .from('downloads')
        .upload(filePath, selectedFile);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase.from('download_files').insert({
        file_name: formData.file_name || selectedFile.name,
        file_path: filePath,
        file_size: selectedFile.size,
        mime_type: selectedFile.type,
        description: formData.description,
        category: formData.category,
        version: formData.version,
      });

      if (dbError) throw dbError;

      setMessage({ type: 'success', text: 'Arquivo adicionado!' });
      setShowModal(false);
      resetForm();
      loadFiles();
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro no upload.' });
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(file: DownloadFile) {
    if (!confirm('Excluir este arquivo permanentemente?')) return;

    try {
      await supabase.storage.from('downloads').remove([file.file_path]);
      await supabase.from('download_files').delete().eq('id', file.id);
      loadFiles();
      setMessage({ type: 'success', text: 'Arquivo removido.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao excluir.' });
    }
  }

  function resetForm() {
    setFormData({ file_name: '', description: '', category: 'software', version: '1.0' });
    setSelectedFile(null);
  }

  const filteredFiles = files.filter(f => 
    (category === 'todos' || f.category === category) &&
    f.file_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Topo com botão de Adicionar para Admin */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div>
          <h1 style={{ color: colors.text, margin: 0, fontSize: 24 }}>Downloads e Instaladores</h1>
          <p style={{ color: colors.textMuted }}>Arquivos oficiais para franqueados Etork</p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => setShowModal(true)}
            style={{ 
              background: colors.accent, border: 'none', padding: '12px 20px', 
              borderRadius: 8, fontWeight: 'bold', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8 
            }}
          >
            <PlusIcon size={18} /> Adicionar Arquivo
          </button>
        )}
      </div>

      {/* Busca e Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <SearchIcon size={18} style={{ position: 'absolute', left: 12, top: 12, color: colors.textMuted }} />
          <input 
            placeholder="Buscar por nome..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ 
              width: '100%', padding: '12px 12px 12px 40px', background: colors.inputBg,
              border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.text
            }}
          />
        </div>
        <select 
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{ padding: '10px', background: colors.inputBg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 8 }}
        >
          {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Lista de Arquivos */}
      <div style={{ display: 'grid', gap: 15 }}>
        {filteredFiles.map(file => (
          <div key={file.id} style={{ 
            background: colors.surface, border: `1px solid ${colors.border}`, 
            padding: '15px 20px', borderRadius: 12, display: 'flex', 
            alignItems: 'center', justifyContent: 'space-between' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              <div style={{ background: `${colors.accent}15`, padding: 12, borderRadius: 10 }}>
                {file.category === 'instalador' ? <SoftwareIcon color={colors.accent} /> : <FileIcon color={colors.accent} />}
              </div>
              <div>
                <h3 style={{ color: colors.text, margin: '0 0 5px 0', fontSize: 16 }}>{file.file_name}</h3>
                <div style={{ fontSize: 12, color: colors.textMuted, display: 'flex', gap: 15 }}>
                  <span>Versão: {file.version}</span>
                  <span>Tamanho: {(file.file_size / 1024 / 1024).toFixed(2)} MB</span>
                  <span>Downloads: {file.downloads_count || 0}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                onClick={() => handleDownload(file)}
                title="Baixar arquivo"
                style={{ 
                  background: `${colors.accent}20`, border: `1px solid ${colors.accent}`, 
                  color: colors.accent, padding: '8px 15px', borderRadius: 6, 
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 
                }}
              >
                <DownloadIcon size={16} /> Download
              </button>

              {isAdmin && (
                <button 
                  onClick={() => handleDelete(file)}
                  title="Excluir arquivo"
                  style={{ 
                    background: 'transparent', border: `1px solid ${colors.error}50`, 
                    color: colors.error, padding: '8px', borderRadius: 6, cursor: 'pointer' 
                  }}
                >
                  <TrashIcon size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Upload (Admin) */}
      {showModal && (
        <div style={{ 
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 
        }}>
          <div style={{ background: colors.surface, padding: 30, borderRadius: 15, width: '400px', border: `1px solid ${colors.border}` }}>
            <h2 style={{ color: colors.text, marginTop: 0 }}>Novo Arquivo</h2>
            
            <input type="file" onChange={e => setSelectedFile(e.target.files?.[0] || null)} style={{ marginBottom: 15, color: colors.text }} />
            
            <input 
              placeholder="Nome do software/arquivo" 
              value={formData.file_name}
              onChange={e => setFormData({...formData, file_name: e.target.value})}
              style={{ width: '100%', padding: 10, marginBottom: 10, borderRadius: 5, border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text }}
            />

            <select 
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
              style={{ width: '100%', padding: 10, marginBottom: 10, borderRadius: 5, border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text }}
            >
              <option value="instalador">Instalador (.exe / .msi)</option>
              <option value="software">Software / App</option>
              <option value="drivers">Drivers</option>
              <option value="documentos">Manuais / Docs</option>
            </select>

            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                disabled={uploading}
                onClick={handleUpload}
                style={{ flex: 1, padding: 12, background: colors.accent, border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}
              >
                {uploading ? 'Enviando...' : 'Confirmar'}
              </button>
              <button 
                onClick={() => setShowModal(false)}
                style={{ padding: 12, background: 'transparent', border: `1px solid ${colors.border}`, color: colors.textMuted, borderRadius: 8, cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}