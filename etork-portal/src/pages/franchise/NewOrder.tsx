// src/pages/franchise/NewOrder.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, callFunction, storage } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';

type FormData = {
  plate: string;
  chassi: string;
  model: string;
  year: string;
  engine: string;
  cv: string;
  fuel: string;
  dtc: string;
  performance: string[];
  tool: string;
  notes: string;
};

const fuelOptions = ['Flex', 'Diesel', 'Álcool / Gasolina'];
const yearOptions = Array.from({ length: 30 }, (_, index) => `${new Date().getFullYear() - index}`);
const performanceOptions = [
  'DPF & EGR (OFF)',
  'Potência STG1',
  'Potência STG2',
  'Pop and Bangs',
  'VMAX',
  'Start Stop (OFF)',
  'DTC Removal',
  'Remap Rápido',
  'Slip Fix',
];
const toolOptions = [
  'KTAG (Original)',
  'KTAG (Pirata)',
  'KESS V2/KESS3',
  'New Genius',
  'New Transdata',
  'KZ Prog',
  'DFOX',
  'KT200',
  'Outra',
];

export default function FranchiseNewOrder() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState<FormData>({
    plate: '',
    chassi: '',
    model: '',
    year: '',
    engine: '',
    cv: '',
    fuel: fuelOptions[0],
    dtc: '',
    performance: [],
    tool: '',
    notes: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData(prev => ({ ...prev, [key]: value }));
  }

  async function submitOrder(sendAnother = false) {
    if (!formData.plate.trim()) {
      setError('Informe a placa/frota.');
      return;
    }
    if (files.length === 0) {
      setError('Envie pelo menos um arquivo de mapa (ORI, MOD, BIN).');
      return;
    }

    setError('');
    setLoading(true);
    setSuccessMessage('');

    try {
      const result = await callFunction<{ order: { id: string } }>('create-order', {
        vehicle_plate: formData.plate.trim(),
        chassi: formData.chassi.trim() || undefined,
        model: formData.model.trim() || undefined,
        year: formData.year || undefined,
        engine: formData.engine.trim() || undefined,
        cv: formData.cv.trim() || undefined,
        fuel: formData.fuel,
        dtc: formData.dtc.trim() || undefined,
        notes: `Ferramenta: ${formData.tool || 'Não informada'} | Performance: ${formData.performance.join(', ') || 'Nenhuma'} | Obs: ${formData.notes.trim()}`,
      });

      for (const file of files) {
        const path = await storage.uploadOrderFile(result.order.id, file);
        await supabase.from('order_files').insert({
          order_id: result.order.id,
          file_name: file.name,
          file_path: path,
          file_size: file.size,
          mime_type: file.type,
        });
      }

      for (const file of extraFiles) {
        const path = await storage.uploadOrderFile(result.order.id, file);
        await supabase.from('order_files').insert({
          order_id: result.order.id,
          file_name: file.name,
          file_path: path,
          file_size: file.size,
          mime_type: file.type,
        });
      }

      if (sendAnother) {
        setFiles([]);
        setExtraFiles([]);
        setFormData({
          plate: '',
          chassi: '',
          model: '',
          year: '',
          engine: '',
          cv: '',
          fuel: fuelOptions[0],
          dtc: '',
          performance: [],
          tool: '',
          notes: '',
        });
        setSuccessMessage('Pedido enviado com sucesso. Preencha outro pedido abaixo.');
      } else {
        navigate('/orders');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Erro ao enviar pedido.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    background: isDark ? '#111' : '#fff',
    border: `1px solid ${isDark ? '#333' : '#dcdcdc'}`,
    color: isDark ? '#eee' : '#111',
    fontSize: 13,
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: 8,
    fontSize: 12,
    fontWeight: 700,
    color: isDark ? '#bbb' : '#555',
    letterSpacing: 0.5,
  };

  const sectionStyle: React.CSSProperties = {
    background: isDark ? '#121212' : '#fafafa',
    border: `1px solid ${isDark ? '#222' : '#e5e5e5'}`,
    borderRadius: 16,
    padding: 20,
  };

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, color: isDark ? '#fff' : '#111' }}>Enviar Novos Arquivos</h1>
          <p style={{ margin: '8px 0 0', color: isDark ? '#aaa' : '#666' }}>
            Preencha os dados do veículo e faça o upload dos arquivos conforme solicitado.
          </p>
        </div>
        <button
          onClick={() => navigate('/orders')}
          style={{
            background: '#c53030',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '12px 20px',
            cursor: 'pointer',
            fontWeight: 700,
            boxShadow: '0 12px 24px rgba(197, 46, 46, 0.18)',
          }}
        >
          Voltar para Meus Arquivos
        </button>
      </div>

      {successMessage && (
        <div style={{ marginBottom: 16, padding: '14px 16px', background: '#163a0f', color: '#d1fae5', borderRadius: 12 }}>
          {successMessage}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={sectionStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 18, color: isDark ? '#fff' : '#111' }}>Informações do Veículo</h2>

          <label style={labelStyle}>PLACA / FROTA</label>
          <input
            value={formData.plate}
            onChange={e => updateField('plate', e.target.value.toUpperCase())}
            placeholder="ABC1D23"
            style={inputStyle}
          />

          <label style={labelStyle}>CHASSI</label>
          <input
            value={formData.chassi}
            onChange={e => updateField('chassi', e.target.value)}
            placeholder="XXXXXXXXXXXXXXX"
            style={inputStyle}
          />

          <label style={labelStyle}>MODELO / MARCA</label>
          <input
            value={formData.model}
            onChange={e => updateField('model', e.target.value)}
            placeholder="Ex: Jeep Compass"
            style={inputStyle}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>ANO</label>
              <select
                value={formData.year}
                onChange={e => updateField('year', e.target.value)}
                style={inputStyle}
              >
                <option value="">Selecione</option>
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>MOTOR</label>
              <input
                value={formData.engine}
                onChange={e => updateField('engine', e.target.value)}
                placeholder="Ex: 2.0 Turbo"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>CV</label>
              <input
                value={formData.cv}
                onChange={e => updateField('cv', e.target.value)}
                placeholder="Ex: 250"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>COMBUSTÍVEL</label>
              <select
                value={formData.fuel}
                onChange={e => updateField('fuel', e.target.value)}
                style={inputStyle}
              >
                {fuelOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          <label style={labelStyle}>DTC / AVARIAS</label>
          <input
            value={formData.dtc}
            onChange={e => updateField('dtc', e.target.value)}
            placeholder="Descreva DTCs ou avarias"
            style={inputStyle}
          />
        </div>

        <div style={sectionStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 18, color: isDark ? '#fff' : '#111' }}>Performance e Ferramentas</h2>

          <label style={labelStyle}>PERFORMANCE - SELECIONE OS SERVIÇOS</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 18 }}>
            {performanceOptions.map(option => {
              const active = formData.performance.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    const next = active
                      ? formData.performance.filter(item => item !== option)
                      : [...formData.performance, option];
                    updateField('performance', next);
                  }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid',
                    borderColor: active ? '#dc2626' : isDark ? '#2d2d2d' : '#d1d5db',
                    background: active ? '#dc2626' : isDark ? '#141414' : '#fff',
                    color: active ? '#fff' : isDark ? '#eee' : '#111',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 12,
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <label style={labelStyle}>FERRAMENTA UTILIZADA</label>
          <select
            value={formData.tool}
            onChange={e => updateField('tool', e.target.value)}
            style={inputStyle}
          >
            <option value="">Selecione a ferramenta</option>
            {toolOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ ...sectionStyle, marginTop: 20 }}>
        <h2 style={{ marginTop: 0, marginBottom: 18, color: isDark ? '#fff' : '#111' }}>Upload de Arquivos</h2>

        <label style={labelStyle}>ARQUIVOS DE MAPA (ORI, MOD, BIN)</label>
        <div style={{ marginBottom: 18 }}>
          <input
            type="file"
            multiple
            accept=".bin,.ori,.mod"
            onChange={e => setFiles(Array.from(e.target.files || []))}
            style={{ ...inputStyle, padding: '14px 12px' }}
          />
          {files.length > 0 && (
            <div style={{ marginTop: 8, color: isDark ? '#d1fae5' : '#065f46', fontSize: 12 }}>
              {files.length} arquivo(s) selecionado(s)
            </div>
          )}
        </div>

        <label style={labelStyle}>FOTO / PDF</label>
        <div style={{ marginBottom: 18 }}>
          <input
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={e => setExtraFiles(Array.from(e.target.files || []))}
            style={{ ...inputStyle, padding: '14px 12px' }}
          />
          {extraFiles.length > 0 && (
            <div style={{ marginTop: 8, color: isDark ? '#d1fae5' : '#065f46', fontSize: 12 }}>
              {extraFiles.length} arquivo(s) selecionado(s)
            </div>
          )}
        </div>

        <label style={labelStyle}>OBSERVAÇÕES</label>
        <textarea
          value={formData.notes}
          onChange={e => updateField('notes', e.target.value)}
          rows={5}
          placeholder="Insira observações adicionais..."
          style={{ ...inputStyle, minHeight: 140, resize: 'vertical' }}
        />
      </div>

      {error && (
        <div style={{ marginTop: 20, padding: '14px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: 12 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 24 }}>
        <button
          type="button"
          onClick={() => submitOrder(false)}
          disabled={loading}
          style={{
            flex: 1,
            minWidth: 180,
            background: '#dc2626',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '14px 18px',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          {loading ? 'ENVIANDO...' : 'ENVIAR'}
        </button>

        <button
          type="button"
          onClick={() => submitOrder(true)}
          disabled={loading}
          style={{
            flex: 1,
            minWidth: 180,
            background: '#1f2937',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '14px 18px',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          {loading ? 'ENVIANDO...' : 'ENVIAR E ENVIAR NOVO'}
        </button>

        <button
          type="button"
          onClick={() => navigate('/orders')}
          style={{
            flex: 1,
            minWidth: 180,
            background: isDark ? '#1f2937' : '#f3f4f6',
            color: isDark ? '#fff' : '#111',
            border: '1px solid',
            borderColor: isDark ? '#374151' : '#d1d5db',
            borderRadius: 12,
            padding: '14px 18px',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          CANCELAR
        </button>
      </div>
    </div>
  );
}
