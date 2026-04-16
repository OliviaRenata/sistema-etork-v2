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
  km: string;
  fuel: string;
  transmission: 'Manual' | 'Automático' | 'DSG/Dualogic' | '';
  hw_number: string;
  sw_number: string;
  sw_upgrade: string;
  spare_part: string;
  system: string;
  protocol: string;
  readingMode: 'OBD' | 'BANCADA' | 'BOOT' | 'VR' | '';
  dtc: string;
  performance: string[];
  tool: string[];
  toolOther: string;
  notes: string;
};

const fuelOptions = ['Flex', 'Diesel', 'Gasolina', 'Álcool', 'Híbrido', 'Elétrico'];
const yearOptions = Array.from({ length: 40 }, (_, i) => `${new Date().getFullYear() - i}`);

const performanceOptions = [
  'DPF & EGR (OFF)', 'DPF (OFF)', 'EGR (OFF)', 'SCR/AdBlue OFF',
  'Combo 3 OFF', 'Sonda/O2 (OFF)', 'MAF (OFF)', 'Eolis Renault',
  'STG1 Potência', 'STG2 Potência', 'STG1 + DPF/EGR', 'Agri STG1 + EGR',
  'Pop & Bangs', 'VMAX OFF', 'Hard Cut', 'DTC P0420',
  'DTC OFF (OBD)', 'Start Stop', 'TVA (OFF)', 'Bomba Água OFF',
  'Heliçe JD', 'Torque SCR', 'Decode MR/FR', 'Checksum',
  'Original', 'Verificação', 'Especial',
];

const toolOptions = [
  'KTAG ORIGINAL', 'KTAG PIRATA', 'KESS V2 ORIGINAL', 'KESS PIRATA',
  'KESS3 ORIGINAL', 'NEW GENIUS', 'NEW TRANSDATA', 'KZ PROG',
  'DFOX', 'KT200', 'Outra',
];

export default function FranchiseNewOrder() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState<FormData>({
    plate: '', chassi: '', model: '', year: '', engine: '', cv: '', km: '',
    fuel: fuelOptions[0], transmission: '', hw_number: '', sw_number: '',
    sw_upgrade: '', spare_part: '', system: '', protocol: '',
    readingMode: '', dtc: '', performance: [], tool: [], toolOther: '', notes: '',
  });

  const [mapFiles, setMapFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  const toggleSelection = (list: string[], item: string) =>
    list.includes(item) ? list.filter(i => i !== item) : [...list, item];

  const submitOrder = async () => {
    if (!formData.plate.trim() || mapFiles.length === 0) {
      setError('Placa e Arquivo de Mapa são obrigatórios.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const toolsFinal = formData.tool
        .map(t => (t === 'Outra' ? `Outra (${formData.toolOther})` : t))
        .join(', ');

      const result = await callFunction<{ order: { id: string } }>('create-order', {
        vehicle_plate: formData.plate.toUpperCase(),
        chassi: formData.chassi,
        model: formData.model,
        year: formData.year,
        engine: formData.engine,
        cv: formData.cv,
        fuel: formData.fuel,
        notes: `KM: ${formData.km} | Câmbio: ${formData.transmission} | HW: ${formData.hw_number} | SW: ${formData.sw_number} | SW Up: ${formData.sw_upgrade} | System: ${formData.system} | Modo: ${formData.readingMode} | Prot: ${formData.protocol} | Ferramentas: ${toolsFinal} | Perf: ${formData.performance.join(', ')} | DTCs: ${formData.dtc} | Obs: ${formData.notes}`,
      });

      for (const file of mapFiles) {
        const path = await storage.uploadOrderFile(result.order.id, file);
        await supabase.from('order_files').insert({
          order_id: result.order.id,
          file_name: file.name,
          file_path: path,
          file_size: file.size,
          mime_type: file.type,
        });
      }
      navigate('/orders');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Estilos ──────────────────────────────────────────────
  const bg = isDark ? '#0d0d0d' : '#f3f4f6';
  const card: React.CSSProperties = {
    background: isDark ? '#141414' : '#fff',
    borderRadius: '12px',
    border: `1px solid ${isDark ? '#222' : '#e5e7eb'}`,
    padding: '18px',
  };

  const input: React.CSSProperties = {
    width: '100%',
    padding: '9px 10px',
    borderRadius: '8px',
    background: isDark ? '#1c1c1c' : '#f9fafb',
    border: `1px solid ${isDark ? '#333' : '#d1d5db'}`,
    color: isDark ? '#fff' : '#111',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const label: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 700,
    color: isDark ? '#666' : '#888',
    marginBottom: '5px',
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 900,
    color: '#e6b800',
    marginBottom: '14px',
    borderLeft: '3px solid #e6b800',
    paddingLeft: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const badge = (active: boolean): React.CSSProperties => ({
    padding: '7px 4px',
    fontSize: '10px',
    borderRadius: '6px',
    cursor: 'pointer',
    border: `1px solid ${active ? '#e6b800' : isDark ? '#2a2a2a' : '#e5e7eb'}`,
    background: active ? '#e6b800' : isDark ? '#111' : '#fafafa',
    color: active ? '#000' : isDark ? '#999' : '#555',
    fontWeight: active ? 700 : 400,
    transition: 'all 0.15s',
    textAlign: 'center',
    lineHeight: 1.3,
  });

  return (
    <div style={{ background: bg, minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: isDark ? '#fff' : '#111', margin: 0 }}>
              ENVIAR ARQUIVOS
            </h1>
            <p style={{ fontSize: '13px', color: '#888', marginTop: '3px' }}>
              {loading ? 'Processando...' : 'Preencha os dados técnicos para processamento do remap.'}
            </p>
          </div>
          <button
            onClick={() => navigate('/orders')}
            style={{ background: '#222', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
          >
            ← Voltar
          </button>
        </div>

        {/* Layout: 3 colunas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', alignItems: 'start' }}>

          {/* ── COLUNA 1 ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Dados do Veículo */}
            <div style={card}>
              <p style={sectionTitle}>1. Dados do Veículo</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={label}>Placa / Frota *</label>
                  <input style={input} value={formData.plate} onChange={e => updateField('plate', e.target.value.toUpperCase())} placeholder="BRA2E19" />
                </div>
                <div>
                  <label style={label}>Chassi</label>
                  <input style={input} value={formData.chassi} onChange={e => updateField('chassi', e.target.value)} placeholder="Opcional" />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={label}>Modelo *</label>
                  <input style={input} value={formData.model} onChange={e => updateField('model', e.target.value)} placeholder="Ex: VW Amarok 2.0 TDI" />
                </div>
                <div>
                  <label style={label}>Ano *</label>
                  <select style={input} value={formData.year} onChange={e => updateField('year', e.target.value)}>
                    <option value="">Selecione</option>
                    {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label style={label}>Motor *</label>
                  <input style={input} value={formData.engine} onChange={e => updateField('engine', e.target.value)} placeholder="Ex: 2.0 TDI" />
                </div>
                <div>
                  <label style={label}>CV *</label>
                  <input style={input} value={formData.cv} onChange={e => updateField('cv', e.target.value)} placeholder="Ex: 180" />
                </div>
                <div>
                  <label style={label}>Combustível *</label>
                  <select style={input} value={formData.fuel} onChange={e => updateField('fuel', e.target.value)}>
                    {fuelOptions.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label style={label}>KM Atual</label>
                  <input style={input} value={formData.km} onChange={e => updateField('km', e.target.value)} placeholder="Ex: 85.000" />
                </div>
                <div>
                  <label style={label}>DTC / Avarias</label>
                  <input style={input} value={formData.dtc} onChange={e => updateField('dtc', e.target.value)} placeholder="Códigos de erro" />
                </div>
              </div>
            </div>

            {/* Identificação da ECU */}
            <div style={card}>
              <p style={sectionTitle}>2. Identificação da ECU</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={label}>Nº Hardware (HW)</label>
                  <input style={input} value={formData.hw_number} onChange={e => updateField('hw_number', e.target.value)} placeholder="Ex: 0281017" />
                </div>
                <div>
                  <label style={label}>Nº Software (SW)</label>
                  <input style={input} value={formData.sw_number} onChange={e => updateField('sw_number', e.target.value)} placeholder="Ex: 1037517" />
                </div>
                <div>
                  <label style={label}>System / Módulo</label>
                  <input style={input} value={formData.system} onChange={e => updateField('system', e.target.value)} placeholder="Ex: EDC17C46" />
                </div>
                <div>
                  <label style={label}>Protocolo</label>
                  <input style={input} value={formData.protocol} onChange={e => updateField('protocol', e.target.value)} placeholder="Ex: 742" />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={label}>Modo de Leitura</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {(['OBD', 'BANCADA', 'BOOT', 'VR'] as const).map(m => (
                      <button key={m} type="button" onClick={() => updateField('readingMode', m)} style={badge(formData.readingMode === m)}>{m}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={label}>Câmbio</label>
                  <select style={input} value={formData.transmission} onChange={e => updateField('transmission', e.target.value as any)}>
                    <option value="">Selecione</option>
                    <option value="Manual">Manual</option>
                    <option value="Automático">Automático</option>
                    <option value="DSG/Dualogic">DSG/Dualogic</option>
                  </select>
                </div>
                <div>
                  <label style={label}>SW Upgrade</label>
                  <input style={input} value={formData.sw_upgrade} onChange={e => updateField('sw_upgrade', e.target.value)} placeholder="Versão upgrade" />
                </div>
              </div>
            </div>
          </div>

          {/* ── COLUNA 2: Performance ── */}
          <div style={card}>
            <p style={sectionTitle}>3. Performance</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {performanceOptions.map(opt => (
                <button key={opt} type="button" onClick={() => updateField('performance', toggleSelection(formData.performance, opt))} style={badge(formData.performance.includes(opt))}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* ── COLUNA 3 ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Ferramenta */}
            <div style={card}>
              <p style={sectionTitle}>4. Ferramenta Utilizada *</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {toolOptions.map(opt => (
                  <button key={opt} type="button" onClick={() => updateField('tool', toggleSelection(formData.tool, opt))} style={badge(formData.tool.includes(opt))}>
                    {opt}
                  </button>
                ))}
              </div>
              {formData.tool.includes('Outra') && (
                <div style={{ marginTop: '10px' }}>
                  <label style={label}>Especifique a ferramenta</label>
                  <input style={input} value={formData.toolOther} onChange={e => updateField('toolOther', e.target.value)} placeholder="Nome da ferramenta" />
                </div>
              )}
            </div>

            {/* Upload */}
            <div style={card}>
              <p style={sectionTitle}>5. Arquivos de Mapa *</p>
              <div
                onClick={() => document.getElementById('map-upload')?.click()}
                style={{
                  border: `2px dashed ${isDark ? '#333' : '#d1d5db'}`,
                  borderRadius: '8px',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: isDark ? '#111' : '#fafafa',
                  color: mapFiles.length > 0 ? '#e6b800' : '#888',
                  fontSize: '13px',
                  fontWeight: mapFiles.length > 0 ? 700 : 400,
                }}
              >
                {mapFiles.length > 0 ? `✓ ${mapFiles.length} arquivo(s) selecionado(s)` : '+ Clique para selecionar arquivos (ID, ORI, MOD)'}
                <input id="map-upload" type="file" multiple hidden onChange={e => setMapFiles(Array.from(e.target.files || []))} />
              </div>
              {mapFiles.length > 0 && (
                <ul style={{ marginTop: '8px', padding: 0, listStyle: 'none' }}>
                  {mapFiles.map((f, i) => (
                    <li key={i} style={{ fontSize: '11px', color: '#888', padding: '3px 0', borderBottom: `1px solid ${isDark ? '#1e1e1e' : '#f0f0f0'}` }}>
                      📎 {f.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Observações */}
            <div style={card}>
              <p style={sectionTitle}>6. Observações Técnicas</p>
              <textarea
                style={{ ...input, minHeight: '90px', resize: 'vertical' }}
                value={formData.notes}
                onChange={e => updateField('notes', e.target.value)}
                placeholder="Descreva qualquer informação adicional relevante para o serviço..."
              />
            </div>

            {/* Ações */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {error && (
                <div style={{ background: '#dc2626', color: '#fff', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', textAlign: 'center' }}>
                  ⚠️ {error}
                </div>
              )}
              <button
                onClick={submitOrder}
                disabled={loading}
                style={{
                  background: loading ? '#555' : '#e6b800',
                  color: loading ? '#aaa' : '#000',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '16px',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.05em',
                }}
              >
                {loading ? 'PROCESSANDO...' : '🚀 ENVIAR PEDIDO'}
              </button>
              <button
                onClick={() => navigate('/orders')}
                style={{ background: 'transparent', color: '#888', border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`, borderRadius: '10px', padding: '12px', cursor: 'pointer', fontSize: '13px' }}
              >
                Cancelar
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}