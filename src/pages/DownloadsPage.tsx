// src/pages/DownloadsPage.tsx (versão ajustada)
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
  HardDrive,
  Edit,
  Eye
} from 'lucide-react';

// Casting para evitar erros de JSX do React
const DownloadIcon = Download as any;
const TrashIcon = Trash2 as any;
const FileIcon = FileText as any;
const PlusIcon = Plus as any;
const SearchIcon = Search as any;
const SoftwareIcon = FileArchive as any;
const DriverIcon = HardDrive as any;
const EditIcon = Edit as any;
const EyeIcon = Eye as any;

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
  const { isAdmin, user } = useAuth();
  const { theme: currentTheme } = useTheme();
  const isDark = currentTheme === 'dark';
  
  const [files, setFiles] = useState<DownloadFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [editingFile, setEditingFile] = useState<DownloadFile | null>(null);
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
    error: '#e6b800',
    success: '#e6b800'
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
    
    // Admin vê todos os arquivos (incluindo inativos)
    // Franqueados vê apenas ativos
    let query = supabase.from('download_files').select('*');
    
    if (!isAdmin) {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (!error) setFiles(data || []);
    setLoading(false);
  }

  async function handleDownload(file: DownloadFile) {
    try {
      // Incrementar contador de downloads
      await supabase.rpc('increment_download_count', { row_id: file.id });

      const { data, error } = await supabase.storage
        .from('downloads')
        .createSignedUrl(file.file_path, 60);

      if (error) throw error;
      
      // Abrir em nova aba
      window.open(data.signedUrl, '_blank');
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao processar download.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Selecione um arquivo.' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${selectedFile.name}`;
      const filePath = `files/${fileName}`;
      
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
        is_active: true,
        downloads_count: 0,
      });

      if (dbError) throw dbError;

      setMessage({ type: 'success', text: 'Arquivo adicionado com sucesso!' });
      setShowModal(false);
      resetForm();
      loadFiles();
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Erro no upload:', err);
      setMessage({ type: 'error', text: 'Erro ao fazer upload do arquivo.' });
    } finally {
      setUploading(false);
    }
  }

  async function handleUpdate() {
    if (!editingFile) return;
    
    setUploading(true);
    try {
      const updates: any = {
        file_name: formData.file_name,
        description: formData.description,
        category: formData.category,
        version: formData.version,
        updated_at: new Date().toISOString(),
      };

      // Se um novo arquivo foi selecionado, fazer upload
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}-${selectedFile.name}`;
        const filePath = `files/${fileName}`;
        
        const { error: storageError } = await supabase.storage
          .from('downloads')
          .upload(filePath, selectedFile);

        if (storageError) throw storageError;
        
        // Remover arquivo antigo
        await supabase.storage.from('downloads').remove([editingFile.file_path]);
        
        updates.file_path = filePath;
        updates.file_size = selectedFile.size;
        updates.mime_type = selectedFile.type;
      }

      const { error: dbError } = await supabase
        .from('download_files')
        .update(updates)
        .eq('id', editingFile.id);

      if (dbError) throw dbError;

      setMessage({ type: 'success', text: 'Arquivo atualizado com sucesso!' });
      setShowModal(false);
      setEditingFile(null);
      resetForm();
      loadFiles();
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Erro ao atualizar:', err);
      setMessage({ type: 'error', text: 'Erro ao atualizar arquivo.' });
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(file: DownloadFile) {
    if (!confirm(`Tem certeza que deseja excluir "${file.file_name}" permanentemente?`)) return;

    try {
      // Remover do storage
      await supabase.storage.from('downloads').remove([file.file_path]);
      
      // Remover do banco
      const { error } = await supabase
        .from('download_files')
        .delete()
        .eq('id', file.id);

      if (error) throw error;
      
      loadFiles();
      setMessage({ type: 'success', text: 'Arquivo removido com sucesso!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Erro ao excluir:', err);
      setMessage({ type: 'error', text: 'Erro ao excluir arquivo.' });
    }
  }

  async function handleToggleActive(file: DownloadFile) {
    try {
      const { error } = await supabase
        .from('download_files')
        .update({ is_active: !file.is_active, updated_at: new Date().toISOString() })
        .eq('id', file.id);

      if (error) throw error;
      
      loadFiles();
      setMessage({ type: 'success', text: `Arquivo ${!file.is_active ? 'ativado' : 'desativado'} com sucesso!` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      setMessage({ type: 'error', text: 'Erro ao alterar status.' });
    }
  }

  function openEditModal(file: DownloadFile) {
    setEditingFile(file);
    setFormData({
      file_name: file.file_name,
      description: file.description || '',
      category: file.category,
      version: file.version,
    });
    setSelectedFile(null);
    setShowModal(true);
  }

  function resetForm() {
    setFormData({ file_name: '', description: '', category: 'software', version: '1.0' });
    setSelectedFile(null);
    setEditingFile(null);
  }

  const filteredFiles = files.filter(f => 
    (category === 'todos' || f.category === category) &&
    f.file_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Mensagem de feedback */}
      {message.text && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 1000,
          padding: '12px 20px',
          borderRadius: 8,
          background: message.type === 'error' ? '#e6b800' : '#e6b800',
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          animation: 'fadeIn 0.3s ease'
        }}>
          {message.text}
        </div>
      )}

      {/* Topo com botão de Adicionar para Admin */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div>
          <h1 style={{ color: colors.text, margin: 0, fontSize: 24 }}>Downloads e Instaladores</h1>
          <p style={{ color: colors.textMuted }}>Arquivos oficiais para franqueados Etork</p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
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
              border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.text,
              outline: 'none'
            }}
          />
        </div>
        <select 
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{ 
            padding: '10px 16px', background: colors.inputBg, color: colors.text, 
            border: `1px solid ${colors.border}`, borderRadius: 8, cursor: 'pointer'
          }}
        >
          {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Lista de Arquivos */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: colors.textMuted }}>Carregando arquivos...</div>
      ) : filteredFiles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: colors.textMuted }}>
          Nenhum arquivo encontrado.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 15 }}>
          {filteredFiles.map(file => (
            <div key={file.id} style={{ 
              background: colors.surface, border: `1px solid ${colors.border}`, 
              padding: '15px 20px', borderRadius: 12, display: 'flex', 
              alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 15,
              opacity: file.is_active ? 1 : 0.6
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                <div style={{ background: `${colors.accent}15`, padding: 12, borderRadius: 10 }}>
                  {file.category === 'instalador' ? <SoftwareIcon color={colors.accent} /> : 
                   file.category === 'drivers' ? <DriverIcon color={colors.accent} /> :
                   <FileIcon color={colors.accent} />}
                </div>
                <div>
                  <h3 style={{ color: colors.text, margin: '0 0 5px 0', fontSize: 16 }}>
                    {file.file_name}
                    {!file.is_active && <span style={{ marginLeft: 8, fontSize: 10, color: colors.error }}>(Inativo)</span>}
                  </h3>
                  <div style={{ fontSize: 12, color: colors.textMuted, display: 'flex', gap: 15, flexWrap: 'wrap' }}>
                    <span>Versão: {file.version}</span>
                    <span>Tamanho: {(file.file_size / 1024 / 1024).toFixed(2)} MB</span>
                    <span>Downloads: {file.downloads_count || 0}</span>
                    <span>Categoria: {file.category}</span>
                  </div>
                  {file.description && (
                    <p style={{ fontSize: 12, color: colors.textMuted, margin: '5px 0 0 0' }}>{file.description}</p>
                  )}
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
                  <>
                    <button 
                      onClick={() => openEditModal(file)}
                      title="Editar arquivo"
                      style={{ 
                        background: 'transparent', border: `1px solid ${colors.border}`, 
                        color: colors.text, padding: '8px', borderRadius: 6, cursor: 'pointer' 
                      }}
                    >
                      <EditIcon size={16} />
                    </button>
                    <button 
                      onClick={() => handleToggleActive(file)}
                      title={file.is_active ? "Desativar" : "Ativar"}
                      style={{ 
                        background: file.is_active ? '#e6b80020' : '#e6b80020',
                        border: `1px solid ${file.is_active ? '#e6b800' : '#e6b800'}`, 
                        color: file.is_active ? '#e6b800' : '#e6b800', 
                        padding: '8px', borderRadius: 6, cursor: 'pointer' 
                      }}
                    >
                      {file.is_active ? <EyeIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                    <button 
                      onClick={() => handleDelete(file)}
                      title="Excluir arquivo"
                      style={{ 
                        background: 'transparent', border: `1px solid #e6b80050`, 
                        color: '#e6b800', padding: '8px', borderRadius: 6, cursor: 'pointer' 
                      }}
                    >
                      <TrashIcon size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Upload/Edição (Admin) */}
      {showModal && (
        <div style={{ 
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
        }}>
          <div style={{ 
            background: colors.surface, padding: 30, borderRadius: 15, 
            width: '500px', maxWidth: '90%', border: `1px solid ${colors.border}`
          }}>
            <h2 style={{ color: colors.text, marginTop: 0 }}>
              {editingFile ? 'Editar Arquivo' : 'Novo Arquivo'}
            </h2>
            
            <div style={{ marginBottom: 15 }}>
              <label style={{ display: 'block', marginBottom: 5, fontSize: 12, color: colors.textMuted }}>ARQUIVO *</label>
              <input 
                type="file" 
                onChange={e => setSelectedFile(e.target.files?.[0] || null)} 
                style={{ color: colors.text, width: '100%' }}
              />
              {editingFile && !selectedFile && (
                <p style={{ fontSize: 11, color: colors.textMuted, marginTop: 5 }}>Deixe em branco para manter o arquivo atual</p>
              )}
            </div>
            
            <input 
              placeholder="Nome do software/arquivo" 
              value={formData.file_name}
              onChange={e => setFormData({...formData, file_name: e.target.value})}
              style={{ 
                width: '100%', padding: 10, marginBottom: 10, borderRadius: 5, 
                border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text,
                outline: 'none'
              }}
            />

            <textarea
              placeholder="Descrição do arquivo"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              rows={3}
              style={{ 
                width: '100%', padding: 10, marginBottom: 10, borderRadius: 5, 
                border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text,
                outline: 'none', resize: 'vertical'
              }}
            />

            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <select 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                style={{ 
                  flex: 1, padding: 10, borderRadius: 5, 
                  border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text,
                  outline: 'none'
                }}
              >
                <option value="instalador">Instalador (.exe / .msi)</option>
                <option value="software">Software / App</option>
                <option value="drivers">Drivers</option>
                <option value="documentos">Manuais / Docs</option>
              </select>

              <input 
                placeholder="Versão"
                value={formData.version}
                onChange={e => setFormData({...formData, version: e.target.value})}
                style={{ 
                  width: 100, padding: 10, borderRadius: 5, 
                  border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text,
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button 
                disabled={uploading}
                onClick={editingFile ? handleUpdate : handleUpload}
                style={{ 
                  flex: 1, padding: 12, background: colors.accent, border: 'none', 
                  borderRadius: 8, fontWeight: 'bold', cursor: 'pointer',
                  opacity: uploading ? 0.7 : 1
                }}
              >
                {uploading ? 'Processando...' : editingFile ? 'ATUALIZAR' : 'ENVIAR'}
              </button>
              <button 
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                style={{ 
                  padding: 12, background: 'transparent', border: `1px solid ${colors.border}`, 
                  color: colors.textMuted, borderRadius: 8, cursor: 'pointer' 
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS para animação */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}