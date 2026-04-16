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
  tool: string[]; // Alterado para array para múltipla seleção
  notes: string;
};

const fuelOptions = ['Flex', 'Diesel', 'Álcool / Gasolina'];
const yearOptions = Array.from({ length: 30 }, (_, index) => `${new Date().getFullYear() - index}`);

const performanceOptions = [
  'DPF & EGR (OFF)',
  'DPF (OFF)',
  'EGR (OFF)',
  'Sistema SCR OFF',
  'Combo DPF, EGR, SCR OFF',
  'Sonda/O2 (OFF)',
  'MAF (OFF)',
  'Eolis Renault Master',
  'Potência (STG1)',
  'Potência (STG2)',
  'DPF/EGR + Potência',
  'Agri EGR + STG1',
  "Pop and Bang's",
  'VMAX (OFF)',
  'Hard Cut (Diesel)',
  'Solução Cat (P0420)',
  'DTC OFF (OBD)',
  'Start Stop',
  'TVA (OFF)',
  'Bomba d\'Água (OFF)',
  'Heliçe Viscosa (JD)',
  'Redução Torque SCR',
  'Decode MR/FR MB',
  'Checksum',
  'Original de Fábrica',
  'Comparar/Verificar',
  'Pedidos Especiais',
];

const toolOptions = [
  'KTAG ORIGINAL',
  'KESS V2 ORIGINAL',
  'KESS3 ORIGINAL',
  'NEW GENIUS',
  'NEW TRANSDATA',
  'KZ PROG',
  'KESS PIRATA',
  'KTAG PIRATA',
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
    tool: [],
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

  const toggleSelection = (list: string[], item: string) => 
    list.includes(item) ? list.filter(i => i !== item) : [...list, item];

  async function submitOrder(sendAnother = false) {
    if (!formData.plate.trim()) {
      setError('Informe a placa/frota.');
      return;
    }
    if (files.length === 0) {
      setError('Envie pelo menos um arquivo de mapa.');
      return;
    }

    setError('');
    setLoading(true);

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
        notes: `Ferramentas: ${formData.tool.join(', ') || 'Não informada'} | Performance: ${formData.performance.join(', ') || 'Nenhuma'} | Obs: ${formData.notes.trim()}`,
      });

      const allFiles = [...files, ...extraFiles];
      for (const file of allFiles) {
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
          plate: '', chassi: '', model: '', year: '', engine: '',
          cv: '', fuel: fuelOptions[0], dtc: '', performance: [],
          tool: [], notes: '',
        });
        setSuccessMessage('Pedido enviado com sucesso!');
      } else {
        navigate('/orders');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar pedido.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    background: isDark ? '#111' : '#fff',
    border: `1px solid ${isDark ? '#333' : '#dcdcdc'}`,
    color: isDark ? '#eee' : '#111',
    fontSize: 13,
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: 6,
    fontSize: 11,
    fontWeight: 700,
    color: isDark ? '#888' : '#555',
    textTransform: 'uppercase',
  };

  const badgeButtonStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid',
    borderColor: active ? '#dc2626' : isDark ? '#2d2d2d' : '#e5e7eb',
    background: active ? '#dc2626' : isDark ? '#1a1a1a' : '#fff',
    color: active ? '#fff' : isDark ? '#aaa' : '#444',
    cursor: 'pointer',
    fontSize: 11,
    textAlign: 'center',
    transition: 'all 0.2s',
  });

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, color: isDark ? '#fff' : '#111' }}>Novo Arquivo</h1>
        <button onClick={() => navigate('/orders')} style={{ background: '#c53030', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', fontWeight: 600, cursor: 'pointer' }}>
          Voltar
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20, alignItems: 'start' }}>
        
        {/* COLUNA ESQUERDA: VEÍCULO + UPLOAD */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <section style={{ background: isDark ? '#121212' : '#fff', padding: 20, borderRadius: 12, border: `1px solid ${isDark ? '#222' : '#e5e5e5'}` }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16 }}>Dados do Veículo</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Placa / Frota</label>
                <input value={formData.plate} onChange={e => updateField('plate', e.target.value.toUpperCase())} placeholder="Ex: ABC1D23" style={inputStyle} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Modelo / Marca</label>
                <input value={formData.model} onChange={e => updateField('model', e.target.value)} placeholder="Ex: Jeep Compass" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Ano</label>
                <select value={formData.year} onChange={e => updateField('year', e.target.value)} style={inputStyle}>
                  <option value="">Selecione</option>
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Motor</label>
                <input value={formData.engine} onChange={e => updateField('engine', e.target.value)} placeholder="2.0 Turbo" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>CV</label>
                <input value={formData.cv} onChange={e => updateField('cv', e.target.value)} placeholder="170" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Combustível</label>
                <select value={formData.fuel} onChange={e => updateField('fuel', e.target.value)} style={inputStyle}>
                  {fuelOptions.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
          </section>

          <section style={{ background: isDark ? '#121212' : '#fff', padding: 20, borderRadius: 12, border: `1px solid ${isDark ? '#222' : '#e5e5e5'}` }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16 }}>Arquivos e Notas</h3>
            <label style={labelStyle}>Arquivo de Mapa (ORI, BIN)</label>
            <input type="file" multiple accept=".bin,.ori,.mod" onChange={e => setFiles(Array.from(e.target.files || []))} style={{ ...inputStyle, marginBottom: 12 }} />
            
            <label style={labelStyle}>DTC / Avarias / Notas</label>
            <textarea value={formData.notes} onChange={e => updateField('notes', e.target.value)} rows={3} placeholder="Instruções adicionais..." style={{ ...inputStyle, resize: 'none' }} />
          </section>
        </div>

        {/* COLUNA DIREITA: SELEÇÕES MÚLTIPLAS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <section style={{ background: isDark ? '#121212' : '#fff', padding: 20, borderRadius: 12, border: `1px solid ${isDark ? '#222' : '#e5e5e5'}` }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16 }}>Performance (Selecione)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {performanceOptions.map(opt => (
                <button key={opt} type="button" onClick={() => updateField('performance', toggleSelection(formData.performance, opt))} style={badgeButtonStyle(formData.performance.includes(opt))}>
                  {opt}
                </button>
              ))}
            </div>
          </section>

          <section style={{ background: isDark ? '#121212' : '#fff', padding: 20, borderRadius: 12, border: `1px solid ${isDark ? '#222' : '#e5e5e5'}` }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16 }}>Ferramentas Utilizadas</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {toolOptions.map(opt => (
                <button key={opt} type="button" onClick={() => updateField('tool', toggleSelection(formData.tool, opt))} style={badgeButtonStyle(formData.tool.includes(opt))}>
                  {opt}
                </button>
              ))}
            </div>
          </section>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => submitOrder(false)} disabled={loading} style={{ flex: 2, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 10, padding: '16px', fontWeight: 700, cursor: 'pointer' }}>
              {loading ? 'ENVIANDO...' : 'FINALIZAR PEDIDO'}
            </button>
            <button onClick={() => submitOrder(true)} disabled={loading} style={{ flex: 1, background: isDark ? '#222' : '#eee', color: isDark ? '#fff' : '#111', border: 'none', borderRadius: 10, padding: '16px', fontWeight: 600, cursor: 'pointer' }}>
              ENVIAR +1
            </button>
          </div>
          {error && <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center', margin: 0 }}>{error}</p>}
        </div>
      </div>
    </div>
  );
}