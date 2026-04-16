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
const yearOptions = Array.from({ length: 40 }, (_, index) => `${new Date().getFullYear() - index}`);

const performanceOptions = [
  'DPF & EGR (OFF)', 'DPF (OFF)', 'EGR (OFF)', 'SCR/AdBlue OFF',
  'Combo 3 OFF', 'Sonda/O2 (OFF)', 'MAF (OFF)', 'Eolis Renault',
  'STG1 Potência', 'STG2 Potência', 'STG1 + DPF/EGR', 'Agri STG1 + EGR',
  'Pop & Bangs', 'VMAX OFF', 'Hard Cut', 'DTC P0420',
  'DTC OFF (OBD)', 'Start Stop', 'TVA (OFF)', 'Bomba Água OFF',
  'Heliçe JD', 'Torque SCR', 'Decode MR/FR', 'Checksum',
  'Original', 'Verificação', 'Especial'
];

const toolOptions = [
  'KTAG ORIGINAL', 'KTAG PIRATA', 'KESS V2 ORIGINAL', 'KESS PIRATA',
  'KESS3 ORIGINAL', 'NEW GENIUS', 'NEW TRANSDATA', 'KZ PROG',
  'DFOX', 'KT200', 'Outra'
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
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleSelection = (list: string[], item: string) => 
    list.includes(item) ? list.filter(i => i !== item) : [...list, item];

  const submitOrder = async (sendAnother = false) => {
    if (!formData.plate.trim() || mapFiles.length === 0) {
      setError('Placa e Arquivo de Mapa são obrigatórios.');
      return;
    }
    setLoading(true);
    try {
      const toolsFinal = formData.tool.map(t => t === 'Outra' ? `Outra (${formData.toolOther})` : t).join(', ');
      
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

      const allFiles = [...mapFiles, ...extraFiles];
      for (const file of allFiles) {
        const path = await storage.uploadOrderFile(result.order.id, file);
        await supabase.from('order_files').insert({
          order_id: result.order.id, file_name: file.name, file_path: path,
          file_size: file.size, mime_type: file.type,
        });
      }

      if (sendAnother) window.location.reload();
      else navigate('/orders');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const cardStyle: React.CSSProperties = {
    background: isDark ? '#121212' : '#fff',
    padding: '20px', borderRadius: '12px',
    border: `1px solid ${isDark ? '#222' : '#e5e7eb'}`,
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px', borderRadius: '8px',
    background: isDark ? '#1a1a1a' : '#f9fafb',
    border: `1px solid ${isDark ? '#333' : '#d1d5db'}`,
    color: isDark ? '#fff' : '#111', fontSize: '13px', outline: 'none', transition: 'border 0.2s'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 'bold', color: isDark ? '#888' : '#666', marginBottom: '6px', display: 'block'
  };

  const badgeStyle = (active: boolean) => ({
    padding: '8px 4px', fontSize: '10px', borderRadius: '6px', cursor: 'pointer',
    border: '1px solid', transition: 'all 0.2s',
    borderColor: active ? '#e6b800' : (isDark ? '#333' : '#e5e7eb'),
    background: active ? '#e6b800' : (isDark ? '#0a0a0a' : '#fff'),
    color: active ? '#fff' : (isDark ? '#aaa' : '#444'),
    fontWeight: active ? 'bold' : 'normal',
  });

  const uploadBoxStyle: React.CSSProperties = {
    border: `2px dashed ${isDark ? '#333' : '#d1d5db'}`,
    borderRadius: '8px', padding: '15px', textAlign: 'center', cursor: 'pointer',
    background: isDark ? '#1a1a1a' : '#fcfcfc', color: '#888', fontSize: '12px'
  };

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', padding: '30px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '26px', color: isDark ? '#fff' : '#111', margin: 0, fontWeight: 800 }}>ENVIAR ARQUIVOS</h1>
          <p style={{ fontSize: '14px', color: '#888' }}>Preencha os dados técnicos para processamento do remap.</p>
        </div>
        <button onClick={() => navigate('/orders')} style={{ background: '#333', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>Voltar ao Painel</button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr', gap: '25px' }}>
        
        {/* COLUNA ESQUERDA: DADOS DO VEÍCULO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <section style={cardStyle}>
            <h3 style={{ fontSize: '14px', marginBottom: '15px', color: '#e6b800', fontWeight: 900, borderLeft: '4px solid #e6b800', paddingLeft: '10px' }}>1. DADOS DO VEÍCULO</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>PLACA / FROTA *</label>
                <input style={inputStyle} value={formData.plate} onChange={e => updateField('plate', e.target.value.toUpperCase())} placeholder="Ex: BRA2E19" />
              </div>
              <div>
                <label style={labelStyle}>CHASSI</label>
                <input style={inputStyle} value={formData.chassi} onChange={e => updateField('chassi', e.target.value)} placeholder="Opcional" />
              </div>
              <div>
                <label style={labelStyle}>MODELO *</label>
                <input style={inputStyle} value={formData.model} onChange={e => updateField('model', e.target.value)} placeholder="Ex: VW Amarok" />
              </div>
              <div>
                <label style={labelStyle}>ANO *</label>
                <select style={inputStyle} value={formData.year} onChange={e => updateField('year', e.target.value)}>
                  <option value="">Selecione uma opção</option>
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>MOTOR *</label>
                <input style={inputStyle} value={formData.engine} onChange={e => updateField('engine', e.target.value)} placeholder="Ex: 2.0 TDI" />
              </div>
              <div>
                <label style={labelStyle}>CV *</label>
                <input style={inputStyle} value={formData.cv} onChange={e => updateField('cv', e.target.value)} placeholder="Ex: 180" />
              </div>
              <div>
                <label style={labelStyle}>COMBUSTÍVEL *</label>
                <select style={inputStyle} value={formData.fuel} onChange={e => updateField('fuel', e.target.value)}>
                  <option value="">Selecione uma opção</option>
                  {fuelOptions.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>DTC / AVARIAS</label>
                <input style={inputStyle} value={formData.dtc} onChange={e => updateField('dtc', e.target.value)} placeholder="Códigos de erro" />
              </div>
            </div>
          </section>

          <section style={cardStyle}>
            <h3 style={{ fontSize: '14px', marginBottom: '15px', color: '#e6b800', fontWeight: 900, borderLeft: '4px solid #e6b800', paddingLeft: '10px' }}>2. IDENTIFICAÇÃO DA ECU</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>Nº HARDWARE (HW)</label>
                <input style={inputStyle} value={formData.hw_number} onChange={e => updateField('hw_number', e.target.value)} placeholder="Ex: 0281017" />
              </div>
              <div>
                <label style={labelStyle}>Nº SOFTWARE (SW)</label>
                <input style={inputStyle} value={formData.sw_number} onChange={e => updateField('sw_number', e.target.value)} placeholder="Ex: 1037517" />
              </div>
              <div>
                <label style={labelStyle}>SYSTEM/MÓDULO</label>
                <input style={inputStyle} value={formData.system} onChange={e => updateField('system', e.target.value)} placeholder="Ex: EDC17C46" />
              </div>
              <div>
                <label style={labelStyle}>KM ATUAL</label>
                <input style={inputStyle} value={formData.km} onChange={e => updateField('km', e.target.value)} placeholder="Ex: 85.000" />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>MÉTODO E PROTOCOLO</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  {['OBD', 'BANCADA', 'BOOT', 'VR'].map(m => (
                    <button key={m} type="button" onClick={() => updateField('readingMode', m as any)} style={{ ...badgeStyle(formData.readingMode === m), flex: 1 }}>{m}</button>
                  ))}
                </div>
                <input style={inputStyle} value={formData.protocol} onChange={e => updateField('protocol', e.target.value)} placeholder="Nº do Protocolo (Ex: 742)" />
              </div>
            </div>
          </section>
        </div>

        {/* COLUNA DIREITA: SERVIÇOS E UPLOADS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <section style={cardStyle}>
            <h3 style={{ fontSize: '14px', marginBottom: '12px', color: '#e6b800', fontWeight: 900, borderLeft: '4px solid #e6b800', paddingLeft: '10px' }}>3. PERFORMANCE</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {performanceOptions.map(opt => (
                <button key={opt} type="button" onClick={() => updateField('performance', toggleSelection(formData.performance, opt))} style={badgeStyle(formData.performance.includes(opt))}>
                  {opt}
                </button>
              ))}
            </div>
          </section>

          <section style={cardStyle}>
            <h3 style={{ fontSize: '14px', marginBottom: '12px', color: '#e6b800', fontWeight: 900, borderLeft: '4px solid #e6b800', paddingLeft: '10px' }}>4. FERRAMENTA UTILIZADA *</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {toolOptions.map(opt => (
                <button key={opt} type="button" onClick={() => updateField('tool', toggleSelection(formData.tool, opt))} style={badgeStyle(formData.tool.includes(opt))}>
                  {opt}
                </button>
              ))}
            </div>
            {formData.tool.includes('Outra') && (
              <input style={{ ...inputStyle, marginTop: '10px' }} placeholder="Qual ferramenta?" value={formData.toolOther} onChange={e => updateField('toolOther', e.target.value)} />
            )}
          </section>

          {/* ARQUIVOS DE MAPA */}
          <section style={cardStyle}>
            <label style={labelStyle}>ARQUIVOS DE MAPA (ID, ORI, MOD) *</label>
            <div style={uploadBoxStyle} onClick={() => document.getElementById('map-upload')?.click()}>
              {mapFiles.length > 0 ? `${mapFiles.length} arquivo(s) selecionado(s)` : 'Arraste e solte os arquivos ou Clique aqui'}
              <input id="map-upload" type="file" multiple hidden onChange={e => setMapFiles(Array.from(e.target.files || []))} />
            </div>
          </section>

          {/* FOTO / PDF */}
          <section style={cardStyle}>
            <label style={labelStyle}>FOTO / PDF</label>
            <div style={uploadBoxStyle} onClick={() => document.getElementById('extra-upload')?.click()}>
              {extraFiles.length > 0 ? `${extraFiles.length} arquivo(s) selecionado(s)` : 'Arraste e solte os arquivos ou Clique aqui'}
              <input id="extra-upload" type="file" multiple hidden onChange={e => setExtraFiles(Array.from(e.target.files || []))} />
            </div>
          </section>

          <section style={cardStyle}>
            <label style={labelStyle}>OBSERVAÇÕES TÉCNICAS</label>
            <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'none' }} value={formData.notes} onChange={e => updateField('notes', e.target.value)} placeholder="Detalhes adicionais sobre o veículo ou pedido." />
          </section>

          <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={() => submitOrder()} disabled={loading} style={{ flex: 2, background: '#ff0000', color: '#fff', border: 'none', borderRadius: '12px', padding: '18px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>
              {loading ? 'ENVIANDO...' : 'ENVIAR'}
            </button>
            <button onClick={() => submitOrder(true)} disabled={loading} style={{ flex: 1, background: isDark ? '#222' : '#eee', color: isDark ? '#fff' : '#111', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>ENVIAR E NOVO</button>
            <button onClick={() => navigate('/orders')} style={{ flex: 1, background: '#333', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>CANCELAR</button>
          </div>
          {error && <div style={{ color: '#fff', background: '#dc2626', padding: '10px', borderRadius: '8px', fontSize: '12px', textAlign: 'center', marginTop: '10px' }}>{error}</div>}
        </div>

      </div>
    </div>
  );
}