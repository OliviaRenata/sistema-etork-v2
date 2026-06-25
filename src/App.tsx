import { useEffect, useMemo, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Swal from 'sweetalert2';
import {
  ArrowLeft,
  CalendarClock,
  CarFront,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Gauge,
  Pencil,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  UserRound,
  Wrench,
} from 'lucide-react';
import logoEtork from './assets/logoetork.png';
import logoEtorkBrasil from './assets/logoetorkbrasil.png';
import { isSupabaseConfigured, supabase } from './lib/supabase';

const plateLookupApiUrl = (import.meta.env.VITE_CAMPS_API_URL as string | undefined)?.trim();
const plateLookupApiToken = (import.meta.env.VITE_CAMPS_API_TOKEN as string | undefined)?.trim();
 
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
  | 'sales-history'
  | 'appointment-calendar'
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

type CatalogItemType = 'SERVICO' | 'PRODUTO';
type PriceTable = 1 | 2;
type CatalogPickerTarget = 'quote' | 'appointment' | 'sale';

type SavedQuote = {
  customer: string;
  customerType: string;
  phone: string;
  plate: string;
  vehicle: string;
  items: ServiceItem[];
  discount: number;
  timeDays: number;
  note: string;
};

type ImportDocumentRow = {
  id: string;
  customer: string;
  phone: string;
  plate: string;
  vehicle: string;
  note: string;
  createdAtIso: string;
  createdAt: string;
  total: number;
};

type SavedAppointment = {
  date: string;
  customer: string;
  customerType: string;
  phone: string;
  plate: string;
  vehicleDetails: string;
  items: ServiceItem[];
  discount: number;
  timeDays: number;
  note: string;
};

type CalendarAppointment = {
  id: string;
  dayKey: string;
  date: string;
  customer: string;
  phone: string;
  plate: string;
  vehicleDetails: string;
  note: string;
  total: number;
  status: AppointmentStatus;
};

type ReceiptRow = {
  id: string | number;
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
  priceTable: PriceTable;
  city?: string;
  state?: string;
};

type FinancialEntry = {
  id: number;

  date: string;

  description: string;

  amount: number;

  sourceType: string | null;

  sourceId: string | null;

  paymentStatus: 'PAGO' | 'PENDENTE';

  isNew?: boolean;

  entryKind?: 'receita' | 'despesa';
};

type FinancialSaleRow = {
  id: string;

  date: string;

  createdAtIso: string;

  customer: string;

  phone: string;

  plate: string;

  vehicle: string;

  note: string;

  subtotal: number;

  discount: number;

  surcharge: number;

  total: number;

  timeDays: number;

  laborRequired: boolean | null;

  paymentMethod: string;

  paymentStatus: 'PAGO' | 'PENDENTE';
};

type FinancialFilters = {
  query: string;

  startDate: string;

  endDate: string;

  kind: 'all' | 'receita' | 'despesa';

  paymentStatus:
    | 'all'
    | 'PAGO'
    | 'PENDENTE';
};

type ReportFilters = {
  query: string;
  startDate: string;
  endDate: string;
  kind: 'all' | 'receita' | 'despesa';
};

type DashboardServiceTone = 'warning' | 'danger' | 'success' | 'neutral' | 'info';
type DashboardServiceStatus = 'EM ABERTO' | 'EM ANDAMENTO' | 'ATRASADO' | 'AVISAR CLIENTE' | 'CONCLUIDO';
type AppointmentStatus = 'CONFIRMADO' | 'CANCELADO';

type DashboardService = {
  id: string;
  title: string;
  plate: string;
  customer: string;
  status: DashboardServiceStatus;
  tone: DashboardServiceTone;
  sourceDocumentId?: string | null;
};

const DASHBOARD_STATUS_OPTIONS: DashboardServiceStatus[] = [
  'EM ABERTO',
  'EM ANDAMENTO',
  'ATRASADO',
  'AVISAR CLIENTE',
  'CONCLUIDO',
];

function dashboardToneByStatus(status: DashboardServiceStatus): DashboardServiceTone {
  if (status === 'CONCLUIDO') return 'success';
  if (status === 'ATRASADO') return 'danger';
  if (status === 'EM ANDAMENTO') return 'warning';
  if (status === 'AVISAR CLIENTE') return 'info';
  return 'neutral';
}

function normalizeDashboardStatus(value: string | null | undefined): DashboardServiceStatus {
  const normalized = (value || '').trim().toLowerCase();
  if (normalized === 'concluido' || normalized === 'finalizado') return 'CONCLUIDO';
  if (normalized === 'atrasado') return 'ATRASADO';
  if (normalized === 'em andamento' || normalized === 'em_andamento' || normalized === 'andamento') return 'EM ANDAMENTO';
  if (normalized === 'avisar cliente' || normalized === 'avisar_cliente') return 'AVISAR CLIENTE';
  // Legacy values from previous schema versions should behave like open items.
  if (normalized === 'confirmado' || normalized === 'agendado') return 'EM ABERTO';
  if (normalized === 'aberto' || normalized === 'em aberto' || normalized === 'em_aberto') return 'EM ABERTO';
  return 'EM ABERTO';
}

function mapDashboardStatusToDocumentStatus(status: DashboardServiceStatus): string {
  if (status === 'CONCLUIDO') return 'concluido';
  if (status === 'ATRASADO') return 'atrasado';
  if (status === 'EM ANDAMENTO') return 'em_andamento';
  if (status === 'AVISAR CLIENTE') return 'avisar_cliente';
  return 'aberto';
}

function normalizeAppointmentStatus(value: string | null | undefined): AppointmentStatus {
  const normalized = (value || '').trim().toLowerCase();
  if (normalized === 'cancelado') return 'CANCELADO';
  return 'CONFIRMADO';
}

function mapAppointmentStatusToDocumentStatus(status: AppointmentStatus): string {
  return status === 'CANCELADO' ? 'cancelado' : 'confirmado';
}

const FINANCIAL_PAGE_SIZE = 25;
const SALES_HISTORY_PAGE_SIZE = 20;

type CatalogRow = {
  id: string | null;
  itemType: CatalogItemType;
  description: string;
  priceTable1: number;
  priceTable2: number;
  quantity: number;
};

type PrintableDocument = {
  kind: 'orcamento' | 'venda';

  number: string;

  issuedAt: string;

  customer: string;
  customerType: string;

  phone: string;

  plate: string;

  vehicle: string;

  items: ServiceItem[];

  subtotal: number;

  discount: number;

  total: number;

  note: string;

  serviceTimeDays: number;

  laborRequired: boolean | null;

  paymentMethod: string;
};

type PrintSettings = {
  companyName: string;
  companyDocument: string;
  companyPhone: string;
  companyEmail: string;
  companyAddress: string;
  paymentMethod: string;
  warrantyDays: number;
  validityDays: number;
  responsibleName: string;
};

type SaleData = {
  customer: string;
  customerType: string;
  phone: string;
  plate: string;
  vehicleDetails: string;

  laborRequired: boolean;
  timeDays: number;

  items: ServiceItem[];

  discount: number;
  surcharge: number;

  paymentMethod: string;

  note: string;
};
type AppointmentData = {
  date: string;

  customer: string;
  customerType: string;
  phone: string;

  plate: string;
  vehicleDetails: string;

  laborRequired: boolean;

  timeDays: number;

  items: ServiceItem[];

  discount: number;

  paymentMethod: string;

  note: string;
};
type QuoteData = {
  customer: string;
  customerType: string;
  phone: string;
  plate: string;
  vehicle: string;
  items: ServiceItem[];
  discount: number;
  timeDays: number;
  note: string;
};

type SaleHistoryRow = {
  id: string;

  createdAtIso: string;

  createdAt: string;

  customer: string;

  phone: string;

  plate: string;

  vehicle: string;

  subtotal: number;

  discount: number;

  surcharge: number;

  total: number;

  note: string;

  timeDays: number;

  laborRequired: boolean;

  paymentMethod: string;

  paymentStatus: 'PAGO' | 'PENDENTE';
};

type SalesHistoryFilters = {
  query: string;
  startDate: string;
  endDate: string;
};

const PRINT_SETTINGS_STORAGE_KEY = 'etork_print_settings_v1';

const fixedCompanyPrintSettings = {
  companyName: 'ETORK BRASIL PERFORMANCE AUTOMOTIVA',
  companyDocument: 'CNPJ 27.557.075/0001-24',
  companyPhone: '(67) 99254-9181',
  companyEmail: 'comercial@etorkbrasil.com.br',
  companyAddress: 'AV. PRESIDENTE CASTELO BRANCO, 41 CORONEL ANTONINO',
  validityDays: 30,
};

const defaultPrintSettings: PrintSettings = {
  companyName: fixedCompanyPrintSettings.companyName,
  companyDocument: fixedCompanyPrintSettings.companyDocument,
  companyPhone: fixedCompanyPrintSettings.companyPhone,
  companyEmail: fixedCompanyPrintSettings.companyEmail,
  companyAddress: fixedCompanyPrintSettings.companyAddress,
  paymentMethod: 'PIX, Cartao de Credito/Debito ou Dinheiro',
  warrantyDays: 90,
  validityDays: fixedCompanyPrintSettings.validityDays,
  responsibleName: 'Responsavel Tecnico',
};

function sanitizePrintSettings(input: unknown): PrintSettings {
  if (!input || typeof input !== 'object') {
    return { ...defaultPrintSettings };
  }

  const value = input as Partial<PrintSettings>;

  return {
    companyName: fixedCompanyPrintSettings.companyName,
    companyDocument: fixedCompanyPrintSettings.companyDocument,
    companyPhone: fixedCompanyPrintSettings.companyPhone,
    companyEmail: fixedCompanyPrintSettings.companyEmail,
    companyAddress: fixedCompanyPrintSettings.companyAddress,
    paymentMethod:
      typeof value.paymentMethod === 'string' && value.paymentMethod.trim() ? value.paymentMethod : defaultPrintSettings.paymentMethod,
    warrantyDays:
      typeof value.warrantyDays === 'number' && Number.isFinite(value.warrantyDays) ? Math.max(0, Math.floor(value.warrantyDays)) : defaultPrintSettings.warrantyDays,
    validityDays: fixedCompanyPrintSettings.validityDays,
    responsibleName:
      typeof value.responsibleName === 'string' && value.responsibleName.trim() ? value.responsibleName : defaultPrintSettings.responsibleName,
  };
}

function formatMoney(value: number) {
  if (!Number.isFinite(value) || value === 0) return 'N/A';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatNumberValue(value: number) {
  if (!Number.isFinite(value) || value === 0) return 'N/A';
  return String(value);
}

function formatDaysValue(value: number) {
  if (!Number.isFinite(value) || value === 0) return 'N/A';
  return `${value} dia(s)`;
}

function getCustomerPriceTable(customerType: string): PriceTable {
  const normalized = customerType.trim().toUpperCase();
  return normalized.includes('2') || normalized.includes('FRANQUEADO') ? 2 : 1;
}

function getCustomerTypeLabel(priceTable: PriceTable) {
  return priceTable === 2 ? 'TABELA 2 - FRANQUEADO' : 'TABELA 1 - CLIENTE FINAL';
}

function resolveFinancialKind(entry: Pick<FinancialEntry, 'amount' | 'description' | 'sourceType' | 'entryKind'>): 'receita' | 'despesa' {
  if (entry.sourceType === 'venda') return 'receita';
  if (entry.entryKind) return entry.entryKind;
  if ((Number(entry.amount) || 0) < 0) return 'despesa';
  const normalizedDescription = (entry.description || '').trim().toUpperCase();
  if (normalizedDescription.startsWith('DESPESA')) return 'despesa';
  return 'receita';
}

function getCatalogPrice(item: CatalogRow, priceTable: PriceTable) {
  return priceTable === 2 ? item.priceTable2 : item.priceTable1;
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
  const raw = value.trim();
  if (!raw) return null;

  const normalized = raw.replace(',', ' ').replace(/\s+/g, ' ');

  const brMatch = normalized.match(
    /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})(?:\s+(\d{1,2})(?::(\d{1,2}))?)?$/
  );

  if (brMatch) {
    const day = Number(brMatch[1]);
    const month = Number(brMatch[2]);
    const rawYear = Number(brMatch[3]);
    const year = rawYear < 100 ? 2000 + rawYear : rawYear;
    const hour = Number(brMatch[4] ?? 0);
    const minute = Number(brMatch[5] ?? 0);

    const date = new Date(year, month - 1, day, hour, minute, 0, 0);
    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day &&
      date.getHours() === hour &&
      date.getMinutes() === minute
    ) {
      return date;
    }

    return null;
  }

  const isoMatch = normalized.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2})(?::(\d{1,2}))?)?$/
  );

  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    const hour = Number(isoMatch[4] ?? 0);
    const minute = Number(isoMatch[5] ?? 0);

    const date = new Date(year, month - 1, day, hour, minute, 0, 0);
    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day &&
      date.getHours() === hour &&
      date.getMinutes() === minute
    ) {
      return date;
    }

    return null;
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatBrDateTime(value: Date) {
  const day = String(value.getDate()).padStart(2, '0');
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const year = value.getFullYear();
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function toDateTimeLocalValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toDisplayAppointmentDate(value: string) {
  const parsed = parseBrDateTime(value);
  return parsed ? formatBrDateTime(parsed) : value;
}

function toBrDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('pt-BR');
}

function normalizeCatalogKey(value: string) {
  return value.trim().toUpperCase();
}

function normalizeEntityId(value: unknown) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const lowered = raw.toLowerCase();
  if (lowered === 'nan' || lowered === 'undefined' || lowered === 'null') return null;
  return raw;
}

function parseMoneyInput(raw: string) {
  const normalized = raw.trim().replace(/\s+/g, '').replace(/\./g, '').replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getMoneySearchValues(value: number) {
  const absolute = Math.abs(Number(value) || 0);
  const signal = value < 0 ? '-' : '';
  const br = `${signal}${absolute.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const us = `${signal}${absolute.toFixed(2)}`;
  const integer = `${signal}${Math.trunc(absolute)}`;

  return [br, us, integer, `R$ ${br}`, `R$${br}`];
}

function matchesSearchTokens(values: string[], query: string) {
  const tokens = normalizeSearchText(query)
    .split(' ')
    .filter(Boolean);

  if (tokens.length === 0) return true;

  const normalizedValues = values.map((value) => normalizeSearchText(value));
  return tokens.every((token) => normalizedValues.some((value) => value.includes(token)));
}

function toInputDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toCalendarDateKey(value: string) {
  const parsed = parseBrDateTime(value);
  if (!parsed) return '';
  return toInputDateValue(parsed);
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
      <div className="et-header-right">
        <div className="et-clock-wrap">
          <div className="et-clock">{time}</div>
          <div className="et-day">{day}</div>
        </div>
        <button className="et-logout" onClick={onLogout}>SAIR</button>
      </div>
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
          <button className="item-delete" onClick={() => onRemoveItem(index)} aria-label="Excluir item">
            <Trash2 size={14} />
          </button>
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
  data: { description: string; quantity: number; itemType: CatalogItemType; priceTable1: number; priceTable2: number };
  onSave: () => void;
  onClose: () => void;
  onDataChange: (patch: Partial<{ description: string; quantity: number; itemType: CatalogItemType; priceTable1: number; priceTable2: number }>) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{mode === 'add' ? 'NOVO CADASTRO' : 'EDITAR CADASTRO'}</h3>
        
        <div className="modal-body">
          <div className="form-field">
            <label>NOME DO ITEM</label>
            <input
              type="text"
              className="modal-input"
              value={data.description}
              onChange={(e) => onDataChange({ description: e.target.value })}
              placeholder="Digite o nome do item"
            />
          </div>

          <div className="form-field">
            <label>TIPO</label>
            <select
              className="modal-input"
              value={data.itemType}
              onChange={(e) => onDataChange({ itemType: e.target.value === 'PRODUTO' ? 'PRODUTO' : 'SERVICO' })}
            >
              <option value="SERVICO">SERVICO</option>
              <option value="PRODUTO">PRODUTO</option>
            </select>
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
            <label>PRECO TABELA 1</label>
            <input
              type="number"
              className="modal-input"
              value={data.priceTable1}
              min={0}
              step="0.01"
              onChange={(e) => onDataChange({ priceTable1: Math.max(0, Number(e.target.value) || 0) })}
            />
          </div>

          <div className="form-field">
            <label>PRECO TABELA 2</label>
            <input
              type="number"
              className="modal-input"
              value={data.priceTable2}
              min={0}
              step="0.01"
              onChange={(e) => onDataChange({ priceTable2: Math.max(0, Number(e.target.value) || 0) })}
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

function CatalogPickerModal({
  isOpen,
  rows,
  selectedIndex,
  quantity,
  priceTable,
  onSelectedIndex,
  onQuantity,
  onClose,
  onConfirm,
  formatMoney,
}: {
  isOpen: boolean;
  rows: CatalogRow[];
  selectedIndex: number;
  quantity: number;
  priceTable: PriceTable;
  onSelectedIndex: (index: number) => void;
  onQuantity: (quantity: number) => void;
  onClose: () => void;
  onConfirm: () => void;
  formatMoney: (value: number) => string;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) setSearchQuery('');
  }, [isOpen]);

  const searchTerm = searchQuery.trim().toUpperCase();
  const filteredRows = useMemo(
    () =>
      rows
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => {
          if (!searchTerm) return true;
          return `${item.itemType} ${normalizeCatalogKey(item.description)}`.includes(searchTerm);
        })
        .slice(0, 10),
    [rows, searchTerm]
  );

  const selectedItem = rows[selectedIndex];

  function handleSearchChange(value: string) {
    setSearchQuery(value);

    const nextTerm = value.trim().toUpperCase();
    if (!nextTerm) return;

    const firstMatch = rows.findIndex((item) => `${item.itemType} ${normalizeCatalogKey(item.description)}`.includes(nextTerm));
    if (firstMatch >= 0) onSelectedIndex(firstMatch);
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">ADICIONAR SERVICO / PRODUTO</h3>
        <div className="modal-body">
          <div className="form-field">
            <label>ITEM</label>
            <input
              type="text"
              className="modal-input"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Pesquisar servico ou produto"
              autoFocus
            />
            <div className="catalog-suggestions" role="listbox" aria-label="Sugestoes de itens">
              {filteredRows.length === 0 ? (
                <div className="catalog-suggestion-empty">Nenhum item encontrado</div>
              ) : (
                filteredRows.map(({ item, index }) => (
                  <button
                    type="button"
                    className={`catalog-suggestion ${selectedIndex === index ? 'selected' : ''}`}
                    key={`${item.id ?? 'local'}-${item.description}-${index}`}
                    onClick={() => {
                      onSelectedIndex(index);
                      setSearchQuery(item.description);
                    }}
                    role="option"
                    aria-selected={selectedIndex === index}
                  >
                    <span className="catalog-suggestion-type">{item.itemType}</span>
                    <span className="catalog-suggestion-name">{item.description}</span>
                    <span className="catalog-suggestion-price">
                      T1 {formatMoney(item.priceTable1)} | T2 {formatMoney(item.priceTable2)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="form-field">
            <label>QUANTIDADE</label>
            <input
              type="number"
              min={1}
              className="modal-input"
              value={quantity}
              onChange={(e) => onQuantity(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>

          {selectedItem && (
            <div className="form-field">
              <label>PRECO APLICADO</label>
              <input
                type="text"
                className="modal-input"
                readOnly
                value={`${priceTable === 2 ? 'TABELA 2' : 'TABELA 1'} - ${formatMoney(getCatalogPrice(selectedItem, priceTable))}`}
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>CANCELAR</button>
          <button className="btn-save" onClick={onConfirm} disabled={!selectedItem}>ADICIONAR</button>
        </div>
      </div>
    </div>
  );
}

function AppointmentEditModal({
  isOpen,
  data,
  onSave,
  onCancel,
  onDelete,
  onPrint,
  onWhatsapp,
  onClose,
  onDataChange,
  onPlateLookup,
}: {
  isOpen: boolean;
  data: CalendarAppointment | null;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onPrint: () => void;
  onWhatsapp: () => void;
  onClose: () => void;
  onDataChange: (patch: Partial<CalendarAppointment>) => void;
  onPlateLookup: (plateValue: string) => void;
}) {
  if (!isOpen || !data) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-wide" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">EDITAR AGENDAMENTO</h3>

        <div className="modal-body">
          <div className="form-field">
            <label>DATA / HORA</label>
            <input
              type="text"
              className="modal-input"
              value={data.date}
              onChange={(e) => onDataChange({ date: e.target.value })}
              placeholder="DD/MM/AAAA HH:MM"
            />
          </div>

          <div className="form-field">
            <label>CLIENTE</label>
            <input
              type="text"
              className="modal-input"
              value={data.customer}
              onChange={(e) => onDataChange({ customer: e.target.value })}
              placeholder="Nome do cliente"
            />
          </div>

          <div className="form-field">
            <label>TELEFONE</label>
            <input
              type="text"
              className="modal-input"
              value={data.phone}
              onChange={(e) => onDataChange({ phone: e.target.value })}
              placeholder="(67) 9 0000-0000"
            />
          </div>

          <div className="form-field">
            <label>PLACA</label>
            <input
              type="text"
              className="modal-input"
              value={data.plate}
              onChange={(e) => onDataChange({ plate: e.target.value.toUpperCase() })}
              onBlur={(e) => onPlateLookup(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onPlateLookup((e.currentTarget as HTMLInputElement).value);
                }
              }}
              placeholder="AAA-0000"
            />
          </div>

          <div className="form-field">
            <label>VEICULO / SERVICO</label>
            <textarea
              className="modal-input modal-textarea"
              value={data.vehicleDetails}
              onChange={(e) => onDataChange({ vehicleDetails: e.target.value })}
              rows={3}
              placeholder="Detalhes do veiculo e servico"
            />
          </div>

          <div className="form-field">
            <label>STATUS</label>
            <select
              className="modal-input"
              value={data.status}
              onChange={(e) => onDataChange({ status: e.target.value as AppointmentStatus })}
            >
              <option value="CONFIRMADO">CONFIRMADO</option>
              <option value="CANCELADO">CANCELADO</option>
            </select>
          </div>

          <div className="form-field">
            <label>VALOR TOTAL</label>
            <input
              type="number"
              className="modal-input"
              step="0.01"
              min={0}
              value={data.total}
              onChange={(e) => onDataChange({ total: Math.max(0, Number(e.target.value) || 0) })}
            />
          </div>

          <div className="form-field">
            <label>OBSERVACOES</label>
            <input
              type="text"
              className="modal-input"
              value={data.note}
              onChange={(e) => onDataChange({ note: e.target.value })}
              placeholder="Observacoes adicionais"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-yellow" onClick={onPrint}>IMPRIMIR VIA</button>
          <button className="btn-cyan" onClick={onWhatsapp}>ENVIAR WHATSAPP</button>
          <button className="btn-red" onClick={onCancel}>CANCELAR AGEND.</button>
          <button className="btn-dark" onClick={onDelete}>EXCLUIR</button>
          <button className="btn-cancel" onClick={onClose}>CANCELAR</button>
          <button className="btn-save" onClick={onSave}>SALVAR</button>
        </div>
      </div>
    </div>
  );
}

function ServiceStatusModal({
  isOpen,
  service,
  onClose,
  onServiceChange,
  onSave,
  onPrint,
  onWhatsapp,
  onCancelAppointment,
  onDeleteAppointment,
  hasLinkedAppointment,
}: {
  isOpen: boolean;
  service: DashboardService | null;
  onClose: () => void;
  onServiceChange: (patch: Partial<DashboardService>) => void;
  onSave: () => void;
  onPrint: () => void;
  onWhatsapp: () => void;
  onCancelAppointment: () => void;
  onDeleteAppointment: () => void;
  hasLinkedAppointment: boolean;
}) {
  if (!isOpen || !service) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">DETALHES DO SERVICO</h3>

        <div className="modal-body">
          <div className="form-field">
            <label>VEICULO / SERVICO</label>
            <input type="text" className="modal-input" value={service.title} readOnly />
          </div>

          <div className="form-field">
            <label>PLACA</label>
            <input type="text" className="modal-input" value={service.plate} readOnly />
          </div>

          <div className="form-field">
            <label>STATUS</label>
            <select
              className="modal-input"
              value={service.status}
              onChange={(event) => {
                const nextStatus = event.target.value as DashboardServiceStatus;
                onServiceChange({
                  status: nextStatus,
                  tone: dashboardToneByStatus(nextStatus),
                });
              }}
            >
              {DASHBOARD_STATUS_OPTIONS.map((statusOption) => (
                <option key={statusOption} value={statusOption}>
                  {statusOption}
                </option>
              ))}
            </select>
          </div>

          <div className={`status-preview tone-${service.tone}`}>{service.status}</div>
          <p className="service-modal-help">Selecione o status para atualizar o andamento do servico.</p>
        </div>

        <div className="modal-footer service-status-modal-actions">
          <button className="btn-yellow" disabled={!hasLinkedAppointment} onClick={onPrint}>IMPRIMIR VIA</button>
          <button className="btn-cyan" disabled={!hasLinkedAppointment} onClick={onWhatsapp}>ENVIAR WHATSAPP</button>
          <button className="btn-red" disabled={!hasLinkedAppointment} onClick={onCancelAppointment}>CANCELAR AGEND.</button>
          <button className="btn-dark" disabled={!hasLinkedAppointment} onClick={onDeleteAppointment}>EXCLUIR</button>
          <button className="btn-cancel" onClick={onClose}>CANCELAR</button>
          <button className="btn-save" onClick={onSave}>SALVAR STATUS</button>
        </div>
      </div>
    </div>
  );
}

function SaleScreen({
  saleData,
  setSaleData,
  saleSubtotal,
  saleTotal,
  saleQuoteSearch,
  setSaleQuoteSearch,
  saleQuoteResults,
  saleSelectedQuoteId,
  setSaleSelectedQuoteId,
  saleAppointmentSearch,
  setSaleAppointmentSearch,
  saleAppointmentResults,
  saleSelectedAppointmentId,
  setSaleSelectedAppointmentId,
  runSaleQuoteSearch,
  importQuoteToSaleBySearch,
  runSaleAppointmentSearch,
  importAppointmentToSaleBySearch,
  importQuoteToSale,
  importAppointmentToSale,
  addItemToSale,
  updateItems,
  removeItem,
  onCancelSale,
  finalizeSale,
  isSaving,
  formatMoney,
  setScreen,
  applyMatchedClient,
  onPlateLookup,
  onQuickCreateClient,
}: {
  saleData: SaleData;
  setSaleData: (updater: (prev: SaleData) => SaleData) => void;
  saleSubtotal: number;
  saleTotal: number;
  saleQuoteSearch: string;
  setSaleQuoteSearch: (value: string) => void;
  saleQuoteResults: ImportDocumentRow[];
  saleSelectedQuoteId: string;
  setSaleSelectedQuoteId: (value: string) => void;
  saleAppointmentSearch: string;
  setSaleAppointmentSearch: (value: string) => void;
  saleAppointmentResults: ImportDocumentRow[];
  saleSelectedAppointmentId: string;
  setSaleSelectedAppointmentId: (value: string) => void;
  runSaleQuoteSearch: () => void;
  importQuoteToSaleBySearch: () => void;
  runSaleAppointmentSearch: () => void;
  importAppointmentToSaleBySearch: () => void;
  importQuoteToSale: () => void;
  importAppointmentToSale: () => void;
  addItemToSale: () => void;
  updateItems: (target: 'quote' | 'appointment' | 'sale', index: number, patch: Partial<ServiceItem>) => void;
  removeItem: (target: 'quote' | 'appointment' | 'sale', index: number) => void;
  onCancelSale: () => void;
  finalizeSale: () => void;
  isSaving: boolean;
  formatMoney: (value: number) => string;
  setScreen: (next: Screen) => void;
  applyMatchedClient: (target: 'quote' | 'appointment' | 'sale', customerValue: string) => void;
  onPlateLookup: (target: 'quote' | 'appointment' | 'sale', plateValue: string) => void;
  onQuickCreateClient: (target: 'quote' | 'appointment' | 'sale') => void;
}) {
  function patchSale(patch: Partial<SaleData>) {
    setSaleData((prev) => ({ ...prev, ...patch }));
  }

  const vehicleLines = saleData.vehicleDetails
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const vehicleModel = vehicleLines[0] || 'VEICULO PERFORMANCE';
  const vehicleGear = vehicleLines[1] || 'AUTOMATICO';
  const vehicleYear = vehicleLines[2] || '2024/2024';

  const paymentStatusLabel = saleTotal > 0 ? 'PENDENTE' : 'SEM VALOR';

  async function handleSendService() {
    await Swal.fire({
      title: 'Servico enviado',
      text: 'A OS foi enviada para a fila interna de producao.',
      icon: 'success',
      confirmButtonColor: '#6b7280',
      background: '#111827',
      color: '#f3f4f6',
    });
  }

  async function handleRemoveSaleItem(index: number) {
    const result = await Swal.fire({
      title: 'Remover servico?',
      text: 'Essa acao remove o item da OS atual.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Remover',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      background: '#111827',
      color: '#f3f4f6',
    });

    if (result.isConfirmed) {
      removeItem('sale', index);
    }
  }

  return (
    <main className="sales-premium sales-premium-panel">
      <section className="sales-premium-header sales-premium-header-compact card border-0">
        <div className="sales-premium-header-top">
          <div>
            <p className="sales-premium-eyebrow mb-1">ETORK BRASIL PERFORMANCE HUB</p>
            <h2 className="sales-premium-title mb-0">Balcao de Vendas</h2>
          </div>
        </div>

        <div className="sales-premium-header-grid">
          <div className="sales-premium-top-badges">
            <span><UserRound size={14} /> ADMIN</span>
            <span><ShieldCheck size={14} /> OS {paymentStatusLabel}</span>
            <span><Wrench size={14} /> ETORK LIVE</span>
          </div>
        </div>

        <div className="sales-premium-header-actions">
          <button className="sales-premium-btn ghost sales-premium-btn-back" onClick={() => setScreen('dashboard')}>
            <CalendarClock size={16} /> Voltar
          </button>
          <button
            className="sales-premium-btn ghost"
            onClick={() => {
              onCancelSale();
            }}
          >
            Cancelar Venda
          </button>
          <button className="sales-premium-btn primary" onClick={() => void handleSendService()}>
            <Send size={16} /> Enviar Servico
          </button>
          <button className="sales-premium-btn success" onClick={finalizeSale} disabled={isSaving}>
            <CircleDollarSign size={16} /> {isSaving ? 'Salvando...' : 'Finalizar Venda'}
          </button>
        </div>
      </section>

      <section className="container-fluid sales-premium-content sales-premium-content-grid px-0">
        <div className="row g-2 h-100">
          <div className="col-12 col-xl-8 sales-premium-col">
            <div className="card sales-premium-card sales-premium-main-card border-0 h-100">
              <div className="card-body p-3 sales-premium-main-body">
                <div className="row g-2 sales-premium-client-vehicle">
                  <div className="col-12 col-md-7">
                    <div className="card sales-premium-inner border-0 h-100">
                      <div className="card-body p-3">
                        <h6 className="sales-premium-section-title mb-3"><UserRound size={15} /> Cliente</h6>
                        <div className="row g-2">
                          <div className="col-12 col-md-6">
                            <div className="form-floating">
                              <input
                                id="sales-customer-name"
                                list="client-suggestions"
                                className="form-control sales-premium-input"
                                value={saleData.customer}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  patchSale({ customer: value });
                                  if (value.trim().toLowerCase() === 'cadastrar novo cliente') {
                                    onQuickCreateClient('sale');
                                  }
                                }}
                                onBlur={(e) => applyMatchedClient('sale', e.target.value)}
                                placeholder="Cliente"
                              />
                              <label htmlFor="sales-customer-name">Cliente</label>
                            </div>
                          </div>
                          <div className="col-12 col-md-6 d-flex align-items-center">
                            <button type="button" className="sales-premium-btn ghost" onClick={() => onQuickCreateClient('sale')}>
                              Cadastrar novo cliente
                            </button>
                          </div>
                          <div className="col-12 col-md-6">
                            <div className="form-floating">
                              <select id="sales-customer-type" className="form-select sales-premium-input" value={saleData.customerType} onChange={(e) => patchSale({ customerType: e.target.value })}>
                                <option value={getCustomerTypeLabel(1)}>{getCustomerTypeLabel(1)}</option>
                                <option value={getCustomerTypeLabel(2)}>{getCustomerTypeLabel(2)}</option>
                              </select>
                              <label htmlFor="sales-customer-type">Tipo</label>
                            </div>
                          </div>
                          <div className="col-12 col-md-6">
                            <div className="form-floating">
                              <input id="sales-customer-phone" className="form-control sales-premium-input" value={saleData.phone} onChange={(e) => patchSale({ phone: e.target.value })} placeholder="Telefone" />
                              <label htmlFor="sales-customer-phone">Telefone</label>
                            </div>
                          </div>
                          <div className="col-12 col-md-6">
                            <div className="form-floating">
                              <input id="sales-customer-plate" className="form-control sales-premium-input" value={saleData.plate} onChange={(e) => patchSale({ plate: e.target.value.toUpperCase() })} onBlur={(e) => onPlateLookup('sale', e.target.value)} onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  onPlateLookup('sale', (e.currentTarget as HTMLInputElement).value);
                                }
                              }} placeholder="Placa" />
                              <label htmlFor="sales-customer-plate">Placa</label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-5">
                    <div className="card sales-premium-inner border-0 h-100">
                      <div className="card-body p-3">
                        <h6 className="sales-premium-section-title mb-3"><CarFront size={15} /> Veiculo</h6>
                        <strong className="sales-premium-vehicle-title d-block">{vehicleModel}</strong>
                        <small className="sales-premium-muted d-block mb-2">{vehicleGear} • {vehicleYear}</small>
                        <textarea id="sales-vehicle-details" className="form-control sales-premium-input sales-premium-note sales-premium-vehicle-note" value={saleData.vehicleDetails} onChange={(e) => patchSale({ vehicleDetails: e.target.value })} placeholder="Veiculo" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card sales-premium-inner sales-premium-import-card border-0">
                  <div className="card-body p-3">
                    <h6 className="sales-premium-section-title mb-3"><Search size={15} /> Importar Orcamento e Agendamento</h6>
                    <div className="row g-2 align-items-center mb-2">
                      <div className="col-12 col-md-6 col-xl-4">
                        <div className="form-floating">
                          <input id="sales-search-quote" className="form-control sales-premium-input" value={saleQuoteSearch} onChange={(e) => setSaleQuoteSearch(e.target.value)} placeholder="Buscar orcamento" />
                          <label htmlFor="sales-search-quote">Buscar orcamento</label>
                        </div>
                      </div>
                      <div className="col-12 col-md-6 col-xl-4">
                        <div className="form-floating">
                          <select id="sales-select-quote" className="form-select sales-premium-input" value={saleSelectedQuoteId} onChange={(e) => setSaleSelectedQuoteId(e.target.value)}>
                            <option value="">Selecione um orcamento</option>
                            {saleQuoteResults.map((row) => (
                              <option key={row.id} value={row.id}>{`${row.customer} | ${row.plate} | ${formatMoney(row.total)}`}</option>
                            ))}
                          </select>
                          <label htmlFor="sales-select-quote">Resultados de orcamento</label>
                        </div>
                      </div>
                      <div className="col-12 col-xl-4 sales-premium-inline-actions">
                        <button className="sales-premium-btn ghost" onClick={runSaleQuoteSearch}>Buscar</button>
                        <button className="sales-premium-btn primary" onClick={importQuoteToSaleBySearch}>Importar</button>
                        <button className="sales-premium-btn success" onClick={importQuoteToSale}>Ultimo</button>
                      </div>
                    </div>

                    <div className="row g-2 align-items-center">
                      <div className="col-12 col-md-6 col-xl-4">
                        <div className="form-floating">
                          <input id="sales-search-appointment" className="form-control sales-premium-input" value={saleAppointmentSearch} onChange={(e) => setSaleAppointmentSearch(e.target.value)} placeholder="Buscar agendamento" />
                          <label htmlFor="sales-search-appointment">Buscar agendamento</label>
                        </div>
                      </div>
                      <div className="col-12 col-md-6 col-xl-4">
                        <div className="form-floating">
                          <select id="sales-select-appointment" className="form-select sales-premium-input" value={saleSelectedAppointmentId} onChange={(e) => setSaleSelectedAppointmentId(e.target.value)}>
                            <option value="">Selecione um agendamento</option>
                            {saleAppointmentResults.map((row) => (
                              <option key={row.id} value={row.id}>{`${row.customer} | ${row.plate} | ${formatMoney(row.total)}`}</option>
                            ))}
                          </select>
                          <label htmlFor="sales-select-appointment">Resultados de agendamento</label>
                        </div>
                      </div>
                      <div className="col-12 col-xl-4 sales-premium-inline-actions">
                        <button className="sales-premium-btn ghost" onClick={runSaleAppointmentSearch}>Buscar</button>
                        <button className="sales-premium-btn primary" onClick={importAppointmentToSaleBySearch}>Importar</button>
                        <button className="sales-premium-btn success" onClick={importAppointmentToSale}>Ultimo</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card sales-premium-inner sales-premium-services-card border-0">
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                      <h6 className="sales-premium-section-title mb-0"><Wrench size={15} /> Servicos</h6>
                      <button className="sales-premium-btn ghost" onClick={addItemToSale}><Plus size={15} /> Adicionar item</button>
                    </div>

                    <div className="sales-premium-table-wrap sales-premium-table-scroller">
                      <div className="sales-premium-table-head">
                        <span>Descricao</span>
                        <span>Qtd</span>
                        <span>Unit.</span>
                        <span>Subtotal</span>
                        <span></span>
                      </div>

                      {saleData.items.map((item, index) => (
                        <div className="sales-premium-table-row" key={`sale-item-${index}`}>
                          <div>
                            <input id={`sale-item-desc-${index}`} className="form-control sales-premium-input" value={item.description} onChange={(e) => updateItems('sale', index, { description: e.target.value })} placeholder="Descricao" />
                          </div>

                          <div className="sales-premium-stepper">
                            <input id={`sale-item-qty-${index}`} className="form-control sales-premium-input text-center" type="number" min={1} value={item.quantity} onChange={(e) => updateItems('sale', index, { quantity: Math.max(1, Number(e.target.value) || 1) })} placeholder="Qtd" />
                          </div>

                          <div>
                            <input id={`sale-item-price-${index}`} className="form-control sales-premium-input text-end" type="number" min={0} step="0.01" value={item.price} onChange={(e) => updateItems('sale', index, { price: Math.max(0, Number(e.target.value) || 0) })} placeholder="Unitario" />
                          </div>

                          <div className="sales-premium-subtotal">{formatMoney(item.price * item.quantity)}</div>

                          <button className="sales-premium-icon-btn" onClick={() => void handleRemoveSaleItem(index)} aria-label="Excluir item">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card sales-premium-inner sales-premium-note-card border-0">
                  <div className="card-body p-3">
                    <h6 className="sales-premium-section-title mb-3">Observacoes</h6>
                    <div className="form-floating">
                      <textarea id="sales-note" className="form-control sales-premium-input sales-premium-note" value={saleData.note} onChange={(e) => patchSale({ note: e.target.value })} placeholder="Observacoes" />
                      <label htmlFor="sales-note">Observacoes da OS</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-4 sales-premium-col">
            <div className="sales-premium-side-stack">
            <div className="card sales-premium-card sales-premium-side-card border-0">
              <div className="card-body p-3">
                <h6 className="sales-premium-section-title mb-3"><CircleDollarSign size={15} /> Financeiro</h6>
                <div className="sales-premium-total-box">
                  <small>Total da OS</small>
                  <strong>{formatMoney(saleTotal)}</strong>
                </div>

                <div className="sales-premium-metrics mt-3">
                  <div>
                    <span>Subtotal</span>
                    <strong>{formatMoney(saleSubtotal)}</strong>
                  </div>
                  <div>
                    <span>Desconto</span>
                    <div className="form-floating">
                      <input id="sales-discount" className="form-control sales-premium-input text-end" type="number" min={0} step="0.01" value={saleData.discount} onChange={(e) => patchSale({ discount: Math.max(0, Number(e.target.value) || 0) })} placeholder="Desconto" />
                      <label htmlFor="sales-discount">Desconto</label>
                    </div>
                  </div>
                  <div>
                    <span>Acrescimo</span>
                    <div className="form-floating">
                      <input id="sales-surcharge" className="form-control sales-premium-input text-end" type="number" min={0} step="0.01" value={saleData.surcharge} onChange={(e) => patchSale({ surcharge: Math.max(0, Number(e.target.value) || 0) })} placeholder="Acrescimo" />
                      <label htmlFor="sales-surcharge">Acrescimo</label>
                    </div>
                  </div>
                </div>
<div className="mt-3">
  <div className="form-floating">
    <select
      id="sales-payment-method"
      className="form-select sales-premium-input"
      value={saleData.paymentMethod}
      onChange={(e) => patchSale({ paymentMethod: e.target.value })}
    >
      <option value="DINHEIRO">Dinheiro</option>
      <option value="PIX">PIX</option>
      <option value="CARTAO_DEBITO">Cartão de Débito</option>
      <option value="CARTAO_CREDITO">Cartão de Crédito</option>
      <option value="BOLETO">Boleto</option>
      <option value="CHEQUE">Cheque</option>
      <option value="SEGURO">Seguro</option>
    </select>

    <label htmlFor="sales-payment-method">
      Forma de Pagamento
    </label>
  </div>
</div>
                <div className="sales-premium-status-grid mt-3">
                  <span className="chip green">EM ANDAMENTO</span>
                  <span className="chip blue">CAIXA ABERTO</span>
                </div>
              </div>
            </div>

            <div className="card sales-premium-card sales-premium-side-card border-0">
              <div className="card-body p-3">
                <h6 className="sales-premium-section-title mb-3"><CarFront size={15} /> Dados do Servico</h6>

                <div className="form-check form-switch sales-premium-switch mb-2">
                  <input className="form-check-input" type="checkbox" id="sales-labor" checked={saleData.laborRequired} onChange={(e) => patchSale({ laborRequired: e.target.checked })} />
                  <label className="form-check-label" htmlFor="sales-labor">Mao de obra inclusa</label>
                </div>

                <div className="form-floating">
                  <input id="sales-time-days" className="form-control sales-premium-input" type="number" min={1} value={saleData.timeDays} onChange={(e) => patchSale({ timeDays: Math.max(1, Number(e.target.value) || 1) })} placeholder="Tempo" />
                  <label htmlFor="sales-time-days">Tempo (dias)</label>
                </div>
              </div>
            </div>

            <div className="card sales-premium-card sales-premium-side-card border-0">
              <div className="card-body p-3">
                <h6 className="sales-premium-section-title mb-3"><Wrench size={15} /> Operacao de Balcao</h6>
                <div className="sales-premium-pdv-lines">
                  <div><span>Status da OS:</span><strong>{paymentStatusLabel}</strong></div>
                  <div><span>Fluxo:</span><strong>Atendimento {'>'} Servico {'>'} Fechamento</strong></div>
                  <div><span>Pagamento:</span><strong>Definir no fechamento</strong></div>
                  <div><span>Prioridade:</span><strong>Padrao</strong></div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
function QuoteScreen({
  quoteData,
  setQuoteData,
  quoteSubtotal,
  quoteTotal,
  addItemToQuote,
  updateItems,
  removeItem,
  finalizeQuote,
  isSaving,
  formatMoney,
  setScreen,
  applyMatchedClient,
  onPlateLookup,
  clearQuoteForm,
  onQuickCreateClient,
}: {
  quoteData: QuoteData;
  setQuoteData: (updater: (prev: QuoteData) => QuoteData) => void;
  quoteSubtotal: number;
  quoteTotal: number;
  addItemToQuote: () => void;
  updateItems: (target: 'quote' | 'appointment' | 'sale', index: number, patch: Partial<ServiceItem>) => void;
  removeItem: (target: 'quote' | 'appointment' | 'sale', index: number) => void;
  finalizeQuote: () => void;
  isSaving: boolean;
  formatMoney: (value: number) => string;
  setScreen: (next: Screen) => void;
  applyMatchedClient: (target: 'quote' | 'appointment' | 'sale', customerValue: string) => void;
  onPlateLookup: (target: 'quote' | 'appointment' | 'sale', plateValue: string) => void;
  clearQuoteForm: () => void;
  onQuickCreateClient: (target: 'quote' | 'appointment' | 'sale') => void;
}) {
  function patchQuote(patch: Partial<QuoteData>) {
    setQuoteData((prev) => ({ ...prev, ...patch }));
  }

  const vehicleLines = quoteData.vehicle
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const vehicleModel = vehicleLines[0] || 'VEICULO PERFORMANCE';
  const vehicleGear = vehicleLines[1] || 'AUTOMATICO';
  const vehicleYear = vehicleLines[2] || '2024/2024';

  async function handleSendQuote() {
    await Swal.fire({
      title: 'Orcamento enviado',
      text: 'O orcamento foi enviado para aprovacao interna.',
      icon: 'success',
      confirmButtonColor: '#6b7280',
      background: '#111827',
      color: '#f3f4f6',
    });
  }

  async function handleRemoveQuoteItem(index: number) {
    const result = await Swal.fire({
      title: 'Remover servico?',
      text: 'Essa acao remove o item do orcamento atual.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Remover',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      background: '#111827',
      color: '#f3f4f6',
    });

    if (result.isConfirmed) {
      removeItem('quote', index);
    }
  }

  return (
    <main className="sales-premium sales-premium-panel">
      <section className="sales-premium-header sales-premium-header-compact card border-0">
        <div className="sales-premium-header-top">
          <div>
            <p className="sales-premium-eyebrow mb-1">ETORK BRASIL PERFORMANCE HUB</p>
            <h2 className="sales-premium-title mb-0">Balcao de Orcamento</h2>
          </div>
        </div>

        <div className="sales-premium-header-grid">
          <div className="sales-premium-top-badges">
            <span><UserRound size={14} /> ADMIN</span>
            <span><ShieldCheck size={14} /> ORCAMENTO EM ABERTO</span>
            <span><Wrench size={14} /> ETORK LIVE</span>
          </div>
        </div>

        <div className="sales-premium-header-actions">
          <button className="sales-premium-btn ghost sales-premium-btn-back" onClick={() => setScreen('dashboard')}>
            <CalendarClock size={16} /> Voltar
          </button>
          <button className="sales-premium-btn ghost" onClick={clearQuoteForm}>
            Limpar Campos
          </button>
          <button className="sales-premium-btn primary" onClick={() => void handleSendQuote()}>
            <Send size={16} /> Enviar Orcamento
          </button>
          <button className="sales-premium-btn success" onClick={finalizeQuote} disabled={isSaving}>
            <CircleDollarSign size={16} /> {isSaving ? 'Salvando...' : 'Finalizar Orcamento'}
          </button>
        </div>
      </section>

      <section className="container-fluid sales-premium-content sales-premium-content-grid px-0">
        <div className="row g-2 h-100">
          <div className="col-12 col-xl-8 sales-premium-col">
            <div className="card sales-premium-card sales-premium-main-card border-0 h-100">
              <div className="card-body p-3 sales-premium-main-body">
                <div className="row g-2 sales-premium-client-vehicle">
                  <div className="col-12 col-md-7">
                    <div className="card sales-premium-inner border-0 h-100">
                      <div className="card-body p-3">
                        <h6 className="sales-premium-section-title mb-3"><UserRound size={15} /> Cliente</h6>
                        <div className="row g-2">
                          <div className="col-12 col-md-6">
                            <div className="form-floating">
                              <input
                                id="quote-customer-name"
                                list="client-suggestions"
                                className="form-control sales-premium-input"
                                value={quoteData.customer}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  patchQuote({ customer: value });
                                  if (value.trim().toLowerCase() === 'cadastrar novo cliente') {
                                    onQuickCreateClient('quote');
                                  }
                                }}
                                onBlur={(e) => applyMatchedClient('quote', e.target.value)}
                                placeholder="Cliente"
                              />
                              <label htmlFor="quote-customer-name">Cliente</label>
                            </div>
                          </div>
                          <div className="col-12 col-md-6 d-flex align-items-center">
                            <button type="button" className="sales-premium-btn ghost" onClick={() => onQuickCreateClient('quote')}>
                              Cadastrar novo cliente
                            </button>
                          </div>
                          <div className="col-12 col-md-6">
                            <div className="form-floating">
                              <select id="quote-customer-type" className="form-select sales-premium-input" value={quoteData.customerType} onChange={(e) => patchQuote({ customerType: e.target.value })}>
                                <option value={getCustomerTypeLabel(1)}>{getCustomerTypeLabel(1)}</option>
                                <option value={getCustomerTypeLabel(2)}>{getCustomerTypeLabel(2)}</option>
                              </select>
                              <label htmlFor="quote-customer-type">Tipo</label>
                            </div>
                          </div>
                          <div className="col-12 col-md-6">
                            <div className="form-floating">
                              <input id="quote-customer-phone" className="form-control sales-premium-input" value={quoteData.phone} onChange={(e) => patchQuote({ phone: e.target.value })} placeholder="Telefone" />
                              <label htmlFor="quote-customer-phone">Telefone</label>
                            </div>
                          </div>
                          <div className="col-12 col-md-6">
                            <div className="form-floating">
                              <input id="quote-customer-plate" className="form-control sales-premium-input" value={quoteData.plate} onChange={(e) => patchQuote({ plate: e.target.value.toUpperCase() })} onBlur={(e) => onPlateLookup('quote', e.target.value)} onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  onPlateLookup('quote', (e.currentTarget as HTMLInputElement).value);
                                }
                              }} placeholder="Placa" />
                              <label htmlFor="quote-customer-plate">Placa</label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-5">
                    <div className="card sales-premium-inner border-0 h-100">
                      <div className="card-body p-3">
                        <h6 className="sales-premium-section-title mb-3"><CarFront size={15} /> Veiculo</h6>
                        <strong className="sales-premium-vehicle-title d-block">{vehicleModel}</strong>
                        <small className="sales-premium-muted d-block mb-2">{vehicleGear} • {vehicleYear}</small>
                        <textarea id="quote-vehicle-details" className="form-control sales-premium-input sales-premium-note sales-premium-vehicle-note" value={quoteData.vehicle} onChange={(e) => patchQuote({ vehicle: e.target.value })} placeholder="Veiculo" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card sales-premium-inner sales-premium-services-card border-0">
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="sales-premium-section-title mb-0"><Wrench size={15} /> Servicos</h6>
                      <button className="sales-premium-btn ghost" onClick={addItemToQuote}><Plus size={15} /> Adicionar item</button>
                    </div>

                    <div className="sales-premium-table-wrap sales-premium-table-scroller">
                      <div className="sales-premium-table-head">
                        <span>Descricao</span>
                        <span>Qtd</span>
                        <span>Unit.</span>
                        <span>Subtotal</span>
                        <span></span>
                      </div>

                      {quoteData.items.map((item, index) => (
                        <div className="sales-premium-table-row" key={`quote-item-${index}`}>
                          <div>
                            <input id={`quote-item-desc-${index}`} className="form-control sales-premium-input" value={item.description} onChange={(e) => updateItems('quote', index, { description: e.target.value })} placeholder="Descricao" />
                          </div>

                          <div className="sales-premium-stepper">
                            <input id={`quote-item-qty-${index}`} className="form-control sales-premium-input text-center" type="number" min={1} value={item.quantity} onChange={(e) => updateItems('quote', index, { quantity: Math.max(1, Number(e.target.value) || 1) })} placeholder="Qtd" />
                          </div>

                          <div>
                            <input id={`quote-item-price-${index}`} className="form-control sales-premium-input text-end" type="number" min={0} step="0.01" value={item.price} onChange={(e) => updateItems('quote', index, { price: Math.max(0, Number(e.target.value) || 0) })} placeholder="Unitario" />
                          </div>

                          <div className="sales-premium-subtotal">{formatMoney(item.price * item.quantity)}</div>

                          <button className="sales-premium-icon-btn" onClick={() => void handleRemoveQuoteItem(index)} aria-label="Excluir item">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card sales-premium-inner sales-premium-note-card border-0">
                  <div className="card-body p-3">
                    <h6 className="sales-premium-section-title mb-3">Observacoes</h6>
                    <textarea id="quote-note" className="form-control sales-premium-input sales-premium-note" value={quoteData.note} onChange={(e) => patchQuote({ note: e.target.value })} placeholder="Observacoes" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-4 sales-premium-col">
            <div className="sales-premium-side-stack">
              <div className="card sales-premium-card sales-premium-side-card border-0">
                <div className="card-body p-3">
                  <h6 className="sales-premium-section-title mb-3"><CircleDollarSign size={15} /> Financeiro</h6>
                  <div className="sales-premium-total-box">
                    <small>Total do Orcamento</small>
                    <strong>{formatMoney(quoteTotal)}</strong>
                  </div>

                  <div className="sales-premium-metrics mt-3">
                    <div>
                      <span>Subtotal</span>
                      <strong>{formatMoney(quoteSubtotal)}</strong>
                    </div>
                    <div>
                      <span>Desconto</span>
                      <input id="quote-discount" className="form-control sales-premium-input text-end" type="number" min={0} step="0.01" value={quoteData.discount} onChange={(e) => patchQuote({ discount: Math.max(0, Number(e.target.value) || 0) })} placeholder="Desconto" />
                    </div>
                  </div>

                  <div className="sales-premium-status-grid mt-3">
                    <span className="chip blue">ORCAMENTO</span>
                    <span className="chip orange">PENDENTE</span>
                  </div>
                </div>
              </div>

              <div className="card sales-premium-card sales-premium-side-card border-0">
                <div className="card-body p-3">
                  <h6 className="sales-premium-section-title mb-3"><CarFront size={15} /> Dados do Servico</h6>
                  <div className="form-floating">
                    <input id="quote-time-days" className="form-control sales-premium-input" type="number" min={1} value={quoteData.timeDays} onChange={(e) => patchQuote({ timeDays: Math.max(1, Number(e.target.value) || 1) })} placeholder="Tempo" />
                    <label htmlFor="quote-time-days">Tempo (dias)</label>
                  </div>
                </div>
              </div>

              <div className="card sales-premium-card sales-premium-side-card border-0">
                <div className="card-body p-3">
                  <h6 className="sales-premium-section-title mb-3"><Wrench size={15} /> Operacao de Balcao</h6>
                  <div className="sales-premium-pdv-lines">
                    <div><span>Status:</span><strong>Aguardando aprovacao</strong></div>
                    <div><span>Fluxo:</span><strong>Cadastro {'>'} Revisao {'>'} Envio</strong></div>
                    <div><span>Prioridade:</span><strong>Padrao</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function App() {
  const [screen, setScreen] = useState<Screen>('intro-brand');
  const [now, setNow] = useState(() => new Date());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(!isSupabaseConfigured);
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
  const [serviceCatalogData, setServiceCatalogData] = useState<CatalogRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const createEmptyQuoteData = (): QuoteData => ({
    customer: '',
    customerType: getCustomerTypeLabel(1),
    phone: '',
    plate: '',
    vehicle: '',
    items: [],
    discount: 0,
    timeDays: 1,
    note: '',
  });
  const [quoteData, setQuoteData] = useState<QuoteData>({
    ...createEmptyQuoteData(),
  });
 const createEmptyAppointmentData = (): AppointmentData => ({
  date: '',

  customer: '',

  customerType: getCustomerTypeLabel(1),

  phone: '',

  plate: '',

  vehicleDetails: '',

  laborRequired: true,

  timeDays: 1,

  items: [],

  discount: 0,

  paymentMethod: 'PIX',

  note: '',
});

 const [appointmentData, setAppointmentData] =
  useState<ReturnType<typeof createEmptyAppointmentData>>(
    createEmptyAppointmentData()
  );
const createEmptySaleData = (): SaleData => ({
  customer: '',
  customerType: getCustomerTypeLabel(1),

  phone: '',

  plate: '',

  vehicleDetails: '',

  laborRequired: true,

  timeDays: 1,

  items: [],

  discount: 0,

  surcharge: 0,

  paymentMethod: 'PIX',

  note: '',
});

  const [saleData, setSaleData] =
  useState<ReturnType<typeof createEmptySaleData>>(
    createEmptySaleData()
  );
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [savedQuote, setSavedQuote] = useState<SavedQuote | null>(null);
  const [savedAppointment, setSavedAppointment] = useState<SavedAppointment | null>(null);
  const [receiptFilters, setReceiptFilters] = useState({
    customer: '',
    plate: '',
    startDate: '',
    endDate: '',
  });
  const [selectedPrintKind, setSelectedPrintKind] = useState<'orcamento' | 'venda'>('venda');
  const [lastSavedDocumentIds, setLastSavedDocumentIds] = useState<{ orcamento: string | null; venda: string | null }>({
    orcamento: null,
    venda: null,
  });
  const [printSettings, setPrintSettings] = useState<PrintSettings>(() => {
    const stored = window.localStorage.getItem(PRINT_SETTINGS_STORAGE_KEY);
    if (!stored) return { ...defaultPrintSettings };

    try {
      return sanitizePrintSettings(JSON.parse(stored));
    } catch {
      return { ...defaultPrintSettings };
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>([]);
  const [financialSalesRows, setFinancialSalesRows] = useState<FinancialSaleRow[]>([]);
const [financialFilters, setFinancialFilters] =
  useState<FinancialFilters>({
    query: '',

    startDate: '',

    endDate: '',

    kind: 'all',

    paymentStatus: 'all',
  });

  const [reportFilters, setReportFilters] = useState<ReportFilters>({
    query: '',
    startDate: '',
    endDate: '',
    kind: 'all',
  });
  const [financialPage, setFinancialPage] = useState(1);
  const [calendarAppointments, setCalendarAppointments] = useState<CalendarAppointment[]>([]);
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(() => toInputDateValue(new Date()));
  
  // Product Modal State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productModalMode, setProductModalMode] = useState<'add' | 'edit'>('add');
  const [productModalData, setProductModalData] = useState({
    description: '',
    quantity: 1,
    itemType: 'SERVICO' as CatalogItemType,
    priceTable1: 0,
    priceTable2: 0,
  });
  const [productEditingIndex, setProductEditingIndex] = useState<number | null>(null);
  const [catalogPickerOpen, setCatalogPickerOpen] = useState(false);
  const [catalogPickerTarget, setCatalogPickerTarget] = useState<CatalogPickerTarget>('sale');
  const [catalogPickerIndex, setCatalogPickerIndex] = useState(0);
  const [catalogPickerQuantity, setCatalogPickerQuantity] = useState(1);
  const [calendarEditData, setCalendarEditData] = useState<CalendarAppointment | null>(null);
  const [appointmentQuoteSearch, setAppointmentQuoteSearch] = useState('');
  const [appointmentQuoteResults, setAppointmentQuoteResults] = useState<ImportDocumentRow[]>([]);
  const [appointmentSelectedQuoteId, setAppointmentSelectedQuoteId] = useState('');
  const [saleQuoteSearch, setSaleQuoteSearch] = useState('');
  const [saleQuoteResults, setSaleQuoteResults] = useState<ImportDocumentRow[]>([]);
  const [saleSelectedQuoteId, setSaleSelectedQuoteId] = useState('');
  const [saleAppointmentSearch, setSaleAppointmentSearch] = useState('');
  const [saleAppointmentResults, setSaleAppointmentResults] = useState<ImportDocumentRow[]>([]);
  const [saleSelectedAppointmentId, setSaleSelectedAppointmentId] = useState('');
  const [salesHistory, setSalesHistory] = useState<SaleHistoryRow[]>([]);
  const [salesHistoryLoading, setSalesHistoryLoading] = useState(false);
  const [saleReceiptLoading, setSaleReceiptLoading] = useState(false);
  const [selectedSalePrintable, setSelectedSalePrintable] = useState<PrintableDocument | null>(null);
  const [salesHistoryFilters, setSalesHistoryFilters] = useState<SalesHistoryFilters>({
    query: '',
    startDate: '',
    endDate: '',
  });
  const [salesHistoryPage, setSalesHistoryPage] = useState(1);
  const [dashboardServices, setDashboardServices] = useState<DashboardService[]>([]);
  const [dashboardRealDataReady, setDashboardRealDataReady] = useState(false);
  const [selectedDashboardService, setSelectedDashboardService] = useState<DashboardService | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!authInitialized) return;

    if (screen === 'intro-brand') {
      const timer = window.setTimeout(() => setScreen(isAuthenticated ? 'dashboard' : 'auth-login'), 1800);
      return () => window.clearTimeout(timer);
    }

    if (screen === 'intro-system') {
      const timer = window.setTimeout(() => setScreen(isAuthenticated ? 'dashboard' : 'auth-login'), 50);
      return () => window.clearTimeout(timer);
    }
  }, [authInitialized, isAuthenticated, screen]);

  useEffect(() => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path.includes('/reset-password') || hash.includes('type=recovery')) {
      setScreen('auth-reset');
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthInitialized(true);
      return;
    }

    const sb = supabase;
    let active = true;

    sb.auth.getSession().then(({ data }) => {
      if (!active) return;

      const hasSession = Boolean(data.session);
      setIsAuthenticated(hasSession);
      setAuthInitialized(true);
      if (hasSession) {
        setScreen((prev) =>
          prev === 'intro-brand' || prev === 'intro-system' || prev.startsWith('auth-') ? 'dashboard' : prev
        );
      }
    }).catch(() => {
      if (!active) return;
      setIsAuthenticated(false);
      setAuthInitialized(true);
    });

    const { data: authListener } = sb.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthMessage('Defina sua nova senha para concluir a recuperacao.');
        setScreen('auth-reset');
        setAuthInitialized(true);
        return;
      }

      const hasSession = Boolean(session);
      setIsAuthenticated(hasSession);
      setAuthInitialized(true);
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
          prev === 'sales-history' ||
          prev === 'appointment-calendar' ||
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
    if (!authInitialized) return;
    if (isAuthenticated) return;

    if (
      screen === 'dashboard' ||
      screen === 'menu-search' ||
      screen === 'menu-clients' ||
      screen === 'menu-financial' ||
      screen === 'menu-products' ||
      screen === 'menu-reports' ||
      screen === 'sales-history' ||
      screen === 'appointment-calendar' ||
      screen === 'new-quote' ||
      screen === 'new-appointment' ||
      screen === 'new-sale' ||
      screen === 'print-receipt'
    ) {
      setScreen('auth-login');
    }
  }, [authInitialized, isAuthenticated, screen]);

  useEffect(() => {
    if (screen === 'appointment-calendar') {
      setCalendarSelectedDate(toInputDateValue(new Date()));
    }
  }, [screen]);

  useEffect(() => {
    if (screen === 'new-appointment') {
      clearAppointmentForm();
    }
  }, [screen]);

  useEffect(() => {
    if (!isAuthenticated || !isSupabaseConfigured || !supabase) return;

    const sb = supabase;
    let active = true;

    async function loadFromDatabase() {
      setDashboardRealDataReady(false);
      setDashboardServices([]);
      setCalendarAppointments([]);
      setFinancialEntries([]);
      setServiceCatalogData([]);

      const [catalogResult, receiptResult, clientsResult, financialResult, appointmentResult, salesResult] = await Promise.all([
        sb
          .from('service_catalog_v2')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true }),
        sb
          .from('v_receipts_list_v2')
          .select('sale_date, customer_name, vehicle_desc, plate, total_amount')
          .limit(150),
        sb
          .from('clients_v2')
          .select('id, name, phone, plate, city, state, price_table')
          .order('id', { ascending: false }),

sb
  .from('financial_entries_v2')
  .select(`
    id,
    entry_date,
    description,
    amount,
    source_type,
    source_id,
    payment_status
  `)
  .order('id', { ascending: false }),

        sb
          .from('documents_v2')
          .select('id, customer_name_snapshot, phone_snapshot, plate_snapshot, vehicle_snapshot, notes, discount_amount, scheduled_for, total_amount, created_at, status')
          .eq('doc_type', 'agendamento')
          .order('scheduled_for', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false }),
sb
  .from('documents_v2')
  .select(
    'id, customer_name_snapshot, phone_snapshot, plate_snapshot, vehicle_snapshot, notes, subtotal_amount, discount_amount, surcharge_amount, total_amount, service_time_days, labor_required, created_at, payment_method, payment_status'
  )
  .eq('doc_type', 'venda')
          .order('created_at', { ascending: false })
          .limit(250),
      ]);

      if (!active) return;

      if (!catalogResult.error && catalogResult.data && catalogResult.data.length > 0) {
        setServiceCatalogData(
          catalogResult.data.map((item) => ({
            id: normalizeEntityId(item.id),
            itemType: item.item_type === 'PRODUTO' ? 'PRODUTO' : 'SERVICO',
            description: item.name || '',
            priceTable1: Number(item.price_table_1 ?? item.default_price) || 0,
            priceTable2: Number(item.price_table_2 ?? item.default_price) || 0,
            quantity: Number(item.quantity) || 1,
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
      }

      if (!clientsResult.error && clientsResult.data && clientsResult.data.length > 0) {
        const mappedClients: ClientRow[] = clientsResult.data.map((item) => ({
          id: Number(item.id),
          name: item.name || '',
          phone: item.phone || '',
          plate: item.plate || '',
          city: (item as { city?: string | null }).city || '',
          state: (item as { state?: string | null }).state || '',
          priceTable: Number((item as { price_table?: number | null }).price_table) === 2 ? 2 : 1,
        }));
        setClients(mappedClients);
      }

      if (!financialResult.error && financialResult.data && financialResult.data.length > 0) {
   const mappedEntries: FinancialEntry[] = financialResult.data.map((item) => {
  const amount = Number(item.amount) || 0;
  const description = item.description || '';

  return {
    id: Number(item.id),
    date: item.entry_date || new Date().toISOString().slice(0, 10),
    description,
    amount,
    sourceType: item.source_type || null,
    sourceId: item.source_id ? String(item.source_id) : null,

    paymentStatus:
      item.payment_status === 'PAGO'
        ? 'PAGO'
        : 'PENDENTE',

    isNew: false,

    entryKind:
      item.source_type === 'venda'
        ? 'receita'
        : amount < 0
          ? 'despesa'
          : description.trim().toUpperCase().startsWith('DESPESA')
            ? 'despesa'
            : 'receita',
  };
});

setFinancialEntries(mappedEntries);
      }

      if (!salesResult.error && salesResult.data) {
const mappedSales: FinancialSaleRow[] =
salesResult.data.map((item) => ({

    id: String(item.id),

    date: toBrDate(item.created_at || ''),

    createdAtIso: item.created_at || '',

    customer: item.customer_name_snapshot || 'SEM CLIENTE',

    phone: item.phone_snapshot || '',

    plate: item.plate_snapshot || '',

    vehicle: item.vehicle_snapshot || '',

    note: item.notes || '',

    subtotal: Number(item.subtotal_amount) || 0,

    discount: Number(item.discount_amount) || 0,

    surcharge: Number(item.surcharge_amount) || 0,

    total: Number(item.total_amount) || 0,

    timeDays: Number(item.service_time_days) || 0,

    laborRequired:
        typeof item.labor_required === 'boolean'
            ? item.labor_required
            : null,

    paymentMethod:
        item.payment_method || '',

    paymentStatus:
        item.payment_status === 'PAGO'
            ? 'PAGO'
            : 'PENDENTE',
}));
       
        setFinancialSalesRows(mappedSales);
      }

      if (!appointmentResult.error && appointmentResult.data) {
        const mappedAppointments = appointmentResult.data.map((item) => {
          const scheduledDate = item.scheduled_for ? new Date(item.scheduled_for) : null;

          return {
            id: String(item.id),
            dayKey: scheduledDate ? toInputDateValue(scheduledDate) : '',
            date: scheduledDate ? formatBrDateTime(scheduledDate) : '',
            customer: item.customer_name_snapshot || '',
            phone: item.phone_snapshot || '',
            plate: item.plate_snapshot || '',
            vehicleDetails: item.vehicle_snapshot || '',
            note: item.notes || '',
            total: Number(item.total_amount) || 0,
            status: normalizeAppointmentStatus(item.status),
          };
        });
        setCalendarAppointments(mappedAppointments);

        const mappedDashboardServices: DashboardService[] = appointmentResult.data.slice(0, 8).map((item) => {
          const dashboardStatus = normalizeDashboardStatus(item.status);
          return {
            id: `appt-${String(item.id)}`,
            title: (item.vehicle_snapshot || '').split('\n')[0] || item.customer_name_snapshot || 'SERVICO',
            plate: item.plate_snapshot || 'SEM PLACA',
            customer: item.customer_name_snapshot || 'SEM CLIENTE',
            status: dashboardStatus,
            tone: dashboardToneByStatus(dashboardStatus),
            sourceDocumentId: String(item.id),
          };
        });
        setDashboardServices(mappedDashboardServices);
      }

      if (active) {
        setDashboardRealDataReady(true);
      }
    }

    loadFromDatabase().catch(() => {
      if (active) {
        setDashboardRealDataReady(true);
      }
    });

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const shouldWaitDashboardRealData = isAuthenticated && isSupabaseConfigured && !dashboardRealDataReady;

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
  const saleTotal = useMemo(
    () => Math.max(saleSubtotal - saleData.discount + saleData.surcharge, 0),
    [saleSubtotal, saleData.discount, saleData.surcharge]
  );

  const calendarSelectedDateTime = useMemo(() => new Date(`${calendarSelectedDate}T12:00:00`), [calendarSelectedDate]);
  const calendarMonthStart = useMemo(
    () => new Date(calendarSelectedDateTime.getFullYear(), calendarSelectedDateTime.getMonth(), 1),
    [calendarSelectedDateTime]
  );
  const calendarMonthLabel = useMemo(
    () => calendarMonthStart.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    [calendarMonthStart]
  );
  const calendarGridStart = useMemo(() => {
    const start = new Date(calendarMonthStart);
    start.setDate(start.getDate() - start.getDay());
    return start;
  }, [calendarMonthStart]);
  const calendarDays = useMemo(
    () =>
      Array.from({ length: 42 }, (_, index) => {
        const day = new Date(calendarGridStart);
        day.setDate(calendarGridStart.getDate() + index);
        return day;
      }),
    [calendarGridStart]
  );
  const appointmentsByDate = useMemo(
    () =>
      calendarAppointments.reduce<Record<string, CalendarAppointment[]>>((acc, item) => {
        const key = item.dayKey || toCalendarDateKey(item.date);
        if (!key) return acc;
        acc[key] = acc[key] ? [...acc[key], item] : [item];
        return acc;
      }, {}),
    [calendarAppointments]
  );
  const calendarSelectedAppointments = useMemo(
    () => appointmentsByDate[calendarSelectedDate] || [],
    [appointmentsByDate, calendarSelectedDate]
  );
  const calendarTodayKey = toInputDateValue(new Date());

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

  useEffect(() => {
    if (screen !== 'print-receipt') return;
    if (!isSupabaseConfigured || !supabase) return;

    const sb = supabase;
    let active = true;

    async function loadLatestDocumentIds() {
      const { data, error } = await sb
        .from('documents_v2')
        .select('id, doc_type')
        .in('doc_type', ['orcamento', 'venda'])
        .order('id', { ascending: false })
        .limit(50);

      if (!active || error || !data) return;

      const lastQuote = data.find((item) => item.doc_type === 'orcamento');
      const lastSale = data.find((item) => item.doc_type === 'venda');

      setLastSavedDocumentIds((prev) => ({
        orcamento: lastQuote ? String(lastQuote.id) : prev.orcamento,
        venda: lastSale ? String(lastSale.id) : prev.venda,
      }));
    }

    void loadLatestDocumentIds();

    return () => {
      active = false;
    };
  }, [screen]);

  useEffect(() => {
    if (screen !== 'new-sale') return;
    setSaleData(createEmptySaleData());
  }, [screen]);

  useEffect(() => {
    window.localStorage.setItem(PRINT_SETTINGS_STORAGE_KEY, JSON.stringify(printSettings));
  }, [printSettings]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!isSupabaseConfigured || !supabase) return;

    const sb = supabase;
    let active = true;

    async function loadPrintSettings() {
      const { data, error } = await sb
        .from('app_settings_v2')
        .select('setting_value')
        .eq('setting_key', 'print_settings')
        .maybeSingle();

      if (!active || error || !data || !data.setting_value) return;

      setPrintSettings(sanitizePrintSettings(data.setting_value));
    }

    void loadPrintSettings();

    return () => {
      active = false;
    };
  }, [isAuthenticated, isSupabaseConfigured, supabase]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!isSupabaseConfigured || !supabase) return;

    const sb = supabase;
    const timeoutId = window.setTimeout(() => {
      void sb.from('app_settings_v2').upsert(
        {
          setting_key: 'print_settings',
          setting_value: printSettings,
        },
        { onConflict: 'setting_key' }
      );
    }, 650);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isAuthenticated, isSupabaseConfigured, printSettings, supabase]);

  const salesHistoryFromFinancialRows = useMemo<SaleHistoryRow[]>(
    () =>
      financialSalesRows.map((row) => ({
        id: row.id,
        createdAtIso: row.createdAtIso,
        createdAt: row.createdAtIso ? new Date(row.createdAtIso).toLocaleString('pt-BR') : row.date,
        customer: row.customer,
        phone: row.phone,
        plate: row.plate,
        vehicle: row.vehicle,
        subtotal: row.subtotal,
        discount: row.discount,
        surcharge: row.surcharge,
        total: row.total,
        note: row.note,
        timeDays: row.timeDays || 1,
        laborRequired: row.laborRequired ?? false,
        paymentMethod: row.paymentMethod,
        paymentStatus: row.paymentStatus,
      })),
    [financialSalesRows]
  );

  const salesHistoryFromFinancialEntries = useMemo<SaleHistoryRow[]>(() => {
    const documentSaleIds = new Set(salesHistoryFromFinancialRows.map((row) => row.id));

    return financialEntries
      .filter((entry) => entry.sourceType === 'venda' || entry.description.trim().toUpperCase().startsWith('VENDA #'))
      .filter((entry) => Number(entry.amount) > 0)
      .map((entry) => {
        const sourceId = entry.sourceId || `FIN-${entry.id}`;
        const descriptionMatch = entry.description.match(/^VENDA\s+#([^\s]+)\s+-\s+(.+)$/i);
        const customer = descriptionMatch?.[2]?.trim() || entry.description.replace(/^VENDA\s+#?[^\s]*\s*-?\s*/i, '').trim() || 'SEM CLIENTE';

return {
  id: sourceId,
  createdAtIso: entry.date ? `${entry.date}T12:00:00` : '',
  createdAt: entry.date ? new Date(`${entry.date}T12:00:00`).toLocaleString('pt-BR') : '',
  customer,
  phone: '',
  plate: '',
  vehicle: '',
  subtotal: Number(entry.amount) || 0,
  discount: 0,
  surcharge: 0,
  total: Number(entry.amount) || 0,
  note: entry.description,
  timeDays: 1,
  laborRequired: false,

  paymentMethod: '',
  paymentStatus: entry.paymentStatus,
};
      })
      .filter((row) => !documentSaleIds.has(row.id))
      .sort((a, b) => {
        const aDate = a.createdAtIso ? new Date(a.createdAtIso).getTime() : 0;
        const bDate = b.createdAtIso ? new Date(b.createdAtIso).getTime() : 0;
        return bDate - aDate;
      });
  }, [financialEntries, salesHistoryFromFinancialRows]);

  const fallbackSalesHistory = useMemo(
    () => [...salesHistoryFromFinancialRows, ...salesHistoryFromFinancialEntries],
    [salesHistoryFromFinancialEntries, salesHistoryFromFinancialRows]
  );

  useEffect(() => {
    if (screen !== 'sales-history') return;

    let active = true;

    async function loadSalesHistory() {
      setSalesHistoryLoading(true);
      setSalesHistory(fallbackSalesHistory);

      if (!isAuthenticated || !isSupabaseConfigured || !supabase) {
        if (!active) return;
        setSalesHistoryLoading(false);
        return;
      }

      const sb = supabase;
      const { data, error } = await sb
        .from('documents_v2')
        .select(
          'id, created_at, customer_name_snapshot, phone_snapshot, plate_snapshot, vehicle_snapshot, subtotal_amount, discount_amount, surcharge_amount, total_amount, notes, service_time_days, labor_required, payment_method, payment_status'
        )
        .eq('doc_type', 'venda')
        .order('created_at', { ascending: false })
        .limit(200);

      if (!active) return;

      if (error || !data) {
        setSalesHistory(fallbackSalesHistory);
        setSalesHistoryLoading(false);
        return;
      }

     const mapped: SaleHistoryRow[] = data.map((row) => ({
  id: String(row.id),

  createdAtIso: row.created_at || '',

  createdAt: row.created_at
    ? new Date(row.created_at).toLocaleString('pt-BR')
    : '',

  customer: row.customer_name_snapshot || 'SEM CLIENTE',

  phone: row.phone_snapshot || '',

  plate: row.plate_snapshot || '',

  vehicle: row.vehicle_snapshot || '',

  subtotal: Number(row.subtotal_amount) || 0,

  discount: Number(row.discount_amount) || 0,

  surcharge: Number(row.surcharge_amount) || 0,

  total: Number(row.total_amount) || 0,

  note: row.notes || '',

  timeDays: Number(row.service_time_days) || 1,

  laborRequired: Boolean(row.labor_required),

  paymentMethod: row.payment_method || '',

  paymentStatus:
    row.payment_status === 'PAGO'
      ? 'PAGO'
      : 'PENDENTE',
}));

      setSalesHistory(mapped.length > 0 ? mapped : fallbackSalesHistory);
      setSalesHistoryLoading(false);
    }

    void loadSalesHistory();

    return () => {
      active = false;
    };
  }, [screen, fallbackSalesHistory, isAuthenticated, isSupabaseConfigured, supabase]);

  const printableDocuments = useMemo<PrintableDocument[]>(() => {
    const nowStamp = now.toLocaleString('pt-BR');
    const quoteSource = savedQuote || quoteData;
    const saleVehicleFirstLine = saleData.vehicleDetails.split('\n')[0] || saleData.vehicleDetails;
    const quoteId = lastSavedDocumentIds.orcamento;
    const saleId = lastSavedDocumentIds.venda;
    const quoteNumber = quoteId ? `ORC-${String(quoteId).slice(0, 8).toUpperCase()}` : `ORC-${savedQuote ? 'ATUAL' : 'RASCUNHO'}`;
    const saleNumber = saleId ? `VEN-${String(saleId).slice(0, 8).toUpperCase()}` : 'VEN-RASCUNHO';

    return [
      {
        kind: 'orcamento',
        number: quoteNumber,
        issuedAt: nowStamp,
        customer: quoteSource.customer,
        customerType: quoteSource.customerType,
        phone: quoteSource.phone,
        plate: quoteSource.plate,
        vehicle: quoteSource.vehicle,
        items: cloneItems(quoteSource.items),
        subtotal: quoteSource.items.reduce((acc, item) => acc + item.price * item.quantity, 0),
        discount: quoteSource.discount,
        total: Math.max(quoteSource.items.reduce((acc, item) => acc + item.price * item.quantity, 0) - quoteSource.discount, 0),
        note: quoteSource.note,
        serviceTimeDays: quoteSource.timeDays,
        laborRequired: null,
        paymentMethod: '',
      },
      {
        kind: 'venda',
        number: saleNumber,
        issuedAt: `${receipts[0]?.date || now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })}`,
        customer: saleData.customer,
        customerType: saleData.customerType,
        phone: saleData.phone,
        plate: saleData.plate,
        vehicle: saleData.vehicleDetails || saleVehicleFirstLine,
        items: cloneItems(saleData.items),
        subtotal: saleSubtotal,
        discount: saleData.discount,
        total: saleTotal,
        note: saleData.note,
        serviceTimeDays: saleData.timeDays,
        laborRequired: saleData.laborRequired,
        paymentMethod: saleData.paymentMethod,
      },
    ];
  }, [lastSavedDocumentIds.orcamento, lastSavedDocumentIds.venda, now, quoteData, receipts, saleData, saleSubtotal, saleTotal, savedQuote]);

  const selectedPrintableDocument = useMemo(
    () => printableDocuments.find((doc) => doc.kind === selectedPrintKind) || printableDocuments[0] || null,
    [printableDocuments, selectedPrintKind]
  );

  const filteredSalesHistory = useMemo(() => {
    const query = salesHistoryFilters.query.trim().toLowerCase();
    const start = salesHistoryFilters.startDate ? new Date(`${salesHistoryFilters.startDate}T00:00:00`) : null;
    const end = salesHistoryFilters.endDate ? new Date(`${salesHistoryFilters.endDate}T23:59:59.999`) : null;

    return salesHistory.filter((row) => {
      const matchesQuery =
        !query ||
        String(row.id).includes(query) ||
        row.customer.toLowerCase().includes(query) ||
        row.phone.toLowerCase().includes(query) ||
        row.plate.toLowerCase().includes(query) ||
        row.vehicle.toLowerCase().includes(query);

      const parsedFromIso = row.createdAtIso ? new Date(row.createdAtIso) : null;
      const parsedFromLabel = parseBrDate(row.createdAt);
      const rowDate = parsedFromIso && !Number.isNaN(parsedFromIso.getTime()) ? parsedFromIso : parsedFromLabel;

      if ((start || end) && !rowDate) return false;
      if (start && rowDate && rowDate < start) return false;
      if (end && rowDate && rowDate > end) return false;

      return matchesQuery;
    });
  }, [salesHistory, salesHistoryFilters]);

  const salesHistoryTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredSalesHistory.length / SALES_HISTORY_PAGE_SIZE)),
    [filteredSalesHistory.length]
  );

  const pagedSalesHistory = useMemo(() => {
    const startIndex = (salesHistoryPage - 1) * SALES_HISTORY_PAGE_SIZE;
    return filteredSalesHistory.slice(startIndex, startIndex + SALES_HISTORY_PAGE_SIZE);
  }, [filteredSalesHistory, salesHistoryPage]);

  const filteredClients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(query) ||
        client.phone.toLowerCase().includes(query) ||
        client.plate.toLowerCase().includes(query) ||
        (client.city || '').toLowerCase().includes(query) ||
        (client.state || '').toLowerCase().includes(query)
    );
  }, [clients, searchQuery]);

  const clientsTable1 = useMemo(
    () => filteredClients.filter((client) => client.priceTable === 1),
    [filteredClients]
  );

  const clientsTable2 = useMemo(
    () => filteredClients.filter((client) => client.priceTable === 2),
    [filteredClients]
  );

  const filteredProducts = useMemo(() => {
    const query = productSearchQuery.trim().toLowerCase();
    if (!query) return serviceCatalogData;
    return serviceCatalogData.filter((item) => item.description.toLowerCase().includes(query));
  }, [serviceCatalogData, productSearchQuery]);

  const filteredFinancialEntries = useMemo(() => {
    const query = financialFilters.query.trim().toLowerCase();
    const start = financialFilters.startDate ? new Date(`${financialFilters.startDate}T00:00:00`) : null;
    const end = financialFilters.endDate ? new Date(`${financialFilters.endDate}T23:59:59.999`) : null;

    return financialEntries
      .filter((entry) => {
        const matchesQuery =
          !query ||
          entry.description.toLowerCase().includes(query) ||
          entry.date.toLowerCase().includes(query) ||
          String(entry.id).includes(query);

        const entryKind = resolveFinancialKind(entry);
        const matchesKind =
          entry.isNew ||
          financialFilters.kind === 'all' ||
          (financialFilters.kind === 'receita' && entryKind === 'receita') ||
          (financialFilters.kind === 'despesa' && entryKind === 'despesa');
        const matchesPaymentStatus =
          financialFilters.paymentStatus === 'all' ||
          entry.paymentStatus === financialFilters.paymentStatus;
        const entryDate = new Date(`${entry.date}T12:00:00`);
        if (Number.isNaN(entryDate.getTime())) return false;

        if (start && entryDate < start) return false;
        if (end && entryDate > end) return false;

        return matchesQuery && matchesKind && matchesPaymentStatus;
      })
      .sort((a, b) => {
        const dateDiff = new Date(`${b.date}T12:00:00`).getTime() - new Date(`${a.date}T12:00:00`).getTime();
        if (dateDiff !== 0) return dateDiff;
        return b.id - a.id;
      });
  }, [financialEntries, financialFilters]);

  const financialSummary = useMemo(() => {
    const income = filteredFinancialEntries.reduce((acc, entry) => (
      resolveFinancialKind(entry) === 'receita' ? acc + Math.abs(entry.amount) : acc
    ), 0);
    const expense = filteredFinancialEntries.reduce((acc, entry) => (
      resolveFinancialKind(entry) === 'despesa' ? acc + Math.abs(entry.amount) : acc
    ), 0);
    const balance = income - expense;
    const incomeCount = filteredFinancialEntries.filter((entry) => resolveFinancialKind(entry) === 'receita').length;
    const expenseCount = filteredFinancialEntries.filter((entry) => resolveFinancialKind(entry) === 'despesa').length;
    const averageTicket = incomeCount > 0 ? income / incomeCount : 0;

    return {
      totalEntries: filteredFinancialEntries.length,
      income,
      expense,
      balance,
      incomeCount,
      expenseCount,
      averageTicket,
    };
  }, [filteredFinancialEntries]);

  const financialTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredFinancialEntries.length / FINANCIAL_PAGE_SIZE)),
    [filteredFinancialEntries.length]
  );

  const pagedFinancialEntries = useMemo(() => {
    const startIndex = (financialPage - 1) * FINANCIAL_PAGE_SIZE;
    return filteredFinancialEntries.slice(startIndex, startIndex + FINANCIAL_PAGE_SIZE);
  }, [filteredFinancialEntries, financialPage]);

  const financialRunningBalanceById = useMemo(() => {
    const byDateAsc = [...filteredFinancialEntries].sort((a, b) => {
      const dateDiff = new Date(`${a.date}T12:00:00`).getTime() - new Date(`${b.date}T12:00:00`).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.id - b.id;
    });

    let running = 0;
    const map = new Map<number, number>();
    byDateAsc.forEach((entry) => {
      running += entry.amount;
      map.set(entry.id, running);
    });

    return map;
  }, [filteredFinancialEntries]);

  const pagedFinancialRows = useMemo(
    () =>
      pagedFinancialEntries.map((entry) => ({
        ...entry,
        kindLabel: resolveFinancialKind(entry) === 'despesa' ? 'DESPESA' : 'RECEITA',
        runningBalance: financialRunningBalanceById.get(entry.id) ?? entry.amount,
        isSaleLinked: entry.sourceType === 'venda' && Boolean(entry.sourceId),
      })),
    [financialRunningBalanceById, pagedFinancialEntries]
  );

  const effectiveFinancialSalesRows = useMemo(() => {
    return financialSalesRows;
  }, [financialSalesRows]);

  const filteredFinancialSalesRows = useMemo(() => {
    if (financialFilters.kind === 'despesa') return [];

    const query = financialFilters.query.trim();
    const start = financialFilters.startDate ? new Date(`${financialFilters.startDate}T00:00:00`) : null;
    const end = financialFilters.endDate ? new Date(`${financialFilters.endDate}T23:59:59.999`) : null;

    return effectiveFinancialSalesRows
      .filter((row) => {
        const rowDate = row.createdAtIso ? new Date(row.createdAtIso) : parseBrDate(row.date);

        if ((start || end) && !rowDate) return false;
        if (start && rowDate && rowDate < start) return false;
        if (end && rowDate && rowDate > end) return false;

        if (
financialFilters.paymentStatus !== 'all' &&
row.paymentStatus !== financialFilters.paymentStatus
) {
    return false;
}

        if (!query) return true;

        return matchesSearchTokens(
          [
            row.id,
            row.date,
            row.createdAtIso,
            row.customer,
            row.phone,
            row.plate,
            row.vehicle,
            row.note,
            String(row.timeDays),
            row.laborRequired === null ? '' : row.laborRequired ? 'SIM' : 'NAO',
            ...getMoneySearchValues(row.subtotal),
            ...getMoneySearchValues(row.discount),
            ...getMoneySearchValues(row.surcharge),
            ...getMoneySearchValues(row.total),
          ],
          query
        );
      })
      .sort((a, b) => {
        const aDate = a.createdAtIso ? new Date(a.createdAtIso).getTime() : parseBrDate(a.date)?.getTime() || 0;
        const bDate = b.createdAtIso ? new Date(b.createdAtIso).getTime() : parseBrDate(b.date)?.getTime() || 0;
        return bDate - aDate;
      });
  }, [effectiveFinancialSalesRows, financialFilters.endDate, financialFilters.kind, financialFilters.paymentStatus, financialFilters.query, financialFilters.startDate]);

  const financialSalesTotal = useMemo(
    () => filteredFinancialSalesRows.reduce((acc, row) => acc + row.total, 0),
    [filteredFinancialSalesRows]
  );

  const financialPageRangeLabel = useMemo(() => {
    if (filteredFinancialEntries.length === 0) return '0-0';
    const from = (financialPage - 1) * FINANCIAL_PAGE_SIZE + 1;
    const to = Math.min(financialPage * FINANCIAL_PAGE_SIZE, filteredFinancialEntries.length);
    return `${from}-${to}`;
  }, [filteredFinancialEntries.length, financialPage]);

  const financialTotal = useMemo(
    () => financialEntries.reduce((acc, entry) => acc + entry.amount, 0),
    [financialEntries]
  );

  const dashboardKpis = useMemo(() => {
    const todayKey = toInputDateValue(new Date());
    const todayAppointments = calendarAppointments.filter((appointment) => appointment.dayKey === todayKey);
    const confirmedToday = todayAppointments.filter((appointment) => appointment.status === 'CONFIRMADO').length;
    const canceledToday = todayAppointments.filter((appointment) => appointment.status === 'CANCELADO').length;
    const todayRevenue = financialEntries.reduce((acc, entry) => {
      if (resolveFinancialKind(entry) !== 'receita') return acc;
      const dateKey = toInputDateValue(new Date(`${entry.date}T12:00:00`));
      if (dateKey !== todayKey) return acc;
      return acc + Math.abs(Number(entry.amount) || 0);
    }, 0);

    return {
      todayAppointments: todayAppointments.length,
      confirmedToday,
      canceledToday,
      todayRevenue,
    };
  }, [calendarAppointments, financialEntries]);

  const lowStockItems = useMemo(
    () => serviceCatalogData.filter((item) => Number(item.quantity) <= 2).slice(0, 6),
    [serviceCatalogData]
  );

  const filteredReportEntries = useMemo(() => {
    const query = reportFilters.query.trim();
    const start = reportFilters.startDate ? new Date(`${reportFilters.startDate}T00:00:00`) : null;
    const end = reportFilters.endDate ? new Date(`${reportFilters.endDate}T23:59:59.999`) : null;

    return financialEntries.filter((entry) => {
      const entryKind = resolveFinancialKind(entry);
      if (reportFilters.kind !== 'all' && entryKind !== reportFilters.kind) return false;

      const entryDate = new Date(`${entry.date}T12:00:00`);
      if (Number.isNaN(entryDate.getTime())) return false;
      if (start && entryDate < start) return false;
      if (end && entryDate > end) return false;

      if (!query) return true;
      

      return matchesSearchTokens(
        [
          String(entry.id),
          entry.date,
          entry.description,
          entryKind,
          ...getMoneySearchValues(entry.amount),
        ],
        query
      );
    });
  }, [financialEntries, reportFilters]);

  const reportIncomeTotal = useMemo(
    () => filteredReportEntries.reduce((acc, entry) => (resolveFinancialKind(entry) === 'receita' ? acc + Math.abs(Number(entry.amount) || 0) : acc), 0),
    [filteredReportEntries]
  );

  const reportExpenseTotal = useMemo(
    () => filteredReportEntries.reduce((acc, entry) => (resolveFinancialKind(entry) === 'despesa' ? acc + Math.abs(Number(entry.amount) || 0) : acc), 0),
    [filteredReportEntries]
  );

  const reportBalance = useMemo(() => reportIncomeTotal - reportExpenseTotal, [reportExpenseTotal, reportIncomeTotal]);

  useEffect(() => {
    setFinancialPage(1);
  }, [financialFilters.query, financialFilters.startDate, financialFilters.endDate, financialFilters.kind, financialFilters.paymentStatus]);

  useEffect(() => {
    setFinancialPage((current) => Math.min(current, financialTotalPages));
  }, [financialTotalPages]);

  useEffect(() => {
    setSalesHistoryPage(1);
  }, [salesHistoryFilters.query, salesHistoryFilters.startDate, salesHistoryFilters.endDate]);

  useEffect(() => {
    setSalesHistoryPage((current) => Math.min(current, salesHistoryTotalPages));
  }, [salesHistoryTotalPages]);

  const nextAppointmentCards = useMemo(() => {
    const currentTime = new Date().getTime();

    return calendarAppointments
      .filter((appointment) => appointment.status !== 'CANCELADO')
      .map((appointment) => ({
        appointment,
        scheduledAt: parseBrDateTime(appointment.date),
      }))
      .filter((item) => item.scheduledAt && item.scheduledAt.getTime() >= currentTime)
      .sort((a, b) => (a.scheduledAt?.getTime() || 0) - (b.scheduledAt?.getTime() || 0))
      .slice(0, 3)
      .map(({ appointment }) => ({
        id: appointment.id,
        model: appointment.vehicleDetails.split('\n')[0] || 'SEM VEICULO',
        plate: appointment.plate || 'SEM PLACA',
        date: appointment.date,
      }));
  }, [calendarAppointments, now]);

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

  function findClientMatch(raw: string) {
    const value = raw.trim().toLowerCase();
    if (!value) return null;
    return (
      clients.find(
        (client) =>
          client.name.toLowerCase() === value ||
          client.phone.toLowerCase() === value ||
          client.plate.toLowerCase() === value
      ) || null
    );
  }

  function getSelectedPriceTable(customerType: string) {
    return getCustomerPriceTable(customerType);
  }

  function applyClientToTarget(target: 'quote' | 'appointment' | 'sale', client: ClientRow) {
    const customerType = getCustomerTypeLabel(client.priceTable);

    if (target === 'quote') {
      setQuoteData((prev) => ({
        ...prev,
        customer: client.name,
        customerType,
        phone: client.phone,
        plate: client.plate,
      }));
      return;
    }

    if (target === 'appointment') {
      setAppointmentData((prev) => ({
        ...prev,
        customer: client.name,
        customerType,
        phone: client.phone,
        plate: client.plate,
      }));
      return;
    }

    setSaleData((prev) => ({
      ...prev,
      customer: client.name,
      customerType,
      phone: client.phone,
      plate: client.plate,
    }));
  }

  function getDraftClientByTarget(target: 'quote' | 'appointment' | 'sale') {
    if (target === 'quote') {
      return {
        name: quoteData.customer,
        phone: quoteData.phone,
        plate: quoteData.plate,
        price_table: getSelectedPriceTable(quoteData.customerType),
      };
    }

    if (target === 'appointment') {
      return {
        name: appointmentData.customer,
        phone: appointmentData.phone,
        plate: appointmentData.plate,
        price_table: getSelectedPriceTable(appointmentData.customerType),
      };
    }

    return {
      name: saleData.customer,
      phone: saleData.phone,
      plate: saleData.plate,
      price_table: getSelectedPriceTable(saleData.customerType),
    };
  }

  async function createClientRecord(payload: {
    name: string;
    phone: string;
    plate: string;
    price_table: number;
    city?: string;
    state?: string;
  }) {
    if (!isSupabaseConfigured || !supabase) {
      return null;
    }

    const basePayload = {
      name: payload.name,
      phone: payload.phone,
      plate: payload.plate,
      price_table: payload.price_table,
    };

    const withLocationPayload = {
      ...basePayload,
      city: payload.city || null,
      state: payload.state || null,
    };

    let { data, error } = await supabase
      .from('clients_v2')
      .insert(withLocationPayload)
      .select('id, name, phone, plate, price_table')
      .single();

    if (error) {
      const normalizedMessage = (error.message || '').toLowerCase();
      const missingLocationColumn =
        normalizedMessage.includes("column 'city'") ||
        normalizedMessage.includes("column 'state'") ||
        normalizedMessage.includes('city does not exist') ||
        normalizedMessage.includes('state does not exist');

      if (missingLocationColumn) {
        const fallbackResult = await supabase
          .from('clients_v2')
          .insert(basePayload)
          .select('id, name, phone, plate, price_table')
          .single();

        data = fallbackResult.data;
        error = fallbackResult.error;
      }
    }

    if (error || !data) return null;

    const dbClient: ClientRow = {
      id: Number(data.id),
      name: data.name || payload.name,
      phone: data.phone || payload.phone,
      plate: data.plate || payload.plate,
      priceTable: Number(data.price_table) === 2 ? 2 : 1,
      city: payload.city || '',
      state: payload.state || '',
    };

    return dbClient;
  }

  async function openQuickClientModal(target: 'quote' | 'appointment' | 'sale') {
    if (!isSupabaseConfigured || !supabase) {
      window.alert('Cadastro rapido exige Supabase configurado.');
      return;
    }

    const draft = getDraftClientByTarget(target);
    const result = await Swal.fire({
      title: 'Cadastrar novo cliente',
      html: `
        <input id="swal-client-name" class="swal2-input" placeholder="Nome" value="${escapeHtml(draft.name || '')}" />
        <input id="swal-client-phone" class="swal2-input" placeholder="Telefone" value="${escapeHtml(draft.phone || '')}" />
        <input id="swal-client-plate" class="swal2-input" placeholder="Placa" value="${escapeHtml((draft.plate || '').toUpperCase())}" />
        <input id="swal-client-city" class="swal2-input" placeholder="Cidade" />
        <input id="swal-client-state" class="swal2-input" placeholder="Estado (UF)" maxlength="2" />
        <select id="swal-client-price-table" class="swal2-select">
          <option value="1" ${draft.price_table === 1 ? 'selected' : ''}>Tabela 1 - Cliente Final</option>
          <option value="2" ${draft.price_table === 2 ? 'selected' : ''}>Tabela 2 - Franqueado</option>
        </select>
      `,
      showCancelButton: true,
      confirmButtonText: 'Salvar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#000000',
      color: '#ffffff',
      focusConfirm: false,
      didOpen: () => {
        const confirmButton = Swal.getConfirmButton();
        if (confirmButton) {
          confirmButton.style.backgroundColor = '#000000';
          confirmButton.style.color = '#ffffff';
          confirmButton.style.border = '1px solid #111111';
        }
      },
      preConfirm: () => {
        const nameInput = document.getElementById('swal-client-name') as HTMLInputElement | null;
        const phoneInput = document.getElementById('swal-client-phone') as HTMLInputElement | null;
        const plateInput = document.getElementById('swal-client-plate') as HTMLInputElement | null;
        const cityInput = document.getElementById('swal-client-city') as HTMLInputElement | null;
        const stateInput = document.getElementById('swal-client-state') as HTMLInputElement | null;
        const priceTableInput = document.getElementById('swal-client-price-table') as HTMLSelectElement | null;

        const name = nameInput?.value.trim() || '';
        const phone = phoneInput?.value.trim() || '';
        const plate = (plateInput?.value || '').toUpperCase().trim();
        const city = cityInput?.value.trim() || '';
        const state = (stateInput?.value || '').trim().toUpperCase();
        const parsedTable = Number(priceTableInput?.value || draft.price_table);
        const price_table = parsedTable === 2 ? 2 : 1;

        if (!name) {
          Swal.showValidationMessage('Informe o nome do cliente.');
          return null;
        }

        if (!phone) {
          Swal.showValidationMessage('Informe o telefone do cliente.');
          return null;
        }

        if (!plate) {
          Swal.showValidationMessage('Informe a placa do cliente.');
          return null;
        }

        if (!city) {
          Swal.showValidationMessage('Informe a cidade do cliente.');
          return null;
        }

        if (!state) {
          Swal.showValidationMessage('Informe o estado (UF) do cliente.');
          return null;
        }

        return {
          name,
          phone,
          plate,
          city,
          state,
          price_table,
        };
      },
    });

    if (!result.isConfirmed || !result.value) return;

    const dbClient = await createClientRecord({
      name: result.value.name,
      phone: result.value.phone,
      plate: result.value.plate,
      city: result.value.city,
      state: result.value.state,
      price_table: result.value.price_table,
    });

    if (!dbClient) {
      window.alert('Nao foi possivel salvar cliente no banco.');
      return;
    }

    setClients((prev) => [dbClient, ...prev]);
    applyClientToTarget(target, dbClient);
  }

  function applyMatchedClient(target: 'quote' | 'appointment' | 'sale', customerValue: string) {
    if (customerValue.trim().toLowerCase() === 'cadastrar novo cliente') {
      void openQuickClientModal(target);
      return;
    }

    const client = findClientMatch(customerValue);
    if (!client) return;
    applyClientToTarget(target, client);
  }

  function normalizePlateForLookup(raw: string) {
    return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
  }

  function buildVehicleDetailsFromLookup(payload: unknown) {
    function parseToObject(value: unknown): Record<string, unknown> | null {
      if (!value) return null;
      if (Array.isArray(value)) {
        return parseToObject(value[0]);
      }
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return null;
        try {
          return parseToObject(JSON.parse(trimmed));
        } catch {
          return null;
        }
      }
      if (typeof value === 'object') {
        return value as Record<string, unknown>;
      }
      return null;
    }

    const root = parseToObject(payload);
    if (!root) return null;

    const source =
      parseToObject(root.data) ||
      parseToObject(root.resultado) ||
      root;

    const row = source;
    const extra = parseToObject(row.extra);

    function pickString(obj: Record<string, unknown> | null, keys: string[]) {
      if (!obj) return '';
      const normalizedEntries = Object.entries(obj).map(([key, value]) => [key.toLowerCase(), value] as const);
      for (const key of keys) {
        const targetKey = key.toLowerCase();
        const match = normalizedEntries.find(([entryKey]) => entryKey === targetKey);
        if (!match) continue;
        const value = match[1];
        if (typeof value === 'string' && value.trim()) return value.trim();
        if (typeof value === 'number') return String(value);
      }
      return '';
    }

    const brand = pickString(row, ['marca']) || pickString(extra, ['marca']);
    const model =
      pickString(row, ['modelo', 'model', 'veiculo', 'vehicle', 'descricao', 'modelocompleto', 'marcamodelo']) ||
      pickString(extra, ['modelo', 'marcamodelo', 'grupo']);
    const subModel = pickString(row, ['submodelo']) || pickString(extra, ['submodelo']);
    const version = pickString(row, ['versao']) || pickString(extra, ['versao']);
    const fuel = pickString(row, ['combustivel', 'fuel']) || pickString(extra, ['combustivel']);
    const yearModel = pickString(row, ['anomodelo', 'ano_modelo', 'ano', 'year']) || pickString(extra, ['ano_modelo', 'anomodelo']);
    const yearBuild = pickString(extra, ['ano_fabricacao', 'anofabricacao']);
    const color = pickString(row, ['cor']) || pickString(extra, ['cor']);
    const city = pickString(row, ['municipio']) || pickString(extra, ['municipio']);
    const uf = pickString(row, ['uf']) || pickString(extra, ['uf', 'uf_placa']);
    const plate = pickString(row, ['placa']) || pickString(extra, ['placa', 'placa_modelo_novo', 'placa_modelo_antigo']);

    const modelLine = [brand, model, subModel, version]
      .filter(Boolean)
      .filter((value, index, arr) => arr.indexOf(value) === index)
      .join(' ')
      .trim();

    const firstLine = modelLine || model || brand;
    const yearLine =
      yearBuild && yearModel
        ? `${yearBuild}/${yearModel}`
        : yearModel || yearBuild;

    const lines = [
      firstLine,
      yearLine,
      fuel,
      color,
      [city, uf].filter(Boolean).join(' - ').trim(),
      plate ? `PLACA: ${plate}` : '',
    ].filter(Boolean);

    return lines.length > 0 ? lines.join('\n') : null;
  }

  async function fetchVehicleDetailsByPlate(plateValue: string) {
    if (!plateLookupApiUrl || !plateLookupApiToken) return null;

    const normalizedPlate = normalizePlateForLookup(plateValue);
    if (normalizedPlate.length < 7) return null;

    const hasPlatePlaceholder = plateLookupApiUrl.includes('{placa}');
    const hasTokenPlaceholder = plateLookupApiUrl.includes('{token}');
    let requestUrl = plateLookupApiUrl;

    if (hasPlatePlaceholder) {
      requestUrl = requestUrl.replace('{placa}', encodeURIComponent(normalizedPlate));
    }

    if (hasTokenPlaceholder) {
      requestUrl = requestUrl.replace('{token}', encodeURIComponent(plateLookupApiToken));
    }

    if (!hasPlatePlaceholder && !hasTokenPlaceholder) {
      try {
        const url = new URL(requestUrl);
        if (!url.searchParams.has('placa')) {
          url.searchParams.set('placa', normalizedPlate);
        }
        if (!url.searchParams.has('token')) {
          url.searchParams.set('token', plateLookupApiToken);
        }
        requestUrl = url.toString();
      } catch {
        requestUrl = `${requestUrl}${requestUrl.includes('?') ? '&' : '?'}placa=${encodeURIComponent(normalizedPlate)}&token=${encodeURIComponent(plateLookupApiToken)}`;
      }
    }

    const fallbackUrls = [requestUrl];

    if (requestUrl.startsWith('/.netlify/functions/plate-lookup')) {
      fallbackUrls.push(`/api/plate-lookup?placa=${encodeURIComponent(normalizedPlate)}&token=${encodeURIComponent(plateLookupApiToken)}`);
      fallbackUrls.push(`/api-placas/consulta/${encodeURIComponent(normalizedPlate)}/${encodeURIComponent(plateLookupApiToken)}`);
      fallbackUrls.push(`https://wdapi2.com.br/consulta/${encodeURIComponent(normalizedPlate)}/${encodeURIComponent(plateLookupApiToken)}`);
    } else if (requestUrl.startsWith('/api-placas/')) {
      fallbackUrls.push(`/api/plate-lookup?placa=${encodeURIComponent(normalizedPlate)}&token=${encodeURIComponent(plateLookupApiToken)}`);
      fallbackUrls.push(`https://wdapi2.com.br/${requestUrl.slice('/api-placas/'.length)}`);
    } else if (requestUrl.startsWith('/api/plate-lookup')) {
      fallbackUrls.push(`/api-placas/consulta/${encodeURIComponent(normalizedPlate)}/${encodeURIComponent(plateLookupApiToken)}`);
      fallbackUrls.push(`https://wdapi2.com.br/consulta/${encodeURIComponent(normalizedPlate)}/${encodeURIComponent(plateLookupApiToken)}`);
    } else if (requestUrl.includes('wdapi2.com.br/')) {
      fallbackUrls.push(requestUrl.replace('https://wdapi2.com.br/', '/api-placas/'));
      fallbackUrls.push(`/api/plate-lookup?placa=${encodeURIComponent(normalizedPlate)}&token=${encodeURIComponent(plateLookupApiToken)}`);
    }

    const uniqueUrls = [...new Set(fallbackUrls)];

    for (const url of uniqueUrls) {
      try {
        const response = await fetch(url);
        if (!response.ok) continue;

        let data: unknown;
        const contentType = response.headers.get('content-type') || '';

        if (contentType.toLowerCase().includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          try {
            data = JSON.parse(text);
          } catch {
            continue;
          }
        }

        const details = buildVehicleDetailsFromLookup(data);
        if (details) return details;
      } catch {
        continue;
      }
    }

    return null;
  }

  function showPlateLookupSuccessToast() {
    void Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Dados do veiculo carregados',
      showConfirmButton: false,
      timer: 1400,
      timerProgressBar: true,
      background: '#111827',
      color: '#f3f4f6',
    });
  }

  async function handlePlateLookup(target: 'quote' | 'appointment' | 'sale', plateValue: string) {
    const details = await fetchVehicleDetailsByPlate(plateValue);
    if (!details) return;

    showPlateLookupSuccessToast();

    if (target === 'quote') {
      setQuoteData((prev) => ({ ...prev, vehicle: details }));
      return;
    }

    if (target === 'appointment') {
      setAppointmentData((prev) => ({ ...prev, vehicleDetails: details }));
      return;
    }

    setSaleData((prev) => ({ ...prev, vehicleDetails: details }));
  }

  async function handleCalendarPlateLookup(plateValue: string) {
    const details = await fetchVehicleDetailsByPlate(plateValue);
    if (!details) return;
    showPlateLookupSuccessToast();
    setCalendarEditData((prev) => (prev ? { ...prev, vehicleDetails: details } : prev));
  }

  async function handleReceiptPlateLookup(receiptId: ReceiptRow['id'], plateValue: string) {
    const details = await fetchVehicleDetailsByPlate(plateValue);
    if (!details) return;

    const vehicleName = details.split('\n').map((line) => line.trim()).filter(Boolean)[0];
    if (!vehicleName) return;

    showPlateLookupSuccessToast();
    updateReceipt(receiptId, { car: vehicleName });
  }

  function resolveCustomerType(customerName: string, fallback: string) {
    const value = customerName.trim().toLowerCase();
    if (!value) return fallback;

    const matched = clients.find((client) => client.name.trim().toLowerCase() === value);
    if (!matched) return fallback;
    return getCustomerTypeLabel(matched.priceTable);
  }

  async function searchDocumentsForImport(docType: 'orcamento' | 'agendamento', query: string) {
    if (!isSupabaseConfigured || !supabase) {
      return [] as ImportDocumentRow[];
    }

    const sb = supabase;
    const normalized = query.trim();
    const maxRows = normalized ? 150 : 30;

    const { data, error } = await sb
      .from('documents_v2')
      .select('id, customer_name_snapshot, phone_snapshot, plate_snapshot, vehicle_snapshot, notes, created_at, total_amount')
      .eq('doc_type', docType)
      .order('created_at', { ascending: false })
      .limit(maxRows);

    if (error || !data) return [];

    const mapped = data.map((row) => {
      const total = Number(row.total_amount) || 0;

      return {
        id: String(row.id),
        customer: row.customer_name_snapshot || 'SEM CLIENTE',
        phone: row.phone_snapshot || 'SEM TEL',
        plate: row.plate_snapshot || 'SEM PLACA',
        vehicle: row.vehicle_snapshot || 'SEM VEICULO',
        note: row.notes || '',
        createdAtIso: row.created_at || '',
        createdAt: toBrDate(row.created_at || ''),
        total,
      };
    });

    if (!normalized) return mapped;

    return mapped.filter((row) =>
      matchesSearchTokens(
        [
          row.id,
          row.customer,
          row.phone,
          row.plate,
          row.vehicle,
          row.note,
          row.createdAt,
          row.createdAtIso,
          ...getMoneySearchValues(row.total),
        ],
        normalized
      )
    );
  }

  async function fetchDocumentWithItemsById(docType: 'orcamento' | 'agendamento', id: string) {
    if (!isSupabaseConfigured || !supabase) return null;

    const sb = supabase;
    const { data: doc, error: docError } = await sb
      .from('documents_v2')
      .select('id, customer_name_snapshot, phone_snapshot, plate_snapshot, vehicle_snapshot, notes, discount_amount, service_time_days, scheduled_for, status')
      .eq('doc_type', docType)
      .eq('id', id)
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
      status: normalizeDashboardStatus(doc.status),
      items: mappedItems,
    };
  }

  async function runAppointmentQuoteSearch() {
    const rows = await searchDocumentsForImport('orcamento', appointmentQuoteSearch);
    setAppointmentQuoteResults(rows);
    setAppointmentSelectedQuoteId(rows[0] ? String(rows[0].id) : '');
  }

  function clearAppointmentForm() {
    setAppointmentData(createEmptyAppointmentData());
    setAppointmentQuoteSearch('');
    setAppointmentQuoteResults([]);
    setAppointmentSelectedQuoteId('');
  }

  async function runSaleQuoteSearch() {
    const rows = await searchDocumentsForImport('orcamento', saleQuoteSearch);
    setSaleQuoteResults(rows);
    setSaleSelectedQuoteId(rows[0] ? String(rows[0].id) : '');
  }

  async function runSaleAppointmentSearch() {
    const rows = await searchDocumentsForImport('agendamento', saleAppointmentSearch);
    setSaleAppointmentResults(rows);
    setSaleSelectedAppointmentId(rows[0] ? String(rows[0].id) : '');
  }

  async function importQuoteToAppointmentBySearch() {
    const id = appointmentSelectedQuoteId.trim();
    if (!id) return;

    const selected = await fetchDocumentWithItemsById('orcamento', id);
    if (!selected) {
      window.alert('Orcamento nao encontrado.');
      return;
    }

    setAppointmentData((prev) => ({
      ...prev,
      customer: selected.customer,
      phone: selected.phone,
      plate: selected.plate,
      vehicleDetails: selected.vehicleSnapshot,
      items: cloneItems(selected.items),
      discount: selected.discount,
      note: selected.note,
    }));
    window.alert('Orcamento importado para o agendamento.');
  }

  function openCatalogPicker(target: CatalogPickerTarget) {
    if (serviceCatalogData.length === 0) {
      window.alert('Cadastre ao menos um item antes de adicionar.');
      return;
    }
    setCatalogPickerTarget(target);
    setCatalogPickerIndex(0);
    setCatalogPickerQuantity(1);
    setCatalogPickerOpen(true);
  }

  function confirmCatalogPicker() {
    const picked = serviceCatalogData[catalogPickerIndex];
    if (!picked) {
      window.alert('Item invalido.');
      return;
    }

    const priceTable = getSelectedPriceTable(
      catalogPickerTarget === 'quote'
        ? quoteData.customerType
        : catalogPickerTarget === 'appointment'
          ? appointmentData.customerType
          : saleData.customerType
    );

    const nextItem: ServiceItem = {
      description: picked.description,
      quantity: Math.max(1, Number(catalogPickerQuantity) || 1),
      price: getCatalogPrice(picked, priceTable),
    };

    if (catalogPickerTarget === 'quote') {
      setQuoteData((prev) => ({ ...prev, items: [...prev.items, nextItem] }));
    } else if (catalogPickerTarget === 'appointment') {
      setAppointmentData((prev) => ({ ...prev, items: [...prev.items, nextItem] }));
    } else {
      setSaleData((prev) => ({ ...prev, items: [...prev.items, nextItem] }));
    }

    setCatalogPickerOpen(false);
  }

  function addItemToQuote() {
    openCatalogPicker('quote');
  }

  function addItemToAppointment() {
    openCatalogPicker('appointment');
  }

  function addItemToSale() {
    openCatalogPicker('sale');
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

  function handleMenuAction(name: 'Pesquisar' | 'Clientes' | 'Financeiro' | 'Cadastro' | 'Relatorios' | 'Agenda' | 'Vendas') {
    if (name === 'Pesquisar') setScreen('menu-search');
    if (name === 'Clientes') setScreen('menu-clients');
    if (name === 'Financeiro') setScreen('menu-financial');
    if (name === 'Cadastro') setScreen('menu-products');
    if (name === 'Relatorios') setScreen('menu-reports');
    if (name === 'Vendas') setScreen('sales-history');
    if (name === 'Agenda') {
      setCalendarSelectedDate(toInputDateValue(new Date()));
      setScreen('appointment-calendar');
    }
  }

  function openDashboardServiceModal(service: DashboardService) {
    setSelectedDashboardService({ ...service });
  }

  function findSelectedDashboardAppointment() {
    if (!selectedDashboardService?.sourceDocumentId) return null;
    return calendarAppointments.find((item) => item.id === selectedDashboardService.sourceDocumentId) || null;
  }

  async function saveDashboardServiceStatus() {
    if (!selectedDashboardService) return;
    const selected = selectedDashboardService;

    setDashboardServices((prev) =>
      prev.map((service) =>
        service.id === selected.id ? selected : service
      )
    );
    setCalendarAppointments((prev) =>
      prev.map((appointment) =>
        selected.sourceDocumentId && appointment.id === selected.sourceDocumentId
          ? { ...appointment, status: selected.status === 'AVISAR CLIENTE' ? 'CANCELADO' : 'CONFIRMADO' }
          : appointment
      )
    );

    if (selected.sourceDocumentId && isSupabaseConfigured && supabase) {
      const sb = supabase;
      const nextStatus = mapDashboardStatusToDocumentStatus(selected.status);
      const rpcResult = await sb.rpc('update_document_status_safe', {
        p_document_id: String(selected.sourceDocumentId),
        p_status: nextStatus,
      });

      if (rpcResult.error) {
        console.error('Falha ao atualizar status via RPC update_document_status_safe', rpcResult.error);
        window.alert('Nao foi possivel salvar o status no Supabase. Verifique se a funcao update_document_status_safe foi criada no banco.');
      }
    }

    setSelectedDashboardService(null);
  }

  function moveCalendarMonth(offset: number) {
    setCalendarSelectedDate((current) => {
      const nextDate = new Date(`${current}T12:00:00`);
      nextDate.setMonth(nextDate.getMonth() + offset);
      return toInputDateValue(nextDate);
    });
  }

  function openCalendarEdit(appt: CalendarAppointment) {
    setCalendarEditData({ ...appt });
  }

  async function saveCalendarEdit(nextStatus?: AppointmentStatus) {
    if (!calendarEditData) return;
    const editedDate = parseBrDateTime(calendarEditData.date);
    const normalizedDate = editedDate ? formatBrDateTime(editedDate) : calendarEditData.date;
    const resolvedStatus: AppointmentStatus =
      nextStatus === 'CANCELADO' || nextStatus === 'CONFIRMADO'
        ? nextStatus
        : calendarEditData.status || 'CONFIRMADO';
    const updated = {
      ...calendarEditData,
      date: normalizedDate,
      dayKey: toCalendarDateKey(normalizedDate),
      status: resolvedStatus,
    };

    setCalendarAppointments((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
    setDashboardServices((prev) =>
      prev.map((service) =>
        service.sourceDocumentId === updated.id
          ? {
              ...service,
              title: (updated.vehicleDetails || '').split('\n')[0] || updated.customer || 'SERVICO',
              plate: updated.plate || 'SEM PLACA',
              customer: updated.customer || 'SEM CLIENTE',
              status: updated.status === 'CANCELADO' ? 'AVISAR CLIENTE' : 'CONCLUIDO',
              tone: updated.status === 'CANCELADO' ? 'info' : 'success',
            }
          : service
      )
    );

    if (isSupabaseConfigured && supabase) {
      const sb = supabase;
      const { error } = await sb
        .from('documents_v2')
        .update({
          customer_name_snapshot: updated.customer,
          phone_snapshot: updated.phone,
          plate_snapshot: updated.plate,
          vehicle_snapshot: updated.vehicleDetails,
          scheduled_for: editedDate ? editedDate.toISOString() : null,
          notes: updated.note,
          total_amount: updated.total,
          status: mapAppointmentStatusToDocumentStatus(updated.status),
        })
        .eq('id', updated.id)
        .eq('doc_type', 'agendamento');

      if (error) {
        console.error('Falha ao salvar alteracoes do agendamento', error);
        window.alert(`Nao foi possivel salvar no Supabase: ${error.message}`);
      }
    }

    setCalendarEditData(null);
  }

  async function cancelCalendarAppointment() {
    await saveCalendarEdit('CANCELADO');
  }

  async function deleteCalendarAppointment() {
    if (!calendarEditData) return;
    const target = calendarEditData;

    setCalendarAppointments((prev) => prev.filter((item) => item.id !== target.id));
    setDashboardServices((prev) => prev.filter((service) => service.sourceDocumentId !== target.id));

    if (isSupabaseConfigured && supabase) {
      const sb = supabase;
      await sb
        .from('documents_v2')
        .delete()
        .eq('id', target.id)
        .eq('doc_type', 'agendamento');
    }

    setCalendarEditData(null);
  }

  async function cancelSelectedDashboardServiceAppointment() {
    const appointment = findSelectedDashboardAppointment();
    if (!appointment) {
      window.alert('Servico sem agendamento vinculado.');
      return;
    }

    const updated = { ...appointment, status: 'CANCELADO' as AppointmentStatus };
    setCalendarAppointments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    setDashboardServices((prev) =>
      prev.map((service) =>
        service.id === selectedDashboardService?.id
          ? { ...service, status: 'AVISAR CLIENTE', tone: 'info' }
          : service
      )
    );

    if (isSupabaseConfigured && supabase) {
      const sb = supabase;
      await sb
        .from('documents_v2')
        .update({ status: mapAppointmentStatusToDocumentStatus('CANCELADO') })
        .eq('id', updated.id)
        .eq('doc_type', 'agendamento');
    }

    setSelectedDashboardService((prev) => (prev ? { ...prev, status: 'AVISAR CLIENTE', tone: 'info' } : prev));
  }

  async function deleteSelectedDashboardServiceAppointment() {
    const appointment = findSelectedDashboardAppointment();
    if (!appointment) {
      window.alert('Servico sem agendamento vinculado.');
      return;
    }

    setCalendarAppointments((prev) => prev.filter((item) => item.id !== appointment.id));
    setDashboardServices((prev) => prev.filter((service) => service.id !== selectedDashboardService?.id));

    if (isSupabaseConfigured && supabase) {
      const sb = supabase;
      await sb
        .from('documents_v2')
        .delete()
        .eq('id', appointment.id)
        .eq('doc_type', 'agendamento');
    }

    setSelectedDashboardService(null);
  }

  async function printServiceSlip(appointment: CalendarAppointment, preferredStatus?: DashboardServiceStatus) {
    const popup = openPrintWindow('width=900,height=700');
    if (!popup) {
      window.alert('Nao foi possivel abrir a tela de impressao.');
      return;
    }

    const linkedDashboardStatus =
      preferredStatus || dashboardServices.find((service) => service.sourceDocumentId === appointment.id)?.status;
    const docWithItems = await fetchDocumentWithItemsById('agendamento', appointment.id);
    const resolvedStatus =
      linkedDashboardStatus ||
      docWithItems?.status ||
      (appointment.status === 'CANCELADO' ? 'AVISAR CLIENTE' : 'EM ABERTO');

    const itemRows = (docWithItems?.items || [])
      .map(
        (item, index) =>
          `<li>${escapeHtml(index + 1)}. ${escapeHtml(item.description || 'SERVICO')} - QTD: ${escapeHtml(
            formatNumberValue(item.quantity)
          )}</li>`
      )
      .join('');

    const itemsMarkup = itemRows || '<li>SEM ITENS/SERVICOS CADASTRADOS</li>';

    const printable = `
      <html>
        <head>
          <title>Via de Servico</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 22px; color: #111; }
            h1 { margin: 0 0 12px; font-size: 24px; }
            .line { margin: 6px 0; font-size: 14px; }
            .label { font-weight: 700; }
            .box { margin-top: 14px; border: 1px solid #ccc; padding: 10px; white-space: pre-wrap; }
            .services-list { margin: 8px 0 0 18px; padding: 0; }
            .services-list li { margin: 4px 0; }
          </style>
        </head>
        <body>
          <h1>VIA DE SERVICO</h1>
          <div class="line"><span class="label">Placa:</span> ${escapeHtml(appointment.plate || '-')}</div>
          <div class="line"><span class="label">Data:</span> ${escapeHtml(appointment.date || '-')}</div>
          <div class="box"><span class="label">ITENS/SERVICOS:</span><ul class="services-list">${itemsMarkup}</ul></div>
          <div class="box"><span class="label">VEICULO:</span><br/>${escapeHtml(appointment.vehicleDetails || '-')}</div>
          <div class="box"><span class="label">Observacoes:</span><br/>${escapeHtml(appointment.note || '-')}</div>
          <div class="line" style="margin-top: 18px;"><span class="label">FINALIZADO EM:</span> __/__/___ &nbsp;&nbsp; <span class="label">AS:</span> __:___h.</div>
          
          <div class="line" style="margin-top: 10px;"><span class="label">RESPONSAVEL:</span>
        
          . ____________________________________
           
          . ____________________________________
           
          . ____________________________________
           
          . ____________________________________</div>
        </body>
      </html>
    `;

    popup.document.open();
    popup.document.write(printable);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  function printCalendarAppointmentServiceSlip() {
    if (!calendarEditData) return;
    void printServiceSlip(calendarEditData);
  }

  function printSelectedDashboardServiceSlip() {
    const appointment = findSelectedDashboardAppointment();
    if (!appointment) {
      window.alert('Servico sem agendamento vinculado.');
      return;
    }
    void printServiceSlip(appointment, selectedDashboardService?.status);
  }

  function openSelectedDashboardServiceWhatsapp() {
    const appointment = findSelectedDashboardAppointment();
    if (!appointment) {
      window.alert('Servico sem agendamento vinculado.');
      return;
    }
    openWhatsappAppointment(appointment);
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
        city: patch.city,
        state: patch.state,
        price_table: patch.priceTable,
      })
      .eq('id', id);
  }

  async function addClient() {
    if (!isSupabaseConfigured || !supabase) {
      window.alert('Adicionar cliente requer Supabase configurado.');
      return;
    }

    const payload = {
      name: 'NOVO CLIENTE',
      phone: '67 90000-0000',
      plate: 'AAA-0000',
      city: '',
      state: '',
      price_table: 1,
    };

    const dbClient = await createClientRecord(payload);
    if (!dbClient) {
      window.alert('Nao foi possivel salvar cliente no banco.');
      return;
    }

    setClients((prev) => [dbClient, ...prev]);
  }

  async function removeClient(id: number) {
    setClients((prev) => prev.filter((client) => client.id !== id));

    if (!isSupabaseConfigured || !supabase) return;

    const sb = supabase;
    await sb.from('clients_v2').delete().eq('id', id);
  }

  async function updateProduct(
    id: string | null,
    index: number,
    patch: Partial<{ description: string; itemType: CatalogItemType; priceTable1: number; priceTable2: number; quantity: number }>
  ) {
    setServiceCatalogData((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));

    if (!isSupabaseConfigured || !supabase || id === null) return;

    const sb = supabase;
    await sb
      .from('service_catalog_v2')
      .update({
        name: patch.description,
        default_price: patch.priceTable1,
        price_table_1: patch.priceTable1,
        price_table_2: patch.priceTable2,
        quantity: patch.quantity,
        item_type: patch.itemType,
      })
      .eq('id', id);
  }

  async function addProduct() {
    setProductModalMode('add');
    setProductModalData({ description: '', quantity: 1, itemType: 'SERVICO', priceTable1: 0, priceTable2: 0 });
    setProductEditingIndex(null);
    setProductModalOpen(true);
  }

  async function saveProduct() {
    if (!productModalData.description.trim()) {
      window.alert('Preencha o nome do produto');
      return;
    }

    if (productModalMode === 'add') {
      if (!isSupabaseConfigured || !supabase) {
        window.alert('Salvar produto requer Supabase configurado.');
        return;
      }

      const sb = supabase;
const codePrefix = productModalData.itemType === 'PRODUTO' ? 'PRD' : 'SRV';
const codeSuffix = Date.now().toString(36).toUpperCase().slice(-6);
const payload = {
  code: `${codePrefix}-${codeSuffix}`,
  name: productModalData.description,
  default_price: productModalData.priceTable1,
  price_table_1: productModalData.priceTable1,
  price_table_2: productModalData.priceTable2,
  quantity: productModalData.quantity,
  item_type: productModalData.itemType,
  is_active: true,
};
      const { data, error } = await sb
        .from('service_catalog_v2')
        .insert(payload)
        .select('id, name, default_price, price_table_1, price_table_2, quantity, item_type')
        .single();

      if (error || !data) {
        window.alert(`Nao foi possivel salvar produto no banco: ${error?.message ?? 'Erro desconhecido'}`);
        return;
      }

      setServiceCatalogData((prev) => [
        {
          id: normalizeEntityId(data.id),
          itemType: data.item_type === 'PRODUTO' ? 'PRODUTO' : 'SERVICO',
          description: data.name,
          priceTable1: Number(data.price_table_1 ?? data.default_price) || 0,
          priceTable2: Number(data.price_table_2 ?? data.default_price) || 0,
          quantity: Number(data.quantity) || productModalData.quantity,
        },
        ...prev,
      ]);
      setProductModalOpen(false);
      return;
    } else if (productEditingIndex !== null) {
      // Edit mode
      const product = serviceCatalogData[productEditingIndex];
      await updateProduct(product.id, productEditingIndex, {
        description: productModalData.description,
        itemType: productModalData.itemType,
        priceTable1: productModalData.priceTable1,
        priceTable2: productModalData.priceTable2,
        quantity: productModalData.quantity,
      });
    }

    setProductModalOpen(false);
  }

  function openEditProductModal(index: number) {
    if (index < 0 || index >= serviceCatalogData.length) {
      window.alert('Item nao encontrado para edicao. Atualize a lista e tente novamente.');
      return;
    }

    const product = serviceCatalogData[index];
    setProductModalMode('edit');
    setProductModalData({
      description: product.description,
      quantity: product.quantity,
      itemType: product.itemType,
      priceTable1: product.priceTable1,
      priceTable2: product.priceTable2,
    });
    setProductEditingIndex(index);
    setProductModalOpen(true);
  }

  function closeProductModal() {
    setProductModalOpen(false);
    setProductEditingIndex(null);
  }

  async function removeProduct(id: string | null, index: number) {
    setServiceCatalogData((prev) => prev.filter((_, idx) => idx !== index));

    if (!isSupabaseConfigured || !supabase || id === null) return;

    const sb = supabase;
    await sb.from('service_catalog_v2').update({ is_active: false }).eq('id', id);
  }

  function updateFinancialEntry(id: number, patch: Partial<FinancialEntry>) {
    const current = financialEntries.find((entry) => entry.id === id);
    if (current?.sourceType === 'venda' && current?.sourceId) {
      return;
    }

    setFinancialEntries((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));

    if (patch.description !== undefined && patch.description.trim() === '') {
      setFinancialEntries((prev) => prev.map((entry) => (entry.id === id ? { ...entry, description: 'LANCAMENTO' } : entry)));
    }
  }

  async function persistFinancialEntry(id: number) {
    const current = financialEntries.find((entry) => entry.id === id);
    if (!current) return;
    if (current.sourceType === 'venda' && current.sourceId) return;

    setFinancialEntries((prev) => prev.map((e) => e.id === id ? { ...e, isNew: false } : e));

    if (!isSupabaseConfigured || !supabase) return;

    const sb = supabase;
    await sb
      .from('financial_entries_v2')
      .update({
        entry_date: current.date,
        description: current.description || 'LANCAMENTO',
        amount: current.amount,
         payment_status: current.paymentStatus,
      })
      .eq('id', id);
  }

  async function addFinancialEntry(kind: 'receita' | 'despesa') {
    if (!isSupabaseConfigured || !supabase) {
      window.alert('Adicionar lancamento financeiro requer Supabase configurado.');
      return;
    }

    const label = kind === 'despesa' ? 'DESPESA' : 'RECEITA';
    const sb = supabase;
    const payload = {
      entry_date: new Date().toISOString().slice(0, 10),
      description: label,
      amount: 0,
       payment_status: 'PENDENTE',
    };

    const { data, error } = await sb
      .from('financial_entries_v2')
      .insert(payload)
     .select('id, entry_date, description, amount, payment_status')
      .single();

    if (error || !data) {
      window.alert(`Nao foi possivel salvar lancamento no banco: ${error?.message ?? 'Erro desconhecido'}`);
      return;
    }

    const dbEntry: FinancialEntry = {
      id: Number(data.id),
      date: data.entry_date,
      description: data.description,
      amount: 0,
      sourceType: null,
      sourceId: null,
      isNew: true,
      entryKind: kind,
       paymentStatus: data.payment_status as 'PAGO' | 'PENDENTE',
    };
    setFinancialEntries((prev) => [dbEntry, ...prev]);
  }

  async function removeFinancialEntry(id: number) {
    const current = financialEntries.find((entry) => entry.id === id);
    if (current?.sourceType === 'venda' && current?.sourceId) {
      window.alert('Lancamento vinculado a venda nao pode ser removido manualmente.');
      return;
    }

    setFinancialEntries((prev) => prev.filter((entry) => entry.id !== id));

    if (!isSupabaseConfigured || !supabase) return;

    const sb = supabase;
    await sb.from('financial_entries_v2').delete().eq('id', id);
  }
async function updateSalePaymentStatus(
  id: string,
  status: 'PAGO' | 'PENDENTE'
) {
  setFinancialSalesRows((prev) =>
    prev.map((sale) =>
      sale.id === id
        ? {
            ...sale,
            paymentStatus: status,
          }
        : sale
    )
  );

  setSalesHistory((prev) =>
    prev.map((sale) =>
      sale.id === id
        ? {
            ...sale,
            paymentStatus: status,
          }
        : sale
    )
  );

  if (!isSupabaseConfigured || !supabase) return;

  const { error } = await supabase
    .from('documents_v2')
    .update({
      payment_status: status,
    })
    .eq('id', id);

  if (error) {
    console.error(error);
    window.alert('Não foi possível atualizar o status do pagamento.');
  }
}
  function updateReceipt(id: ReceiptRow['id'], patch: Partial<ReceiptRow>) {
    setReceipts((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function removeReceipt(id: ReceiptRow['id']) {
    setReceipts((prev) => prev.filter((row) => row.id !== id));
  }

  function addReceipt() {
    window.alert('Adicionar recibo manualmente nao e suportado. Use vendas salvas no Supabase.');
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
    surcharge?: number;
    paymentMethod?: string;
    note: string;
    scheduledFor?: string;
  },
  items: ServiceItem[]
)
 {
    if (!isSupabaseConfigured || !supabase) return { ok: false as const, error: 'Supabase nao configurado' };

    const sb = supabase;
    const scheduledForIso = payload.scheduledFor ? parseBrDateTime(payload.scheduledFor)?.toISOString() ?? null : null;
    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const surcharge = Math.max(0, payload.surcharge ?? 0);
    const total = Math.max(subtotal - payload.discount + surcharge, 0);

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

    surcharge_amount: surcharge,

    payment_method: payload.paymentMethod ?? null,

    payment_status: 'PENDENTE',

    notes: payload.note || null,

    subtotal_amount: subtotal,

    total_amount: total,
  })
  .select()
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
      customer: quoteData.customer,
      customerType: quoteData.customerType,
      phone: quoteData.phone,
      plate: quoteData.plate,
      vehicle: quoteData.vehicle,
      items: cloneItems(quoteData.items),
      discount: quoteData.discount,
      timeDays: quoteData.timeDays,
      note: quoteData.note,
    };

    setIsSaving(true);
    const result = await persistDocument(
      'orcamento',
      {
        customerName: quoteData.customer,
        phone: quoteData.phone,
        plate: quoteData.plate,
        vehicleSnapshot: quoteData.vehicle,
        laborRequired: false,
        serviceTimeDays: quoteData.timeDays,
        discount: quoteData.discount,
          paymentMethod: 'PIX',
        note: quoteData.note,
      },
      quoteData.items
    );

    setIsSaving(false);
    if (result.ok && result.id) {
      setSavedQuote(payload);
      setLastSavedDocumentIds((prev) => ({ ...prev, orcamento: String(result.id) }));
      window.alert('Orcamento salvo com sucesso no banco.');
      setScreen('dashboard');
    } else {
      window.alert(`Nao foi possivel salvar o orcamento no banco: ${result.error ?? 'Erro desconhecido'}`);
    }
  }

  async function finalizeAppointment() {
    const parsedAppointmentDate = parseBrDateTime(appointmentData.date);
    if (!parsedAppointmentDate) {
      window.alert('Data do agendamento invalida. Selecione data e hora validas.');
      return;
    }

    const displayDate = formatBrDateTime(parsedAppointmentDate);

    const payload: SavedAppointment = {
      date: displayDate,
      customer: appointmentData.customer,
      customerType: appointmentData.customerType,
      phone: appointmentData.phone,
      plate: appointmentData.plate,
      vehicleDetails: appointmentData.vehicleDetails,
      items: cloneItems(appointmentData.items),
      discount: appointmentData.discount,
      timeDays: 1,
      note: appointmentData.note,
    };

    setIsSaving(true);

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

    paymentMethod: appointmentData.paymentMethod,

    note: appointmentData.note,

    scheduledFor: appointmentData.date,
  },
  appointmentData.items
);
    setIsSaving(false);
    if (result.ok && result.id) {
      const appointmentId = String(result.id);
      setSavedAppointment(payload);
      setCalendarAppointments((prev) => [
        {
          id: appointmentId,
          dayKey: toCalendarDateKey(payload.date),
          date: payload.date,
          customer: payload.customer,
          phone: payload.phone,
          plate: payload.plate,
          vehicleDetails: payload.vehicleDetails,
          note: payload.note,
          total: appointmentData.items.reduce((acc, item) => acc + item.price * item.quantity, 0) - appointmentData.discount,
          status: 'CONFIRMADO',
        },
        ...prev,
      ]);
      window.alert('Agendamento salvo com sucesso no banco.');
      setScreen('dashboard');
    } else {
      window.alert(`Nao foi possivel salvar o agendamento no banco: ${result.error ?? 'Erro desconhecido'}`);
    }
  }

  async function importQuoteToSale() {
    const dbQuote = await fetchLatestDocumentWithItems('orcamento');

    const source = dbQuote
      ? {
          customer: dbQuote.customer,
          customerType: savedQuote?.customerType || quoteData.customerType,
          phone: dbQuote.phone,
          plate: dbQuote.plate,
          vehicle: dbQuote.vehicleSnapshot,
          items: dbQuote.items,
          discount: dbQuote.discount,
          timeDays: dbQuote.timeDays,
          note: dbQuote.note,
        }
      : savedQuote || {
      customer: quoteData.customer,
      customerType: quoteData.customerType,
      phone: quoteData.phone,
      plate: quoteData.plate,
      vehicle: quoteData.vehicle,
      items: quoteData.items,
      discount: quoteData.discount,
      timeDays: quoteData.timeDays,
      note: quoteData.note,
    };

    setSaleData((prev) => ({
      ...prev,
      customer: source.customer,
      customerType: resolveCustomerType(source.customer, source.customerType),
      phone: source.phone,
      plate: source.plate,
      items: cloneItems(source.items),
      discount: source.discount,
      surcharge: 0,
      timeDays: source.timeDays,
      note: source.note,
      vehicleDetails: source.vehicle,
    }));
    window.alert(dbQuote ? 'Orcamento importado do banco.' : 'Orcamento importado para a venda.');
  }

  async function importQuoteToSaleBySearch() {
    const id = saleSelectedQuoteId.trim();
    if (!id) return;

    const selected = await fetchDocumentWithItemsById('orcamento', id);
    if (!selected) {
      window.alert('Orcamento nao encontrado.');
      return;
    }

    setSaleData((prev) => ({
      ...prev,
      customer: selected.customer,
      customerType: resolveCustomerType(selected.customer, prev.customerType),
      phone: selected.phone,
      plate: selected.plate,
      vehicleDetails: selected.vehicleSnapshot,
      items: cloneItems(selected.items),
      discount: selected.discount,
      surcharge: 0,
      timeDays: selected.timeDays,
      note: selected.note,
    }));
    window.alert('Orcamento importado para a venda.');
  }

  async function importAppointmentToSaleBySearch() {
    const id = saleSelectedAppointmentId.trim();
    if (!id) return;

    const selected = await fetchDocumentWithItemsById('agendamento', id);
    if (!selected) {
      window.alert('Agendamento nao encontrado.');
      return;
    }

    setSaleData((prev) => ({
      ...prev,
      customer: selected.customer,
      customerType: resolveCustomerType(selected.customer, prev.customerType),
      phone: selected.phone,
      plate: selected.plate,
      vehicleDetails: selected.vehicleSnapshot,
      items: cloneItems(selected.items),
      discount: selected.discount,
      surcharge: 0,
      timeDays: selected.timeDays,
      note: selected.note,
    }));
    window.alert('Agendamento importado para a venda.');
  }

  async function importAppointmentToSale() {
    const dbAppointment = await fetchLatestDocumentWithItems('agendamento');

    const source = dbAppointment
      ? {
          date: dbAppointment.scheduledFor ? new Date(dbAppointment.scheduledFor).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(',', '') : appointmentData.date,
          customer: dbAppointment.customer,
          customerType: savedAppointment?.customerType || appointmentData.customerType,
          phone: dbAppointment.phone,
          plate: dbAppointment.plate,
          vehicleDetails: dbAppointment.vehicleSnapshot,
          items: dbAppointment.items,
          discount: dbAppointment.discount,
          timeDays: dbAppointment.timeDays,
          note: dbAppointment.note,
        }
      : savedAppointment || {
      date: appointmentData.date,
      customer: appointmentData.customer,
      customerType: appointmentData.customerType,
      phone: appointmentData.phone,
      plate: appointmentData.plate,
      vehicleDetails: appointmentData.vehicleDetails,
      items: appointmentData.items,
      discount: appointmentData.discount,
      timeDays: saleData.timeDays,
      note: appointmentData.note,
    };

    setSaleData((prev) => ({
      ...prev,
      customer: source.customer,
      customerType: resolveCustomerType(source.customer, source.customerType),
      phone: source.phone,
      plate: source.plate,
      vehicleDetails: source.vehicleDetails,
      items: cloneItems(source.items),
      discount: source.discount,
      surcharge: 0,
      timeDays: source.timeDays,
      note: source.note,
    }));
    window.alert(dbAppointment ? 'Agendamento importado do banco.' : 'Agendamento importado para a venda.');
  }

  function clearSaleForm() {
    setSaleData(createEmptySaleData());
    setSaleQuoteSearch('');
    setSaleQuoteResults([]);
    setSaleSelectedQuoteId('');
    setSaleAppointmentSearch('');
    setSaleAppointmentResults([]);
    setSaleSelectedAppointmentId('');
  }

  async function finalizeSale() {
    const soldByDescription = saleData.items.reduce<Record<string, number>>((acc, item) => {
      const key = normalizeCatalogKey(item.description);
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + (Number(item.quantity) || 0);
      return acc;
    }, {});

    const catalogByDescription = serviceCatalogData.reduce<Record<string, CatalogRow>>((acc, item) => {
      const key = normalizeCatalogKey(item.description);
      if (key && !acc[key]) acc[key] = item;
      return acc;
    }, {});

    const insufficientItems: string[] = [];
    Object.entries(soldByDescription).forEach(([key, soldQty]) => {
      const catalogItem = catalogByDescription[key];
      if (!catalogItem) return;
      if (catalogItem.quantity < soldQty) {
        insufficientItems.push(`${catalogItem.description} (estoque: ${catalogItem.quantity}, venda: ${soldQty})`);
      }
    });

    if (insufficientItems.length > 0) {
      window.alert(`Estoque insuficiente para:\n${insufficientItems.join('\n')}`);
      return;
    }

    const nextCatalog = serviceCatalogData.map((item) => {
      const soldQty = soldByDescription[normalizeCatalogKey(item.description)] || 0;
      if (soldQty <= 0) return item;
      return { ...item, quantity: item.quantity - soldQty };
    });
    setServiceCatalogData(nextCatalog);

    if (isSupabaseConfigured && supabase) {
      const sb = supabase;
      await Promise.all(
        nextCatalog
          .filter((item) => item.id !== null)
          .filter((item) => soldByDescription[normalizeCatalogKey(item.description)] > 0)
          .map((item) =>
            sb
              .from('service_catalog_v2')
              .update({ quantity: item.quantity })
              .eq('id', item.id as string)
          )
      );
    }

    const nowDate = now.toLocaleDateString('pt-BR');
    const car = saleData.vehicleDetails.split('\n')[0] || saleData.vehicleDetails;

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

    surcharge: saleData.surcharge,

    paymentMethod: saleData.paymentMethod,

    note: saleData.note,
  },
  saleData.items
);
    setIsSaving(false);
    if (!result.ok || !result.id) {
      window.alert(`Nao foi possivel salvar a venda no banco: ${result.error ?? 'Erro desconhecido'}`);
      return;
    }

    const receiptId = String(result.id);

    const persistedReceipt: ReceiptRow = {
      id: receiptId,
      date: nowDate,
      customer: saleData.customer,
      car,
      plate: saleData.plate,
      total: saleTotal,
    };

    setLastSavedDocumentIds((prev) => ({ ...prev, venda: String(result.id) }));
    setReceipts((prev) => [persistedReceipt, ...prev]);
    window.alert('Venda finalizada e salva no banco.');
    setFinancialSalesRows((prev) => [
    {
        id: String(result.id),
        date: nowDate,
        createdAtIso: new Date().toISOString(),
        customer: saleData.customer,
        phone: saleData.phone,
        plate: saleData.plate,
        vehicle: saleData.vehicleDetails,
        subtotal: saleSubtotal,
        discount: saleData.discount,
        surcharge: saleData.surcharge,
        total: saleTotal,
        note: saleData.note,
        timeDays: saleData.timeDays,
        laborRequired: saleData.laborRequired,

        paymentMethod: saleData.paymentMethod,
        paymentStatus: 'PENDENTE',
    },
    ...prev,
]);
    setSelectedPrintKind('venda');
    setScreen('print-receipt');
  }

  function openSaleReceiptDocument(printable: PrintableDocument, shouldPrint = false) {
    setSaleData((prev) => ({
      ...prev,
      customer: printable.customer,
      customerType: printable.customerType,
      phone: printable.phone,
      plate: printable.plate,
      vehicleDetails: printable.vehicle,
      laborRequired: printable.laborRequired ?? true,
      timeDays: printable.serviceTimeDays,
      items: cloneItems(printable.items),
      discount: printable.discount,
      surcharge: Math.max(printable.total - printable.subtotal + printable.discount, 0),
      note: printable.note,
        paymentMethod: printable.paymentMethod,
    }));

    setSelectedPrintKind('venda');
    setScreen('print-receipt');

    if (shouldPrint) {
      window.setTimeout(() => {
        window.print();
      }, 180);
    }
  }

  async function selectSaleForReceipt(saleId: string, openReceipt = false) {
    const saleRow = salesHistory.find((row) => row.id === saleId);
    if (!saleRow) return;

    setSaleReceiptLoading(true);
const basePrintable: PrintableDocument = {
  kind: 'venda',
  number: `VEN-${saleRow.id.slice(0, 8).toUpperCase()}`,
  issuedAt: saleRow.createdAt,
  customer: saleRow.customer,
  customerType: getCustomerTypeLabel(1),
  phone: saleRow.phone,
  plate: saleRow.plate,
  vehicle: saleRow.vehicle,
  items: [
    {
      description: saleRow.vehicle || 'SERVICO',
      quantity: 1,
      price: saleRow.total,
    },
  ],
  subtotal: saleRow.subtotal,
  discount: saleRow.discount,
  total: saleRow.total,
  note: saleRow.note,
  serviceTimeDays: saleRow.timeDays,
  laborRequired: saleRow.laborRequired,

  paymentMethod: saleRow.paymentMethod,
 
};
// Abre imediatamente o recibo para evitar sensacao de travamento enquanto busca itens detalhados.
    if (openReceipt) {
      openSaleReceiptDocument(basePrintable);
    }

    if (!isSupabaseConfigured || !supabase) {
      setSelectedSalePrintable(basePrintable);
      setSaleReceiptLoading(false);
      return;
    }

    try {
      const sb = supabase;
      const { data: items } = await sb
        .from('document_items_v2')
        .select('description, quantity, unit_price')
        .eq('document_id', saleId)
        .order('created_at', { ascending: true });

      const mappedItems: ServiceItem[] = (items || []).map((item) => ({
        description: item.description,
        quantity: Number(item.quantity) || 1,
        price: Number(item.unit_price) || 0,
      }));

      const printable: PrintableDocument = {
        ...basePrintable,
        items: mappedItems.length > 0 ? mappedItems : basePrintable.items,
      };

      setSelectedSalePrintable(printable);
      if (openReceipt) {
        openSaleReceiptDocument(printable);
      }
    } finally {
      setSaleReceiptLoading(false);
    }
  }

  function printSelectedSaleReceipt() {
    if (!selectedSalePrintable) return;
    openSaleReceiptDocument(selectedSalePrintable, true);
  }

  async function deleteSaleFromHistory(saleId: string) {
    const confirmResult = await Swal.fire({
      title: 'Excluir venda?',
      text: 'Essa acao exclui definitivamente a venda e seus lancamentos vinculados.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      background: '#111827',
      color: '#f3f4f6',
    });

    if (!confirmResult.isConfirmed) return;

    if (isSupabaseConfigured && supabase) {
      const sb = supabase;
      const financialEntryId = saleId.startsWith('FIN-') ? Number(saleId.replace('FIN-', '')) : null;

      if (financialEntryId) {
        const { error } = await sb.from('financial_entries_v2').delete().eq('id', financialEntryId);

        if (error) {
          window.alert(`Nao foi possivel excluir a venda: ${error.message}`);
          return;
        }
      } else {
        const { error: itemsError } = await sb
          .from('document_items_v2')
          .delete()
          .eq('document_id', saleId);

        if (itemsError) {
          window.alert(`Nao foi possivel excluir os itens da venda: ${itemsError.message}`);
          return;
        }

        const { error: financialError } = await sb
          .from('financial_entries_v2')
          .delete()
          .eq('source_type', 'venda')
          .eq('source_id', saleId);

        if (financialError) {
          window.alert(`Nao foi possivel excluir o lancamento financeiro da venda: ${financialError.message}`);
          return;
        }

        const { error } = await sb
          .from('documents_v2')
          .delete()
          .eq('id', saleId)
          .eq('doc_type', 'venda');

        if (error) {
          window.alert(`Nao foi possivel excluir a venda: ${error.message}`);
          return;
        }
      }
    }

    setSalesHistory((prev) => prev.filter((sale) => sale.id !== saleId));
    setFinancialSalesRows((prev) => prev.filter((sale) => sale.id !== saleId));
    setFinancialEntries((prev) =>
      prev.filter((entry) => entry.sourceId !== saleId && `FIN-${entry.id}` !== saleId)
    );
    setReceipts((prev) => prev.filter((receipt) => String(receipt.id) !== saleId));
    setSelectedSalePrintable((current) => {
      if (!current) return current;
      return current.number.includes(String(saleId).slice(0, 8).toUpperCase()) ? null : current;
    });
  }

  async function handleLogin() {
    setAuthMessage('');

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setAuthMessage('Informe email e senha.');
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setAuthMessage('Supabase nao configurado. Configuracao e login requerem Supabase valido.');
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

  function escapeCsv(value: unknown) {
    return `"${String(value ?? '')
      .replaceAll('"', '""')
      .replaceAll('\r\n', '\n')
      .replaceAll('\r', '\n')}"`;
  }

  function downloadCsv(fileName: string, headers: string[], rows: Array<Array<unknown>>) {
    const lines = [
      headers.map((header) => escapeCsv(header)).join(','),
      ...rows.map((row) => row.map((cell) => escapeCsv(cell)).join(',')),
    ];
    const csvContent = `\uFEFF${lines.join('\r\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function escapeHtml(value: unknown) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function openPrintWindow(features: string) {
    // Prefer a hidden iframe to avoid popup blockers on print actions.
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    const frameWindow = iframe.contentWindow;
    if (frameWindow) {
      const cleanup = () => {
        window.setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 400);
      };

      frameWindow.addEventListener('afterprint', cleanup, { once: true });
      window.setTimeout(cleanup, 60000);
      return frameWindow;
    }

    iframe.remove();

    // Fallback for environments where iframe printing is unavailable.
    const attempts = [`popup=yes,${features}`, features, ''];
    for (const attempt of attempts) {
      const popup = window.open('about:blank', '_blank', attempt);
      if (popup) return popup;
    }

    return null;
  }

  function exportReceiptCSV() {
    downloadCsv(
      `recibos-${Date.now()}.csv`,
      ['ID', 'Data', 'Cliente', 'Veiculo', 'Placa', 'Total'],
      filteredReceipts.map((row) => [row.id, row.date, row.customer, row.car, row.plate, row.total.toFixed(2)])
    );
  }

  function exportClientsCSV() {
    downloadCsv(
      `clientes-filtrados-${Date.now()}.csv`,
      ['ID', 'Nome', 'Telefone', 'Placa', 'Cidade', 'Estado', 'Tabela Preco'],
      filteredClients.map((client) => [
        client.id,
        client.name,
        client.phone,
        client.plate,
        client.city || '',
        client.state || '',
        client.priceTable === 2 ? 'TABELA 2 - FRANQUEADO' : 'TABELA 1 - CLIENTE FINAL',
      ])
    );
  }

  function printFilteredClients() {
    const printWindow = openPrintWindow('width=1000,height=700');
    if (!printWindow) {
      window.alert('Nao foi possivel abrir a janela de impressao. Verifique se o bloqueador de pop-up esta ativo.');
      return;
    }

    const rows = filteredClients
      .map(
        (client) => `
          <tr>
            <td>${escapeHtml(client.id)}</td>
            <td>${escapeHtml(client.name || '-')}</td>
            <td>${escapeHtml(client.phone || '-')}</td>
            <td>${escapeHtml(client.plate || '-')}</td>
            <td>${escapeHtml(client.city || '-')}</td>
            <td>${escapeHtml(client.state || '-')}</td>
            <td>${client.priceTable === 2 ? 'TABELA 2 - FRANQUEADO' : 'TABELA 1 - CLIENTE FINAL'}</td>
          </tr>
        `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>CLIENTES FILTRADOS</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #111; }
          h1 { margin: 0 0 10px; font-size: 18px; }
          .meta { margin-bottom: 12px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #bbb; padding: 6px; font-size: 12px; text-align: left; }
          th { background: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>CLIENTES FILTRADOS (${escapeHtml(filteredClients.length)})</h1>
        <div class="meta">Busca: ${escapeHtml(searchQuery || 'SEM FILTRO')} | Gerado em ${escapeHtml(new Date().toLocaleString('pt-BR'))}</div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>NOME</th>
              <th>TELEFONE</th>
              <th>PLACA</th>
              <th>CIDADE</th>
              <th>ESTADO</th>
              <th>TABELA</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="7">Nenhum cliente encontrado.</td></tr>'}
          </tbody>
        </table>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  function exportProductsCSV() {
    downloadCsv(
      `cadastro-filtrado-${Date.now()}.csv`,
      ['ID', 'Tipo', 'Descricao', 'Quantidade', 'Preco Tabela 1', 'Preco Tabela 2', 'Sem Estoque'],
      filteredProducts.map((item) => [
        item.id ?? '',
        item.itemType,
        item.description,
        item.quantity,
        item.priceTable1.toFixed(2),
        item.priceTable2.toFixed(2),
        item.quantity <= 0 ? 'SIM' : 'NAO',
      ])
    );
  }

  function printFilteredProducts() {
    const printWindow = openPrintWindow('width=1100,height=700');
    if (!printWindow) {
      window.alert('Nao foi possivel abrir a janela de impressao. Verifique se o bloqueador de pop-up esta ativo.');
      return;
    }

    const rows = filteredProducts
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(item.itemType)}</td>
            <td>${escapeHtml(item.description || '-')}</td>
            <td>${escapeHtml(formatNumberValue(item.quantity))}</td>
            <td>${escapeHtml(formatMoney(item.priceTable1))}</td>
            <td>${escapeHtml(formatMoney(item.priceTable2))}</td>
            <td>${item.quantity <= 0 ? 'SIM' : 'NAO'}</td>
          </tr>
        `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>CADASTRO FILTRADO</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #111; }
          h1 { margin: 0 0 10px; font-size: 18px; }
          .meta { margin-bottom: 12px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #bbb; padding: 6px; font-size: 12px; text-align: left; }
          th { background: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>CADASTRO FILTRADO (${escapeHtml(filteredProducts.length)})</h1>
        <div class="meta">Busca: ${escapeHtml(productSearchQuery || 'SEM FILTRO')} | Gerado em ${escapeHtml(new Date().toLocaleString('pt-BR'))}</div>
        <table>
          <thead>
            <tr>
              <th>TIPO</th>
              <th>DESCRICAO</th>
              <th>QUANTIDADE</th>
              <th>TABELA 1</th>
              <th>TABELA 2</th>
              <th>SEM ESTOQUE</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="6">Nenhum item encontrado.</td></tr>'}
          </tbody>
        </table>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  function exportFinancialCSV() {
    downloadCsv(
      `financeiro-filtrado-${Date.now()}.csv`,
      ['ID', 'Data', 'Descricao', 'Tipo', 'Valor', 'Vinculado Venda', 'Origem', 'ID Origem', 'Status'],
      filteredFinancialEntries.map((row) => {
        const type = row.amount < 0 ? 'DESPESA' : 'RECEITA';
        return [
          row.id,
          row.date,
          row.description,
          type,
          row.amount.toFixed(2),
          row.sourceType === 'venda' ? 'SIM' : 'NAO',
          row.sourceType || '',
          row.sourceId || '',
        ];
      })
    );
  }

  function printFilteredFinancial() {
    const printWindow = openPrintWindow('width=1200,height=800');
    if (!printWindow) {
      window.alert('Nao foi possivel abrir a janela de impressao. Verifique se o bloqueador de pop-up esta ativo.');
      return;
    }

    const rows = filteredFinancialEntries
      .map((row) => {
        const kind = resolveFinancialKind(row) === 'despesa' ? 'DESPESA' : 'RECEITA';
        return `
          <tr>
            <td>${escapeHtml(row.id)}</td>
            <td>${escapeHtml(row.date || '-')}</td>
            <td>${escapeHtml(row.description || '-')}</td>
            <td>${kind}</td>
            <td>${escapeHtml(formatMoney(row.amount))}</td>
          </tr>
        `;
      })
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>FINANCEIRO FILTRADO</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #111; }
          h1 { margin: 0 0 10px; font-size: 18px; }
          .meta { margin-bottom: 12px; font-size: 12px; }
          .dashboard-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-bottom: 12px; }
          .kpi { border: 1px solid #bbb; border-radius: 6px; padding: 8px; background: #fafafa; }
          .kpi strong { display: block; font-size: 10px; color: #555; margin-bottom: 4px; text-transform: uppercase; }
          .kpi span { font-size: 13px; font-weight: 700; color: #111; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #bbb; padding: 6px; font-size: 12px; text-align: left; }
          th { background: #f2f2f2; }
          @media print {
            .dashboard-grid { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>FINANCEIRO FILTRADO (${escapeHtml(filteredFinancialEntries.length)})</h1>
        <div class="meta">Periodo: ${escapeHtml(financialFilters.startDate || 'INICIO')} ate ${escapeHtml(financialFilters.endDate || 'HOJE')} | Gerado em ${escapeHtml(new Date().toLocaleString('pt-BR'))}</div>
        <section class="dashboard-grid">
          <div class="kpi"><strong>Lancamentos</strong><span>${escapeHtml(formatNumberValue(financialSummary.totalEntries))}</span></div>
          <div class="kpi"><strong>Receitas</strong><span>${escapeHtml(formatMoney(financialSummary.income))}</span></div>
          <div class="kpi"><strong>Despesas</strong><span>${escapeHtml(formatMoney(financialSummary.expense))}</span></div>
          <div class="kpi"><strong>Saldo</strong><span>${escapeHtml(formatMoney(financialSummary.balance))}</span></div>
          <div class="kpi"><strong>Qtd Receitas</strong><span>${escapeHtml(formatNumberValue(financialSummary.incomeCount))}</span></div>
          <div class="kpi"><strong>Qtd Despesas</strong><span>${escapeHtml(formatNumberValue(financialSummary.expenseCount))}</span></div>
          <div class="kpi"><strong>Ticket Medio</strong><span>${escapeHtml(formatMoney(financialSummary.averageTicket))}</span></div>
          <div class="kpi"><strong>Total Geral (Base Completa)</strong><span>${escapeHtml(formatMoney(financialTotal))}</span></div>
          <div class="kpi"><strong>Vendas Filtradas</strong><span>${escapeHtml(formatMoney(financialSalesTotal))}</span></div>
          <div class="kpi"><strong>Qtd Vendas</strong><span>${escapeHtml(formatNumberValue(filteredFinancialSalesRows.length))}</span></div>
        </section>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>DATA</th>
              <th>DESCRICAO</th>
              <th>TIPO</th>
              <th>VALOR</th>
               <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="5">Nenhum lancamento encontrado.</td></tr>'}
          </tbody>
        </table>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  function exportReportsCSV() {
    const saleById = new Map(effectiveFinancialSalesRows.map((row) => [row.id, row]));
    downloadCsv(
      `relatorio-filtrado-${Date.now()}.csv`,
      [
        'Data Lancamento',
        'Tipo',
        'Descricao',
        'Valor Lancamento',
        'Origem',
        'Data Venda',
        'Cliente',
        'Telefone',
        'Placa',
        'Veiculo',
        'Subtotal Venda',
        'Desconto Venda',
        'Acrescimo Venda',
        'Total Venda',
        'Prazo Dias',
        'Mao de Obra',
        'Observacao',
      ],
      filteredReportEntries.map((entry) => {
        const type = resolveFinancialKind(entry) === 'despesa' ? 'DESPESA' : 'RECEITA';
        const sourceType = entry.sourceType || '';
        const sourceId = entry.sourceId || '';
        const linkedSale = sourceType === 'venda' && sourceId ? saleById.get(String(sourceId)) : undefined;

        return [
          entry.date,
          type,
          entry.description,
          entry.amount.toFixed(2),
          sourceType || '-',
          linkedSale?.date || '-',
          linkedSale?.customer || '-',
          linkedSale?.phone || '-',
          linkedSale?.plate || '-',
          linkedSale?.vehicle || '-',
          linkedSale ? linkedSale.subtotal.toFixed(2) : '-',
          linkedSale ? linkedSale.discount.toFixed(2) : '-',
          linkedSale ? linkedSale.surcharge.toFixed(2) : '-',
          linkedSale ? linkedSale.total.toFixed(2) : '-',
          linkedSale ? linkedSale.timeDays : '-',
          linkedSale?.laborRequired === null || linkedSale?.laborRequired === undefined
            ? '-'
            : linkedSale.laborRequired
              ? 'SIM'
              : 'NAO',
          linkedSale?.note || '-',
        ];
      })
    );
  }

  function exportReportsGroupedByDayCSV() {
    const grouped = filteredReportEntries.reduce<Record<string, { receitas: number; despesas: number; saldo: number; qtd: number }>>((acc, entry) => {
      const day = entry.date || 'SEM DATA';
      if (!acc[day]) {
        acc[day] = { receitas: 0, despesas: 0, saldo: 0, qtd: 0 };
      }
      const amount = Number(entry.amount) || 0;
      const kind = resolveFinancialKind(entry);
      if (kind === 'despesa') {
        acc[day].despesas += Math.abs(amount);
        acc[day].saldo -= Math.abs(amount);
      } else {
        acc[day].receitas += Math.abs(amount);
        acc[day].saldo += Math.abs(amount);
      }
      acc[day].qtd += 1;
      return acc;
    }, {});

    downloadCsv(
      `relatorio-resumo-diario-${Date.now()}.csv`,
      ['Data', 'Qtd Lancamentos', 'Receitas', 'Despesas', 'Saldo'],
      Object.entries(grouped)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([date, values]) => [date, values.qtd, values.receitas.toFixed(2), values.despesas.toFixed(2), values.saldo.toFixed(2)])
    );
  }

  function printDetailedReports() {
    const printWindow = openPrintWindow('width=1600,height=900');
    if (!printWindow) {
      window.alert('Nao foi possivel abrir a janela de impressao. Verifique se o bloqueador de pop-up esta ativo.');
      return;
    }

    const saleById = new Map(effectiveFinancialSalesRows.map((row) => [row.id, row]));

    const rows = filteredReportEntries
      .map((entry) => {
        const type = resolveFinancialKind(entry) === 'despesa' ? 'DESPESA' : 'RECEITA';
        const sourceType = entry.sourceType || '';
        const sourceId = entry.sourceId || '';
        const linkedSale = sourceType === 'venda' && sourceId ? saleById.get(String(sourceId)) : undefined;

        return `
          <tr>
            <td>${escapeHtml(entry.date || '-')}</td>
            <td>${type}</td>
            <td>${escapeHtml(entry.description || '-')}</td>
            <td>${escapeHtml(formatMoney(entry.amount))}</td>
            <td>${escapeHtml(sourceType || '-')}</td>
            <td>${escapeHtml(linkedSale?.date || '-')}</td>
            <td>${escapeHtml(linkedSale?.customer || '-')}</td>
            <td>${escapeHtml(linkedSale?.phone || '-')}</td>
            <td>${escapeHtml(linkedSale?.plate || '-')}</td>
            <td>${escapeHtml(linkedSale?.vehicle || '-')}</td>
            <td>${escapeHtml(linkedSale ? formatMoney(linkedSale.subtotal) : '-')}</td>
            <td>${escapeHtml(linkedSale ? formatMoney(linkedSale.discount) : '-')}</td>
            <td>${escapeHtml(linkedSale ? formatMoney(linkedSale.surcharge) : '-')}</td>
            <td>${escapeHtml(linkedSale ? formatMoney(linkedSale.total) : '-')}</td>
            <td>${escapeHtml(linkedSale ? String(linkedSale.timeDays) : '-')}</td>
            <td>${escapeHtml(
              linkedSale?.laborRequired === null || linkedSale?.laborRequired === undefined
                ? '-'
                : linkedSale.laborRequired
                  ? 'SIM'
                  : 'NAO'
            )}</td>
            <td>${escapeHtml(linkedSale?.note || '-')}</td>
          </tr>
        `;
      })
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>RELATORIO DETALHADO</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #111; }
          h1 { margin: 0 0 8px; font-size: 18px; }
          .meta { margin-bottom: 10px; font-size: 12px; }
          .summary { margin-bottom: 12px; font-size: 12px; font-weight: 600; }
          .table-wrap { overflow-x: auto; }
          table { width: 100%; border-collapse: collapse; min-width: 1900px; }
          th, td { border: 1px solid #bbb; padding: 5px; font-size: 11px; text-align: left; vertical-align: top; }
          th { background: #f2f2f2; text-transform: uppercase; }
          @media print {
            body { margin: 10mm; }
            .table-wrap { overflow: visible; }
            table { min-width: 0; }
          }
        </style>
      </head>
      <body>
        <h1>RELATORIO DETALHADO (${escapeHtml(filteredReportEntries.length)})</h1>
        <div class="meta">Periodo: ${escapeHtml(reportFilters.startDate || 'INICIO')} ate ${escapeHtml(reportFilters.endDate || 'HOJE')} | Tipo: ${escapeHtml(reportFilters.kind.toUpperCase())} | Gerado em ${escapeHtml(new Date().toLocaleString('pt-BR'))}</div>
        <div class="summary">Receitas: ${escapeHtml(formatMoney(reportIncomeTotal))} | Despesas: ${escapeHtml(formatMoney(reportExpenseTotal))} | Saldo: ${escapeHtml(formatMoney(reportBalance))}</div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data Lancamento</th>
                <th>Tipo</th>
                <th>Descricao</th>
                <th>Valor Lancamento</th>
                <th>Origem</th>
                <th>Data Venda</th>
                <th>Cliente</th>
                <th>Telefone</th>
                <th>Placa</th>
                <th>Veiculo</th>
                <th>Subtotal Venda</th>
                <th>Desconto Venda</th>
                <th>Acrescimo Venda</th>
                <th>Total Venda</th>
                <th>Prazo Dias</th>
                <th>Mao de Obra</th>
                <th>Observacao</th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="17">Nenhum lancamento encontrado para os filtros aplicados.</td></tr>'}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  function exportSalesHistoryCSV() {
    downloadCsv(
      `vendas-filtradas-${Date.now()}.csv`,
      ['ID', 'Data', 'Cliente', 'Telefone', 'Placa', 'Veiculo', 'Subtotal', 'Desconto', 'Acrescimo', 'Total', 'Forma Pagamento',
    'Status','Prazo Dias', 'Mao de Obra', 'Observacao'],
      filteredSalesHistory.map((row) => [
        row.id,
        row.createdAt,
        row.customer,
        row.phone,
        row.plate,
        row.vehicle,
        row.subtotal.toFixed(2),
        row.discount.toFixed(2),
        row.surcharge.toFixed(2),
        row.total.toFixed(2),
            row.paymentMethod,
    row.paymentStatus,
        row.timeDays,
        row.laborRequired ? 'SIM' : 'NAO',
        row.note,
      ])
    );
  }

  function printFilteredSalesHistory() {
    const printWindow = openPrintWindow('width=1200,height=800');
    if (!printWindow) {
      window.alert('Nao foi possivel abrir a janela de impressao. Verifique se o bloqueador de pop-up esta ativo.');
      return;
    }

    const filteredSalesTotalAmount = filteredSalesHistory.reduce((acc, row) => acc + (Number(row.total) || 0), 0);

    const rows = filteredSalesHistory
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.createdAt)}</td>
            <td>${escapeHtml(row.customer || 'SEM CLIENTE')}</td>
            <td>${escapeHtml(row.phone || 'SEM TELEFONE')}</td>
            <td>${escapeHtml(row.plate || 'SEM PLACA')}</td>
            <td>${escapeHtml(row.vehicle || 'SEM VEICULO')}</td>
            <td>${escapeHtml(formatMoney(row.total))}</td>
                    <td>${escapeHtml(row.paymentMethod || '-')}</td>
        <td>${escapeHtml(row.paymentStatus)}</td>
            <td>${row.laborRequired ? 'SIM' : 'NAO'}</td>
          </tr>
        `
      )
      .join('');

    const title = `LISTA DE VENDAS FILTRADAS (${filteredSalesHistory.length})`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #111; }
          h1 { margin: 0 0 10px; font-size: 18px; }
          .meta { margin-bottom: 12px; font-size: 12px; }
          .summary { margin-bottom: 12px; font-size: 12px; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #bbb; padding: 6px; font-size: 10px; vertical-align: top; white-space: nowrap; }
          th { background: #f2f2f2; text-align: left; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <div class="meta">Periodo: ${escapeHtml(salesHistoryFilters.startDate || 'INICIO')} ate ${escapeHtml(salesHistoryFilters.endDate || 'HOJE')} | Gerado em ${escapeHtml(new Date().toLocaleString('pt-BR'))}</div>
        <div class="summary">QTD VENDAS: ${escapeHtml(formatNumberValue(filteredSalesHistory.length))} | TOTAL VENDAS: ${escapeHtml(formatMoney(filteredSalesTotalAmount))}</div>
        <table>
          <thead>
            <tr>
              <th>DATA</th>
              <th>CLIENTE</th>
              <th>TELEFONE</th>
              <th>PLACA</th>
              <th>VEICULO</th>
              <th>TOTAL</th>
                <th>FORMA PAGAMENTO</th>
    <th>STATUS</th>
              <th>M.O</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="7">Nenhuma venda encontrada com os filtros atuais.</td></tr>'}
          </tbody>
        </table>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  function exportCalendarAppointmentsCSV() {
    downloadCsv(
      `agenda-${calendarSelectedDate}-${Date.now()}.csv`,
      ['ID', 'Dia', 'Data', 'Cliente', 'Telefone', 'Placa', 'Veiculo', 'Status', 'Total', 'Observacao'],
      calendarSelectedAppointments.map((row) => [
        row.id,
        row.dayKey,
        row.date,
        row.customer,
        row.phone,
        row.plate,
        row.vehicleDetails,
        row.status,
        row.total.toFixed(2),
        row.note,
      ])
    );
  }

  function printCalendarAppointments() {
    const printWindow = openPrintWindow('width=1200,height=800');
    if (!printWindow) {
      window.alert('Nao foi possivel abrir a janela de impressao. Verifique se o bloqueador de pop-up esta ativo.');
      return;
    }

    const rows = calendarSelectedAppointments
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.date)}</td>
            <td>${escapeHtml(row.customer || '-')}</td>
            <td>${escapeHtml(row.phone || '-')}</td>
            <td>${escapeHtml(row.plate || '-')}</td>
            <td>${escapeHtml((row.vehicleDetails || '-').split('\n')[0])}</td>
            <td>${escapeHtml(row.status)}</td>
            <td>${escapeHtml(formatMoney(row.total))}</td>
            <td>${escapeHtml(row.note || '-')}</td>
          </tr>
        `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>AGENDA FILTRADA</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #111; }
          h1 { margin: 0 0 10px; font-size: 18px; }
          .meta { margin-bottom: 12px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #bbb; padding: 6px; font-size: 12px; text-align: left; }
          th { background: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>AGENDA DO DIA (${escapeHtml(calendarSelectedAppointments.length)})</h1>
        <div class="meta">Data selecionada: ${escapeHtml(new Date(`${calendarSelectedDate}T12:00:00`).toLocaleDateString('pt-BR'))} | Gerado em ${escapeHtml(new Date().toLocaleString('pt-BR'))}</div>
        <table>
          <thead>
            <tr>
              <th>DATA / HORA</th>
              <th>CLIENTE</th>
              <th>TELEFONE</th>
              <th>PLACA</th>
              <th>VEICULO</th>
              <th>STATUS</th>
              <th>TOTAL</th>
              <th>OBSERVACAO</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="8">Nenhum agendamento no dia selecionado.</td></tr>'}
          </tbody>
        </table>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  function buildWhatsappAppointmentMessage(target: Pick<CalendarAppointment, 'customer' | 'date' | 'status'>) {
    return `Ola ${target.customer || 'cliente'}, seu agendamento esta ${target.status.toLowerCase()} para ${target.date}.`;
  }

  function openWhatsappAppointment(target: Pick<CalendarAppointment, 'customer' | 'phone' | 'date' | 'status'>, customMessage?: string) {
    const digits = (target.phone || '').replace(/\D/g, '');
    if (!digits) {
      window.alert('Telefone do agendamento nao informado.');
      return;
    }

    const message = (customMessage || buildWhatsappAppointmentMessage(target)).trim();
    if (!message) {
      window.alert('Mensagem do WhatsApp nao pode ficar vazia.');
      return;
    }

    window.open(`https://wa.me/55${digits}?text=${encodeURIComponent(message)}`, '_blank');
  }

  function openWhatsappAppointmentWithMessageEdit(target: Pick<CalendarAppointment, 'customer' | 'phone' | 'date' | 'status'>) {
    const defaultMessage = buildWhatsappAppointmentMessage(target);
    const editedMessage = window.prompt('Edite a mensagem que sera enviada no WhatsApp:', defaultMessage);
    if (editedMessage === null) return;
    openWhatsappAppointment(target, editedMessage);
  }

  function openCalendarAppointmentWhatsapp() {
    if (!calendarEditData) return;
    openWhatsappAppointment(calendarEditData);
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
      <main className="intro-screen intro-brand">
        <img src={logoEtorkBrasil} alt="Etork Brasil" className="intro-logo-lg" />
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
                <div className="line"><strong>CADASTRO</strong></div>
                {filteredProducts.map((item, index) => (
                  <div className="menu-row" key={`${item.description}-${index}`}>
                    <span>{item.itemType}</span>
                    <span>{item.description}</span>
                    <span>{formatMoney(item.priceTable1)}</span>
                    <span>{formatMoney(item.priceTable2)}</span>
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
              <button className="btn-back" onClick={() => setScreen('dashboard')} aria-label="Voltar">
                <ArrowLeft size={18} />
              </button>
            </div>
          </footer>
        </main>
      )}

      {screen === 'menu-clients' && (
        <main className="panel panel-form client-panel">
          <h2 className="panel-title">CLIENTES</h2>
          <section className="form-grid menu-single">
            <div className="form-main client-main">
              <div className="clients-toolbar client-toolbar-modern">
                <button className="btn-cyan lg" onClick={addClient}>NOVO CLIENTE</button>
                <input
                  className="input-look"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Buscar por nome, telefone, placa, cidade ou estado"
                />
              </div>
              <div className="mini-actions receipt-actions" style={{ marginBottom: 10 }}>
                <button className="btn-cyan lg" onClick={exportClientsCSV}>EXPORTAR FILTRADO</button>
                <button className="btn-yellow lg" onClick={printFilteredClients}>IMPRIMIR FILTRADO</button>
              </div>

              <div className="clients-columns client-columns-modern">
                <section className="clients-table-card client-card">
                  <header>
                    <strong>TABELA 1 - CLIENTE FINAL</strong>
                    <span>{clientsTable1.length} cliente(s)</span>
                  </header>
                  {clientsTable1.map((client, index) => (
                    <div className="menu-row editable client-row client-row-modern" key={`${client.id}-table1-${index}`}>
                      <input className="input-look" value={client.name} onChange={(event) => updateClient(client.id, { name: event.target.value })} />
                      <input className="input-look" value={client.phone} onChange={(event) => updateClient(client.id, { phone: event.target.value })} />
                      <input className="input-look plate" value={client.plate} onChange={(event) => updateClient(client.id, { plate: event.target.value.toUpperCase() })} />
                      <input className="input-look" value={client.city || ''} onChange={(event) => updateClient(client.id, { city: event.target.value })} />
                      <input className="input-look" value={client.state || ''} maxLength={2} onChange={(event) => updateClient(client.id, { state: event.target.value.toUpperCase() })} />
                      <select className="input-look" value={client.priceTable} onChange={(event) => updateClient(client.id, { priceTable: Number(event.target.value) as PriceTable })}>
                        <option value={1}>TABELA 1</option>
                        <option value={2}>TABELA 2</option>
                      </select>
                      <button className="item-delete" onClick={() => removeClient(client.id)} aria-label="Excluir cliente">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {clientsTable1.length === 0 && <div className="receipt-empty">Nenhum cliente na Tabela 1 para este filtro.</div>}
                </section>

                <section className="clients-table-card client-card">
                  <header>
                    <strong>TABELA 2 - FRANQUEADO</strong>
                    <span>{clientsTable2.length} cliente(s)</span>
                  </header>
                  {clientsTable2.map((client, index) => (
                    <div className="menu-row editable client-row client-row-modern" key={`${client.id}-table2-${index}`}>
                      <input className="input-look" value={client.name} onChange={(event) => updateClient(client.id, { name: event.target.value })} />
                      <input className="input-look" value={client.phone} onChange={(event) => updateClient(client.id, { phone: event.target.value })} />
                      <input className="input-look plate" value={client.plate} onChange={(event) => updateClient(client.id, { plate: event.target.value.toUpperCase() })} />
                      <input className="input-look" value={client.city || ''} onChange={(event) => updateClient(client.id, { city: event.target.value })} />
                      <input className="input-look" value={client.state || ''} maxLength={2} onChange={(event) => updateClient(client.id, { state: event.target.value.toUpperCase() })} />
                      <select className="input-look" value={client.priceTable} onChange={(event) => updateClient(client.id, { priceTable: Number(event.target.value) as PriceTable })}>
                        <option value={1}>TABELA 1</option>
                        <option value={2}>TABELA 2</option>
                      </select>
                      <button className="item-delete" onClick={() => removeClient(client.id)} aria-label="Excluir cliente">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {clientsTable2.length === 0 && <div className="receipt-empty">Nenhum cliente na Tabela 2 para este filtro.</div>}
                </section>
              </div>
            </div>
          </section>
          <footer className="panel-footer">
            <div className="footer-right">
              <button className="btn-back" onClick={() => setScreen('dashboard')} aria-label="Voltar">
                <ArrowLeft size={18} />
              </button>
            </div>
          </footer>
        </main>
      )}

      {screen === 'menu-products' && (
        <main className="panel panel-form cadastro-panel">
          <h2 className="panel-title">CADASTRO</h2>
          <section className="form-grid menu-single">
            <div className="form-main cadastro-main">
              <div className="line search-bar cadastro-search-bar">
                <strong>BUSCA:</strong> 
                <input 
                  className="input-look" 
                  value={productSearchQuery} 
                  onChange={(event) => setProductSearchQuery(event.target.value)} 
                  placeholder="nome do item..."
                />
              </div>
              <div className="mini-actions receipt-actions cadastro-actions">
                <button className="btn-cyan lg" onClick={addProduct}>NOVO CADASTRO</button>
                <button className="btn-cyan lg" onClick={exportProductsCSV}>EXPORTAR FILTRADO</button>
                <button className="btn-yellow lg" onClick={printFilteredProducts}>IMPRIMIR FILTRADO</button>
              </div>
              <div className="cadastro-list">
              {filteredProducts.length === 0 ? (
                <div className="no-results">Nenhum item encontrado</div>
              ) : (
                filteredProducts.map((item, index) => {
                  const actualIndex = serviceCatalogData.findIndex(
                    (p) => p.id === item.id || (p.description === item.description && p.itemType === item.itemType)
                  );
                  const isOutOfStock = item.quantity <= 0;
                  return (
                    <div className={`menu-row editable cadastro-row ${isOutOfStock ? 'out-of-stock' : ''}`} key={`${item.description}-${index}`}>
                      <span className="product-name cadastro-type">{item.itemType}</span>
                      <span className="product-name">{item.description}</span>
                      <span className={`product-qty ${isOutOfStock ? 'out-of-stock' : ''}`}>
                        QTD: {formatNumberValue(item.quantity)}
                        {isOutOfStock && <strong className="stock-alert">SEM ESTOQUE</strong>}
                      </span>
                      <span className="product-price">T1 {formatMoney(item.priceTable1)}</span>
                      <span className="product-price">T2 {formatMoney(item.priceTable2)}</span>
                      <div className="item-actions">
                        <button className="item-edit" onClick={() => openEditProductModal(actualIndex)} aria-label="Editar item">
                          <Pencil size={14} />
                        </button>
                        <button className="item-delete" onClick={() => void removeProduct(item.id, actualIndex)} aria-label="Excluir item">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
              </div>
            </div>
          </section>
          <footer className="panel-footer">
            <div className="footer-right">
              <button className="btn-back" onClick={() => setScreen('dashboard')} aria-label="Voltar">
                <ArrowLeft size={18} />
              </button>
            </div>
          </footer>
        </main>
      )}

      {screen === 'menu-financial' && (
        <main className="panel panel-form">
          <h2 className="panel-title">FINANCEIRO</h2>
          <section className="form-grid menu-single">
            <div className="form-main">
              <div className="financial-summary-grid">
                <article className="financial-card">
                  <strong>LANCAMENTOS</strong>
                  <span>{financialSummary.totalEntries}</span>
                </article>
                <article className="financial-card">
                  <strong>RECEITAS</strong>
                  <span>{formatMoney(financialSummary.income)}</span>
                </article>
                <article className="financial-card">
                  <strong>DESPESAS</strong>
                  <span>{formatMoney(financialSummary.expense)}</span>
                </article>
                <article className={`financial-card ${financialSummary.balance < 0 ? 'negative' : 'positive'}`}>
                  <strong>SALDO</strong>
                  <span>{formatMoney(financialSummary.balance)}</span>
                </article>
                <article className="financial-card">
                  <strong>QTD RECEITAS</strong>
                  <span>{financialSummary.incomeCount}</span>
                </article>
                <article className="financial-card">
                  <strong>QTD DESPESAS</strong>
                  <span>{financialSummary.expenseCount}</span>
                </article>
                <article className="financial-card">
                  <strong>TICKET MEDIO</strong>
                  <span>{formatMoney(financialSummary.averageTicket)}</span>
                </article>
              </div>

              <div className="financial-filters">
                <input
                  className="input-look"
                  placeholder="Buscar por descricao, cliente, placa, veiculo, data, valor ou id"
                  value={financialFilters.query}
                  onChange={(event) => setFinancialFilters((prev) => ({ ...prev, query: event.target.value }))}
                />
                <input
                  className="input-look"
                  type="date"
                  value={financialFilters.startDate}
                  onChange={(event) => setFinancialFilters((prev) => ({ ...prev, startDate: event.target.value }))}
                />
                <input
                  className="input-look"
                  type="date"
                  value={financialFilters.endDate}
                  onChange={(event) => setFinancialFilters((prev) => ({ ...prev, endDate: event.target.value }))}
                />
                <select
                  className="input-look"
                  value={financialFilters.kind}
                  onChange={(event) =>
                    setFinancialFilters((prev) => ({ ...prev, kind: event.target.value as FinancialFilters['kind'] }))
                  }
                >
                  <option value="all">TODOS</option>
                  <option value="receita">SOMENTE RECEITAS</option>
                  <option value="despesa">SOMENTE DESPESAS</option>
                </select>
                <select
  className="input-look"
  value={financialFilters.paymentStatus}
  onChange={(event) =>
    setFinancialFilters((prev) => ({
      ...prev,
      paymentStatus: event.target.value as FinancialFilters['paymentStatus'],
    }))
  }
>
  <option value="all">TODOS STATUS</option>
  <option value="PAGO">PAGO</option>
  <option value="PENDENTE">PENDENTE</option>
</select>
              </div>

              <div className="line"><strong>TOTAL GERAL (BASE COMPLETA):</strong> <span>{formatMoney(financialTotal)}</span></div>
              <div className="mini-actions receipt-actions">
                 <button className="btn-cyan lg" onClick={() => void addFinancialEntry('receita')}>ADICIONAR RECEITA</button>
                 <button className="btn-red lg" onClick={() => void addFinancialEntry('despesa')}>ADICIONAR DESPESA</button>
                 <button className="btn-yellow lg" onClick={exportFinancialCSV}>EXPORTAR CSV FILTRADO</button>
                  <button className="btn-yellow lg" onClick={printFilteredFinancial}>IMPRIMIR FILTRADO</button>
              </div>
              {pagedFinancialRows.map((entry) => (
                <div className={`menu-row editable financial-row ${entry.isSaleLinked ? 'locked' : ''}`} key={entry.id}>
                  <input
                    className="input-look"
                    type="date"
                    value={entry.date}
                    disabled={entry.isSaleLinked}
                    onChange={(event) => updateFinancialEntry(entry.id, { date: event.target.value })}
                    onBlur={() => void persistFinancialEntry(entry.id)}
                  />
                  <input
                    className="input-look"
                    value={entry.description}
                    disabled={entry.isSaleLinked}
                    onChange={(event) => updateFinancialEntry(entry.id, { description: event.target.value })}
                    onBlur={() => void persistFinancialEntry(entry.id)}
                  />
                  <input
                    className="input-look"
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={entry.amount === 0 && entry.isNew ? '' : entry.amount}
                    disabled={entry.isSaleLinked}
                    onChange={(event) => {
                      const rawValue = parseFloat(event.target.value);
                      const parsed = Number.isFinite(rawValue) ? rawValue : 0;
                      const normalizedAmount = resolveFinancialKind(entry) === 'despesa'
                        ? -Math.abs(parsed)
                        : Math.abs(parsed);
                      updateFinancialEntry(entry.id, { amount: normalizedAmount });
                    }}
                    onBlur={() => void persistFinancialEntry(entry.id)}
                  />
                  <span className={`financial-kind ${entry.kindLabel === 'DESPESA' ? 'expense' : 'income'}`}>
                    {entry.isSaleLinked ? 'RECEITA VENDA' : entry.kindLabel}
                  </span>
                  <span className="financial-balance-cell">{formatMoney(entry.runningBalance)}</span>
                  <button className="item-delete" disabled={entry.isSaleLinked} onClick={() => void removeFinancialEntry(entry.id)}>
                    {entry.isSaleLinked ? '-' : 'X'}
                  </button>
                  <select
  className="input-look"
  value={entry.paymentStatus}
  onChange={(event) => {
    updateFinancialEntry(entry.id, {
      paymentStatus: event.target.value as 'PAGO' | 'PENDENTE',
    });
    void persistFinancialEntry(entry.id);
  }}
>
  <option value="PENDENTE">PENDENTE</option>
  <option value="PAGO">PAGO</option>
</select>
                </div>
              ))}
              {filteredFinancialEntries.length === 0 && (
                <div className="receipt-empty">Nenhum lancamento encontrado para os filtros aplicados.</div>
              )}
              {filteredFinancialEntries.length > 0 && (
                <div className="financial-pagination">
                  <span>{`Mostrando ${financialPageRangeLabel} de ${filteredFinancialEntries.length}`}</span>
                  <div className="mini-actions">
                    <button
                      className="btn-cyan"
                      onClick={() => setFinancialPage((current) => Math.max(1, current - 1))}
                      disabled={financialPage <= 1}
                    >
                      ANTERIOR
                    </button>
                    <button
                      className="btn-cyan"
                      onClick={() => setFinancialPage((current) => Math.min(financialTotalPages, current + 1))}
                      disabled={financialPage >= financialTotalPages}
                    >
                      PROXIMA
                    </button>
                  </div>
                </div>
              )}

              <div className="financial-sales-section">
                <div className="line"><strong>VENDAS FILTRADAS:</strong> <span>{formatMoney(financialSalesTotal)}</span></div>
                <div className="line"><strong>QTD VENDAS:</strong> <span>{formatNumberValue(filteredFinancialSalesRows.length)}</span></div>

                <div className="financial-sales-table">
                  <div className="financial-sales-header">
                    <span>DATA</span>
                    <span>CLIENTE</span>
                    <span>PLACA</span>
                    <span>VEICULO</span>
                    <span>TOTAL / STATUS</span>
                  </div>
                  {filteredFinancialSalesRows.map((sale) => (
                    <div className="financial-sales-row" key={sale.id}>
                      <span>{sale.date}</span>
                      <span>{sale.customer}</span>
                      <span>{sale.plate || 'SEM PLACA'}</span>
                      <span>{sale.vehicle || 'SEM VEICULO'}</span>
                      <span className="financial-total-status-cell">
                        <strong className="money">{formatMoney(sale.total)}</strong>
                        <select
                          className="input-look financial-status-select"
                          value={sale.paymentStatus}
                          onChange={(event) =>
                            void updateSalePaymentStatus(
                              sale.id,
                              event.target.value as 'PAGO' | 'PENDENTE'
                            )
                          }
                        >
                          <option value="PENDENTE">PENDENTE</option>
                          <option value="PAGO">PAGO</option>
                        </select>
                      </span>
                    </div>
                  ))}
                  {filteredFinancialSalesRows.length === 0 && (
                    <div className="receipt-empty">Nenhuma venda encontrada para os filtros aplicados.</div>
                  )}
                </div>
              </div>
            </div>
          </section>
          <footer className="panel-footer">
            <div className="footer-right">
              <button className="btn-back" onClick={() => setScreen('dashboard')} aria-label="Voltar">
                <ArrowLeft size={18} />
              </button>
            </div>
          </footer>
        </main>
      )}

      {screen === 'menu-reports' && (
        <main className="panel panel-form">
          <h2 className="panel-title">RELATORIOS</h2>
          <section className="form-grid menu-single">
            <div className="form-main">
              <div className="financial-filters">
                <input
                  className="input-look"
                  placeholder="Buscar por descricao, tipo, data, valor ou id"
                  value={reportFilters.query}
                  onChange={(event) => setReportFilters((prev) => ({ ...prev, query: event.target.value }))}
                />
                <input
                  className="input-look"
                  type="date"
                  value={reportFilters.startDate}
                  onChange={(event) => setReportFilters((prev) => ({ ...prev, startDate: event.target.value }))}
                />
                <input
                  className="input-look"
                  type="date"
                  value={reportFilters.endDate}
                  onChange={(event) => setReportFilters((prev) => ({ ...prev, endDate: event.target.value }))}
                />
                <select
                  className="input-look"
                  value={reportFilters.kind}
                  onChange={(event) =>
                    setReportFilters((prev) => ({ ...prev, kind: event.target.value as ReportFilters['kind'] }))
                  }
                >
                  <option value="all">TODOS</option>
                  <option value="receita">SOMENTE RECEITAS</option>
                  <option value="despesa">SOMENTE DESPESAS</option>
                </select>
              </div>

              <div className="line"><strong>CLIENTES CADASTRADOS:</strong> <span>{formatNumberValue(clients.length)}</span></div>
              <div className="line"><strong>ITENS CADASTRADOS:</strong> <span>{formatNumberValue(serviceCatalogData.length)}</span></div>
              <div className="line"><strong>RECIBOS GERADOS:</strong> <span>{formatNumberValue(receipts.length)}</span></div>
              <div className="line"><strong>FATURAMENTO:</strong> <span>{formatMoney(financialTotal)}</span></div>
              <div className="line"><strong>REGISTROS FILTRADOS:</strong> <span>{formatNumberValue(filteredReportEntries.length)}</span></div>
              <div className="mini-actions">
                <button className="btn-yellow lg" onClick={printDetailedReports}>IMPRIMIR RELATORIO</button>
                <button className="btn-cyan lg" onClick={exportReportsCSV}>EXPORTAR CSV FILTRADO</button>
                <button className="btn-cyan lg" onClick={exportReportsGroupedByDayCSV}>EXPORTAR RESUMO DIARIO</button>
                <button className="btn-cyan lg" onClick={() => setScreen('print-receipt')}>VER RECIBOS</button>
              </div>
            </div>
          </section>
          <footer className="panel-footer">
            <div className="footer-right">
              <button className="btn-back" onClick={() => setScreen('dashboard')} aria-label="Voltar">
                <ArrowLeft size={18} />
              </button>
            </div>
          </footer>
        </main>
      )}

      {screen === 'appointment-calendar' && (
        <main className="panel panel-form panel-calendar">
          <section className="panel-hero calendar-hero">
            <div>
              <p className="panel-eyebrow">GESTAO DE HORARIOS</p>
              <h2 className="panel-title">CALENDARIO DE AGENDAMENTOS</h2>
              <p className="panel-subtitle">Visualize o mes, acompanhe a carga do dia e acesse os agendamentos sem perder contexto.</p>
            </div>
            <div className="panel-summary-strip calendar-hero-stats">
              <div className="summary-chip">
                <span>DATA SELECIONADA</span>
                <strong>{new Date(`${calendarSelectedDate}T12:00:00`).toLocaleDateString('pt-BR')}</strong>
              </div>
              <div className="summary-chip">
                <span>AGENDAMENTOS</span>
                <strong>{formatNumberValue(calendarSelectedAppointments.length)}</strong>
              </div>
              <div className="summary-chip highlight">
                <span>CONFIRMADOS NO DIA</span>
                <strong>{formatNumberValue(calendarSelectedAppointments.filter((appointment) => appointment.status !== 'CANCELADO').length)}</strong>
              </div>
            </div>
          </section>
          <section className="calendar-layout">
            <div className="calendar-main calendar-main-card">
              <div className="calendar-toolbar">
                <button className="calendar-nav" onClick={() => moveCalendarMonth(-1)} aria-label="Mes anterior">
                  <ChevronLeft size={20} />
                </button>
                <div className="calendar-month-label">{calendarMonthLabel}</div>
                <button className="calendar-nav" onClick={() => moveCalendarMonth(1)} aria-label="Proximo mes">
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="calendar-weekdays">
                {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map((day) => (
                  <div className="calendar-weekday" key={day}>
                    {day}
                  </div>
                ))}
              </div>

              <div className="calendar-grid">
                {calendarDays.map((day) => {
                  const dayKey = toInputDateValue(day);
                  const isSelected = dayKey === calendarSelectedDate;
                  const isToday = dayKey === calendarTodayKey;
                  const dayAppointments = appointmentsByDate[dayKey] || [];

                  return (
                    <button
                      key={dayKey}
                      className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                      onClick={() => setCalendarSelectedDate(dayKey)}
                    >
                      <span className="calendar-day-number">{day.getDate()}</span>
                      {dayAppointments.length > 0 && <span className="calendar-day-badge">{dayAppointments.length}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <aside className="calendar-side calendar-side-card">
              <div className="calendar-side-header">
                <strong>{new Date(`${calendarSelectedDate}T12:00:00`).toLocaleDateString('pt-BR')}</strong>
                <span>{formatNumberValue(calendarSelectedAppointments.length)} agendamento(s)</span>
                <div className="mini-actions receipt-actions">
                  <button className="btn-cyan lg" onClick={exportCalendarAppointmentsCSV}>EXPORTAR FILTRADO</button>
                  <button className="btn-yellow lg" onClick={printCalendarAppointments}>IMPRIMIR FILTRADO</button>
                </div>
              </div>

              <div className="calendar-side-list">
                {calendarSelectedAppointments.length === 0 ? (
                  <div className="calendar-empty">Nenhum agendamento neste dia.</div>
                ) : (
                  calendarSelectedAppointments.map((appointment) => (
                    <article className="calendar-card" key={appointment.id} onClick={() => openCalendarEdit(appointment)} style={{ cursor: 'pointer' }}>
                      <div className="calendar-card-title">{appointment.customer || 'SEM CLIENTE'}</div>
                      <div className={`calendar-status-badge ${appointment.status === 'CANCELADO' ? 'cancelado' : 'confirmado'}`}>{appointment.status}</div>
                      <div className="calendar-card-line">{appointment.plate || 'SEM PLACA'}</div>
                      <div className="calendar-card-line">{appointment.vehicleDetails.split('\n')[0] || 'SEM VEICULO'}</div>
                      <div className="calendar-card-line">{appointment.date}</div>
                      <div className="calendar-card-line">{formatMoney(appointment.total)}</div>
                      <div className="calendar-card-actions">
                        <button
                          className="btn-cyan"
                          onClick={(event) => {
                            event.stopPropagation();
                            openWhatsappAppointment(appointment);
                          }}
                        >
                          WHATSAPP
                        </button>
                      </div>
                      <button
                        className="calendar-message-link"
                        onClick={(event) => {
                          event.stopPropagation();
                          openWhatsappAppointmentWithMessageEdit(appointment);
                        }}
                      >
                        ALTERAR MENSAGEM
                      </button>
                      {appointment.note && <div className="calendar-card-note">OBS: {appointment.note}</div>}
                    </article>
                  ))
                )}
              </div>
            </aside>
          </section>

          <footer className="panel-footer">
            <div className="footer-right">
              <button className="btn-back" onClick={() => setScreen('dashboard')} aria-label="Voltar">
                <ArrowLeft size={18} />
              </button>
            </div>
          </footer>
        </main>
      )}

      {screen === 'dashboard' && (
        <main className="panel panel-dashboard">
          <h2 className="panel-title">SERVICOS</h2>
          <section className="dashboard-layout">
            <aside className="left-actions">
              <button onClick={() => handleMenuAction('Clientes')}>CLIENTES</button>
              <button onClick={() => handleMenuAction('Financeiro')}>FINANCEIRO</button>
              <button onClick={() => handleMenuAction('Cadastro')}>CADASTRO</button>
              <button onClick={() => handleMenuAction('Agenda')}>AGENDA</button>
              <button onClick={() => handleMenuAction('Relatorios')}>RELATORIOS</button>
              <button onClick={() => handleMenuAction('Vendas')}>LISTAR VENDAS</button>
            </aside>

            <section className="dashboard-center">
              {shouldWaitDashboardRealData ? (
                <div className="receipt-empty">Carregando informacoes reais...</div>
              ) : (
                <>
                  <div className="dashboard-kpi-grid">
                    <article className="dashboard-kpi-card">
                      <strong>AGENDADOS HOJE</strong>
                      <span>{dashboardKpis.todayAppointments}</span>
                    </article>
                    <article className="dashboard-kpi-card">
                      <strong>CONFIRMADOS</strong>
                      <span>{dashboardKpis.confirmedToday}</span>
                    </article>
                    <article className="dashboard-kpi-card warning">
                      <strong>CANCELADOS</strong>
                      <span>{dashboardKpis.canceledToday}</span>
                    </article>
                    <article className="dashboard-kpi-card money">
                      <strong>RECEITA HOJE</strong>
                      <span>{formatMoney(dashboardKpis.todayRevenue)}</span>
                    </article>
                  </div>

                  {lowStockItems.length > 0 && (
                    <div className="stock-warning-panel">
                      <strong>ALERTA DE ESTOQUE BAIXO</strong>
                      <div className="stock-warning-list">
                        {lowStockItems.map((item) => (
                          <span key={`${item.id ?? 'local'}-${item.description}`}>{item.description} ({item.quantity})</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="service-chips">
                    {dashboardServices.map((service) => (
                      <article
                        key={service.id}
                        className="service-chip service-chip-clickable"
                        role="button"
                        tabIndex={0}
                        onClick={() => openDashboardServiceModal(service)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openDashboardServiceModal(service);
                          }
                        }}
                      >
                        <strong>{service.title}</strong>
                        <span>{service.plate}</span>
                        <span className="service-chip-customer">{service.customer}</span>
                        <small className={`tone-${service.tone}`}>{service.status}</small>
                      </article>
                    ))}
                    {dashboardServices.length === 0 && (
                      <div className="receipt-empty">Nenhum servico em andamento no momento.</div>
                    )}
                  </div>
                </>
              )}

              <div className="next-title">PROXIMOS AGENDAMENTOS</div>
              {nextAppointmentCards.length > 0 ? (
                nextAppointmentCards.map((appointment) => (
                  <article className="next-card" key={appointment.id}>
                    <strong>{appointment.model}</strong>
                    <span>{appointment.plate}</span>
                    <small>{appointment.date}</small>
                  </article>
                ))
              ) : (
                <div className="receipt-empty">Nenhum proximo agendamento encontrado.</div>
              )}
            </section>

            <aside className="right-actions">
              <button className="action-green" onClick={() => setScreen('new-sale')}>NOVA VENDA</button>
              <button className="action-yellow" onClick={() => setScreen('new-appointment')}>NOVO AGENDAMENTO</button>
              <button className="action-blue" onClick={() => { setQuoteData(createEmptyQuoteData()); setScreen('new-quote'); }}>NOVO ORCAMENTO</button>
              <button className="action-orange" onClick={() => setScreen('print-receipt')}>IMPRIMIR RECIBO</button>
            </aside>
          </section>
        </main>
      )}

      {screen === 'sales-history' && (
        <main className="panel panel-form sales-history-panel">
          <h2 className="panel-title">LISTA DE VENDAS</h2>
          <section className="form-grid menu-single">
            <div className="form-main sales-history-main">
              <div className="sales-history-filter-card">
                <div className="sales-history-filter-title">FILTROS</div>
                <div className="financial-filters sales-history-filters-grid">
                <input
                  className="input-look"
                  placeholder="Buscar por cliente, placa, telefone, veiculo ou numero"
                  value={salesHistoryFilters.query}
                  onChange={(event) => setSalesHistoryFilters((prev) => ({ ...prev, query: event.target.value }))}
                />
                <input
                  className="input-look"
                  type="date"
                  value={salesHistoryFilters.startDate}
                  onChange={(event) => setSalesHistoryFilters((prev) => ({ ...prev, startDate: event.target.value }))}
                />
                <input
                  className="input-look"
                  type="date"
                  value={salesHistoryFilters.endDate}
                  onChange={(event) => setSalesHistoryFilters((prev) => ({ ...prev, endDate: event.target.value }))}
                />
                </div>
                <div className="mini-actions receipt-actions" style={{ marginTop: 10 }}>
                  <button className="btn-cyan lg" onClick={exportSalesHistoryCSV}>EXPORTAR FILTRADO</button>
                  <button className="btn-yellow lg" onClick={printFilteredSalesHistory}>IMPRIMIR FILTRADO</button>
                </div>
              </div>

              {salesHistoryLoading && <div className="receipt-empty sales-history-empty">Carregando vendas...</div>}

              {!salesHistoryLoading && filteredSalesHistory.length === 0 && (
                <div className="receipt-empty sales-history-empty">Nenhuma venda encontrada.</div>
              )}

              {!salesHistoryLoading && filteredSalesHistory.length > 0 && (
                <div className="sales-history-list-card">
                  <div className="sales-history-grid-header">
                    <span>DATA</span>
                    <span>CLIENTE</span>
                    <span>PLACA</span>
                    <span>TOTAL</span>
                    <span>ACOES</span>
                  </div>

                  {pagedSalesHistory.map((sale) => (
                    <div className="sales-history-grid-row" key={sale.id}>
                      <span className="muted">{sale.createdAt}</span>
                      <span className="strong">{sale.customer}</span>
                      <span className="plate">{sale.plate || 'SEM PLACA'}</span>
                      <span className="money">{formatMoney(sale.total)}</span>
                      <div className="mini-actions">
                        <button className="btn-cyan sales-history-select-btn" onClick={() => void selectSaleForReceipt(sale.id, true)}>SELECIONAR</button>
                        <button className="btn-red sales-history-select-btn" onClick={() => void deleteSaleFromHistory(sale.id)}>EXCLUIR</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!salesHistoryLoading && filteredSalesHistory.length > 0 && (
                <div className="financial-pagination">
                  <span>{`Mostrando ${(salesHistoryPage - 1) * SALES_HISTORY_PAGE_SIZE + 1}-${Math.min(
                    salesHistoryPage * SALES_HISTORY_PAGE_SIZE,
                    filteredSalesHistory.length
                  )} de ${filteredSalesHistory.length}`}</span>
                  <div className="mini-actions">
                    <button
                      className="btn-cyan"
                      onClick={() => setSalesHistoryPage((current) => Math.max(1, current - 1))}
                      disabled={salesHistoryPage <= 1}
                    >
                      ANTERIOR
                    </button>
                    <button
                      className="btn-cyan"
                      onClick={() => setSalesHistoryPage((current) => Math.min(salesHistoryTotalPages, current + 1))}
                      disabled={salesHistoryPage >= salesHistoryTotalPages}
                    >
                      PROXIMA
                    </button>
                  </div>
                </div>
              )}

              {selectedSalePrintable && (
                <div className="print-config-card sales-history-preview-card" style={{ marginTop: 12 }}>
                  <h3>VENDA SELECIONADA</h3>
                  <div className="line"><strong>NUMERO:</strong> <span>{selectedSalePrintable.number}</span></div>
                  <div className="line"><strong>CLIENTE:</strong> <span>{selectedSalePrintable.customer}</span></div>
                  <div className="line"><strong>PLACA:</strong> <span>{selectedSalePrintable.plate || 'SEM PLACA'}</span></div>
                  <div className="line"><strong>TOTAL:</strong> <span>{formatMoney(selectedSalePrintable.total)}</span></div>
                  <table className="print-doc-items sales-history-items-table" style={{ marginTop: 10 }}>
                    <thead>
                      <tr>
                        <th>Descricao</th>
                        <th>Qtd</th>
                        <th>Valor Unit.</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSalePrintable.items.map((item, index) => (
                        <tr key={`${item.description}-${index}`}>
                          <td>{item.description}</td>
                          <td>{formatNumberValue(item.quantity)}</td>
                          <td>{formatMoney(item.price)}</td>
                          <td>{formatMoney(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mini-actions receipt-actions">
                    <button className="btn-yellow lg" onClick={printSelectedSaleReceipt}>IMPRIMIR RECIBO</button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <footer className="panel-footer">
            <div className="footer-right">
              <button className="btn-back" onClick={() => setScreen('dashboard')} aria-label="Voltar">
                <ArrowLeft size={18} />
              </button>
            </div>
          </footer>
        </main>
      )}

      {screen === 'new-quote' && (
        <QuoteScreen
          quoteData={quoteData}
          setQuoteData={setQuoteData}
          quoteSubtotal={quoteSubtotal}
          quoteTotal={quoteTotal}
          addItemToQuote={addItemToQuote}
          updateItems={updateItems}
          removeItem={removeItem}
          finalizeQuote={() => void finalizeQuote()}
          isSaving={isSaving}
          formatMoney={formatMoney}
          setScreen={setScreen}
          applyMatchedClient={applyMatchedClient}
          onPlateLookup={handlePlateLookup}
          clearQuoteForm={() => setQuoteData(createEmptyQuoteData())}
          onQuickCreateClient={(target) => void openQuickClientModal(target)}
        />
      )}

      {screen === 'new-appointment' && (
        <main className="panel panel-form panel-appointment">
          <section className="panel-hero appointment-hero">
            <div>
              <p className="panel-eyebrow">FLUXO RAPIDO</p>
              <h2 className="panel-title">NOVO AGENDAMENTO</h2>
              <p className="panel-subtitle">Importe um orçamento, ajuste os dados do cliente e finalize com uma leitura mais limpa do serviço.</p>
            </div>
            <div className="panel-summary-strip">
              <div className="summary-chip">
                <span>DATA</span>
                <strong>{toDisplayAppointmentDate(appointmentData.date)}</strong>
              </div>
              <div className="summary-chip">
                <span>ITENS</span>
                <strong>{formatNumberValue(appointmentData.items.length)}</strong>
              </div>
              <div className="summary-chip highlight">
                <span>TOTAL</span>
                <strong>{formatMoney(appointmentTotal)}</strong>
              </div>
            </div>
          </section>
          <section className="sale-tools sale-tools-search appointment-search-bar">
            <input className="input-look" value={appointmentQuoteSearch} onChange={(event) => setAppointmentQuoteSearch(event.target.value)} placeholder="Pesquisar orcamento por nome, data, valor, telefone, placa, veiculo ou observacao" />
            <button type="button" className="tool-blue" onClick={() => void runAppointmentQuoteSearch()}>PESQUISAR ORCAMENTO</button>
            <select className="input-look" value={appointmentSelectedQuoteId} onChange={(event) => setAppointmentSelectedQuoteId(event.target.value)}>
              <option value="">Selecione um orcamento</option>
              {appointmentQuoteResults.map((row) => (
                <option key={row.id} value={row.id}>{`${row.customer} | ${row.phone} | ${row.plate} | ${row.createdAt} | ${formatMoney(row.total)}`}</option>
              ))}
            </select>
            <button className="tool-yellow" onClick={() => void importQuoteToAppointmentBySearch()}>IMPORTAR</button>
            <button className="tool-yellow" onClick={clearAppointmentForm}>LIMPAR CAMPOS</button>
          </section>
          <section className="form-grid appointment-grid">
            <div className="form-main appointment-main-card">
              <div className="section-label">DADOS DO AGENDAMENTO</div>
              <div className="line"><strong>DATA:</strong> <input type="datetime-local" className="input-look" value={appointmentData.date} onChange={(event) => setAppointmentData((prev) => ({ ...prev, date: event.target.value }))} title={toDisplayAppointmentDate(appointmentData.date)} /></div>
              <div className="line"><strong>CLIENTE:</strong> <input list="client-suggestions" className="input-look" value={appointmentData.customer} onChange={(event) => {
                const value = event.target.value;
                setAppointmentData((prev) => ({ ...prev, customer: value }));
                if (value.trim().toLowerCase() === 'cadastrar novo cliente') {
                  void openQuickClientModal('appointment');
                }
              }} onBlur={(event) => applyMatchedClient('appointment', event.target.value)} /> <select className="input-look" value={appointmentData.customerType} onChange={(event) => setAppointmentData((prev) => ({ ...prev, customerType: event.target.value }))}><option value={getCustomerTypeLabel(1)}>{getCustomerTypeLabel(1)}</option><option value={getCustomerTypeLabel(2)}>{getCustomerTypeLabel(2)}</option></select> <button type="button" className="tool-blue" onClick={() => void openQuickClientModal('appointment')}>Cadastrar novo cliente</button></div>
              <div className="line line-mini"><strong>LISTAR</strong> <button onClick={addItemToAppointment}>+</button></div>
              <ServiceRows
                items={appointmentData.items}
                onChangeItem={(index, patch) => updateItems('appointment', index, patch)}
                onRemoveItem={(index) => removeItem('appointment', index)}
              />
              <div className="line"><strong>OBSERVACAO:</strong> <textarea className="vehicle-card note-input" value={appointmentData.note} onChange={(event) => setAppointmentData((prev) => ({ ...prev, note: event.target.value }))} /></div>
            </div>

            <aside className="vehicle-info appointment-side-card">
              <div className="section-label">VEICULO E CONTATO</div>
              <div className="line side-top"><strong>TEL:</strong> <input className="input-look" value={appointmentData.phone} onChange={(event) => setAppointmentData((prev) => ({ ...prev, phone: event.target.value }))} /></div>
              <div className="line side-top line-check"><strong>MAO DE OBRA</strong> <input type="checkbox" checked={appointmentData.laborRequired} onChange={(event) => setAppointmentData((prev) => ({ ...prev, laborRequired: event.target.checked }))} /></div>
              <div className="line side-top"><strong>PLACA:</strong> <input className="input-look plate" value={appointmentData.plate} onChange={(event) => setAppointmentData((prev) => ({ ...prev, plate: event.target.value.toUpperCase() }))} onBlur={(event) => void handlePlateLookup('appointment', event.target.value)} onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void handlePlateLookup('appointment', (event.currentTarget as HTMLInputElement).value);
                }
              }} /></div>
              <textarea className="vehicle-card vehicle-input" value={appointmentData.vehicleDetails} onChange={(event) => setAppointmentData((prev) => ({ ...prev, vehicleDetails: event.target.value }))} />
            </aside>
          </section>

          <footer className="panel-footer">
            <div className="footer-left">
              <div className="mini-actions">
                <button className="btn-yellow" onClick={() => askAndApplyDiscount(appointmentData.discount, (next) => setAppointmentData((prev) => ({ ...prev, discount: next })))}>INSERIR DESCONTO</button>
              </div>
              <div className="total">TOTAL: <span>{formatMoney(appointmentTotal)}</span></div>
            </div>
            <div className="footer-right">
              <div className="appointment-footer-note">Dica: use a busca para importar um orçamento e ganhar tempo no preenchimento.</div>
              <button className="btn-back" onClick={() => setScreen('dashboard')} aria-label="Voltar">
                <ArrowLeft size={18} />
              </button>
              <button className="btn-finish" onClick={() => void finalizeAppointment()}>{isSaving ? 'SALVANDO...' : 'FINALIZAR AGENDAMENTO'}</button>
            </div>
          </footer>
        </main>
      )}

      {screen === 'new-sale' && (
        <SaleScreen
          saleData={saleData}
          setSaleData={setSaleData}
          saleSubtotal={saleSubtotal}
          saleTotal={saleTotal}
          saleQuoteSearch={saleQuoteSearch}
          setSaleQuoteSearch={setSaleQuoteSearch}
          saleQuoteResults={saleQuoteResults}
          saleSelectedQuoteId={saleSelectedQuoteId}
          setSaleSelectedQuoteId={setSaleSelectedQuoteId}
          saleAppointmentSearch={saleAppointmentSearch}
          setSaleAppointmentSearch={setSaleAppointmentSearch}
          saleAppointmentResults={saleAppointmentResults}
          saleSelectedAppointmentId={saleSelectedAppointmentId}
          setSaleSelectedAppointmentId={setSaleSelectedAppointmentId}
          runSaleQuoteSearch={() => void runSaleQuoteSearch()}
          importQuoteToSaleBySearch={() => void importQuoteToSaleBySearch()}
          runSaleAppointmentSearch={() => void runSaleAppointmentSearch()}
          importAppointmentToSaleBySearch={() => void importAppointmentToSaleBySearch()}
          importQuoteToSale={() => void importQuoteToSale()}
          importAppointmentToSale={() => void importAppointmentToSale()}
          addItemToSale={addItemToSale}
          updateItems={updateItems}
          removeItem={removeItem}
          onCancelSale={clearSaleForm}
          finalizeSale={() => void finalizeSale()}
          isSaving={isSaving}
          formatMoney={formatMoney}
          setScreen={setScreen}
          applyMatchedClient={applyMatchedClient}
          onPlateLookup={handlePlateLookup}
          onQuickCreateClient={(target) => void openQuickClientModal(target)}
        />
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
            <div className="receipt-print-layout">
              <section className="print-config-card">
                <h3>CONFIGURACAO DO DOCUMENTO</h3>
                <div className="print-config-grid">
                  <label>
                    EMPRESA
                    <input
                      className="input-look"
                      value={printSettings.companyName}
                      readOnly
                    />
                  </label>
                  <label>
                    CNPJ/CPF
                    <input
                      className="input-look"
                      value={printSettings.companyDocument}
                      readOnly
                    />
                  </label>
                  <label>
                    TELEFONE DA EMPRESA
                    <input
                      className="input-look"
                      value={printSettings.companyPhone}
                      readOnly
                    />
                  </label>
                  <label>
                    EMAIL DA EMPRESA
                    <input
                      className="input-look"
                      value={printSettings.companyEmail}
                      readOnly
                    />
                  </label>
                  <label className="wide">
                    ENDERECO DA EMPRESA
                    <input
                      className="input-look"
                      value={printSettings.companyAddress}
                      readOnly
                    />
                  </label>
                  <label className="wide">
                    FORMA DE PAGAMENTO
                    <input
                      className="input-look"
                      value={printSettings.paymentMethod}
                      onChange={(event) => setPrintSettings((prev) => ({ ...prev, paymentMethod: event.target.value }))}
                    />
                  </label>
                  <label>
                    GARANTIA (DIAS)
                    <input
                      type="number"
                      min={0}
                      className="input-look"
                      value={printSettings.warrantyDays}
                      onChange={(event) =>
                        setPrintSettings((prev) => ({ ...prev, warrantyDays: Math.max(0, Number(event.target.value) || 0) }))
                      }
                    />
                  </label>
                  <label>
                    VALIDADE ORCAMENTO (DIAS)
                    <input
                      type="number"
                      min={0}
                      className="input-look"
                      value={printSettings.validityDays}
                      readOnly
                    />
                  </label>
                  <label>
                    RESPONSAVEL
                    <input
                      className="input-look"
                      value={printSettings.responsibleName}
                      onChange={(event) => setPrintSettings((prev) => ({ ...prev, responsibleName: event.target.value }))}
                    />
                  </label>
                </div>
              </section>

              <div className="print-doc-toolbar">
                <div className="mini-actions">
                  <button
                    className={`btn-cyan lg ${selectedPrintKind === 'orcamento' ? 'active-print' : ''}`}
                    onClick={() => setSelectedPrintKind('orcamento')}
                  >
                    ORCAMENTO
                  </button>
                  <button
                    className={`btn-cyan lg ${selectedPrintKind === 'venda' ? 'active-print' : ''}`}
                    onClick={() => setSelectedPrintKind('venda')}
                  >
                    VENDA
                  </button>
                </div>
                <button className="btn-yellow lg" onClick={() => window.print()}>IMPRIMIR DOCUMENTO</button>
              </div>

              {saleReceiptLoading && selectedPrintKind === 'venda' && (
                <div className="receipt-empty">Carregando itens da venda...</div>
              )}

              {selectedPrintableDocument ? (
                <article className="print-doc-sheet">
                  <header className="print-doc-header">
                    <div>
                      <img src={logoEtorkBrasil} alt="Etork Brasil" className="print-doc-logo" />
                      <h3>{selectedPrintableDocument.kind === 'venda' ? 'RECIBO DE VENDA' : 'ORCAMENTO DE SERVICOS'}</h3>
                      <p>Etork Brasil - Documento gerado pelo sistema</p>
                    </div>
                    <div className="print-doc-meta">
                      <div><strong>Numero:</strong> <span>{selectedPrintableDocument.number}</span></div>
                      <div><strong>Emissao:</strong> <span>{selectedPrintableDocument.issuedAt}</span></div>
                      <div><strong>Tipo:</strong> <span>{selectedPrintableDocument.kind.toUpperCase()}</span></div>
                    </div>
                  </header>

                  <section className="print-doc-grid">
                    <div>
                      <h4>Dados do Cliente</h4>
                      <p><strong>Cliente:</strong> {selectedPrintableDocument.customer || 'NAO INFORMADO'}</p>
                      <p><strong>Tipo:</strong> {selectedPrintableDocument.customerType || 'NAO INFORMADO'}</p>
                      <p><strong>Telefone:</strong> {selectedPrintableDocument.phone || 'NAO INFORMADO'}</p>
                      <p><strong>Placa:</strong> {selectedPrintableDocument.plate || 'NAO INFORMADA'}</p>
                    </div>
                    <div>
                      <h4>Dados do Veiculo e Servico</h4>
                      <p><strong>Veiculo:</strong> {selectedPrintableDocument.vehicle || 'NAO INFORMADO'}</p>
                      <p><strong>Tempo estimado:</strong> {formatDaysValue(selectedPrintableDocument.serviceTimeDays)}</p>
                      {selectedPrintableDocument.laborRequired !== null && (
                        <p><strong>Mao de obra:</strong> {selectedPrintableDocument.laborRequired ? 'SIM' : 'NAO'}</p>
                      )}
                    </div>
                  </section>
<section className="print-doc-totals">
  <div><strong>Subtotal:</strong> {formatMoney(selectedPrintableDocument.subtotal)}</div>
  <div><strong>Desconto:</strong> {formatMoney(selectedPrintableDocument.discount)}</div>
  <div><strong>Total:</strong> {formatMoney(selectedPrintableDocument.total)}</div>
  <div><strong>Forma de pagamento:</strong> {selectedPrintableDocument.paymentMethod || 'Não informado'}</div>
</section>

                  <table className="print-doc-items">
                    <thead>
                      <tr>
                        <th>Descricao</th>
                        <th>Qtd</th>
                        <th>Valor Unit.</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedPrintableDocument.items.map((item, index) => (
                        <tr key={`${item.description}-${index}`}>
                          <td>{item.description}</td>
                          <td>{formatNumberValue(item.quantity)}</td>
                          <td>{formatMoney(item.price)}</td>
                          <td>{formatMoney(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <section className="print-doc-totals">
                    <div><strong>Subtotal:</strong> <span>{formatMoney(selectedPrintableDocument.subtotal)}</span></div>
                    <div><strong>Desconto:</strong> <span>{formatMoney(selectedPrintableDocument.discount)}</span></div>
                    <div className="grand-total"><strong>Total:</strong> <span>{formatMoney(selectedPrintableDocument.total)}</span></div>
                  </section>

                  <section className="print-doc-note">
                    <h4>Observacoes</h4>
                    <p>{selectedPrintableDocument.note || 'Sem observacoes adicionais.'}</p>
                  </section>

                  <section className="print-doc-commercial">
                    <h4>Informacoes Comerciais</h4>
                    <p><strong>Forma de pagamento:</strong> {printSettings.paymentMethod}</p>
                    <p><strong>Garantia:</strong> {formatDaysValue(printSettings.warrantyDays)}</p>
                    <p><strong>Validade do orcamento:</strong> {formatDaysValue(printSettings.validityDays)}</p>
                    <p><strong>Responsavel:</strong> {printSettings.responsibleName}</p>
                  </section>

                  <section className="print-doc-company">
                    <h4>Dados da Empresa</h4>
                    <p>{printSettings.companyName}</p>
                    <p>{printSettings.companyDocument}</p>
                    <p>{printSettings.companyPhone}</p>
                    <p>{printSettings.companyEmail}</p>
                    <p>{printSettings.companyAddress}</p>
                  </section>

                  <section className="print-doc-signatures">
                    <div>
                      <span>Assinatura da Empresa</span>
                    </div>
                    <div>
                      <span>Assinatura do Cliente</span>
                    </div>
                  </section>
                </article>
              ) : (
                <div className="receipt-empty">Nao ha dados suficientes para montar o documento de impressao.</div>
              )}
            </div>

            <div className="mini-actions receipt-actions">
              <button className="btn-cyan lg" onClick={addReceipt}>NOVO RECIBO</button>
            </div>
            {filteredReceipts.map((row) => (
              <div className="receipt-row editable" key={row.id}>
                <input className="input-look" value={row.date} onChange={(event) => updateReceipt(row.id, { date: event.target.value })} />
                <input className="input-look" value={row.customer} onChange={(event) => updateReceipt(row.id, { customer: event.target.value })} />
                <input className="input-look" value={row.car} onChange={(event) => updateReceipt(row.id, { car: event.target.value })} />
                <input className="input-look plate" value={row.plate} onChange={(event) => updateReceipt(row.id, { plate: event.target.value.toUpperCase() })} onBlur={(event) => void handleReceiptPlateLookup(row.id, event.target.value)} onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void handleReceiptPlateLookup(row.id, (event.currentTarget as HTMLInputElement).value);
                  }
                }} />
                <input className="input-look" type="number" min={0} step="0.01" value={row.total} onChange={(event) => updateReceipt(row.id, { total: Math.max(0, Number(event.target.value) || 0) })} />
                <button className="item-delete" onClick={() => removeReceipt(row.id)} aria-label="Excluir recibo">
                  <Trash2 size={14} />
                </button>
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
              <button className="btn-back" onClick={() => setScreen('dashboard')} aria-label="Voltar">
                <ArrowLeft size={18} />
              </button>
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

      <CatalogPickerModal
        isOpen={catalogPickerOpen}
        rows={serviceCatalogData}
        selectedIndex={catalogPickerIndex}
        quantity={catalogPickerQuantity}
        priceTable={getSelectedPriceTable(
          catalogPickerTarget === 'quote'
            ? quoteData.customerType
            : catalogPickerTarget === 'appointment'
              ? appointmentData.customerType
              : saleData.customerType
        )}
        onSelectedIndex={setCatalogPickerIndex}
        onQuantity={setCatalogPickerQuantity}
        onClose={() => setCatalogPickerOpen(false)}
        onConfirm={confirmCatalogPicker}
        formatMoney={formatMoney}
      />

      <AppointmentEditModal
        isOpen={calendarEditData !== null}
        data={calendarEditData}
        onSave={() => void saveCalendarEdit()}
        onCancel={() => void cancelCalendarAppointment()}
        onDelete={() => void deleteCalendarAppointment()}
        onPrint={printCalendarAppointmentServiceSlip}
        onWhatsapp={openCalendarAppointmentWhatsapp}
        onClose={() => setCalendarEditData(null)}
        onDataChange={(patch) => setCalendarEditData((prev) => prev ? { ...prev, ...patch } : prev)}
        onPlateLookup={(plateValue) => void handleCalendarPlateLookup(plateValue)}
      />

      <ServiceStatusModal
        isOpen={selectedDashboardService !== null}
        service={selectedDashboardService}
        onClose={() => setSelectedDashboardService(null)}
        onServiceChange={(patch) => setSelectedDashboardService((prev) => (prev ? { ...prev, ...patch } : prev))}
        onSave={saveDashboardServiceStatus}
        onPrint={printSelectedDashboardServiceSlip}
        onWhatsapp={openSelectedDashboardServiceWhatsapp}
        onCancelAppointment={() => void cancelSelectedDashboardServiceAppointment()}
        onDeleteAppointment={() => void deleteSelectedDashboardServiceAppointment()}
        hasLinkedAppointment={Boolean(selectedDashboardService?.sourceDocumentId)}
      />

      <datalist id="client-suggestions">
        <option value="Cadastrar novo cliente">Opcao rapida</option>
        {clients.map((client, index) => (
          <option key={`${client.id}-${index}-suggestion`} value={client.name}>{`${client.phone} | ${client.plate}`}</option>
        ))}
      </datalist>


      <button className="skip-intro" onClick={() => setScreen('dashboard')}>IR PARA O SISTEMA</button>
      <img className="brand-watermark" src={logoEtork} alt="Etork" />
    </div>
  );
}

export default App;
