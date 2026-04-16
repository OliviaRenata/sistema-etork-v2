// src/pages/franchise/Orders.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, callFunction, storage } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../lib/utils';
import type { Order, OrderStatus } from '../../types';
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '../../types';

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
  tool: string[];
  notes: string;
};

const fuelOptions = ['Flex', 'Diesel', 'Álcool / Gasolina'];
const yearOptions = Array.from({ length: 30 }, (_, index) => `${new Date().getFullYear() - index}`);
const performanceOptions = [
  'DPF & EGR (OFF)',
  'DPF (OFF)',
  'EGR (OFF)',
  'Sistema SCR OFF',
  'Combo DPF, EGR, SCR OFF (Utilitários Geral)',
  'Sonda/O2 (OFF)',
  'MAF (OFF)',
  'Sistema Eolis Renault Master Módulo Bosch',
  'Potência (STG1)',
  'Potência (STG2)',
  'DPF & EGR (OFF) + Potência (STG1 ou STG2)',
  'Combo Agricultura EGR + Potência STG1',
  "Pop and Bang's",
  'VMAX/Limitador de Velocidade (OFF)',
  'Hard Cut (Veículos Diesel)',
  "DTC's (OFF) sobre o DTC P0420 (Solução Cat OFF)",
  'Remoção de Código de Falha por OBD Genérico (DTC)',
  'Start Stop',
  'TVA (OFF) - Borboleta de Admissão',
  'Bomba d\'Água (OFF)',
  'Heliçe Viscosa OFF (Somente Linha John Deere)',
  'Redução de Torque por Sistema SCR (Caminhão)',
  'Decode Módulo do Motor Mercedes (MR) ou Cabine (FR)',
  'Correção de Checksum',
  'Voltar para Parâmetros Originais de Fábrica',
  'Comparar Arquivos Originais/Verificação',
  'Pedidos Especiais (conforme campo de observação)',
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
  'Outra (especificar)',
];

export default function FranchiseOrders() {
  const navigate = useNavigate();
  const { franchisee, loading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // New order form state
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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);

  // Colors based on theme
  const colors = {
    bgPrimary: isDark ? '#0a0a0a' : '#f5f5f5',
    bgCard: isDark ? '#111' : '#ffffff',
    bgCardHover: isDark ? '#1a1a1a' : '#fafafa',
    borderCard: isDark ? '#1e1e1e' : '#e0e0e0',
    textPrimary: isDark ? '#fff' : '#1a1a1a',
    textSecondary: isDark ? '#888' : '#666',
    textMuted: isDark ? '#555' : '#999',
    statusAmber: isDark ? '#854d0e' : '#fef3c7',
    statusBlue: isDark ? '#1e3a8a' : '#dbeafe',
    statusPurple: isDark ? '#7c3aed' : '#e9d5ff',
    statusGreen: isDark ? '#14532d' : '#dcfce7',
    statusRed: isDark ? '#7f1d1d' : '#fee2e2',
    badgeFile: isDark ? '#1a1500' : '#fff8e0',
    badgeFileColor: isDark ? '#e6b800' : '#b8860b',
  };

  useEffect(() => {
    if (franchisee?.id) {
      loadOrders();
    }
  }, [franchisee?.id]);

  async function loadOrders() {
    if (!franchisee?.id) {
      setLoadingOrders(false);
      return;
    }

    setLoadingOrders(true);
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items:order_items(
            quantity,
            item:items(name, unit_price)
          ),
          order_files(id, file_name, file_path)
        `)
        .eq('franchisee_id', franchisee.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  }

  async function handleSubmitOrder(sendAnother = false) {
    if (!formData.plate.trim()) {
      setSubmitError('Informe a placa/frota.');
      return;
    }
    if (files.length === 0) {
      setSubmitError('Envie pelo menos um arquivo de mapa (ORI, MOD, BIN).');
      return;
    }

    setSubmitError('');
    setSubmitting(true);
    setSubmitSuccess('');

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
        notes: `Ferramenta: ${formData.tool.join(', ') || 'Não informada'} | Performance: ${formData.performance.join(', ') || 'Nenhuma'} | Obs: ${formData.notes.trim()}`,
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

      await loadOrders();

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
          tool: [],
          notes: '',
        });
        setSubmitSuccess('Pedido enviado com sucesso! Preencha outro pedido abaixo.');
      } else {
        setShowNewOrderForm(false);
        setSubmitSuccess('Pedido enviado com sucesso!');
        setTimeout(() => setSubmitSuccess(''), 3000);
      }
    } catch (err: unknown) {
      setSubmitError((err as Error).message || 'Erro ao enviar pedido.');
    } finally {
      setSubmitting(false);
    }
  }

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData(prev => ({ ...prev, [key]: value }));
  }

  function toggleSelectOrder(orderId: string) {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  }

  function toggleSelectAll() {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map(o => o.id)));
    }
  }

  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const getStatusText = (status: OrderStatus) => {
    return ORDER_STATUS_LABEL[status] || status;
  };

  const getStatusColor = (status: OrderStatus) => {
    const colorMap = {
      solicitado: colors.statusAmber,
      em_producao: colors.statusBlue,
      enviado: colors.statusPurple,
      concluido: colors.statusGreen,
      cancelado: colors.statusRed,
    };
    return colorMap[status] || colors.bgCard;
  };

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
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
      {/* Show error if franchisee not loaded */}
      {!franchisee && !loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: colors.statusRed }}>
          <h2>Erro de Acesso</h2>
          <p>Você não tem permissão para acessar esta página ou seu perfil de franqueado não foi encontrado.</p>
          <p>Entre em contato com o suporte se acreditar que isso é um erro.</p>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: colors.textSecondary }}>
          Carregando pedidos...
        </div>
      ) : (
        <>
          {/* Header with navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: colors.textPrimary }}>Meus Arquivos</h1>
              <p style={{ margin: '4px 0 0', color: colors.textSecondary, fontSize: 13 }}>
                Gerencie seus pedidos e envie novos arquivos
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => navigate('/support')}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: `1px solid ${colors.borderCard}`,
                  borderRadius: 8,
                  color: colors.textSecondary,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Suporte
              </button>
              <button
                onClick={() => setShowNewOrderForm(!showNewOrderForm)}
                style={{
                  padding: '10px 24px',
                  background: '#e6b800',
                  border: 'none',
                  borderRadius: 8,
                  color: '#000',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {showNewOrderForm ? 'Cancelar Novo Pedido' : '+ Enviar Novos Arquivos'}
              </button>
            </div>
          </div>

          {/* Success/Error Messages */}
          {submitSuccess && (
            <div style={{ marginBottom: 16, padding: '14px 16px', background: '#163a0f', color: '#d1fae5', borderRadius: 12 }}>
              {submitSuccess}
            </div>
          )}

          {submitError && (
            <div style={{ marginBottom: 16, padding: '14px 16px', background: '#7f1d1d', color: '#fecaca', borderRadius: 12 }}>
              {submitError}
            </div>
          )}

          {/* New Order Form */}
          {showNewOrderForm && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={sectionStyle}>
              <h2 style={{ marginTop: 0, marginBottom: 18, color: colors.textPrimary, fontSize: 16 }}>Informações do Veículo</h2>

              <label style={labelStyle}>PLACA / FROTA *</label>
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
              <h2 style={{ marginTop: 0, marginBottom: 18, color: colors.textPrimary, fontSize: 16 }}>Performance e Ferramentas</h2>

              <label style={labelStyle}>PERFORMANCE - SELECIONE OS SERVIÇOS</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 18, maxHeight: 300, overflowY: 'auto' }}>
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

              <label style={labelStyle}>FERRAMENTAS UTILIZADAS</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 18, maxHeight: 300, overflowY: 'auto' }}>
                {toolOptions.map(option => {
                  const active = formData.tool.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        const next = active
                          ? formData.tool.filter(item => item !== option)
                          : [...formData.tool, option];
                        updateField('tool', next);
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
            </div>
          </div>

          <div style={{ ...sectionStyle, marginTop: 20 }}>
            <h2 style={{ marginTop: 0, marginBottom: 18, color: colors.textPrimary, fontSize: 16 }}>Upload de Arquivos</h2>

            <label style={labelStyle}>ARQUIVOS DE MAPA (ORI, MOD, BIN) *</label>
            <div style={{ marginBottom: 18 }}>
              <input
                type="file"
                multiple
                accept=".bin,.ori,.mod"
                onChange={e => setFiles(Array.from(e.target.files || []))}
                style={{ ...inputStyle, padding: '14px 12px' }}
              />
              {files.length > 0 && (
                <div style={{ marginTop: 8, color: '#4ade80', fontSize: 12 }}>
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
                <div style={{ marginTop: 8, color: '#4ade80', fontSize: 12 }}>
                  {extraFiles.length} arquivo(s) selecionado(s)
                </div>
              )}
            </div>

            <label style={labelStyle}>OBSERVAÇÕES</label>
            <textarea
              value={formData.notes}
              onChange={e => updateField('notes', e.target.value)}
              rows={4}
              placeholder="Insira observações adicionais..."
              style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 20 }}>
            <button
              type="button"
              onClick={() => handleSubmitOrder(false)}
              disabled={submitting}
              style={{
                flex: 1,
                minWidth: 180,
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '14px 18px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? 'ENVIANDO...' : 'ENVIAR PEDIDO'}
            </button>

            <button
              type="button"
              onClick={() => handleSubmitOrder(true)}
              disabled={submitting}
              style={{
                flex: 1,
                minWidth: 180,
                background: '#1f2937',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '14px 18px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? 'ENVIANDO...' : 'ENVIAR E FAZER OUTRO'}
            </button>
          </div>
        </div>
      )}

      {/* Orders Table - Meus Arquivos */}
      <div style={{ background: colors.bgCard, border: `1px solid ${colors.borderCard}`, borderRadius: 12, overflow: 'hidden' }}>
        {/* Table Header with sorting and selection */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.borderCard}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedOrders.size === orders.length && orders.length > 0}
                onChange={toggleSelectAll}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <span style={{ fontSize: 13, color: colors.textSecondary }}>Selecionar todos</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: colors.textSecondary }}>Ordenar por:</span>
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: colors.textPrimary,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                Processo
                <span>{sortOrder === 'desc' ? '↓' : '↑'}</span>
              </button>
            </div>
          </div>
          {selectedOrders.size > 0 && (
            <button
              style={{
                padding: '6px 12px',
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Baixar Selecionados ({selectedOrders.size})
            </button>
          )}
        </div>

        {/* Table Body */}
        {loadingOrders ? (
          <div style={{ padding: 60, textAlign: 'center', color: colors.textSecondary }}>
            Carregando pedidos...
          </div>
        ) : sortedOrders.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: colors.textSecondary }}>
            Nenhum pedido encontrado. Clique em "Enviar Novos Arquivos" para começar.
          </div>
        ) : (
          sortedOrders.map((order) => (
            <div
              key={order.id}
              style={{
                borderBottom: `1px solid ${colors.borderCard}`,
                transition: 'all 0.2s',
              }}
            >
              {/* Order Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 80px 1fr 120px 100px 80px',
                  alignItems: 'center',
                  padding: '14px 20px',
                  cursor: 'pointer',
                  background: expandedOrderId === order.id ? colors.bgCardHover : 'transparent',
                }}
                onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
              >
                <div onClick={(e) => { e.stopPropagation(); toggleSelectOrder(order.id); }}>
                  <input
                    type="checkbox"
                    checked={selectedOrders.has(order.id)}
                    onChange={() => {}}
                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                  />
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: colors.textPrimary, fontSize: 14 }}>
                    {order.id.slice(0, 6).toUpperCase()}
                  </span>
                </div>
                <div>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    background: getStatusColor(order.status),
                    color: isDark ? '#fff' : '#1a1a1a',
                  }}>
                    {getStatusText(order.status)}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: colors.textSecondary }}>
                  {new Date(order.created_at).toLocaleString('pt-BR')}
                </div>
                <div>
                  {order.order_files && order.order_files.length > 0 && (
                    <span style={{
                      fontSize: 11,
                      color: colors.badgeFileColor,
                      background: colors.badgeFile,
                      padding: '4px 8px',
                      borderRadius: 4,
                    }}>
                      📎 {order.order_files.length} arquivo(s)
                    </span>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); /* Open ticket */ }}
                    style={{
                      padding: '6px 12px',
                      background: 'transparent',
                      border: `1px solid ${colors.borderCard}`,
                      borderRadius: 6,
                      fontSize: 11,
                      color: colors.textSecondary,
                      cursor: 'pointer',
                    }}
                  >
                    Ver Ticket
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedOrderId === order.id && (
                <div style={{ padding: '16px 20px 20px 100px', background: colors.bgCardHover, borderTop: `1px solid ${colors.borderCard}` }}>
                  {/* Vehicle Info */}
                  {order.vehicle_plate && (
                    <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                      {order.vehicle_plate && (
                        <div>
                          <div style={{ fontSize: 11, color: colors.textMuted }}>PLACA</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>{order.vehicle_plate}</div>
                        </div>
                      )}
                      {order.notes && (
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, color: colors.textMuted }}>OBSERVAÇÕES</div>
                          <div style={{ fontSize: 12, color: colors.textSecondary }}>{order.notes}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Order Items */}
                  {order.order_items && order.order_items.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 8 }}>SERVIÇOS SOLICITADOS</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {order.order_items.map((item, idx) => (
                          <span key={idx} style={{
                            padding: '4px 10px',
                            background: isDark ? '#1a1a1a' : '#f0f0f0',
                            borderRadius: 6,
                            fontSize: 12,
                            color: colors.textPrimary,
                          }}>
                            {item.item?.name || 'Item'} × {item.quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Files */}
                  {order.order_files && order.order_files.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 8 }}>ARQUIVOS ANEXADOS</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {order.order_files.map((file) => (
                          <a
                            key={file.id}
                            href={file.file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '6px 12px',
                              background: isDark ? '#1a1a1a' : '#f5f5f5',
                              borderRadius: 6,
                              fontSize: 12,
                              color: '#e6b800',
                              textDecoration: 'none',
                            }}
                          >
                            📄 {file.file_name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {/* Pagination */}
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${colors.borderCard}`, display: 'flex', justifyContent: 'center', gap: 16, alignItems: 'center' }}>
          <button
            disabled
            style={{
              padding: '6px 12px',
              background: 'transparent',
              border: `1px solid ${colors.borderCard}`,
              borderRadius: 6,
              color: colors.textMuted,
              cursor: 'not-allowed',
            }}
          >
            Anterior
          </button>
          <span style={{ fontSize: 13, color: colors.textSecondary }}>
            1 / {Math.ceil(orders.length / 10) || 1}
          </span>
          <button
            disabled
            style={{
              padding: '6px 12px',
              background: 'transparent',
              border: `1px solid ${colors.borderCard}`,
              borderRadius: 6,
              color: colors.textMuted,
              cursor: 'not-allowed',
            }}
          >
            Próximo
          </button>
        </div>
      </div>
        </>
      )}

    </div>
  );
}