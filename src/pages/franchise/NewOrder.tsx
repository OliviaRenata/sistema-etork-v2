import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, callFunction, storage } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
// Importando o serviço da API Placas
import { fetchVehicleByPlate } from '../../lib/vehicleService';

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

// Componentes de Ícones
const IconArrowLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.3-4.3"/>
  </svg>
);

const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconUpload = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const IconFile = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
    <polyline points="13 2 13 9 20 9"/>
  </svg>
);

const IconAlertCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const IconSend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const IconCar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.5 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2"/>
    <circle cx="7" cy="17" r="2"/>
    <circle cx="17" cy="17" r="2"/>
  </svg>
);

const IconCpu = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
    <rect x="9" y="9" width="6" height="6"/>
    <line x1="9" y1="1" x2="9" y2="4"/>
    <line x1="15" y1="1" x2="15" y2="4"/>
    <line x1="9" y1="20" x2="9" y2="23"/>
    <line x1="15" y1="20" x2="15" y2="23"/>
    <line x1="20" y1="9" x2="23" y2="9"/>
    <line x1="20" y1="14" x2="23" y2="14"/>
    <line x1="1" y1="9" x2="4" y2="9"/>
    <line x1="1" y1="14" x2="4" y2="14"/>
  </svg>
);

const IconZap = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const IconTool = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

const IconNote = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const IconLoader = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 2a10 10 0 0 1 10 10"/>
  </svg>
);

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
  const [fetchingPlate, setFetchingPlate] = useState(false);
  const [error, setError] = useState('');

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  const toggleSelection = (list: string[], item: string) =>
    list.includes(item) ? list.filter(i => i !== item) : [...list, item];

  const handlePlateLookup = async () => {
    const cleanPlate = formData.plate.replace(/[^a-zA-Z0-9]/g, '');
    if (cleanPlate.length >= 7) {
      setFetchingPlate(true);
      try {
        const data = await fetchVehicleByPlate(cleanPlate);
        if (data) {
          setFormData(prev => ({
            ...prev,
            model: data.model || prev.model,
            year: data.year || prev.year,
            engine: data.engine || prev.engine,
            fuel: data.fuel || prev.fuel,
            chassi: data.chassi || prev.chassi,
            cv: data.cv || prev.cv
          }));
        }
      } catch (err) {
        console.error("Erro na busca automática:", err);
      } finally {
        setFetchingPlate(false);
      }
    }
  };

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

  // ─── Estilos Otimizados ──────────────────────────────────────────────
  const bg = isDark ? '#0d0d0d' : '#f3f4f6';
  const card: React.CSSProperties = {
    background: isDark ? '#141414' : '#fff',
    borderRadius: '12px',
    border: `1px solid ${isDark ? '#222' : '#e5e7eb'}`,
    padding: '20px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  };

  const input: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '8px',
    background: isDark ? '#1c1c1c' : '#f9fafb',
    border: `1px solid ${isDark ? '#333' : '#d1d5db'}`,
    color: isDark ? '#fff' : '#111',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  const label: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 700,
    color: isDark ? '#999' : '#666',
    marginBottom: '4px',
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 900,
    color: '#e6b800',
    marginBottom: '16px',
    borderLeft: '3px solid #e6b800',
    paddingLeft: '10px',
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const badge = (active: boolean): React.CSSProperties => ({
    padding: '6px 4px',
    fontSize: '10px',
    borderRadius: '6px',
    cursor: 'pointer',
    border: `1px solid ${active ? '#e6b800' : isDark ? '#2a2a2a' : '#e5e7eb'}`,
    background: active ? '#e6b800' : isDark ? '#111' : '#fafafa',
    color: active ? '#000' : isDark ? '#ccc' : '#666',
    fontWeight: active ? 700 : 400,
    transition: 'all 0.15s',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  });

  const formGroup: React.CSSProperties = {
    marginBottom: '12px',
  };

  const spinKeyframes = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;

  return (
    <div style={{ background: bg, minHeight: '100vh', padding: '24px' }}>
      <style>{spinKeyframes}</style>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: isDark ? '#fff' : '#111', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <IconCar />
              NOVO PEDIDO DE REMAP
            </h1>
            <p style={{ fontSize: '13px', color: '#888', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {fetchingPlate ? <IconLoader /> : <IconSearch />}
              {fetchingPlate ? 'Buscando dados da placa...' : 'Preencha os detalhes técnicos abaixo'}
            </p>
          </div>
          <button
            onClick={() => navigate('/orders')}
            style={{ 
              background: isDark ? '#2a2a2a' : '#f0f0f0', 
              color: isDark ? '#fff' : '#333', 
              border: 'none', 
              padding: '8px 20px', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontWeight: 600, 
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconArrowLeft />
            Voltar
          </button>
        </div>

        {/* Layout em 2 colunas para evitar espaço vazio */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          alignItems: 'start' 
        }}>

          {/* ── COLUNA ESQUERDA ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Card Veículo */}
            <div style={card}>
              <div style={sectionTitle}>
                <IconCar />
                1. Dados do Veículo
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ gridColumn: 'span 2', ...formGroup }}>
                  <label style={label}>Placa / Frota *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      style={{
                        ...input,
                        paddingRight: '44px',
                        borderColor: fetchingPlate ? '#e6b800' : isDark ? '#333' : '#d1d5db'
                      }}
                      value={formData.plate}
                      onChange={e => updateField('plate', e.target.value.toUpperCase())}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handlePlateLookup();
                        }
                      }}
                      placeholder="BRA2E19"
                    />
                    <button
                      type="button"
                      onClick={handlePlateLookup}
                      disabled={fetchingPlate || formData.plate.replace(/[^a-zA-Z0-9]/g, '').length < 7}
                      title="Buscar dados da placa"
                      style={{
                        position: 'absolute',
                        right: 6,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        border: `1px solid ${isDark ? '#333' : '#d1d5db'}`,
                        background: isDark ? '#111' : '#fff',
                        color: '#e6b800',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: fetchingPlate ? 'wait' : 'pointer',
                        opacity: fetchingPlate || formData.plate.replace(/[^a-zA-Z0-9]/g, '').length < 7 ? 0.5 : 1,
                      }}
                    >
                      {fetchingPlate ? <IconLoader /> : <IconSearch />}
                    </button>
                  </div>
                </div>
                <div style={{ gridColumn: 'span 2', ...formGroup }}>
                  <label style={label}>Modelo *</label>
                  <input style={input} value={formData.model} onChange={e => updateField('model', e.target.value)} placeholder="Ex: VW Amarok 2.0 TDI" />
                </div>
                <div style={formGroup}>
                  <label style={label}>Ano *</label>
                  <select style={input} value={formData.year} onChange={e => updateField('year', e.target.value)}>
                    <option value="">Selecione</option>
                    {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div style={formGroup}>
                  <label style={label}>Motor *</label>
                  <input style={input} value={formData.engine} onChange={e => updateField('engine', e.target.value)} placeholder="Ex: 2.0 TDI" />
                </div>
                <div style={formGroup}>
                  <label style={label}>Potência (CV) *</label>
                  <input style={input} value={formData.cv} onChange={e => updateField('cv', e.target.value)} placeholder="Ex: 180" />
                </div>
                <div style={formGroup}>
                  <label style={label}>Combustível *</label>
                  <select style={input} value={formData.fuel} onChange={e => updateField('fuel', e.target.value)}>
                    {fuelOptions.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2', ...formGroup }}>
                  <label style={label}>Chassi</label>
                  <input style={input} value={formData.chassi} onChange={e => updateField('chassi', e.target.value)} placeholder="Opcional" />
                </div>
                <div style={formGroup}>
                  <label style={label}>KM Atual</label>
                  <input style={input} value={formData.km} onChange={e => updateField('km', e.target.value)} placeholder="Ex: 85.000" />
                </div>
                <div style={formGroup}>
                  <label style={label}>Câmbio</label>
                  <select style={input} value={formData.transmission} onChange={e => updateField('transmission', e.target.value as any)}>
                    <option value="">Selecione</option>
                    <option value="Manual">Manual</option>
                    <option value="Automático">Automático</option>
                    <option value="DSG/Dualogic">DSG/Dualogic</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Card ECU */}
            <div style={card}>
              <div style={sectionTitle}>
                <IconCpu />
                2. ECU & Sistema
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={formGroup}>
                  <label style={label}>Nº HW</label>
                  <input style={input} value={formData.hw_number} onChange={e => updateField('hw_number', e.target.value)} placeholder="Hardware" />
                </div>
                <div style={formGroup}>
                  <label style={label}>Nº SW</label>
                  <input style={input} value={formData.sw_number} onChange={e => updateField('sw_number', e.target.value)} placeholder="Software" />
                </div>
                <div style={{ gridColumn: 'span 2', ...formGroup }}>
                  <label style={label}>Módulo / Sistema</label>
                  <input style={input} value={formData.system} onChange={e => updateField('system', e.target.value)} placeholder="Ex: EDC17C46" />
                </div>
                <div style={{ gridColumn: 'span 2', ...formGroup }}>
                  <label style={label}>Modo de Leitura</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {(['OBD', 'BANCADA', 'BOOT', 'VR'] as const).map(m => (
                      <button key={m} type="button" onClick={() => updateField('readingMode', m)} style={badge(formData.readingMode === m)}>{m}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Card Ferramenta */}
            <div style={card}>
              <div style={sectionTitle}>
                <IconTool />
                3. Ferramenta *
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '6px' }}>
                {toolOptions.map(opt => (
                  <button key={opt} type="button" onClick={() => updateField('tool', toggleSelection(formData.tool, opt))} style={badge(formData.tool.includes(opt))}>
                    {opt}
                  </button>
                ))}
              </div>
              {formData.tool.includes('Outra') && (
                <div style={{ marginTop: '12px' }}>
                  <input style={input} value={formData.toolOther} onChange={e => updateField('toolOther', e.target.value)} placeholder="Qual ferramenta?" />
                </div>
              )}
            </div>
          </div>

          {/* ── COLUNA DIREITA ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Card Performance */}
            <div style={card}>
              <div style={sectionTitle}>
                <IconZap />
                4. Soluções Requeridas
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '6px', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
                {performanceOptions.map(opt => (
                  <button key={opt} type="button" onClick={() => updateField('performance', toggleSelection(formData.performance, opt))} style={badge(formData.performance.includes(opt))}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Card Arquivo - Mais compacto */}
            <div style={card}>
              <div style={sectionTitle}>
                <IconUpload />
                5. Arquivo Original *
              </div>
              <div
                onClick={() => document.getElementById('map-upload')?.click()}
                style={{
                  border: `2px dashed ${isDark ? '#333' : '#d1d5db'}`,
                  borderRadius: '8px', 
                  padding: '20px',
                  textAlign: 'center', 
                  cursor: 'pointer',
                  background: isDark ? '#111' : '#fafafa', 
                  transition: 'border-color 0.15s',
                }}
              >
                {mapFiles.length > 0 ? (
                  <div>
                    <IconCheck />
                    <div style={{ marginTop: '6px', fontWeight: 600, color: '#e6b800', fontSize: '12px' }}>
                      {mapFiles.length} arquivo(s)
                    </div>
                    <div style={{ fontSize: '10px', marginTop: '4px', color: '#888' }}>
                      {mapFiles[0].name.length > 30 ? mapFiles[0].name.substring(0, 27) + '...' : mapFiles[0].name}
                      {mapFiles.length > 1 && ` +${mapFiles.length - 1}`}
                    </div>
                  </div>
                ) : (
                  <div>
                    <IconUpload />
                    <div style={{ marginTop: '6px', fontSize: '12px' }}>Selecionar arquivo</div>
                    <div style={{ fontSize: '10px', marginTop: '2px', color: '#888' }}>BIN, HEX, ZIP</div>
                  </div>
                )}
                <input id="map-upload" type="file" multiple hidden onChange={e => setMapFiles(Array.from(e.target.files || []))} />
              </div>
            </div>

            {/* Card Notas */}
            <div style={card}>
              <div style={sectionTitle}>
                <IconNote />
                6. Notas e DTCs
              </div>
              <textarea
                style={{ ...input, minHeight: '80px', resize: 'vertical', fontSize: '12px' }}
                value={formData.notes}
                onChange={e => updateField('notes', e.target.value)}
                placeholder="DTCs apagados ou observações importantes..."
              />
            </div>

            {/* Botão de Envio */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {error && (
                <div style={{ 
                  background: '#e6b800', 
                  color: '#fff', 
                  padding: '10px', 
                  borderRadius: '8px', 
                  fontSize: '12px', 
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}>
                  <IconAlertCircle />
                  {error}
                </div>
              )}
              <button
                onClick={submitOrder}
                disabled={loading}
                style={{
                  background: loading ? '#555' : '#e6b800',
                  color: '#000', 
                  border: 'none', 
                  borderRadius: '10px', 
                  padding: '14px',
                  fontWeight: 900, 
                  fontSize: '14px', 
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {loading ? <IconLoader /> : <IconSend />}
                {loading ? 'ENVIANDO...' : 'ENVIAR SOLICITAÇÃO'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}