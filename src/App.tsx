import { useEffect, useMemo, useState } from 'react';
import logoEtork from './assets/logoetork.png';
import logoEtorkBrasil from './assets/logoetorkbrasil.png';
import { isSupabaseConfigured, supabase } from './lib/supabase';

type Screen =
  | 'intro-brand'
  | 'intro-system'
  | 'auth-login'
  | 'auth-register'
  | 'auth-forgot'
  | 'auth-reset'
  | 'menu-search'
  | 'menu-clients'
  | 'menu-financial'
  | 'menu-products'
  | 'menu-reports'
  | 'dashboard'
  | 'new-quote'
  | 'new-appointment'
  | 'new-sale'
  | 'print-receipt';

type ServiceItem = {
  description: string;
  quantity: number;
  price: number;
};

type SavedQuote = {
  vehicle: string;
  items: ServiceItem[];
  discount: number;
  timeDays: number;
  note: string;
};

type SavedAppointment = {
  date: string;
  customer: string;
  phone: string;
  plate: string;
  vehicleDetails: string;
  items: ServiceItem[];
  discount: number;
  note: string;
};

type ReceiptRow = {
  id: number;
  date: string;
  customer: string;
  car: string;
  plate: string;
  total: number;
};

type ClientRow = {
  id: number;
  name: string;
  phone: string;
  plate: string;
};

type FinancialEntry = {
  id: number;
  date: string;
  description: string;
  amount: number;
};

type CatalogRow = {
  id: number | null;
  description: string;
  price: number;
  quantity: number;
};

const dashboardServices = [
  { title: 'AMAROK V6', plate: 'NSA-6J85', status: 'EM ANDAMENTO', tone: 'warning' },
  { title: 'HILUX SRX', plate: 'SDR-F435', status: 'ATRASADO', tone: 'danger' },
  { title: 'S10 LTZ', plate: 'KJD-3D45', status: 'FINALIZADO', tone: 'success' },
  { title: 'UP TSI', plate: 'MNS-5D43', status: 'EM ABERTO', tone: 'neutral' },
  { title: 'GOLF GTI', plate: 'SXC-9G56', status: 'AVISAR CLIENTE', tone: 'info' },
];

const quoteItems: ServiceItem[] = [
  { description: "REMAP STAGE 1 + LIMITADOR OFF + CODING'S", quantity: 1, price: 1800 },
  { description: 'DIFUSOR INOX 3" POLEGADAS', quantity: 1, price: 1500 },
];

const appointmentItems: ServiceItem[] = [
  { description: 'REMAP STAGE 1', quantity: 1, price: 1800 },
  { description: 'DIFUSOR INOX 2,5" POLEGADAS', quantity: 1, price: 1400 },
];

const saleItems: ServiceItem[] = [
  { description: 'DOWNPIPE + INTERMEDIARIO AMAROK V6', quantity: 1, price: 2200 },
  { description: 'ESCAPE FINAL 4" POLEGADAS', quantity: 1, price: 1800 },
  { description: 'REMAP STG2 DPF/EGR', quantity: 1, price: 2000 },
  { description: 'ADD HARDCUT', quantity: 1, price: 400 },
];

const receiptRows: ReceiptRow[] = [
  { id: 1, date: '25/04/2026', customer: 'JOAO HENRIQUE DE ALMEIDA', car: 'AMAROK V6', plate: 'QAN-2H95', total: 4300 },
  { id: 2, date: '25/04/2026', customer: 'CLEBER ANTUNES RICARDO FREITAS', car: 'RAM 3500 NIGHT', plate: 'QAU-1V55', total: 12100 },
  { id: 3, date: '25/04/2026', customer: 'LEANDRO RODRIGUES QUEIROZ', car: 'S10 LTZ', plate: 'QAN-2H95', total: 4300 },
  { id: 4, date: '25/04/2026', customer: 'CLEBER ANTUNES RICARDO FREITAS', car: 'RAM 3500 NIGHT', plate: 'QAU-1V55', total: 12100 },
  { id: 5, date: '24/04/2026', customer: 'JOAO HENRIQUE DE ALMEIDA', car: 'AMAROK V6', plate: 'QAN-2H95', total: 4300 },
  { id: 6, date: '24/04/2026', customer: 'CLEBER ANTUNES RICARDO FREITAS', car: 'RAM 3500 NIGHT', plate: 'QAU-1V55', total: 12100 },
  { id: 7, date: '24/04/2026', customer: 'JOAO HENRIQUE DE ALMEIDA', car: 'AMAROK V6', plate: 'QAN-2H95', total: 4300 },
  { id: 8, date: '23/04/2026', customer: 'CLEBER ANTUNES RICARDO FREITAS', car: 'RAM 3500 NIGHT', plate: 'QAU-1V55', total: 12100 },
];

const defaultServiceCatalog: CatalogRow[] = [
  { id: null, description: 'REMAP STAGE 1', price: 1800, quantity: 1 },
  { id: null, description: 'REMAP STG2 DPF/EGR', price: 2000, quantity: 1 },
  { id: null, description: 'DIFUSOR INOX 2,5" POLEGADAS', price: 1400, quantity: 1 },
  { id: null, description: 'DIFUSOR INOX 3" POLEGADAS', price: 1500, quantity: 1 },
  { id: null, description: 'ESCAPE FINAL 4" POLEGADAS', price: 1800, quantity: 1 },
  { id: null, description: 'ADD HARDCUT', price: 400, quantity: 1 },
  { id: null, description: 'DOWNPIPE + INTERMEDIARIO AMAROK V6', price: 2200, quantity: 1 },
];

const defaultClients: ClientRow[] = [
  { id: 1, name: 'JOAO HENRIQUE DE ALMEIDA', phone: '67 99871-1313', plate: 'QAN-2H92' },
  { id: 2, name: 'MILENNA DE OLIVEIRA FELICIANO', phone: '67 99260-0928', plate: 'QUA-9J17' },
  { id: 3, name: 'CLEBER ANTUNES RICARDO FREITAS', phone: '67 99111-2233', plate: 'QAU-1V55' },
];

const defaultFinancialEntries: FinancialEntry[] = [
  { id: 1, date: '2026-04-25', description: 'Venda oficina', amount: 4300 },
  { id: 2, date: '2026-04-25', description: 'Venda oficina', amount: 12100 },
  { id: 3, date: '2026-04-24', description: 'Venda oficina', amount: 4300 },
];

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseBrDate(value: string) {
  if (value.includes('-')) {
    const raw = new Date(value);
    return Number.isNaN(raw.getTime()) ? null : raw;
  }

  const [day, month, year] = value.split('/').map(Number);
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
}

function parseBrDateTime(value: string) {
  const [datePart, timePart] = value.split(' ');
  const [day, month, year] = datePart.split('/').map(Number);
  const [hour = 0, minute = 0] = (timePart || '').split(':').map(Number);

  if (!day || !month || !year) return null;

  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toBrDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('pt-BR');
}

function parseMoneyInput(raw: string) {
  const normalized = raw.trim().replace(/\s+/g, '').replace(/\./g, '').replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function cloneItems(items: ServiceItem[]) {
  return items.map((item) => ({ ...item }));
}

function AppHeader({ now, onLogout }: { now: Date; onLogout: () => void }) {
  const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
  const day = now.toLocaleDateString('pt-BR');

  return (
    <header className="et-header">
      <div className="et-brand-block">
        <img className="et-brand-logo" src={logoEtork} alt="Etork" />
        <div className="et-brand-user">usuario: ADMIN</div>
      </div>
      <div className="et-clock-wrap">
        <div className="et-clock">{time}</div>
        <div className="et-day">{day}</div>
      </div>
      <button className="et-logout" onClick={onLogout}>SAIR</button>
    </header>
  );
}

function ServiceRows({
  items,
  onChangeItem,
  onRemoveItem,
}: {
  items: ServiceItem[];
  onChangeItem: (index: number, patch: Partial<ServiceItem>) => void;
  onRemoveItem: (index: number) => void;
}) {
  return (
    <div className="et-table">
      {items.map((item, index) => (
        <div className="et-row" key={`${item.description}-${index}`}>
          <input
            className="et-cell et-service"
            value={item.description}
            onChange={(event) => onChangeItem(index, { description: event.target.value })}
          />
          <input
            className="et-cell et-qty"
            type="number"
            min={1}
            value={item.quantity}
            onChange={(event) =>
              onChangeItem(index, {
                quantity: Math.max(1, Number(event.target.value) || 1),
              })
            }
          />
          <input
            className="et-cell et-money"
            type="number"
            min={0}
            step="0.01"
            value={item.price}
            onChange={(event) =>
              onChangeItem(index, {
                price: Math.max(0, Number(event.target.value) || 0),
              })
            }
          />
          <button className="item-delete" onClick={() => onRemoveItem(index)}>X</button>
        </div>
      ))}
    </div>
  );
}

function ProductModal({
  isOpen,
  mode,
  data,
  onSave,
  onClose,
  onDataChange,
}: {
  isOpen: boolean;
  mode: 'add' | 'edit';
  data: { description: string; quantity: number; price: number };
  onSave: () => void;
  onClose: () => void;
  onDataChange: (patch: Partial<{ description: string; quantity: number; price: number }>) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{mode === 'add' ? 'NOVO PRODUTO' : 'EDITAR PRODUTO'}</h3>
        
        <div className="modal-body">
          <div className="form-field">
            <label>NOME DO PRODUTO</label>
            <input
              type="text"
              className="modal-input"
              value={data.description}
              onChange={(e) => onDataChange({ description: e.target.value })}
              placeholder="Digite o nome do produto"
            />
          </div>

          <div className="form-field">
            <label>QUANTIDADE</label>
            <input
              type="number"
              className="modal-input"
              value={data.quantity}
              min={1}
              onChange={(e) => onDataChange({ quantity: Math.max(1, Number(e.target.value) || 1) })}
            />
          </div>

          <div className="form-field">
            <label>VALOR UNITÁRIO</label>
            <input
              type="number"
              className="modal-input"
              value={data.price}
              min={0}
              step="0.01"
              onChange={(e) => onDataChange({ price: Math.max(0, Number(e.target.value) || 0) })}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>CANCELAR</button>
          <button className="btn-save" onClick={onSave}>{mode === 'add' ? 'ADICIONAR' : 'SALVAR'}</button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [screen, setScreen] = useState<Screen>('intro-brand');
  const [now, setNow] = useState(() => new Date());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');
  const [serviceCatalogData, setServiceCatalogData] = useState(defaultServiceCatalog);
  const [isSaving, setIsSaving] = useState(false);
  const [quoteData, setQuoteData] = useState({
    vehicle: 'RAM 1500 CLASSIC 2023',
    items: cloneItems(quoteItems),
    discount: 0,
    timeDays: 1,
    note: '',
  });
  const [appointmentData, setAppointmentData] = useState({
    date: '27/04/2026 08:00',
    customer: 'MILENNA DE OLIVEIRA FELICIANO',
    phone: '67 99260-0928',
    plate: 'QUA-9J17',
    vehicleDetails: 'HYUNDAI H20 1.0\nMANUAL\n2019/2019\nFLEX',
    laborRequired: true,
    items: cloneItems(appointmentItems),
    discount: 0,
    note: '',
  });
  const [saleData, setSaleData] = useState({
    customer: 'JOAO HENRIQUE DE ALMEIDA',
    customerType: 'CLIENTE FINAL',
    phone: '67 99871-1313',
    plate: 'QAN-2H92',
    vehicleDetails: 'VW AMAROK 3.0 V6\nAUTO\n2020/2021\nDIESEL',
    laborRequired: true,
    timeDays: 1,
    items: cloneItems(saleItems),
    discount: 0,
    note: '',
  });
  const [receipts, setReceipts] = useState<ReceiptRow[]>(receiptRows);
  const [savedQuote, setSavedQuote] = useState<SavedQuote | null>(null);
  const [savedAppointment, setSavedAppointment] = useState<SavedAppointment | null>(null);
  const [receiptFilters, setReceiptFilters] = useState({
    customer: '',
    plate: '',
    startDate: '',
    endDate: '',
  });
  const [nextReceiptId, setNextReceiptId] = useState(9);
  const [searchQuery, setSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [clients, setClients] = useState<ClientRow[]>(defaultClients);
  const [nextClientId, setNextClientId] = useState(defaultClients.length + 1);
  const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>(defaultFinancialEntries);
  const [nextFinancialId, setNextFinancialId] = useState(defaultFinancialEntries.length + 1);
  
  // Product Modal State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productModalMode, setProductModalMode] = useState<'add' | 'edit'>('add');
  const [productModalData, setProductModalData] = useState({ description: '', quantity: 1, price: 0 });
  const [productEditingIndex, setProductEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (screen === 'intro-brand') {
      const timer = window.setTimeout(() => setScreen('intro-system'), 1800);
      return () => window.clearTimeout(timer);
    }

    if (screen === 'intro-system') {
      const timer = window.setTimeout(() => setScreen('auth-login'), 1600);
      return () => window.clearTimeout(timer);
    }
  }, [screen]);

  useEffect(() => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path.includes('/reset-password') || hash.includes('type=recovery')) {
      setScreen('auth-reset');
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const sb = supabase;
    let active = true;

    sb.auth.getSession().then(({ data }) => {
      if (!active) return;

      const hasSession = Boolean(data.session);
      setIsAuthenticated(hasSession);
      if (hasSession) {
        setScreen((prev) =>
          prev === 'intro-brand' || prev === 'intro-system' || prev.startsWith('auth-') ? 'dashboard' : prev
        );
      }
    });

    const { data: authListener } = sb.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthMessage('Defina sua nova senha para concluir a recuperacao.');
        setScreen('auth-reset');
        return;
      }

      const hasSession = Boolean(session);
      setIsAuthenticated(hasSession);
      if (hasSession) {
        setScreen((prev) => (prev === 'auth-login' || prev === 'auth-register' || prev === 'auth-forgot' ? 'dashboard' : prev));
      } else {
        setScreen((prev) =>
          prev === 'dashboard' ||
          prev === 'menu-search' ||
          prev === 'menu-clients' ||
          prev === 'menu-financial' ||
          prev === 'menu-products' ||
          prev === 'menu-reports' ||
          prev === 'new-quote' ||
          prev === 'new-appointment' ||
          prev === 'new-sale' ||
          prev === 'print-receipt'
            ? 'auth-login'
            : prev
        );
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) return;

    if (
      screen === 'dashboard' ||
      screen === 'menu-search' ||
      screen === 'menu-clients' ||
      screen === 'menu-financial' ||
      screen === 'menu-products' ||
      screen === 'menu-reports' ||
      screen === 'new-quote' ||
      screen === 'new-appointment' ||
      screen === 'new-sale' ||
      screen === 'print-receipt'
    ) {
      setScreen('auth-login');
    }
  }, [isAuthenticated, screen]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const sb = supabase;
    let active = true;

    async function loadFromDatabase() {
      const [catalogResult, receiptResult, clientsResult, financialResult] = await Promise.all([
        sb
          .from('service_catalog_v2')
          .select('id, name, default_price, is_active')
          .eq('is_active', true)
          .order('name', { ascending: true }),
        sb
          .from('v_receipts_list_v2')
          .select('sale_date, customer_name, vehicle_desc, plate, total_amount')
          .limit(150),
        sb
          .from('clients_v2')
          .select('id, name, phone, plate')
          .order('id', { ascending: false }),
        sb
          .from('financial_entries_v2')
          .select('id, entry_date, description, amount')
          .order('id', { ascending: false }),
      ]);

      if (!active) return;

      if (!catalogResult.error && catalogResult.data && catalogResult.data.length > 0) {
        setServiceCatalogData(
          catalogResult.data.map((item) => ({
            id: item.id,
            description: item.name,
            price: Number(item.default_price) || 0,
            quantity: 1,
          }))
        );
      }

      if (!receiptResult.error && receiptResult.data && receiptResult.data.length > 0) {
        const mapped = receiptResult.data.map((row, index) => ({
          id: index + 1,
          date: toBrDate(row.sale_date),
          customer: row.customer_name,
          car: row.vehicle_desc,
          plate: row.plate,
          total: Number(row.total_amount) || 0,
        }));
        setReceipts(mapped);
        setNextReceiptId(mapped.length + 1);
      }

      if (!clientsResult.error && clientsResult.data && clientsResult.data.length > 0) {
        const mappedClients = clientsResult.data.map((item) => ({
          id: Number(item.id),
          name: item.name || '',
          phone: item.phone || '',
          plate: item.plate || '',
        }));
        setClients(mappedClients);
        setNextClientId(Math.max(...mappedClients.map((client) => client.id)) + 1);
      }

      if (!financialResult.error && financialResult.data && financialResult.data.length > 0) {
        const mappedEntries = financialResult.data.map((item) => ({
          id: Number(item.id),
          date: item.entry_date || new Date().toISOString().slice(0, 10),
          description: item.description || '',
          amount: Number(item.amount) || 0,
        }));
        setFinancialEntries(mappedEntries);
        setNextFinancialId(Math.max(...mappedEntries.map((entry) => entry.id)) + 1);
      }
    }

    loadFromDatabase();

    return () => {
      active = false;
    };
  }, []);

  const quoteSubtotal = useMemo(
    () => quoteData.items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [quoteData.items]
  );
  const quoteTotal = useMemo(() => Math.max(quoteSubtotal - quoteData.discount, 0), [quoteSubtotal, quoteData.discount]);

  const appointmentSubtotal = useMemo(
    () => appointmentData.items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [appointmentData.items]
  );
  const appointmentTotal = useMemo(
    () => Math.max(appointmentSubtotal - appointmentData.discount, 0),
    [appointmentSubtotal, appointmentData.discount]
  );

  const saleSubtotal = useMemo(
    () => saleData.items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [saleData.items]
  );
  const saleTotal = useMemo(() => Math.max(saleSubtotal - saleData.discount, 0), [saleSubtotal, saleData.discount]);

  const filteredReceipts = useMemo(() => {
    return receipts.filter((row) => {
      const customerMatch = row.customer.toLowerCase().includes(receiptFilters.customer.toLowerCase());
      const plateMatch = row.plate.toLowerCase().includes(receiptFilters.plate.toLowerCase());

      const rowDate = parseBrDate(row.date);
      if (!rowDate) return false;

      const start = receiptFilters.startDate ? new Date(receiptFilters.startDate) : null;
      const end = receiptFilters.endDate ? new Date(receiptFilters.endDate) : null;

      if (start && rowDate < start) return false;
      if (end) {
        end.setHours(23, 59, 59, 999);
        if (rowDate > end) return false;
      }

      return customerMatch && plateMatch;
    });
  }, [receipts, receiptFilters]);

  const filteredClients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(query) ||
        client.phone.toLowerCase().includes(query) ||
        client.plate.toLowerCase().includes(query)
    );
  }, [clients, searchQuery]);

  const filteredProducts = useMemo(() => {
    const query = productSearchQuery.trim().toLowerCase();
    if (!query) return serviceCatalogData;
    return serviceCatalogData.filter((item) => item.description.toLowerCase().includes(query));
  }, [serviceCatalogData, productSearchQuery]);

  const filteredFinancialEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return financialEntries;
    return financialEntries.filter(
      (entry) => entry.description.toLowerCase().includes(query) || entry.date.toLowerCase().includes(query)
    );
  }, [financialEntries, searchQuery]);

  const financialTotal = useMemo(
    () => financialEntries.reduce((acc, entry) => acc + entry.amount, 0),
    [financialEntries]
  );

  const nextAppointmentCard = savedAppointment
    ? {
        model: savedAppointment.vehicleDetails.split('\n')[0] || 'SEM VEICULO',
        plate: savedAppointment.plate,
        date: savedAppointment.date,
      }
    : { model: 'HB20 1.0', plate: 'QUA-9J17', date: '27/04/2026 08:00' };

  function askAndApplyDiscount(current: number, apply: (next: number) => void) {
    const answer = window.prompt('Informe o desconto em R$', String(current).replace('.', ','));
    if (answer === null) return;
    const parsed = parseMoneyInput(answer);
    if (parsed === null || parsed < 0) {
      window.alert('Valor invalido.');
      return;
    }
    apply(parsed);
  }

  function askAndApplyNote(current: string, apply: (next: string) => void) {
    const answer = window.prompt('Digite a observacao', current);
    if (answer === null) return;
    apply(answer.trim());
  }

  function pickServiceItem() {
    const menu = serviceCatalogData.map((item, idx) => `${idx + 1}. ${item.description} - ${formatMoney(item.price)}`).join('\n');
    const pick = window.prompt(`Selecione o servico pelo numero:\n\n${menu}`);
    if (!pick) return null;
    const index = Number(pick) - 1;
    if (!Number.isInteger(index) || !serviceCatalogData[index]) {
      window.alert('Servico invalido.');
      return null;
    }

    const qtyRaw = window.prompt('Quantidade', '1');
    const qty = Number(qtyRaw);
    if (!Number.isFinite(qty) || qty <= 0) {
      window.alert('Quantidade invalida.');
      return null;
    }

    return {
      description: serviceCatalogData[index].description,
      quantity: qty,
      price: serviceCatalogData[index].price,
    } as ServiceItem;
  }

  function addItemToQuote() {
    const selected = pickServiceItem();
    if (!selected) return;
    setQuoteData((prev) => ({ ...prev, items: [...prev.items, selected] }));
  }

  function addItemToAppointment() {
    const selected = pickServiceItem();
    if (!selected) return;
    setAppointmentData((prev) => ({ ...prev, items: [...prev.items, selected] }));
  }

  function addItemToSale() {
    const selected = pickServiceItem();
    if (!selected) return;
    setSaleData((prev) => ({ ...prev, items: [...prev.items, selected] }));
  }

  function updateItems(
    target: 'quote' | 'appointment' | 'sale',
    index: number,
    patch: Partial<ServiceItem>
  ) {
    if (target === 'quote') {
      setQuoteData((prev) => ({
        ...prev,
        items: prev.items.map((item, idx) => (idx === index ? { ...item, ...patch } : item)),
      }));
      return;
    }

    if (target === 'appointment') {
      setAppointmentData((prev) => ({
        ...prev,
        items: prev.items.map((item, idx) => (idx === index ? { ...item, ...patch } : item)),
      }));
      return;
    }

    setSaleData((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) => (idx === index ? { ...item, ...patch } : item)),
    }));
  }

  function removeItem(target: 'quote' | 'appointment' | 'sale', index: number) {
    if (target === 'quote') {
      setQuoteData((prev) => ({ ...prev, items: prev.items.filter((_, idx) => idx !== index) }));
      return;
    }

    if (target === 'appointment') {
      setAppointmentData((prev) => ({ ...prev, items: prev.items.filter((_, idx) => idx !== index) }));
      return;
    }

    setSaleData((prev) => ({ ...prev, items: prev.items.filter((_, idx) => idx !== index) }));
  }

  function handleMenuAction(name: 'Pesquisar' | 'Clientes' | 'Financeiro' | 'Produtos' | 'Relatorios') {
    if (name === 'Pesquisar') setScreen('menu-search');
    if (name === 'Clientes') setScreen('menu-clients');
    if (name === 'Financeiro') setScreen('menu-financial');
    if (name === 'Produtos') setScreen('menu-products');
    if (name === 'Relatorios') setScreen('menu-reports');
  }

  async function updateClient(id: number, patch: Partial<ClientRow>) {
    setClients((prev) => prev.map((client) => (client.id === id ? { ...client, ...patch } : client)));

    if (!isSupabaseConfigured || !supabase) return;

    const sb = supabase;
    await sb
      .from('clients_v2')
      .update({
        name: patch.name,
        phone: patch.phone,
        plate: patch.plate,
      })
      .eq('id', id);
  }

  async function addClient() {
    if (isSupabaseConfigured && supabase) {
      const sb = supabase;
      const payload = {
        name: 'NOVO CLIENTE',
        phone: '67 90000-0000',
        plate: 'AAA-0000',
      };

      const { data, error } = await sb.from('clients_v2').insert(payload).select('id, name, phone, plate').single();
      if (!error && data) {
        const dbClient: ClientRow = {
          id: Number(data.id),
          name: data.name || payload.name,
          phone: data.phone || payload.phone,
          plate: data.plate || payload.plate,
        };
        setClients((prev) => [dbClient, ...prev]);
        setNextClientId((prev) => Math.max(prev, dbClient.id + 1));
        return;
      }
    }

    const newClient: ClientRow = {
      id: nextClientId,
      name: 'NOVO CLIENTE',
      phone: '67 90000-0000',
      plate: 'AAA-0000',
    };
    setClients((prev) => [newClient, ...prev]);
    setNextClientId((prev) => prev + 1);
  }

  async function removeClient(id: number) {
    setClients((prev) => prev.filter((client) => client.id !== id));

    if (!isSupabaseConfigured || !supabase) return;

    const sb = supabase;
    await sb.from('clients_v2').delete().eq('id', id);
  }

  async function updateProduct(id: number | null, index: number, patch: Partial<{ description: string; price: number; quantity: number }>) {
    setServiceCatalogData((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));

    if (!isSupabaseConfigured || !supabase || id === null) return;

    const sb = supabase;
    await sb
      .from('service_catalog_v2')
      .update({
        name: patch.description,
        default_price: patch.price,
      })
      .eq('id', id);
  }

  async function addProduct() {
    setProductModalMode('add');
    setProductModalData({ description: '', quantity: 1, price: 0 });
    setProductEditingIndex(null);
    setProductModalOpen(true);
  }

  async function saveProduct() {
    if (!productModalData.description.trim()) {
      window.alert('Preencha o nome do produto');
      return;
    }

    if (productModalMode === 'add') {
      if (isSupabaseConfigured && supabase) {
        const sb = supabase;
        const payload = {
          name: productModalData.description,
          default_price: productModalData.price,
          is_active: true,
        };

        const { data, error } = await sb
          .from('service_catalog_v2')
          .insert(payload)
          .select('id, name, default_price')
          .single();

        if (!error && data) {
          setServiceCatalogData((prev) => [
            {
              id: Number(data.id),
              description: data.name,
              price: Number(data.default_price) || 0,
              quantity: productModalData.quantity,
            },
            ...prev,
          ]);
          setProductModalOpen(false);
          return;
        }
      }

      setServiceCatalogData((prev) => [
        {
          id: null,
          description: productModalData.description,
          price: productModalData.price,
          quantity: productModalData.quantity,
        },
        ...prev,
      ]);
    } else if (productEditingIndex !== null) {
      // Edit mode
      const product = serviceCatalogData[productEditingIndex];
      await updateProduct(product.id, productEditingIndex, {
        description: productModalData.description,
        price: productModalData.price,
        quantity: productModalData.quantity,
      });
    }

    setProductModalOpen(false);
  }

  function openEditProductModal(index: number) {
    const product = serviceCatalogData[index];
    setProductModalMode('edit');
    setProductModalData({
      description: product.description,
      quantity: product.quantity,
      price: product.price,
    });
    setProductEditingIndex(index);
    setProductModalOpen(true);
  }

  function closeProductModal() {
    setProductModalOpen(false);
    setProductEditingIndex(null);
  }

  async function removeProduct(id: number | null, index: number) {
    setServiceCatalogData((prev) => prev.filter((_, idx) => idx !== index));

    if (!isSupabaseConfigured || !supabase || id === null) return;

    const sb = supabase;
    await sb.from('service_catalog_v2').update({ is_active: false }).eq('id', id);
  }

  async function updateFinancialEntry(id: number, patch: Partial<FinancialEntry>) {
    setFinancialEntries((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));

    if (!isSupabaseConfigured || !supabase) return;

    const sb = supabase;
    await sb
      .from('financial_entries_v2')
      .update({
        entry_date: patch.date,
        description: patch.description,
        amount: patch.amount,
      })
      .eq('id', id);
  }

  async function addFinancialEntry() {
    if (isSupabaseConfigured && supabase) {
      const sb = supabase;
      const payload = {
        entry_date: new Date().toISOString().slice(0, 10),
        description: 'LANCAMENTO',
        amount: 0,
      };

      const { data, error } = await sb
        .from('financial_entries_v2')
        .insert(payload)
        .select('id, entry_date, description, amount')
        .single();

      if (!error && data) {
        const dbEntry: FinancialEntry = {
          id: Number(data.id),
          date: data.entry_date,
          description: data.description,
          amount: Number(data.amount) || 0,
        };
        setFinancialEntries((prev) => [dbEntry, ...prev]);
        setNextFinancialId((prev) => Math.max(prev, dbEntry.id + 1));
        return;
      }
    }

    const newEntry: FinancialEntry = {
      id: nextFinancialId,
      date: new Date().toISOString().slice(0, 10),
      description: 'LANCAMENTO',
      amount: 0,
    };
    setFinancialEntries((prev) => [newEntry, ...prev]);
    setNextFinancialId((prev) => prev + 1);
  }

  async function removeFinancialEntry(id: number) {
    setFinancialEntries((prev) => prev.filter((entry) => entry.id !== id));

    if (!isSupabaseConfigured || !supabase) return;

    const sb = supabase;
    await sb.from('financial_entries_v2').delete().eq('id', id);
  }

  function updateReceipt(id: number, patch: Partial<ReceiptRow>) {
    setReceipts((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function removeReceipt(id: number) {
    setReceipts((prev) => prev.filter((row) => row.id !== id));
  }

  function addReceipt() {
    const newRow: ReceiptRow = {
      id: nextReceiptId,
      date: now.toLocaleDateString('pt-BR'),
      customer: 'NOVO CLIENTE',
      car: 'NOVO VEICULO',
      plate: 'AAA-0000',
      total: 0,
    };
    setReceipts((prev) => [newRow, ...prev]);
    setNextReceiptId((prev) => prev + 1);
  }

  async function persistDocument(
    docType: 'orcamento' | 'agendamento' | 'venda',
    payload: {
      customerName: string;
      phone: string;
      plate: string;
      vehicleSnapshot: string;
      laborRequired: boolean;
      serviceTimeDays: number;
      discount: number;
      note: string;
      scheduledFor?: string;
    },
    items: ServiceItem[]
  ) {
    if (!isSupabaseConfigured || !supabase) return { ok: false as const, error: 'Supabase nao configurado' };

    const sb = supabase;
    const scheduledForIso = payload.scheduledFor ? parseBrDateTime(payload.scheduledFor)?.toISOString() ?? null : null;
    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const total = Math.max(subtotal - payload.discount, 0);

    const { data: documentRow, error: documentError } = await sb
      .from('documents_v2')
      .insert({
        doc_type: docType,
        status: 'aberto',
        customer_name_snapshot: payload.customerName || null,
        phone_snapshot: payload.phone || null,
        plate_snapshot: payload.plate || null,
        vehicle_snapshot: payload.vehicleSnapshot || null,
        labor_required: payload.laborRequired,
        service_time_days: payload.serviceTimeDays,
        scheduled_for: scheduledForIso,
        discount_amount: payload.discount,
        notes: payload.note || null,
        subtotal_amount: subtotal,
        total_amount: total,
      })
      .select('id')
      .single();

    if (documentError || !documentRow) {
      return { ok: false as const, error: documentError?.message || 'Erro ao salvar documento' };
    }

    if (items.length > 0) {
      const itemRows = items.map((item) => ({
        document_id: documentRow.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.price,
      }));

      const { error: itemsError } = await sb.from('document_items_v2').insert(itemRows);
      if (itemsError) {
        return { ok: false as const, error: itemsError.message };
      }
    }

    return { ok: true as const, id: documentRow.id };
  }

  async function fetchLatestDocumentWithItems(docType: 'orcamento' | 'agendamento') {
    if (!isSupabaseConfigured || !supabase) return null;

    const sb = supabase;
    const { data: doc, error: docError } = await sb
      .from('documents_v2')
      .select('id, customer_name_snapshot, phone_snapshot, plate_snapshot, vehicle_snapshot, notes, discount_amount, service_time_days, scheduled_for')
      .eq('doc_type', docType)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (docError || !doc) return null;

    const { data: items } = await sb
      .from('document_items_v2')
      .select('description, quantity, unit_price')
      .eq('document_id', doc.id)
      .order('created_at', { ascending: true });

    const mappedItems: ServiceItem[] = (items || []).map((item) => ({
      description: item.description,
      quantity: Number(item.quantity) || 1,
      price: Number(item.unit_price) || 0,
    }));

    return {
      customer: doc.customer_name_snapshot || '',
      phone: doc.phone_snapshot || '',
      plate: doc.plate_snapshot || '',
      vehicleSnapshot: doc.vehicle_snapshot || '',
      note: doc.notes || '',
      discount: Number(doc.discount_amount) || 0,
      timeDays: Number(doc.service_time_days) || 1,
      scheduledFor: doc.scheduled_for,
      items: mappedItems,
    };
  }

  async function finalizeQuote() {
    const payload: SavedQuote = {
      vehicle: quoteData.vehicle,
      items: cloneItems(quoteData.items),
      discount: quoteData.discount,
      timeDays: quoteData.timeDays,
      note: quoteData.note,
    };

    setIsSaving(true);
    setSavedQuote(payload);

    const result = await persistDocument(
      'orcamento',
      {
        customerName: saleData.customer,
        phone: saleData.phone,
        plate: saleData.plate,
        vehicleSnapshot: quoteData.vehicle,
        laborRequired: saleData.laborRequired,
        serviceTimeDays: quoteData.timeDays,
        discount: quoteData.discount,
        note: quoteData.note,
      },
      quoteData.items
    );

    setIsSaving(false);
    window.alert(result.ok ? 'Orcamento salvo com sucesso no banco.' : 'Orcamento salvo localmente (falha no banco).');
    setScreen('dashboard');
  }

  async function finalizeAppointment() {
    const payload: SavedAppointment = {
      date: appointmentData.date,
      customer: appointmentData.customer,
      phone: appointmentData.phone,
      plate: appointmentData.plate,
      vehicleDetails: appointmentData.vehicleDetails,
      items: cloneItems(appointmentData.items),
      discount: appointmentData.discount,
      note: appointmentData.note,
    };

    setIsSaving(true);
    setSavedAppointment(payload);

    const result = await persistDocument(
      'agendamento',
      {
        customerName: appointmentData.customer,
        phone: appointmentData.phone,
        plate: appointmentData.plate,
        vehicleSnapshot: appointmentData.vehicleDetails,
        laborRequired: appointmentData.laborRequired,
        serviceTimeDays: 1,
        discount: appointmentData.discount,
        note: appointmentData.note,
        scheduledFor: appointmentData.date,
      },
      appointmentData.items
    );

    setIsSaving(false);
    window.alert(result.ok ? 'Agendamento salvo com sucesso no banco.' : 'Agendamento salvo localmente (falha no banco).');
    setScreen('dashboard');
  }

  async function importQuoteToSale() {
    const dbQuote = await fetchLatestDocumentWithItems('orcamento');

    const source = dbQuote
      ? {
          vehicle: dbQuote.vehicleSnapshot,
          items: dbQuote.items,
          discount: dbQuote.discount,
          timeDays: dbQuote.timeDays,
          note: dbQuote.note,
        }
      : savedQuote || {
      vehicle: quoteData.vehicle,
      items: quoteData.items,
      discount: quoteData.discount,
      timeDays: quoteData.timeDays,
      note: quoteData.note,
    };

    setSaleData((prev) => ({
      ...prev,
      items: cloneItems(source.items),
      discount: source.discount,
      timeDays: source.timeDays,
      note: source.note,
      vehicleDetails: source.vehicle,
    }));
    window.alert(dbQuote ? 'Orcamento importado do banco.' : 'Orcamento importado para a venda.');
  }

  async function importAppointmentToSale() {
    const dbAppointment = await fetchLatestDocumentWithItems('agendamento');

    const source = dbAppointment
      ? {
          date: dbAppointment.scheduledFor ? new Date(dbAppointment.scheduledFor).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(',', '') : appointmentData.date,
          customer: dbAppointment.customer,
          phone: dbAppointment.phone,
          plate: dbAppointment.plate,
          vehicleDetails: dbAppointment.vehicleSnapshot,
          items: dbAppointment.items,
          discount: dbAppointment.discount,
          note: dbAppointment.note,
        }
      : savedAppointment || {
      date: appointmentData.date,
      customer: appointmentData.customer,
      phone: appointmentData.phone,
      plate: appointmentData.plate,
      vehicleDetails: appointmentData.vehicleDetails,
      items: appointmentData.items,
      discount: appointmentData.discount,
      note: appointmentData.note,
    };

    setSaleData((prev) => ({
      ...prev,
      customer: source.customer,
      phone: source.phone,
      plate: source.plate,
      vehicleDetails: source.vehicleDetails,
      items: cloneItems(source.items),
      discount: source.discount,
      note: source.note,
    }));
    window.alert(dbAppointment ? 'Agendamento importado do banco.' : 'Agendamento importado para a venda.');
  }

  async function finalizeSale() {
    const nowDate = now.toLocaleDateString('pt-BR');
    const car = saleData.vehicleDetails.split('\n')[0] || saleData.vehicleDetails;
    const newReceipt: ReceiptRow = {
      id: nextReceiptId,
      date: nowDate,
      customer: saleData.customer,
      car,
      plate: saleData.plate,
      total: saleTotal,
    };

    setIsSaving(true);
    const result = await persistDocument(
      'venda',
      {
        customerName: saleData.customer,
        phone: saleData.phone,
        plate: saleData.plate,
        vehicleSnapshot: saleData.vehicleDetails,
        laborRequired: saleData.laborRequired,
        serviceTimeDays: saleData.timeDays,
        discount: saleData.discount,
        note: saleData.note,
      },
      saleData.items
    );
    setIsSaving(false);

    setReceipts((prev) => [newReceipt, ...prev]);
    setNextReceiptId((prev) => prev + 1);
    window.alert(result.ok ? 'Venda finalizada e salva no banco.' : 'Venda finalizada localmente (falha no banco).');
    setScreen('print-receipt');
  }

  async function handleLogin() {
    setAuthMessage('');

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setAuthMessage('Informe email e senha.');
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setIsAuthenticated(true);
      setAuthMessage('Supabase nao configurado. Entrando em modo local.');
      setScreen('dashboard');
      return;
    }

    const sb = supabase;
    setAuthLoading(true);
    const { error } = await sb.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });
    setAuthLoading(false);

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setIsAuthenticated(true);
    setScreen('dashboard');
  }

  async function handleRegister() {
    setAuthMessage('');

    if (!registerName.trim() || !registerEmail.trim() || !registerPassword.trim() || !registerPasswordConfirm.trim()) {
      setAuthMessage('Preencha todos os campos.');
      return;
    }

    if (registerPassword !== registerPasswordConfirm) {
      setAuthMessage('As senhas nao conferem.');
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setAuthMessage('Cadastro requer configuracao do Supabase.');
      return;
    }

    const sb = supabase;
    setAuthLoading(true);
    const { error } = await sb.auth.signUp({
      email: registerEmail.trim(),
      password: registerPassword,
      options: {
        data: {
          full_name: registerName.trim(),
        },
      },
    });
    setAuthLoading(false);

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setAuthMessage('Cadastro realizado. Verifique seu email para confirmar a conta.');
    setScreen('auth-login');
  }

  async function handleForgotPassword() {
    setAuthMessage('');

    if (!forgotEmail.trim()) {
      setAuthMessage('Informe o email para recuperacao.');
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setAuthMessage('Recuperacao de senha requer configuracao do Supabase.');
      return;
    }

    const sb = supabase;
    setAuthLoading(true);
    const { error } = await sb.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setAuthLoading(false);

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setAuthMessage('Email de recuperacao enviado com sucesso.');
  }

  async function handleResetPassword() {
    setAuthMessage('');

    if (!resetPassword.trim() || !resetPasswordConfirm.trim()) {
      setAuthMessage('Preencha os dois campos de senha.');
      return;
    }

    if (resetPassword !== resetPasswordConfirm) {
      setAuthMessage('As senhas nao conferem.');
      return;
    }

    if (resetPassword.length < 6) {
      setAuthMessage('Use pelo menos 6 caracteres.');
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setAuthMessage('Redefinicao requer configuracao do Supabase.');
      return;
    }

    const sb = supabase;
    setAuthLoading(true);
    const { error } = await sb.auth.updateUser({
      password: resetPassword,
    });
    setAuthLoading(false);

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setResetPassword('');
    setResetPasswordConfirm('');
    setAuthMessage('Senha atualizada com sucesso. Faca login novamente.');
    setScreen('auth-login');
  }

  async function handleLogout() {
    if (isSupabaseConfigured && supabase) {
      const sb = supabase;
      await sb.auth.signOut();
    }
    setIsAuthenticated(false);
    setScreen('auth-login');
  }

  function exportReceiptCSV() {
    const header = 'Data,Cliente,Veiculo,Placa,Total\n';
    const body = filteredReceipts
      .map((row) => `${row.date},"${row.customer}","${row.car}",${row.plate},${row.total.toFixed(2)}`)
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `recibos-${Date.now()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (screen === 'intro-brand') {
    return (
      <main className="intro-screen intro-brand">
        <img src={logoEtorkBrasil} alt="Etork Brasil" className="intro-logo-lg" />
      </main>
    );
  }

  if (screen === 'intro-system') {
    return (
      <main className="intro-screen intro-system">
        <img src={logoEtork} alt="Etork" className="intro-logo-lg" />
      </main>
    );
  }

  if (screen === 'auth-login') {
    return (
      <main className="auth-screen">
        <section className="auth-card">
          <img className="auth-logo" src={logoEtorkBrasil} alt="Etork Brasil" />
          <h1>Login</h1>
          <label>
            Email
            <input
              type="email"
              value={loginEmail}
              onChange={(event) => setLoginEmail(event.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              value={loginPassword}
              onChange={(event) => setLoginPassword(event.target.value)}
              placeholder="********"
              autoComplete="current-password"
            />
          </label>
          <button className="auth-primary" onClick={() => void handleLogin()} disabled={authLoading}>
            {authLoading ? 'Entrando...' : 'Entrar'}
          </button>
          <div className="auth-links">
            <button onClick={() => setScreen('auth-register')}>Criar conta</button>
            <button onClick={() => setScreen('auth-forgot')}>Esqueci a senha</button>
          </div>
          {authMessage && <p className="auth-message">{authMessage}</p>}
        </section>
      </main>
    );
  }

  if (screen === 'auth-register') {
    return (
      <main className="auth-screen">
        <section className="auth-card">
          <img className="auth-logo" src={logoEtorkBrasil} alt="Etork Brasil" />
          <h1>Cadastro</h1>
          <label>
            Nome
            <input
              type="text"
              value={registerName}
              onChange={(event) => setRegisterName(event.target.value)}
              placeholder="Seu nome"
              autoComplete="name"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={registerEmail}
              onChange={(event) => setRegisterEmail(event.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              value={registerPassword}
              onChange={(event) => setRegisterPassword(event.target.value)}
              placeholder="********"
              autoComplete="new-password"
            />
          </label>
          <label>
            Confirmar senha
            <input
              type="password"
              value={registerPasswordConfirm}
              onChange={(event) => setRegisterPasswordConfirm(event.target.value)}
              placeholder="********"
              autoComplete="new-password"
            />
          </label>
          <button className="auth-primary" onClick={() => void handleRegister()} disabled={authLoading}>
            {authLoading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
          <div className="auth-links">
            <button onClick={() => setScreen('auth-login')}>Voltar para login</button>
          </div>
          {authMessage && <p className="auth-message">{authMessage}</p>}
        </section>
      </main>
    );
  }

  if (screen === 'auth-forgot') {
    return (
      <main className="auth-screen">
        <section className="auth-card">
          <img className="auth-logo" src={logoEtorkBrasil} alt="Etork Brasil" />
          <h1>Esqueci a senha</h1>
          <label>
            Email
            <input
              type="email"
              value={forgotEmail}
              onChange={(event) => setForgotEmail(event.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
            />
          </label>
          <button className="auth-primary" onClick={() => void handleForgotPassword()} disabled={authLoading}>
            {authLoading ? 'Enviando...' : 'Enviar recuperacao'}
          </button>
          <div className="auth-links">
            <button onClick={() => setScreen('auth-login')}>Voltar para login</button>
          </div>
          {authMessage && <p className="auth-message">{authMessage}</p>}
        </section>
      </main>
    );
  }

  if (screen === 'auth-reset') {
    return (
      <main className="auth-screen">
        <section className="auth-card">
          <img className="auth-logo" src={logoEtorkBrasil} alt="Etork Brasil" />
          <h1>Redefinir senha</h1>
          <label>
            Nova senha
            <input
              type="password"
              value={resetPassword}
              onChange={(event) => setResetPassword(event.target.value)}
              placeholder="********"
              autoComplete="new-password"
            />
          </label>
          <label>
            Confirmar nova senha
            <input
              type="password"
              value={resetPasswordConfirm}
              onChange={(event) => setResetPasswordConfirm(event.target.value)}
              placeholder="********"
              autoComplete="new-password"
            />
          </label>
          <button className="auth-primary" onClick={() => void handleResetPassword()} disabled={authLoading}>
            {authLoading ? 'Atualizando...' : 'Salvar nova senha'}
          </button>
          <div className="auth-links">
            <button onClick={() => setScreen('auth-login')}>Voltar para login</button>
          </div>
          {authMessage && <p className="auth-message">{authMessage}</p>}
        </section>
      </main>
    );
  }

  return (
    <div className="et-shell">
      <AppHeader now={now} onLogout={() => void handleLogout()} />

      {screen === 'menu-search' && (
        <main className="panel panel-form">
          <h2 className="panel-title">PESQUISAR</h2>
          <section className="form-grid menu-single">
            <div className="form-main">
              <div className="line"><strong>BUSCA:</strong> <input className="input-look" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="cliente, placa, produto..." /></div>

              <div className="menu-block">
                <div className="line"><strong>CLIENTES</strong></div>
                {filteredClients.map((client) => (
                  <div className="menu-row" key={client.id}>
                    <span>{client.name}</span>
                    <span>{client.phone}</span>
                    <span>{client.plate}</span>
                  </div>
                ))}
              </div>

              <div className="menu-block">
                <div className="line"><strong>PRODUTOS</strong></div>
                {filteredProducts.map((item, index) => (
                  <div className="menu-row" key={`${item.description}-${index}`}>
                    <span>{item.description}</span>
                    <span>{formatMoney(item.price)}</span>
                  </div>
                ))}
              </div>

              <div className="menu-block">
                <div className="line"><strong>FINANCEIRO</strong></div>
                {filteredFinancialEntries.map((entry) => (
                  <div className="menu-row" key={entry.id}>
                    <span>{entry.date}</span>
                    <span>{entry.description}</span>
                    <span>{formatMoney(entry.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <footer className="panel-footer">
            <div className="footer-right">
              <button className="btn-back" onClick={() => setScreen('dashboard')}>←</button>
            </div>
          </footer>
        </main>
      )}

      {screen === 'menu-clients' && (
        <main className="panel panel-form">
          <h2 className="panel-title">CLIENTES</h2>
          <section className="form-grid menu-single">
            <div className="form-main">
              <div className="mini-actions receipt-actions">
                <button className="btn-cyan lg" onClick={addClient}>NOVO CLIENTE</button>
              </div>
              {clients.map((client) => (
                <div className="menu-row editable" key={client.id}>
                  <input className="input-look" value={client.name} onChange={(event) => updateClient(client.id, { name: event.target.value })} />
                  <input className="input-look" value={client.phone} onChange={(event) => updateClient(client.id, { phone: event.target.value })} />
                  <input className="input-look plate" value={client.plate} onChange={(event) => updateClient(client.id, { plate: event.target.value.toUpperCase() })} />
                  <button className="item-delete" onClick={() => removeClient(client.id)}>X</button>
                </div>
              ))}
            </div>
          </section>
          <footer className="panel-footer">
            <div className="footer-right">
              <button className="btn-back" onClick={() => setScreen('dashboard')}>←</button>
            </div>
          </footer>
        </main>
      )}

      {screen === 'menu-products' && (
        <main className="panel panel-form">
          <h2 className="panel-title">PRODUTOS</h2>
          <section className="form-grid menu-single">
            <div className="form-main">
              <div className="line search-bar">
                <strong>BUSCA:</strong> 
                <input 
                  className="input-look" 
                  value={productSearchQuery} 
                  onChange={(event) => setProductSearchQuery(event.target.value)} 
                  placeholder="nome do produto..."
                />
              </div>
              <div className="mini-actions receipt-actions">
                <button className="btn-cyan lg" onClick={addProduct}>NOVO PRODUTO</button>
              </div>
              {filteredProducts.length === 0 ? (
                <div className="no-results">Nenhum produto encontrado</div>
              ) : (
                filteredProducts.map((item, index) => {
                  const actualIndex = serviceCatalogData.findIndex(
                    (p) => p.description === item.description && p.price === item.price
                  );
                  return (
                    <div className="menu-row editable" key={`${item.description}-${index}`}>
                      <span className="product-name">{item.description}</span>
                      <span className="product-qty">QTD: {item.quantity}</span>
                      <span className="product-price">{formatMoney(item.price)}</span>
                      <button className="item-edit" onClick={() => openEditProductModal(actualIndex)}>✎</button>
                      <button className="item-delete" onClick={() => void removeProduct(item.id, actualIndex)}>X</button>
                    </div>
                  );
                })
              )}
            </div>
          </section>
          <footer className="panel-footer">
            <div className="footer-right">
              <button className="btn-back" onClick={() => setScreen('dashboard')}>←</button>
            </div>
          </footer>
        </main>
      )}

      {screen === 'menu-financial' && (
        <main className="panel panel-form">
          <h2 className="panel-title">FINANCEIRO</h2>
          <section className="form-grid menu-single">
            <div className="form-main">
              <div className="line"><strong>TOTAL GERAL:</strong> <span>{formatMoney(financialTotal)}</span></div>
              <div className="mini-actions receipt-actions">
                <button className="btn-cyan lg" onClick={addFinancialEntry}>NOVO LANCAMENTO</button>
              </div>
              {financialEntries.map((entry) => (
                <div className="menu-row editable" key={entry.id}>
                  <input className="input-look" type="date" value={entry.date} onChange={(event) => updateFinancialEntry(entry.id, { date: event.target.value })} />
                  <input className="input-look" value={entry.description} onChange={(event) => updateFinancialEntry(entry.id, { description: event.target.value })} />
                  <input className="input-look" type="number" min={0} step="0.01" value={entry.amount} onChange={(event) => updateFinancialEntry(entry.id, { amount: Math.max(0, Number(event.target.value) || 0) })} />
                  <button className="item-delete" onClick={() => removeFinancialEntry(entry.id)}>X</button>
                </div>
              ))}
            </div>
          </section>
          <footer className="panel-footer">
            <div className="footer-right">
              <button className="btn-back" onClick={() => setScreen('dashboard')}>←</button>
            </div>
          </footer>
        </main>
      )}

      {screen === 'menu-reports' && (
        <main className="panel panel-form">
          <h2 className="panel-title">RELATORIOS</h2>
          <section className="form-grid menu-single">
            <div className="form-main">
              <div className="line"><strong>CLIENTES CADASTRADOS:</strong> <span>{clients.length}</span></div>
              <div className="line"><strong>PRODUTOS CADASTRADOS:</strong> <span>{serviceCatalogData.length}</span></div>
              <div className="line"><strong>RECIBOS GERADOS:</strong> <span>{receipts.length}</span></div>
              <div className="line"><strong>FATURAMENTO:</strong> <span>{formatMoney(financialTotal)}</span></div>
              <div className="mini-actions">
                <button className="btn-yellow lg" onClick={() => window.print()}>IMPRIMIR RELATORIO</button>
                <button className="btn-cyan lg" onClick={() => setScreen('print-receipt')}>VER RECIBOS</button>
              </div>
            </div>
          </section>
          <footer className="panel-footer">
            <div className="footer-right">
              <button className="btn-back" onClick={() => setScreen('dashboard')}>←</button>
            </div>
          </footer>
        </main>
      )}

      {screen === 'dashboard' && (
        <main className="panel panel-dashboard">
          <h2 className="panel-title">SERVICOS</h2>
          <section className="dashboard-layout">
            <aside className="left-actions">
              <button onClick={() => handleMenuAction('Pesquisar')}>PESQUISAR</button>
              <button onClick={() => handleMenuAction('Clientes')}>CLIENTES</button>
              <button onClick={() => handleMenuAction('Financeiro')}>FINANCEIRO</button>
              <button onClick={() => handleMenuAction('Produtos')}>PRODUTOS</button>
              <button onClick={() => handleMenuAction('Relatorios')}>RELATORIOS</button>
            </aside>

            <section className="dashboard-center">
              <div className="service-chips">
                {dashboardServices.map((service) => (
                  <article key={service.title + service.plate} className="service-chip">
                    <strong>{service.title}</strong>
                    <span>{service.plate}</span>
                    <small className={`tone-${service.tone}`}>{service.status}</small>
                  </article>
                ))}
              </div>

              <div className="next-title">PROXIMOS AGENDAMENTOS</div>
              <article className="next-card">
                <strong>{nextAppointmentCard.model}</strong>
                <span>{nextAppointmentCard.plate}</span>
                <small>{nextAppointmentCard.date}</small>
              </article>
            </section>

            <aside className="right-actions">
              <button className="action-green" onClick={() => setScreen('new-sale')}>NOVA VENDA</button>
              <button className="action-yellow" onClick={() => setScreen('new-appointment')}>NOVO AGENDAMENTO</button>
              <button className="action-blue" onClick={() => setScreen('new-quote')}>NOVO ORCAMENTO</button>
              <button className="action-orange" onClick={() => setScreen('print-receipt')}>IMPRIMIR RECIBO</button>
            </aside>
          </section>
        </main>
      )}

      {screen === 'new-quote' && (
        <main className="panel panel-form">
          <h2 className="panel-title">NOVO ORCAMENTO</h2>
          <section className="form-grid">
            <div className="form-main">
              <div className="line"><strong>VEICULO:</strong> <input className="input-look" value={quoteData.vehicle} onChange={(event) => setQuoteData((prev) => ({ ...prev, vehicle: event.target.value }))} /></div>
              <div className="line line-mini"><strong>LISTAR</strong> <button onClick={addItemToQuote}>+</button></div>
              <ServiceRows
                items={quoteData.items}
                onChangeItem={(index, patch) => updateItems('quote', index, patch)}
                onRemoveItem={(index) => removeItem('quote', index)}
              />
              {quoteData.note && <div className="note-box">OBS: {quoteData.note}</div>}
            </div>

            <aside className="vehicle-info vehicle-empty" />
          </section>

          <footer className="panel-footer">
            <div className="footer-left">
              <div className="line footer-time"><strong>TEMPO DE SERVICO</strong> <input className="input-look small" type="number" min={1} value={quoteData.timeDays} onChange={(event) => setQuoteData((prev) => ({ ...prev, timeDays: Math.max(1, Number(event.target.value) || 1) }))} /></div>
              <div className="mini-actions">
                <button className="btn-yellow" onClick={() => askAndApplyDiscount(quoteData.discount, (next) => setQuoteData((prev) => ({ ...prev, discount: next })))}>INSERIR DESCONTO</button>
                <button className="btn-cyan" onClick={() => askAndApplyNote(quoteData.note, (next) => setQuoteData((prev) => ({ ...prev, note: next })))}>INSERIR OBSERVACAO</button>
              </div>
              <div className="total">TOTAL: <span>{formatMoney(quoteTotal)}</span></div>
            </div>
            <div className="footer-right">
              <button className="btn-back" onClick={() => setScreen('dashboard')}>←</button>
              <button className="btn-finish" onClick={() => void finalizeQuote()}>{isSaving ? 'SALVANDO...' : 'FINALIZAR ORCAMENTO'}</button>
            </div>
          </footer>
        </main>
      )}

      {screen === 'new-appointment' && (
        <main className="panel panel-form">
          <h2 className="panel-title">NOVO AGENDAMENTO</h2>
          <section className="form-grid">
            <div className="form-main">
              <div className="line"><strong>DATA:</strong> <input className="input-look" value={appointmentData.date} onChange={(event) => setAppointmentData((prev) => ({ ...prev, date: event.target.value }))} /></div>
              <div className="line"><strong>CLIENTE:</strong> <input className="input-look" value={appointmentData.customer} onChange={(event) => setAppointmentData((prev) => ({ ...prev, customer: event.target.value }))} /> <small className="badge">CLIENTE FINAL</small></div>
              <div className="line line-mini"><strong>LISTAR</strong> <button onClick={addItemToAppointment}>+</button></div>
              <ServiceRows
                items={appointmentData.items}
                onChangeItem={(index, patch) => updateItems('appointment', index, patch)}
                onRemoveItem={(index) => removeItem('appointment', index)}
              />
              {appointmentData.note && <div className="note-box">OBS: {appointmentData.note}</div>}
            </div>

            <aside className="vehicle-info">
              <div className="line side-top"><strong>TEL:</strong> <input className="input-look" value={appointmentData.phone} onChange={(event) => setAppointmentData((prev) => ({ ...prev, phone: event.target.value }))} /></div>
              <div className="line side-top line-check"><strong>MAO DE OBRA</strong> <input type="checkbox" checked={appointmentData.laborRequired} onChange={(event) => setAppointmentData((prev) => ({ ...prev, laborRequired: event.target.checked }))} /></div>
              <div className="line side-top"><strong>PLACA:</strong> <input className="input-look plate" value={appointmentData.plate} onChange={(event) => setAppointmentData((prev) => ({ ...prev, plate: event.target.value.toUpperCase() }))} /></div>
              <textarea className="vehicle-card vehicle-input" value={appointmentData.vehicleDetails} onChange={(event) => setAppointmentData((prev) => ({ ...prev, vehicleDetails: event.target.value }))} />
            </aside>
          </section>

          <footer className="panel-footer">
            <div className="footer-left">
              <div className="mini-actions">
                <button className="btn-yellow" onClick={() => askAndApplyDiscount(appointmentData.discount, (next) => setAppointmentData((prev) => ({ ...prev, discount: next })))}>INSERIR DESCONTO</button>
                <button className="btn-cyan" onClick={() => askAndApplyNote(appointmentData.note, (next) => setAppointmentData((prev) => ({ ...prev, note: next })))}>INSERIR OBSERVACAO</button>
              </div>
              <div className="total">TOTAL: <span>{formatMoney(appointmentTotal)}</span></div>
            </div>
            <div className="footer-right">
              <button className="btn-back" onClick={() => setScreen('dashboard')}>←</button>
              <button className="btn-finish" onClick={() => void finalizeAppointment()}>{isSaving ? 'SALVANDO...' : 'FINALIZAR AGENDAMENTO'}</button>
            </div>
          </footer>
        </main>
      )}

      {screen === 'new-sale' && (
        <main className="panel panel-form">
          <h2 className="panel-title">NOVA VENDA</h2>
          <section className="sale-tools">
            <button className="tool-blue" onClick={() => void importQuoteToSale()}>IMPORTAR ORCAMENTO</button>
            <button className="tool-yellow" onClick={() => void importAppointmentToSale()}>IMPORTAR AGENDAMENTO</button>
          </section>

          <section className="form-grid">
            <div className="form-main">
              <div className="line"><strong>CLIENTE:</strong> <input className="input-look" value={saleData.customer} onChange={(event) => setSaleData((prev) => ({ ...prev, customer: event.target.value }))} /> <input className="input-look small" value={saleData.customerType} onChange={(event) => setSaleData((prev) => ({ ...prev, customerType: event.target.value }))} /></div>
              <div className="line line-mini"><strong>LISTAR</strong> <button onClick={addItemToSale}>+</button></div>
              <ServiceRows
                items={saleData.items}
                onChangeItem={(index, patch) => updateItems('sale', index, patch)}
                onRemoveItem={(index) => removeItem('sale', index)}
              />
              {saleData.note && <div className="note-box">OBS: {saleData.note}</div>}
            </div>

            <aside className="vehicle-info">
              <div className="line side-top"><strong>TEL:</strong> <input className="input-look" value={saleData.phone} onChange={(event) => setSaleData((prev) => ({ ...prev, phone: event.target.value }))} /></div>
              <div className="line side-top line-check"><strong>MAO DE OBRA</strong> <input type="checkbox" checked={saleData.laborRequired} onChange={(event) => setSaleData((prev) => ({ ...prev, laborRequired: event.target.checked }))} /></div>
              <div className="line side-top"><strong>PLACA:</strong> <input className="input-look plate" value={saleData.plate} onChange={(event) => setSaleData((prev) => ({ ...prev, plate: event.target.value.toUpperCase() }))} /></div>
              <textarea className="vehicle-card vehicle-input" value={saleData.vehicleDetails} onChange={(event) => setSaleData((prev) => ({ ...prev, vehicleDetails: event.target.value }))} />
              <div className="line footer-time"><strong>TEMPO DE SERVICO</strong> <input className="input-look small" type="number" min={1} value={saleData.timeDays} onChange={(event) => setSaleData((prev) => ({ ...prev, timeDays: Math.max(1, Number(event.target.value) || 1) }))} /></div>
            </aside>
          </section>

          <footer className="panel-footer">
            <div className="footer-left">
              <div className="mini-actions">
                <button className="btn-yellow" onClick={() => askAndApplyDiscount(saleData.discount, (next) => setSaleData((prev) => ({ ...prev, discount: next })))}>INSERIR DESCONTO</button>
                <button className="btn-cyan" onClick={() => askAndApplyNote(saleData.note, (next) => setSaleData((prev) => ({ ...prev, note: next })))}>INSERIR OBSERVACAO</button>
              </div>
              <div className="total">TOTAL: <span>{formatMoney(saleTotal)}</span></div>
            </div>
            <div className="footer-right">
              <button className="btn-back" onClick={() => setScreen('dashboard')}>←</button>
              <button className="btn-dark" onClick={() => window.alert('Servico enviado para fila interna.')}>ENVIAR SERVICO</button>
              <button className="btn-finish" onClick={() => void finalizeSale()}>{isSaving ? 'SALVANDO...' : 'FINALIZAR VENDA'}</button>
            </div>
          </footer>
        </main>
      )}

      {screen === 'print-receipt' && (
        <main className="panel panel-form">
          <h2 className="panel-title">IMPRIMIR RECIBO</h2>

          <section className="receipt-filters">
            <div className="line"><strong>CLIENTE:</strong> <input className="input-look" value={receiptFilters.customer} onChange={(event) => setReceiptFilters((prev) => ({ ...prev, customer: event.target.value }))} /></div>
            <div className="line dual">
              <div><strong>DATA:</strong> <input type="date" className="input-look small" value={receiptFilters.startDate} onChange={(event) => setReceiptFilters((prev) => ({ ...prev, startDate: event.target.value }))} /></div>
              <div><strong>A</strong> <input type="date" className="input-look small" value={receiptFilters.endDate} onChange={(event) => setReceiptFilters((prev) => ({ ...prev, endDate: event.target.value }))} /></div>
            </div>
            <div className="line right"><strong>PLACA:</strong> <input className="input-look plate" value={receiptFilters.plate} onChange={(event) => setReceiptFilters((prev) => ({ ...prev, plate: event.target.value.toUpperCase() }))} /></div>
          </section>

          <section className="receipt-table">
            <div className="mini-actions receipt-actions">
              <button className="btn-cyan lg" onClick={addReceipt}>NOVO RECIBO</button>
            </div>
            {filteredReceipts.map((row) => (
              <div className="receipt-row editable" key={row.id}>
                <input className="input-look" value={row.date} onChange={(event) => updateReceipt(row.id, { date: event.target.value })} />
                <input className="input-look" value={row.customer} onChange={(event) => updateReceipt(row.id, { customer: event.target.value })} />
                <input className="input-look" value={row.car} onChange={(event) => updateReceipt(row.id, { car: event.target.value })} />
                <input className="input-look plate" value={row.plate} onChange={(event) => updateReceipt(row.id, { plate: event.target.value.toUpperCase() })} />
                <input className="input-look" type="number" min={0} step="0.01" value={row.total} onChange={(event) => updateReceipt(row.id, { total: Math.max(0, Number(event.target.value) || 0) })} />
                <button className="item-delete" onClick={() => removeReceipt(row.id)}>X</button>
              </div>
            ))}
            {filteredReceipts.length === 0 && <div className="receipt-empty">Nenhum recibo encontrado para os filtros selecionados.</div>}
          </section>

          <footer className="panel-footer">
            <div className="footer-left">
              <div className="mini-actions">
                <button className="btn-yellow lg" onClick={exportReceiptCSV}>EXPORTAR CSV</button>
                <button className="btn-yellow lg" onClick={() => window.print()}>IMPRIMIR</button>
              </div>
            </div>
            <div className="footer-right">
              <button className="btn-back" onClick={() => setScreen('dashboard')}>←</button>
              <button className="btn-finish" onClick={() => setScreen('dashboard')}>FECHAR</button>
            </div>
          </footer>
        </main>
      )}

      <ProductModal
        isOpen={productModalOpen}
        mode={productModalMode}
        data={productModalData}
        onSave={saveProduct}
        onClose={closeProductModal}
        onDataChange={(patch) => setProductModalData((prev) => ({ ...prev, ...patch }))}
      />

      <button className="skip-intro" onClick={() => setScreen('dashboard')}>IR PARA O SISTEMA</button>
      <img className="brand-watermark" src={logoEtork} alt="Etork" />
    </div>
  );
}

export default App;