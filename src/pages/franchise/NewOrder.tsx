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

  // Função para buscar dados automaticamente ao digitar a placa
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
  });

  return (
    <div style={{ background: bg, minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: isDark ? '#fff' : '#111', margin: 0 }}>
              NOVO PEDIDO DE REMAP
            </h1>
            <p style={{ fontSize: '13px', color: '#888', marginTop: '3px' }}>
              {fetchingPlate ? 'Buscando dados da placa...' : 'Preencha os detalhes técnicos abaixo.'}
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
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr', gap: '16px', alignItems: 'start' }}>

          {/* ── COLUNA 1: VEÍCULO ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={card}>
              <p style={sectionTitle}>1. Dados do Veículo</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={label}>Placa / Frota *</label>
                  <input 
                    style={{...input, borderColor: fetchingPlate ? '#e6b800' : isDark ? '#333' : '#d1d5db'}} 
                    value={formData.plate} 
                    onChange={e => updateField('plate', e.target.value.toUpperCase())} 
                    onBlur={handlePlateLookup}
                    placeholder="BRA2E19" 
                  />
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
                  <label style={label}>Potência (CV) *</label>
                  <input style={input} value={formData.cv} onChange={e => updateField('cv', e.target.value)} placeholder="Ex: 180" />
                </div>
                <div>
                  <label style={label}>Combustível *</label>
                  <select style={input} value={formData.fuel} onChange={e => updateField('fuel', e.target.value)}>
                    {fuelOptions.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={label}>Chassi</label>
                  <input style={input} value={formData.chassi} onChange={e => updateField('chassi', e.target.value)} placeholder="Opcional" />
                </div>
                <div>
                  <label style={label}>KM Atual</label>
                  <input style={input} value={formData.km} onChange={e => updateField('km', e.target.value)} placeholder="Ex: 85.000" />
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
              </div>
            </div>

            <div style={card}>
              <p style={sectionTitle}>2. ECU & Sistema</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={label}>Nº HW</label>
                  <input style={input} value={formData.hw_number} onChange={e => updateField('hw_number', e.target.value)} placeholder="Hardware" />
                </div>
                <div>
                  <label style={label}>Nº SW</label>
                  <input style={input} value={formData.sw_number} onChange={e => updateField('sw_number', e.target.value)} placeholder="Software" />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={label}>Módulo / Sistema</label>
                  <input style={input} value={formData.system} onChange={e => updateField('system', e.target.value)} placeholder="Ex: EDC17C46" />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={label}>Modo de Leitura</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {(['OBD', 'BANCADA', 'BOOT', 'VR'] as const).map(m => (
                      <button key={m} type="button" onClick={() => updateField('readingMode', m)} style={badge(formData.readingMode === m)}>{m}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── COLUNA 2: PERFORMANCE ── */}
          <div style={card}>
            <p style={sectionTitle}>3. Soluções Requeridas</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {performanceOptions.map(opt => (
                <button key={opt} type="button" onClick={() => updateField('performance', toggleSelection(formData.performance, opt))} style={badge(formData.performance.includes(opt))}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* ── COLUNA 3: FERRAMENTA & ENVIO ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={card}>
              <p style={sectionTitle}>4. Ferramenta *</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {toolOptions.map(opt => (
                  <button key={opt} type="button" onClick={() => updateField('tool', toggleSelection(formData.tool, opt))} style={badge(formData.tool.includes(opt))}>
                    {opt}
                  </button>
                ))}
              </div>
              {formData.tool.includes('Outra') && (
                <input style={{ ...input, marginTop: '10px' }} value={formData.toolOther} onChange={e => updateField('toolOther', e.target.value)} placeholder="Qual ferramenta?" />
              )}
            </div>

            <div style={card}>
              <p style={sectionTitle}>5. Arquivo Original / Leitura *</p>
              <div
                onClick={() => document.getElementById('map-upload')?.click()}
                style={{
                  border: `2px dashed ${isDark ? '#333' : '#d1d5db'}`,
                  borderRadius: '8px', padding: '20px', textAlign: 'center', cursor: 'pointer',
                  background: isDark ? '#111' : '#fafafa', color: '#888', fontSize: '13px',
                }}
              >
                {mapFiles.length > 0 ? `✓ ${mapFiles.length} arquivos selecionados` : '+ Selecionar Arquivos'}
                <input id="map-upload" type="file" multiple hidden onChange={e => setMapFiles(Array.from(e.target.files || []))} />
              </div>
            </div>

            <div style={card}>
              <p style={sectionTitle}>6. Notas e DTCs</p>
              <textarea
                style={{ ...input, minHeight: '80px', resize: 'none' }}
                value={formData.notes}
                onChange={e => updateField('notes', e.target.value)}
                placeholder="DTCs apagados ou observações importantes..."
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {error && (
                <div style={{ background: '#dc2626', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '13px', textAlign: 'center' }}>
                  {error}
                </div>
              )}
              <button
                onClick={submitOrder}
                disabled={loading}
                style={{
                  background: loading ? '#555' : '#e6b800',
                  color: '#000', border: 'none', borderRadius: '10px', padding: '16px',
                  fontWeight: 900, fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'ENVIANDO...' : '🚀 ENVIAR SOLICITAÇÃO'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}