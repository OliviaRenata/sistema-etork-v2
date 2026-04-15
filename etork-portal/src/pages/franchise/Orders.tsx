// src/pages/franchise/NewOrder.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, callFunction, storage } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Item, CartItem } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

export default function FranchiseNewOrder() {
  const { franchisee } = useAuth();
  const navigate = useNavigate();
  const { theme: currentTheme } = useTheme();
  const isDark = currentTheme === 'dark';

  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState<Record<string, string> | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [plateLoading, setPlateLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');

  useEffect(() => {
    supabase.from('items').select('*').eq('active', true).order('category', { ascending: true })
      .then(({ data }) => setItems(data || []));
  }, []);

  const categories = ['Todos', ...Array.from(new Set(items.map(i => i.category)))];

  const filteredItems = items.filter(item =>
    (activeCategory === 'Todos' || item.category === activeCategory) &&
    (item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase()))
  );

  function addToCart(item: Item) {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) return prev.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { item, quantity: 1 }];
    });
  }

  function updateQty(itemId: string, qty: number) {
    if (qty <= 0) setCart(prev => prev.filter(c => c.item.id !== itemId));
    else setCart(prev => prev.map(c => c.item.id === itemId ? { ...c, quantity: qty } : c));
  }

  const cartTotal = cart.reduce((sum, c) => sum + c.item.unit_price * c.quantity, 0);
  const requiresFile = cart.some(c => c.item.requires_file);

  async function lookupPlate() {
    if (!vehiclePlate || vehiclePlate.length < 7) return;
    setPlateLoading(true);
    try {
      const plate = vehiclePlate.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      await fetch(`https://brasilapi.com.br/api/cep/v1/${plate}`).catch(() => null);
      setVehicleInfo({ plate, status: 'Consulta realizada', queried_at: new Date().toLocaleString('pt-BR') });
    } catch {
      setVehicleInfo(null);
    } finally {
      setPlateLoading(false);
    }
  }

  async function handleSubmit() {
    if (cart.length === 0) { setError('Adicione pelo menos um item ao pedido.'); return; }
    if (requiresFile && files.length === 0) { setError('Um ou mais itens selecionados exigem upload de arquivo.'); return; }

    setError('');
    setLoading(true);
    try {
      const result = await callFunction<{ order: { id: string } }>('create-order', {
        notes,
        vehicle_plate: vehiclePlate || undefined,
        items: cart.map(c => ({ item_id: c.item.id, quantity: c.quantity })),
      });

      for (const file of files) {
        const path = await storage.uploadOrderFile(result.order.id, file);
        await supabase.from('order_files').insert({
          order_id: result.order.id,
          file_name: file.name,
          file_path: path,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: (await supabase.auth.getUser()).data.user!.id,
        });
      }

      navigate('/orders');
    } catch (err: unknown) {
      setError((err as Error).message || 'Erro ao criar pedido.');
    } finally {
      setLoading(false);
    }
  }

  // Cores baseadas no tema
  const colors = {
    bgCard: isDark ? '#111' : '#ffffff',
    bgCardSelected: isDark ? '#1a1500' : '#fff8e0',
    borderCard: isDark ? '#1e1e1e' : '#e0e0e0',
    borderCardSelected: isDark ? '#3a3000' : '#e6b800',
    textPrimary: isDark ? '#fff' : '#1a1a1a',
    textSecondary: isDark ? '#666' : '#888',
    textMuted: isDark ? '#555' : '#999',
    bgInput: isDark ? '#0d0d0d' : '#f5f5f5',
    borderInput: isDark ? '#2a2a2a' : '#ddd',
    bgSection: isDark ? '#111' : '#ffffff',
    borderSection: isDark ? '#1e1e1e' : '#e0e0e0',
    bgVehicleInfo: isDark ? '#0d1a0d' : '#e8f5e9',
    vehicleInfoColor: isDark ? '#4ade80' : '#2e7d32',
    badgeFile: isDark ? '#1a1500' : '#fff8e0',
    badgeFileColor: isDark ? '#e6b800' : '#b8860b',
    bgError: isDark ? '#1a0a0a' : '#ffebee',
    errorColor: isDark ? '#e74c3c' : '#c62828',
    bgSuccess: isDark ? '#0a1a0a' : '#e8f5e9',
    successColor: isDark ? '#4ade80' : '#2e7d32',
    btnSecondaryBg: isDark ? 'transparent' : '#f5f5f5',
    btnSecondaryBorder: isDark ? '#333' : '#ddd',
    btnSecondaryColor: isDark ? '#ccc' : '#666',
    qtyBtnBg: isDark ? '#1a1a1a' : '#e0e0e0',
    qtyBtnBorder: isDark ? '#333' : '#ccc',
    qtyBtnColor: isDark ? '#fff' : '#1a1a1a',
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Novo Pedido</h1>
        <p style={{ color: colors.textSecondary, fontSize: 13, margin: 0 }}>Selecione os serviços desejados</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        {/* Left: catalog */}
        <div>
          {/* Vehicle plate */}
          <div style={{ background: colors.bgSection, border: `1px solid ${colors.borderSection}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: colors.textSecondary }}>PLACA DO VEÍCULO (opcional)</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <input
                value={vehiclePlate}
                onChange={e => setVehiclePlate(e.target.value.toUpperCase())}
                placeholder="ex: ABC1D23"
                maxLength={8}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 8, fontSize: 13, outline: 'none',
                  background: colors.bgInput, border: `1px solid ${colors.borderInput}`, color: colors.textPrimary
                }}
                onFocus={e => e.target.style.borderColor = '#e6b800'}
                onBlur={e => e.target.style.borderColor = colors.borderInput}
              />
              <button 
                onClick={lookupPlate} 
                disabled={plateLoading || vehiclePlate.length < 7}
                style={{
                  padding: '10px 14px', background: colors.btnSecondaryBg,
                  border: `1px solid ${colors.btnSecondaryBorder}`, borderRadius: 8,
                  color: colors.btnSecondaryColor, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  ...(plateLoading || vehiclePlate.length < 7 ? { opacity: 0.5 } : {})
                }}>
                {plateLoading ? '...' : 'Consultar'}
              </button>
            </div>
            {vehicleInfo && (
              <div style={{ marginTop: 8, padding: '8px 12px', background: colors.bgVehicleInfo, borderRadius: 6, fontSize: 12, color: colors.vehicleInfoColor }}>
                ✓ Placa {vehicleInfo.plate} consultada em {vehicleInfo.queried_at}
              </div>
            )}
          </div>

          {/* Search + categories */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar serviço..."
              style={{
                flex: 1, minWidth: 160, padding: '10px 12px', borderRadius: 8, fontSize: 13, outline: 'none',
                background: colors.bgInput, border: `1px solid ${colors.borderInput}`, color: colors.textPrimary
              }}
              onFocus={e => e.target.style.borderColor = '#e6b800'}
              onBlur={e => e.target.style.borderColor = colors.borderInput}
            />
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '8px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  border: '1px solid',
                  background: activeCategory === cat ? '#e6b800' : 'transparent',
                  color: activeCategory === cat ? '#000' : colors.textSecondary,
                  borderColor: activeCategory === cat ? '#e6b800' : colors.borderInput,
                  cursor: 'pointer', letterSpacing: 0.5,
                }}>
                {cat}
              </button>
            ))}
          </div>

          {/* Items grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {filteredItems.map(item => {
              const inCart = cart.find(c => c.item.id === item.id);
              return (
                <div key={item.id} style={{
                  background: inCart ? colors.bgCardSelected : colors.bgCard,
                  border: `1px solid ${inCart ? colors.borderCardSelected : colors.borderCard}`,
                  borderRadius: 10, padding: 14,
                  cursor: 'pointer', transition: 'all 0.15s',
                }} onClick={() => addToCart(item)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: colors.textMuted, letterSpacing: 1 }}>{item.sku}</span>
                    {item.requires_file && (
                      <span style={{ fontSize: 9, color: colors.badgeFileColor, background: colors.badgeFile, padding: '2px 6px', borderRadius: 4, border: `1px solid ${colors.borderCardSelected}` }}>
                        FILE
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary, marginBottom: 4, lineHeight: 1.3 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 10, lineHeight: 1.4 }}>{item.description}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#e6b800' }}>{formatCurrency(item.unit_price)}</span>
                    <span style={{ fontSize: 18, color: inCart ? '#4ade80' : colors.textMuted }}>{inCart ? '✓' : '+'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: cart */}
        <div style={{ 
          background: colors.bgSection, 
          border: `1px solid ${colors.borderSection}`, 
          borderRadius: 10, 
          padding: 16, 
          position: 'sticky', 
          top: 80 
        }}>
          <h2 style={{ color: colors.textPrimary, fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Resumo do Pedido</h2>

          {cart.length === 0 ? (
            <p style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
              Selecione serviços ao lado
            </p>
          ) : (
            <>
              {cart.map(c => (
                <div key={c.item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: colors.textPrimary, fontWeight: 500 }}>{c.item.name}</div>
                    <div style={{ fontSize: 11, color: colors.textSecondary }}>{formatCurrency(c.item.unit_price)} × {c.quantity}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button 
                      onClick={() => updateQty(c.item.id, c.quantity - 1)} 
                      style={{
                        width: 22, height: 22, borderRadius: 4, cursor: 'pointer', fontSize: 14,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                        background: colors.qtyBtnBg, border: `1px solid ${colors.qtyBtnBorder}`, color: colors.qtyBtnColor
                      }}>
                      -
                    </button>
                    <span style={{ color: colors.textPrimary, fontSize: 12, minWidth: 16, textAlign: 'center' }}>{c.quantity}</span>
                    <button 
                      onClick={() => updateQty(c.item.id, c.quantity + 1)} 
                      style={{
                        width: 22, height: 22, borderRadius: 4, cursor: 'pointer', fontSize: 14,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                        background: colors.qtyBtnBg, border: `1px solid ${colors.qtyBtnBorder}`, color: colors.qtyBtnColor
                      }}>
                      +
                    </button>
                  </div>
                  <span style={{ fontSize: 12, color: '#e6b800', fontWeight: 600, minWidth: 60, textAlign: 'right' }}>
                    {formatCurrency(c.item.unit_price * c.quantity)}
                  </span>
                </div>
              ))}

              <div style={{ borderTop: `1px solid ${colors.borderSection}`, paddingTop: 12, marginTop: 8, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: colors.textSecondary, fontSize: 13 }}>Total</span>
                  <span style={{ color: '#e6b800', fontSize: 18, fontWeight: 700 }}>{formatCurrency(cartTotal)}</span>
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Observações (opcional)..."
            rows={3}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 13, outline: 'none',
              resize: 'vertical', marginBottom: 12, boxSizing: 'border-box',
              background: colors.bgInput, border: `1px solid ${colors.borderInput}`, color: colors.textPrimary
            }}
            onFocus={e => e.target.style.borderColor = '#e6b800'}
            onBlur={e => e.target.style.borderColor = colors.borderInput}
          />

          {/* File upload */}
          {requiresFile && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: colors.textSecondary }}>
                ARQUIVOS DO REMAP <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <input type="file" multiple
                onChange={e => setFiles(Array.from(e.target.files || []))}
                style={{ marginTop: 6, color: colors.textSecondary, fontSize: 12 }}
                accept=".bin,.ori,.mod,.zip,.rar,.pdf"
              />
              {files.length > 0 && (
                <div style={{ marginTop: 6, fontSize: 11, color: colors.successColor }}>
                  {files.length} arquivo(s) selecionado(s)
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{ padding: '8px 12px', background: colors.bgError, borderRadius: 6, color: colors.errorColor, fontSize: 12, marginBottom: 12 }}>
              {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading || cart.length === 0}
            style={{
              width: '100%', padding: '12px',
              background: cart.length > 0 ? '#e6b800' : colors.bgInput,
              color: cart.length > 0 ? '#000' : colors.textMuted,
              border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700,
              cursor: cart.length > 0 ? 'pointer' : 'not-allowed', letterSpacing: 0.5,
            }}>
            {loading ? 'ENVIANDO...' : 'ENVIAR PEDIDO'}
          </button>
        </div>
      </div>
    </div>
  );
}