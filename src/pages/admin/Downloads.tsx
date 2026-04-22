// src/pages/admin/Downloads.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { formatDate } from '../../lib/utils';

// Ícones SVG inline
const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 3l4 4-7 7H10v-4l7-7z"/>
    <path d="M4 20h16"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const FileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
    <polyline points="13 2 13 9 20 9"/>
  </svg>
);

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

export default function AdminDownloads() {
  const { isAdmin } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const downloadsCacheKey = 'admin-downloads:cache-v1';
  
  const [files, setFiles] = useState<DownloadFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFile, setEditingFile] = useState<DownloadFile | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    file_name: '',
    description: '',
    category: 'software',
    version: '1.0',
  });

  const colors = {
    background: isDark ? '#0d0d0d' : '#f3f4f6',
    surface: isDark ? '#141414' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#1a1a1a',
    textSecondary: isDark ? '#888888' : '#777777',
    border: isDark ? '#222222' : '#e5e7eb',
    accent: '#c8c8c8',
    error: '#c8c8c8',
    success: '#c8c8c8',
  };

  // Verificar acesso
  if (!isAdmin) {
    return (
      <div style={{ padding: isMobile ? 24 : 60, textAlign: 'center' }}>
        <h2>Acesso negado</h2>
        <p>Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);

    const cached = sessionStorage.getItem(downloadsCacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as DownloadFile[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFiles(parsed);
          setLoading(false);
          loadFiles(true);
        } else {
          loadFiles();
        }
      } catch {
        loadFiles();
      }
    } else {
      loadFiles();
    }

    return () => window.removeEventListener('resize', onResize);
  }, []);

  async function loadFiles(silent = false) {
    if (!silent) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('download_files')
        .select('id, file_name, file_path, file_size, mime_type, description, category, version, downloads_count, is_active, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const nextFiles = data || [];
      setFiles(nextFiles);
      sessionStorage.setItem(downloadsCacheKey, JSON.stringify(nextFiles));
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
    } finally {
      if (!silent) setLoading(false);
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
      loadFiles(true);
      
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

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}-${selectedFile.name}`;
        const filePath = `files/${fileName}`;
        
        const { error: storageError } = await supabase.storage
          .from('downloads')
          .upload(filePath, selectedFile);

        if (storageError) throw storageError;
        
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
      loadFiles(true);
      
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
      await supabase.storage.from('downloads').remove([file.file_path]);
      
      const { error } = await supabase
        .from('download_files')
        .delete()
        .eq('id', file.id);

      if (error) throw error;

      const nextFiles = files.filter((f) => f.id !== file.id);
      setFiles(nextFiles);
      sessionStorage.setItem(downloadsCacheKey, JSON.stringify(nextFiles));

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

      const nextFiles = files.map((f) =>
        f.id === file.id ? { ...f, is_active: !f.is_active } : f
      );
      setFiles(nextFiles);
      sessionStorage.setItem(downloadsCacheKey, JSON.stringify(nextFiles));

      setMessage({ type: 'success', text: `Arquivo ${!file.is_active ? 'ativado' : 'desativado'}!` });
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

  const categories = [
    { value: 'instalador', label: 'Instalador (.exe / .msi)' },
    { value: 'software', label: 'Software / App' },
    { value: 'drivers', label: 'Drivers' },
    { value: 'documentos', label: 'Manuais / Documentos' },
  ];

  return (
    <div style={{ background: colors.background, minHeight: '100vh', padding: isMobile ? 12 : 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        
        {/* Mensagem de feedback */}
        {message.text && (
          <div style={{
            position: 'fixed',
            top: 20,
            right: isMobile ? 12 : 20,
            zIndex: 1000,
            padding: '12px 20px',
            borderRadius: 8,
            background: message.type === 'error' ? colors.error : colors.success,
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            animation: 'fadeIn 0.3s ease'
          }}>
            {message.text}
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ color: colors.text, fontSize: isMobile ? 20 : 24, margin: 0 }}>Gerenciar Downloads</h1>
            <p style={{ color: colors.textSecondary, marginTop: 4, fontSize: isMobile ? 12 : 14 }}>Adicione, edite ou remova arquivos para os franqueados</p>
          </div>
          
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: isMobile ? '9px 14px' : '10px 20px',
              background: colors.accent,
              color: '#000',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            <PlusIcon /> Adicionar Arquivo
          </button>
        </div>

        {/* Lista de arquivos */}
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: isMobile ? '12px 12px' : '16px 20px', borderBottom: `1px solid ${colors.border}` }}>
            <h3 style={{ color: colors.text, fontSize: 14, margin: 0 }}>Arquivos Disponíveis</h3>
          </div>
          
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: colors.textSecondary }}>Carregando...</div>
          ) : files.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: colors.textSecondary }}>
              Nenhum arquivo disponível. Clique em "Adicionar Arquivo" para começar.
            </div>
          ) : isMobile ? (
            <div style={{ padding: 10, display: 'grid', gap: 10 }}>
              {files.map((file) => (
                <div key={file.id} style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: 10, opacity: file.is_active ? 1 : 0.6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>{file.file_name}</div>
                  {file.description && <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>{file.description}</div>}
                  <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 6 }}>Categoria: {file.category} · Versão: {file.version}</div>
                  <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Downloads: {file.downloads_count || 0} · {formatDate(file.created_at)}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button
                      onClick={() => openEditModal(file)}
                      style={{ flex: 1, background: 'none', border: `1px solid ${colors.border}`, borderRadius: 6, color: colors.accent, padding: '7px 8px', fontSize: 11 }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggleActive(file)}
                      style={{ flex: 1, background: 'none', border: `1px solid ${colors.border}`, borderRadius: 6, color: file.is_active ? colors.error : colors.success, padding: '7px 8px', fontSize: 11 }}
                    >
                      {file.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => handleDelete(file)}
                      style={{ flex: 1, background: 'none', border: `1px solid ${colors.border}`, borderRadius: 6, color: colors.error, padding: '7px 8px', fontSize: 11 }}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.border}`, background: isDark ? '#0f0f0f' : '#fafafa' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.textSecondary }}>ARQUIVO</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.textSecondary }}>CATEGORIA</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.textSecondary }}>VERSÃO</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.textSecondary }}>DOWNLOADS</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.textSecondary }}>STATUS</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.textSecondary }}>DATA</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: colors.textSecondary }}>AÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <tr key={file.id} style={{ borderBottom: `1px solid ${colors.border}`, opacity: file.is_active ? 1 : 0.6 }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <FileIcon />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{file.file_name}</div>
                            {file.description && <div style={{ fontSize: 11, color: colors.textSecondary }}>{file.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: colors.textSecondary }}>{file.category}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: colors.textSecondary }}>{file.version}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: colors.accent }}>{file.downloads_count || 0}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 10,
                          fontWeight: 600,
                          background: file.is_active ? `${colors.success}20` : `${colors.error}20`,
                          color: file.is_active ? colors.success : colors.error
                        }}>
                          {file.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: colors.textSecondary }}>{formatDate(file.created_at)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button
                            onClick={() => openEditModal(file)}
                            title="Editar"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.accent }}
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => handleToggleActive(file)}
                            title={file.is_active ? 'Desativar' : 'Ativar'}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: file.is_active ? colors.error : colors.success }}
                          >
                            <EyeIcon />
                          </button>
                          <button
                            onClick={() => handleDelete(file)}
                            title="Excluir"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.error }}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal de Upload/Edição */}
        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: colors.surface,
              borderRadius: 12,
              padding: isMobile ? 14 : 24,
              width: '90%',
              maxWidth: 500,
              position: 'relative'
            }}>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: colors.textSecondary
                }}
              >
                <XIcon />
              </button>

              <h2 style={{ color: colors.text, margin: '0 0 20px', fontSize: isMobile ? 16 : 18 }}>
                {editingFile ? 'Editar Arquivo' : 'Adicionar Arquivo'}
              </h2>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>ARQUIVO *</label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: colors.background,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 6,
                    color: colors.text
                  }}
                />
                {editingFile && !selectedFile && (
                  <p style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>Deixe em branco para manter o arquivo atual</p>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>NOME DO ARQUIVO</label>
                <input
                  type="text"
                  value={formData.file_name}
                  onChange={(e) => setFormData({ ...formData, file_name: e.target.value })}
                  placeholder="Ex: Software KESS3 v2.0"
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: colors.background,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 6,
                    color: colors.text
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>DESCRIÇÃO</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do arquivo..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: colors.background,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 6,
                    color: colors.text,
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>CATEGORIA</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: colors.background,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 6,
                      color: colors.text
                    }}
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ width: isMobile ? '100%' : 100 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>VERSÃO</label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="1.0"
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: colors.background,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 6,
                      color: colors.text
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button
                  onClick={editingFile ? handleUpdate : handleUpload}
                  disabled={uploading}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: colors.accent,
                    color: '#000',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    opacity: uploading ? 0.7 : 1
                  }}
                >
                  {uploading ? 'PROCESSANDO...' : editingFile ? 'ATUALIZAR' : 'ENVIAR'}
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  style={{
                    padding: '12px 24px',
                    background: 'transparent',
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    color: colors.textSecondary,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}