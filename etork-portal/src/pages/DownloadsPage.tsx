// src/pages/DownloadsPage.tsx

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { DownloadIcon, TrashIcon, FileIcon, PlusIcon } from '../components/ui/Icons';

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
  updated_at: string;
}

export default function DownloadsPage() {
  const { isAdmin } = useAuth();
  const [files, setFiles] = useState<DownloadFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    file_name: '',
    description: '',
    category: 'remap',
    version: '1.0',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const categories = [
    { value: 'todos', label: 'Todos' },
    { value: 'remap', label: 'Remap' },
    { value: 'chip', label: 'Chip' },
    { value: 'software', label: 'Software' },
    { value: 'documentos', label: 'Documentos' },
    { value: 'drivers', label: 'Drivers' },
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

    if (error) {
      console.error('Erro ao carregar arquivos:', error);
    } else {
      setFiles(data || []);
    }
    setLoading(false);
  }

  async function handleDownload(file: DownloadFile) {
    try {
      // Increment download count
      await supabase
        .from('download_files')
        .update({ downloads_count: (file.downloads_count || 0) + 1 })
        .eq('id', file.id);

      // Get signed URL
      const { data, error } = await supabase
        .storage
        .from('downloads')
        .createSignedUrl(file.file_path, 3600);

      if (error) throw error;

      // Open download in new tab
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      setMessage({ type: 'error', text: 'Erro ao baixar arquivo. Tente novamente.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Selecione um arquivo para upload.' });
      return;
    }

    setUploading(true);
    try {
      const fileName = `${Date.now()}-${selectedFile.name}`;
      const filePath = `downloads/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('downloads')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Save to database
      const { error: dbError } = await supabase
        .from('download_files')
        .insert({
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

      setMessage({ type: 'success', text: 'Arquivo enviado com sucesso!' });
      setShowModal(false);
      resetForm();
      loadFiles();
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
      setMessage({ type: 'error', text: 'Erro ao enviar arquivo.' });
    } finally {
      setUploading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  }

  async function handleDelete(file: DownloadFile) {
    if (!confirm(`Tem certeza que deseja excluir "${file.file_name}"?`)) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('downloads')
        .remove([file.file_path]);

      if (storageError) console.error('Erro ao deletar do storage:', storageError);

      // Delete from database
      const { error: dbError } = await supabase
        .from('download_files')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      setMessage({ type: 'success', text: 'Arquivo excluído com sucesso!' });
      loadFiles();
    } catch (error) {
      console.error('Erro ao excluir arquivo:', error);
      setMessage({ type: 'error', text: 'Erro ao excluir arquivo.' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  }

  function resetForm() {
    setFormData({
      file_name: '',
      description: '',
      category: 'remap',
      version: '1.0',
    });
    setSelectedFile(null);
  }

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.file_name.toLowerCase().includes(search.toLowerCase()) ||
                          file.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'todos' || file.category === category;
    return matchesSearch && matchesCategory;
  });

  function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function getCategoryColor(cat: string) {
    const colors: Record<string, string> = {
      remap: '#e6b800',
      chip: '#22c55e',
      software: '#3b82f6',
      documentos: '#a855f7',
      drivers: '#ef4444',
    };
    return colors[cat] || '#888';
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: 'var(--text)', fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>
            Central de Downloads
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
            Arquivos disponíveis para download
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', background: '#e6b800', color: '#000',
              border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#ffd000'}
            onMouseLeave={e => e.currentTarget.style.background = '#e6b800'}
          >
            <PlusIcon width={16} height={16} /> Adicionar Arquivo
          </button>
        )}
      </div>

      {/* Message */}
      {message.text && (
        <div style={{
          padding: '10px 14px', marginBottom: 18, borderRadius: 10,
          background: message.type === 'error' ? '#150a0a' : '#0a1510',
          border: `1px solid ${message.type === 'error' ? '#4f1c1c' : '#153a22'}`,
          color: message.type === 'error' ? '#f87171' : '#7dd3fc',
        }}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar arquivos..."
          style={{
            flex: 1, minWidth: 200, padding: '10px 14px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none',
          }}
          onFocus={e => e.currentTarget.style.borderColor = '#e6b800'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
        />
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{
            padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer',
          }}
        >
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Files Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
          Carregando arquivos...
        </div>
      ) : filteredFiles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
          Nenhum arquivo encontrado.
          {isAdmin && (
            <div style={{ marginTop: 12 }}>
              <button
                onClick={() => setShowModal(true)}
                style={{ color: '#e6b800', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Clique aqui para adicionar o primeiro arquivo
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filteredFiles.map(file => (
            <div
              key={file.id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', background: 'var(--surface)',
                border: '1px solid var(--border)', borderRadius: 12,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#e6b800'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 10,
                  background: 'rgba(230,184,0,0.1)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <FileIcon width={24} height={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                      {file.file_name}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: `${getCategoryColor(file.category)}20`,
                      color: getCategoryColor(file.category),
                      border: `1px solid ${getCategoryColor(file.category)}40`,
                    }}>
                      {categories.find(c => c.value === file.category)?.label || file.category}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                      v{file.version}
                    </span>
                  </div>
                  {file.description && (
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                      {file.description}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--muted)' }}>
                    <span>{formatFileSize(file.file_size)}</span>
                    <span>📥 {file.downloads_count || 0} downloads</span>
                    <span>📅 {new Date(file.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleDownload(file)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', background: '#e6b800', color: '#000',
                    border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#ffd000'}
                  onMouseLeave={e => e.currentTarget.style.background = '#e6b800'}
                >
                  <DownloadIcon width={14} height={14} /> Baixar
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(file)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 12px', background: 'transparent',
                      border: '1px solid #4a1a1a', borderRadius: 8,
                      color: '#f87171', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#1a0a0a'; e.currentTarget.style.borderColor = '#7a2a2a'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#4a1a1a'; }}
                  >
                    <TrashIcon width={14} height={14} /> Excluir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--surface)', borderRadius: 16,
            width: 500, maxWidth: '90vw', padding: 24,
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ color: 'var(--text)', fontSize: 18, margin: 0 }}>
                Adicionar Arquivo
              </h2>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 24, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, letterSpacing: 1 }}>
                ARQUIVO *
              </label>
              <input
                type="file"
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                style={{
                  width: '100%', padding: '10px', background: 'var(--bg)',
                  border: '1px solid var(--border)', borderRadius: 8,
                  color: 'var(--text)', fontSize: 13,
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, letterSpacing: 1 }}>
                NOME DO ARQUIVO
              </label>
              <input
                type="text"
                value={formData.file_name}
                onChange={e => setFormData({ ...formData, file_name: e.target.value })}
                placeholder="Nome exibido (opcional)"
                style={{
                  width: '100%', padding: '10px', background: 'var(--bg)',
                  border: '1px solid var(--border)', borderRadius: 8,
                  color: 'var(--text)', fontSize: 13, outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, letterSpacing: 1 }}>
                DESCRIÇÃO
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do arquivo..."
                rows={3}
                style={{
                  width: '100%', padding: '10px', background: 'var(--bg)',
                  border: '1px solid var(--border)', borderRadius: 8,
                  color: 'var(--text)', fontSize: 13, outline: 'none', resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, letterSpacing: 1 }}>
                  CATEGORIA
                </label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: '100%', padding: '10px', background: 'var(--bg)',
                    border: '1px solid var(--border)', borderRadius: 8,
                    color: 'var(--text)', fontSize: 13, cursor: 'pointer',
                  }}
                >
                  {categories.filter(c => c.value !== 'todos').map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, letterSpacing: 1 }}>
                  VERSÃO
                </label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={e => setFormData({ ...formData, version: e.target.value })}
                  placeholder="1.0"
                  style={{
                    width: '100%', padding: '10px', background: 'var(--bg)',
                    border: '1px solid var(--border)', borderRadius: 8,
                    color: 'var(--text)', fontSize: 13, outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button
                onClick={handleUpload}
                disabled={uploading}
                style={{
                  flex: 1, padding: '12px', background: '#e6b800', color: '#000',
                  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1,
                }}
              >
                {uploading ? 'ENVIANDO...' : 'ENVIAR ARQUIVO'}
              </button>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                style={{
                  padding: '12px 20px', background: 'transparent',
                  border: '1px solid var(--border)', borderRadius: 8,
                  color: 'var(--muted)', cursor: 'pointer', fontSize: 13,
                }}
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