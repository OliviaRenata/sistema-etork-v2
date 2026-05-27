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
  priceTable: PriceTable;
};

type FinancialEntry = {
  id: number;
  date: string;
  description: string;
  amount: number;
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
  total: number;
};

type FinancialFilters = {
  query: string;
  startDate: string;
  endDate: string;
  kind: 'all' | 'receita' | 'despesa';
};

const FINANCIAL_PAGE_SIZE = 25;
const SALES_HISTORY_PAGE_SIZE = 20;

type CatalogRow = {
  id: number | null;
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
};

type SalesHistoryFilters = {
  query: string;
  startDate: string;
  endDate: string;
};

const PRINT_SETTINGS_STORAGE_KEY = 'etork_print_settings_v1';

const defaultPrintSettings: PrintSettings = {
  companyName: 'ETORK BRASIL',
  companyDocument: 'CNPJ 00.000.000/0001-00',
  companyPhone: '(67) 0000-0000',
  companyEmail: 'contato@etorkbrasil.com',
  companyAddress: 'Rua Exemplo, 123 - Campo Grande/MS',
  paymentMethod: 'PIX, Cartao de Credito/Debito ou Dinheiro',
  warrantyDays: 90,
  validityDays: 15,
  responsibleName: 'Responsavel Tecnico',
};

function sanitizePrintSettings(input: unknown): PrintSettings {
  if (!input || typeof input !== 'object') {
    return { ...defaultPrintSettings };
  }

  const value = input as Partial<PrintSettings>;

  return {
    companyName: typeof value.companyName === 'string' && value.companyName.trim() ? value.companyName : defaultPrintSettings.companyName,
    companyDocument:
      typeof value.companyDocument === 'string' && value.companyDocument.trim() ? value.companyDocument : defaultPrintSettings.companyDocument,
    companyPhone: typeof value.companyPhone === 'string' && value.companyPhone.trim() ? value.companyPhone : defaultPrintSettings.companyPhone,
    companyEmail: typeof value.companyEmail === 'string' && value.companyEmail.trim() ? value.companyEmail : defaultPrintSettings.companyEmail,
    companyAddress:
      typeof value.companyAddress === 'string' && value.companyAddress.trim() ? value.companyAddress : defaultPrintSettings.companyAddress,
    paymentMethod:
      typeof value.paymentMethod === 'string' && value.paymentMethod.trim() ? value.paymentMethod : defaultPrintSettings.paymentMethod,
    warrantyDays:
      typeof value.warrantyDays === 'number' && Number.isFinite(value.warrantyDays) ? Math.max(0, Math.floor(value.warrantyDays)) : defaultPrintSettings.warrantyDays,
    validityDays:
      typeof value.validityDays === 'number' && Number.isFinite(value.validityDays) ? Math.max(0, Math.floor(value.validityDays)) : defaultPrintSettings.validityDays,
    responsibleName:
      typeof value.responsibleName === 'string' && value.responsibleName.trim() ? value.responsibleName : defaultPrintSettings.responsibleName,
  };
}

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
  { id: null, itemType: 'SERVICO', description: 'REMAP STAGE 1', priceTable1: 1800, priceTable2: 1800, quantity: 1 },
  { id: null, itemType: 'SERVICO', description: 'REMAP STG2 DPF/EGR', priceTable1: 2000, priceTable2: 2000, quantity: 1 },
  { id: null, itemType: 'PRODUTO', description: 'DIFUSOR INOX 2,5" POLEGADAS', priceTable1: 1400, priceTable2: 1400, quantity: 1 },
  { id: null, itemType: 'PRODUTO', description: 'DIFUSOR INOX 3" POLEGADAS', priceTable1: 1500, priceTable2: 1500, quantity: 1 },
  { id: null, itemType: 'PRODUTO', description: 'ESCAPE FINAL 4" POLEGADAS', priceTable1: 1800, priceTable2: 1800, quantity: 1 },
  { id: null, itemType: 'SERVICO', description: 'ADD HARDCUT', priceTable1: 400, priceTable2: 400, quantity: 1 },
  { id: null, itemType: 'SERVICO', description: 'DOWNPIPE + INTERMEDIARIO AMAROK V6', priceTable1: 2200, priceTable2: 2200, quantity: 1 },
];

const defaultClients: ClientRow[] = [
  { id: 1, name: 'JOAO HENRIQUE DE ALMEIDA', phone: '67 99871-1313', plate: 'QAN-2H92', priceTable: 1 },
  { id: 2, name: 'MILENNA DE OLIVEIRA FELICIANO', phone: '67 99260-0928', plate: 'QUA-9J17', priceTable: 1 },
  { id: 3, name: 'CLEBER ANTUNES RICARDO FREITAS', phone: '67 99111-2233', plate: 'QAU-1V55', priceTable: 2 },
];

const defaultFinancialEntries: FinancialEntry[] = [
  { id: 1, date: '2026-04-25', description: 'Venda oficina', amount: 4300 },
  { id: 2, date: '2026-04-25', description: 'Venda oficina', amount: 12100 },
  { id: 3, date: '2026-04-24', description: 'Venda oficina', amount: 4300 },
];

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
            <label>PREÇO TABELA 1</label>
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
            <label>PREÇO TABELA 2</label>
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
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">ADICIONAR SERVICO / PRODUTO</h3>
        <div className="modal-body">
          <div className="form-field">
            <label>ITEM</label>
            <select
              className="modal-input"
              value={selectedIndex}
              onChange={(e) => onSelectedIndex(Math.max(0, Number(e.target.value) || 0))}
            >
              {rows.map((item, index) => (
                <option key={`${item.id ?? 'local'}-${item.description}-${index}`} value={index}>
                  [{item.itemType}] {item.description} | T1 {formatMoney(item.priceTable1)} | T2 {formatMoney(item.priceTable2)}
                </option>
              ))}
            </select>
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

          {rows[selectedIndex] && (
            <div className="form-field">
              <label>PRECO APLICADO</label>
              <input
                type="text"
                className="modal-input"
                readOnly
                value={`${priceTable === 2 ? 'TABELA 2' : 'TABELA 1'} - ${formatMoney(getCatalogPrice(rows[selectedIndex], priceTable))}`}
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>CANCELAR</button>
          <button className="btn-save" onClick={onConfirm}>ADICIONAR</button>
        </div>
      </div>
    </div>
  );
}

function AppointmentEditModal({
  isOpen,
  data,
  onSave,
  onClose,
  onDataChange,
}: {
  isOpen: boolean;
  data: CalendarAppointment | null;
  onSave: () => void;
  onClose: () => void;
  onDataChange: (patch: Partial<CalendarAppointment>) => void;
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
              placeholder="AAA-0000"
            />
          </div>

          <div className="form-field">
            <label>VEÍCULO / SERVIÇO</label>
            <textarea
              className="modal-input modal-textarea"
              value={data.vehicleDetails}
              onChange={(e) => onDataChange({ vehicleDetails: e.target.value })}
              rows={3}
              placeholder="Detalhes do veículo e serviço"
            />
          </div>

          <div className="form-field">
            <label>OBSERVAÇÕES</label>
            <input
              type="text"
              className="modal-input"
              value={data.note}
              onChange={(e) => onDataChange({ note: e.target.value })}
              placeholder="Observações adicionais"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>CANCELAR</button>
          <button className="btn-save" onClick={onSave}>SALVAR</button>
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
  finalizeSale,
  isSaving,
  formatMoney,
  receipts,
  setScreen,
  applyMatchedClient,
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
  finalizeSale: () => void;
  isSaving: boolean;
  formatMoney: (value: number) => string;
  receipts: ReceiptRow[];
  setScreen: (next: Screen) => void;
  applyMatchedClient: (target: 'quote' | 'appointment' | 'sale', customerValue: string) => void;
}) {
  function patchSale(patch: Partial<SaleData>) {
    setSaleData((prev) => ({ ...prev, ...patch }));
  }

  return (
    <main className="sale-panel">
      <div className="sale-topbar">
        <span className="sale-topbar-title">BALCAO DE VENDAS</span>
        <div className="sale-topbar-actions">
          <button className="sale-btn-ghost" onClick={() => setScreen('dashboard')}>VOLTAR</button>
          <button className="sale-btn-primary" onClick={() => window.alert('Servico enviado para a fila interna.')}>ENVIAR SERVICO</button>
          <button className="sale-btn-green" onClick={finalizeSale} disabled={isSaving}>{isSaving ? 'SALVANDO...' : 'FINALIZAR VENDA'}</button>
        </div>
      </div>

      <div className="sale-body">
        <div className="sale-center">
            <div className="sale-import-row">
              <input
                className="sale-import-input"
                value={saleQuoteSearch}
                onChange={(e) => setSaleQuoteSearch(e.target.value)}
                placeholder="Buscar orcamento por nome, data, valor, tel, placa, veiculo ou observacao"
              />
              <button className="sale-import-btn blue" onClick={runSaleQuoteSearch}>BUSCAR ORC.</button>
              <select className="sale-import-select" value={saleSelectedQuoteId} onChange={(e) => setSaleSelectedQuoteId(e.target.value)}>
                <option value="">Selecione um orcamento</option>
                {saleQuoteResults.map((row) => (
                  <option key={row.id} value={row.id}>
                    {`${row.customer} | ${row.phone} | ${row.plate} | ${row.createdAt} | ${formatMoney(row.total)}`}
                  </option>
                ))}
              </select>
              <button className="sale-import-btn green" onClick={importQuoteToSaleBySearch}>IMPORTAR</button>
              <button className="sale-import-btn green" onClick={importQuoteToSale}>ULTIMO</button>
            </div>

            <div className="sale-import-row">
              <input
                className="sale-import-input"
                value={saleAppointmentSearch}
                onChange={(e) => setSaleAppointmentSearch(e.target.value)}
                placeholder="Buscar agendamento por nome, data, valor, tel, placa, veiculo ou observacao"
              />
              <button className="sale-import-btn amber" onClick={runSaleAppointmentSearch}>BUSCAR AGEND.</button>
              <select
                className="sale-import-select"
                value={saleSelectedAppointmentId}
                onChange={(e) => setSaleSelectedAppointmentId(e.target.value)}
              >
                <option value="">Selecione um agendamento</option>
                {saleAppointmentResults.map((row) => (
                  <option key={row.id} value={row.id}>
                    {`${row.customer} | ${row.phone} | ${row.plate} | ${row.createdAt} | ${formatMoney(row.total)}`}
                  </option>
                ))}
              </select>
              <button className="sale-import-btn amber" onClick={importAppointmentToSaleBySearch}>IMPORTAR</button>
              <button className="sale-import-btn amber" onClick={importAppointmentToSale}>ULTIMO</button>
            </div>

          <div className="sale-client-section">
            <div className="sale-field">
              <span className="sale-field-label">Cliente</span>
              <input
                list="client-suggestions"
                className="sale-field-input"
                value={saleData.customer}
                onChange={(e) => patchSale({ customer: e.target.value })}
                onBlur={(e) => applyMatchedClient('sale', e.target.value)}
                placeholder="Nome do cliente"
              />
            </div>
            <div className="sale-field">
              <span className="sale-field-label">Tipo</span>
              <select
                className="sale-field-input"
                value={saleData.customerType}
                onChange={(e) => patchSale({ customerType: e.target.value })}
              >
                <option value={getCustomerTypeLabel(1)}>{getCustomerTypeLabel(1)}</option>
                <option value={getCustomerTypeLabel(2)}>{getCustomerTypeLabel(2)}</option>
              </select>
            </div>
            <div className="sale-field">
              <span className="sale-field-label">Telefone</span>
              <input
                className="sale-field-input"
                value={saleData.phone}
                onChange={(e) => patchSale({ phone: e.target.value })}
                placeholder="(67) 9 0000-0000"
              />
            </div>
            <div className="sale-field">
              <span className="sale-field-label">Placa</span>
              <input
                className="sale-field-input plate"
                value={saleData.plate}
                onChange={(e) => patchSale({ plate: e.target.value.toUpperCase() })}
                placeholder="AAA-0000"
              />
            </div>
          </div>

          <div className="sale-items-area">
            <div className="sale-items-header">
              <span>Descricao</span>
              <span>Qtd</span>
              <span>Vlr Unit.</span>
              <span>Subtotal</span>
              <span></span>
            </div>

            {saleData.items.map((item, index) => (
              <div className="sale-item-row" key={`sale-item-${index}`}>
                <input
                  className="sale-item-input"
                  value={item.description}
                  onChange={(e) => updateItems('sale', index, { description: e.target.value })}
                />
                <input
                  className="sale-item-input right"
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItems('sale', index, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                />
                <input
                  className="sale-item-input right"
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.price}
                  onChange={(e) => updateItems('sale', index, { price: Math.max(0, Number(e.target.value) || 0) })}
                />
                <span className="sale-item-total">{formatMoney(item.price * item.quantity)}</span>
                <button className="sale-item-del" onClick={() => removeItem('sale', index)}>X</button>
              </div>
            ))}

            <div className="sale-add-row">
              <button className="sale-add-btn" onClick={addItemToSale}>+ ADICIONAR SERVICO / PRODUTO</button>
            </div>
          </div>

          <div className="sale-note-area">
            <textarea
              className="sale-note-input"
              rows={2}
              value={saleData.note}
              onChange={(e) => patchSale({ note: e.target.value })}
              placeholder="Observacoes adicionais"
            />
          </div>
        </div>

        <div className="sale-sidebar">
          <div className="sale-vehicle-section">
            <div className="sale-section-title">Veiculo e Servico</div>
            <textarea
              className="sale-vehicle-textarea"
              rows={4}
              value={saleData.vehicleDetails}
              onChange={(e) => patchSale({ vehicleDetails: e.target.value })}
              placeholder={'MODELO\nCAMBIO\nANO\nCOMBUSTIVEL'}
            />

            <div className="sale-check-row">
              <input
                id="labor-check"
                type="checkbox"
                checked={saleData.laborRequired}
                onChange={(e) => patchSale({ laborRequired: e.target.checked })}
              />
              <label htmlFor="labor-check">MAO DE OBRA INCLUSA</label>
            </div>

            <div className="sale-time-row">
              <label>TEMPO (DIAS)</label>
              <input
                className="sale-time-input"
                type="number"
                min={1}
                value={saleData.timeDays}
                onChange={(e) => patchSale({ timeDays: Math.max(1, Number(e.target.value) || 1) })}
              />
            </div>
          </div>

          <div className="sale-totals-section">
            <div className="sale-section-title">Resumo Financeiro</div>

            <div className="sale-total-row">
              <span className="sale-total-label">Subtotal</span>
              <span className="sale-total-value">{formatMoney(saleSubtotal)}</span>
            </div>

            <div className="sale-total-row discount">
              <span className="sale-total-label">Desconto (-)</span>
              <input
                className="sale-adj-input discount"
                type="number"
                min={0}
                step="0.01"
                value={saleData.discount}
                onChange={(e) => patchSale({ discount: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>

            <div className="sale-total-row surcharge">
              <span className="sale-total-label">Acrescimo (+)</span>
              <input
                className="sale-adj-input surcharge"
                type="number"
                min={0}
                step="0.01"
                value={saleData.surcharge}
                onChange={(e) => patchSale({ surcharge: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>

            <div className="sale-total-row grand">
              <span className="sale-total-label">TOTAL</span>
              <span className="sale-total-value">{formatMoney(saleTotal)}</span>
            </div>
          </div>

          <div className="sale-recent-section">
            <div className="sale-recent-header">
              <span className="sale-section-title" style={{ marginBottom: 0 }}>Lancamentos Recentes</span>
              <span style={{ fontSize: '9px', color: '#44445a', letterSpacing: '0.1em' }}>{formatNumberValue(receipts.length)} registros</span>
            </div>

            <div className="sale-recent-list">
              {receipts.length === 0 ? (
                <div className="sale-recent-empty">Nenhum lancamento</div>
              ) : (
                receipts.map((row) => (
                  <div className="sale-recent-item" key={row.id} title={`${row.car} - ${formatMoney(row.total)}`}>
                    <span className="sale-recent-name">{row.customer}</span>
                    <div className="sale-recent-meta">
                      <span className="sale-recent-plate">{row.plate}</span>
                      <span className="sale-recent-date">{row.date}</span>
                      <span className="sale-recent-total">{formatMoney(row.total)}</span>
                    </div>
                    <span style={{ fontSize: '9px', color: '#2a2a3a', letterSpacing: '0.06em' }}>{row.car}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
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
}) {
  function patchQuote(patch: Partial<QuoteData>) {
    setQuoteData((prev) => ({ ...prev, ...patch }));
  }

  return (
    <main className="sale-panel">
      <div className="sale-topbar">
        <span className="sale-topbar-title">BALCAO DE ORCAMENTO</span>
        <div className="sale-topbar-actions">
          <button className="sale-btn-ghost" onClick={() => setScreen('dashboard')}>VOLTAR</button>
          <button className="sale-btn-primary" onClick={() => window.alert('Orcamento enviado para aprovacao interna.')}>ENVIAR ORCAMENTO</button>
          <button className="sale-btn-green" onClick={finalizeQuote} disabled={isSaving}>{isSaving ? 'SALVANDO...' : 'FINALIZAR ORCAMENTO'}</button>
        </div>
      </div>

      <div className="sale-body">
        <div className="sale-center">
          <div className="sale-client-section">
            <div className="sale-field">
              <span className="sale-field-label">Cliente</span>
              <input
                list="client-suggestions"
                className="sale-field-input"
                value={quoteData.customer}
                onChange={(e) => patchQuote({ customer: e.target.value })}
                onBlur={(e) => applyMatchedClient('quote', e.target.value)}
                placeholder="Nome do cliente"
              />
            </div>
            <div className="sale-field">
              <span className="sale-field-label">Tipo</span>
              <select className="sale-field-input" value={quoteData.customerType} onChange={(e) => patchQuote({ customerType: e.target.value })}>
                <option value={getCustomerTypeLabel(1)}>{getCustomerTypeLabel(1)}</option>
                <option value={getCustomerTypeLabel(2)}>{getCustomerTypeLabel(2)}</option>
              </select>
            </div>
            <div className="sale-field">
              <span className="sale-field-label">Telefone</span>
              <input
                className="sale-field-input"
                value={quoteData.phone}
                onChange={(e) => patchQuote({ phone: e.target.value })}
                placeholder="(67) 9 0000-0000"
              />
            </div>
            <div className="sale-field">
              <span className="sale-field-label">Placa</span>
              <input
                className="sale-field-input plate"
                value={quoteData.plate}
                onChange={(e) => patchQuote({ plate: e.target.value.toUpperCase() })}
                placeholder="AAA-0000"
              />
            </div>
            <div className="sale-field">
              <span className="sale-field-label">Veiculo</span>
              <input
                className="sale-field-input"
                value={quoteData.vehicle}
                onChange={(e) => patchQuote({ vehicle: e.target.value })}
                placeholder="Modelo do veiculo"
              />
            </div>
          </div>

          <div className="sale-items-area">
            <div className="sale-items-header">
              <span>Descricao</span>
              <span>Qtd</span>
              <span>Vlr Unit.</span>
              <span>Subtotal</span>
              <span></span>
            </div>

            {quoteData.items.map((item, index) => (
              <div className="sale-item-row" key={`quote-item-${index}`}>
                <input
                  className="sale-item-input"
                  value={item.description}
                  onChange={(e) => updateItems('quote', index, { description: e.target.value })}
                />
                <input
                  className="sale-item-input right"
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItems('quote', index, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                />
                <input
                  className="sale-item-input right"
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.price}
                  onChange={(e) => updateItems('quote', index, { price: Math.max(0, Number(e.target.value) || 0) })}
                />
                <span className="sale-item-total">{formatMoney(item.price * item.quantity)}</span>
                <button className="sale-item-del" onClick={() => removeItem('quote', index)}>X</button>
              </div>
            ))}

            <div className="sale-add-row">
              <button className="sale-add-btn" onClick={addItemToQuote}>+ ADICIONAR SERVICO / PRODUTO</button>
            </div>
          </div>

          <div className="sale-note-area">
            <textarea
              className="sale-note-input"
              rows={2}
              value={quoteData.note}
              onChange={(e) => patchQuote({ note: e.target.value })}
              placeholder="Observacoes adicionais"
            />
          </div>
        </div>

        <div className="sale-sidebar">
          <div className="sale-vehicle-section">
            <div className="sale-section-title">Dados do Servico</div>
            <div className="sale-time-row">
              <label>TEMPO (DIAS)</label>
              <input
                className="sale-time-input"
                type="number"
                min={1}
                value={quoteData.timeDays}
                onChange={(e) => patchQuote({ timeDays: Math.max(1, Number(e.target.value) || 1) })}
              />
            </div>
          </div>

          <div className="sale-totals-section">
            <div className="sale-section-title">Resumo Financeiro</div>

            <div className="sale-total-row">
              <span className="sale-total-label">Subtotal</span>
              <span className="sale-total-value">{formatMoney(quoteSubtotal)}</span>
            </div>

            <div className="sale-total-row discount">
              <span className="sale-total-label">Desconto (-)</span>
              <input
                className="sale-adj-input discount"
                type="number"
                min={0}
                step="0.01"
                value={quoteData.discount}
                onChange={(e) => patchQuote({ discount: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>

            <div className="sale-total-row grand">
              <span className="sale-total-label">TOTAL</span>
              <span className="sale-total-value">{formatMoney(quoteTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
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
  const [quoteData, setQuoteData] = useState<QuoteData>({
    customer: 'JOAO HENRIQUE DE ALMEIDA',
    customerType: getCustomerTypeLabel(1),
    phone: '67 99871-1313',
    plate: 'QAN-2H92',
    vehicle: 'RAM 1500 CLASSIC 2023',
    items: cloneItems(quoteItems),
    discount: 0,
    timeDays: 1,
    note: '',
  });
  const [appointmentData, setAppointmentData] = useState({
    date: toDateTimeLocalValue(new Date()),
    customer: 'MILENNA DE OLIVEIRA FELICIANO',
    customerType: getCustomerTypeLabel(1),
    phone: '67 99260-0928',
    plate: 'QUA-9J17',
    vehicleDetails: 'HYUNDAI H20 1.0\nMANUAL\n2019/2019\nFLEX',
    laborRequired: true,
    items: cloneItems(appointmentItems),
    discount: 0,
    note: '',
  });
  const [saleData, setSaleData] = useState<SaleData>({
    customer: 'JOAO HENRIQUE DE ALMEIDA',
    customerType: getCustomerTypeLabel(1),
    phone: '67 99871-1313',
    plate: 'QAN-2H92',
    vehicleDetails: 'VW AMAROK 3.0 V6\nAUTO\n2020/2021\nDIESEL',
    laborRequired: true,
    timeDays: 1,
    items: cloneItems(saleItems),
    discount: 0,
    surcharge: 0,
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
  const [nextReceiptId, setNextReceiptId] = useState(9);
  const [searchQuery, setSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [clients, setClients] = useState<ClientRow[]>(defaultClients);
  const [nextClientId, setNextClientId] = useState(defaultClients.length + 1);
  const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>(defaultFinancialEntries);
  const [financialSalesRows, setFinancialSalesRows] = useState<FinancialSaleRow[]>([]);
  const [nextFinancialId, setNextFinancialId] = useState(defaultFinancialEntries.length + 1);
  const [financialFilters, setFinancialFilters] = useState<FinancialFilters>({
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
    const [isLocalMode, setIsLocalMode] = useState(false);
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
    if (!isAuthenticated) return;
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
    if (screen === 'appointment-calendar') {
      setCalendarSelectedDate(toInputDateValue(new Date()));
    }
  }, [screen]);

  useEffect(() => {
    if (!isAuthenticated || isLocalMode || !isSupabaseConfigured || !supabase) return;

    const sb = supabase;
    let active = true;

    async function loadFromDatabase() {
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
          .select('id, name, phone, plate')
          .order('id', { ascending: false }),
        sb
          .from('financial_entries_v2')
          .select('id, entry_date, description, amount')
          .order('id', { ascending: false }),
        sb
          .from('documents_v2')
          .select('id, customer_name_snapshot, phone_snapshot, plate_snapshot, vehicle_snapshot, notes, discount_amount, scheduled_for, total_amount, created_at')
          .eq('doc_type', 'agendamento')
          .order('scheduled_for', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false }),
        sb
          .from('documents_v2')
          .select('id, customer_name_snapshot, phone_snapshot, plate_snapshot, vehicle_snapshot, notes, total_amount, created_at')
          .eq('doc_type', 'venda')
          .order('created_at', { ascending: false })
          .limit(250),
      ]);

      if (!active) return;

      if (!catalogResult.error && catalogResult.data && catalogResult.data.length > 0) {
        setServiceCatalogData(
          catalogResult.data.map((item) => ({
            id: Number(item.id),
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
        setNextReceiptId(mapped.length + 1);
      }

      if (!clientsResult.error && clientsResult.data && clientsResult.data.length > 0) {
        const mappedClients = clientsResult.data.map((item) => ({
          id: Number(item.id),
          name: item.name || '',
          phone: item.phone || '',
          plate: item.plate || '',
          priceTable: Number(item.price_table) === 2 ? 2 : 1,
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

      if (!salesResult.error && salesResult.data) {
        const mappedSales: FinancialSaleRow[] = salesResult.data.map((item) => ({
          id: String(item.id),
          date: toBrDate(item.created_at || ''),
          createdAtIso: item.created_at || '',
          customer: item.customer_name_snapshot || 'SEM CLIENTE',
          phone: item.phone_snapshot || '',
          plate: item.plate_snapshot || '',
          vehicle: item.vehicle_snapshot || '',
          note: item.notes || '',
          total: Number(item.total_amount) || 0,
        }));
        setFinancialSalesRows(mappedSales);
      }

      if (!appointmentResult.error && appointmentResult.data && appointmentResult.data.length > 0) {
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
          };
        });
        setCalendarAppointments(mappedAppointments);
      } else if (savedAppointment) {
        setCalendarAppointments([
          {
            id: 'local-saved-appointment',
            dayKey: toCalendarDateKey(savedAppointment.date),
            date: savedAppointment.date,
            customer: savedAppointment.customer,
            phone: savedAppointment.phone,
            plate: savedAppointment.plate,
            vehicleDetails: savedAppointment.vehicleDetails,
            note: savedAppointment.note,
            total: savedAppointment.items.reduce((acc, item) => acc + item.price * item.quantity, 0) - savedAppointment.discount,
          },
        ]);
      }
    }

    loadFromDatabase();

    return () => {
      active = false;
    };
  }, [isAuthenticated, isLocalMode]);

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

  useEffect(() => {
    if (screen !== 'sales-history') return;

    let active = true;

    async function loadSalesHistory() {
      setSalesHistoryLoading(true);

      if (!isSupabaseConfigured || !supabase) {
        if (!active) return;
        const fallback = receipts.map((row) => ({
          id: String(row.id),
          createdAtIso: '',
          createdAt: row.date,
          customer: row.customer,
          phone: '',
          plate: row.plate,
          vehicle: row.car,
          subtotal: row.total,
          discount: 0,
          surcharge: 0,
          total: row.total,
          note: '',
          timeDays: 1,
          laborRequired: true,
        }));
        setSalesHistory(fallback);
        setSalesHistoryLoading(false);
        return;
      }

      const sb = supabase;
      const { data, error } = await sb
        .from('documents_v2')
        .select(
          'id, created_at, customer_name_snapshot, phone_snapshot, plate_snapshot, vehicle_snapshot, subtotal_amount, discount_amount, surcharge_amount, total_amount, notes, service_time_days, labor_required'
        )
        .eq('doc_type', 'venda')
        .order('created_at', { ascending: false })
        .limit(200);

      if (!active) return;

      if (error || !data) {
        setSalesHistory([]);
        setSalesHistoryLoading(false);
        return;
      }

      const mapped = data.map((row) => ({
        id: String(row.id),
        createdAtIso: row.created_at || '',
        createdAt: row.created_at ? new Date(row.created_at).toLocaleString('pt-BR') : '',
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
      }));

      setSalesHistory(mapped);
      setSalesHistoryLoading(false);
    }

    void loadSalesHistory();

    return () => {
      active = false;
    };
  }, [screen, isSupabaseConfigured, receipts, supabase]);

  const printableDocuments = useMemo<PrintableDocument[]>(() => {
    const nowStamp = now.toLocaleString('pt-BR');
    const quoteSource = savedQuote || quoteData;
    const saleVehicleFirstLine = saleData.vehicleDetails.split('\n')[0] || saleData.vehicleDetails;
    const quoteId = lastSavedDocumentIds.orcamento;
    const saleId = lastSavedDocumentIds.venda;
    const quoteNumber = quoteId ? `ORC-${String(quoteId).slice(0, 8).toUpperCase()}` : `ORC-${savedQuote ? 'ATUAL' : 'RASCUNHO'}`;
    const saleNumber = saleId ? `VEN-${String(saleId).slice(0, 8).toUpperCase()}` : `VEN-${receipts[0]?.id ?? nextReceiptId}`;

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
      },
    ];
  }, [lastSavedDocumentIds.orcamento, lastSavedDocumentIds.venda, now, nextReceiptId, quoteData, receipts, saleData, saleSubtotal, saleTotal, savedQuote]);

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
        client.plate.toLowerCase().includes(query)
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

        const amount = Number(entry.amount) || 0;
        const matchesKind =
          financialFilters.kind === 'all' ||
          (financialFilters.kind === 'receita' && amount >= 0) ||
          (financialFilters.kind === 'despesa' && amount < 0);

        const entryDate = new Date(`${entry.date}T12:00:00`);
        if (Number.isNaN(entryDate.getTime())) return false;

        if (start && entryDate < start) return false;
        if (end && entryDate > end) return false;

        return matchesQuery && matchesKind;
      })
      .sort((a, b) => {
        const dateDiff = new Date(`${b.date}T12:00:00`).getTime() - new Date(`${a.date}T12:00:00`).getTime();
        if (dateDiff !== 0) return dateDiff;
        return b.id - a.id;
      });
  }, [financialEntries, financialFilters]);

  const financialSummary = useMemo(() => {
    const income = filteredFinancialEntries.reduce((acc, entry) => acc + (entry.amount >= 0 ? entry.amount : 0), 0);
    const expense = filteredFinancialEntries.reduce((acc, entry) => acc + (entry.amount < 0 ? Math.abs(entry.amount) : 0), 0);
    const balance = income - expense;
    const incomeCount = filteredFinancialEntries.filter((entry) => entry.amount >= 0).length;
    const expenseCount = filteredFinancialEntries.filter((entry) => entry.amount < 0).length;
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
        kindLabel: entry.amount < 0 ? 'DESPESA' : 'RECEITA',
        runningBalance: financialRunningBalanceById.get(entry.id) ?? entry.amount,
      })),
    [financialRunningBalanceById, pagedFinancialEntries]
  );

  const effectiveFinancialSalesRows = useMemo(() => {
    if (financialSalesRows.length > 0) return financialSalesRows;

    return receipts.map((row) => ({
      id: `local-${row.id}`,
      date: row.date,
      createdAtIso: '',
      customer: row.customer,
      phone: '',
      plate: row.plate,
      vehicle: row.car,
      note: '',
      total: row.total,
    }));
  }, [financialSalesRows, receipts]);

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
  }, [effectiveFinancialSalesRows, financialFilters.endDate, financialFilters.kind, financialFilters.query, financialFilters.startDate]);

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

  useEffect(() => {
    setFinancialPage(1);
  }, [financialFilters.query, financialFilters.startDate, financialFilters.endDate, financialFilters.kind]);

  useEffect(() => {
    setFinancialPage((current) => Math.min(current, financialTotalPages));
  }, [financialTotalPages]);

  useEffect(() => {
    setSalesHistoryPage(1);
  }, [salesHistoryFilters.query, salesHistoryFilters.startDate, salesHistoryFilters.endDate]);

  useEffect(() => {
    setSalesHistoryPage((current) => Math.min(current, salesHistoryTotalPages));
  }, [salesHistoryTotalPages]);

  const nextAppointmentSource = calendarAppointments[0] || savedAppointment;

  const nextAppointmentCard = nextAppointmentSource
    ? {
        model: nextAppointmentSource.vehicleDetails.split('\n')[0] || 'SEM VEICULO',
        plate: nextAppointmentSource.plate,
        date: nextAppointmentSource.date,
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

  function applyMatchedClient(target: 'quote' | 'appointment' | 'sale', customerValue: string) {
    const client = findClientMatch(customerValue);
    if (!client) return;
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
      .select('id, customer_name_snapshot, phone_snapshot, plate_snapshot, vehicle_snapshot, notes, discount_amount, service_time_days, scheduled_for')
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
      items: mappedItems,
    };
  }

  async function runAppointmentQuoteSearch() {
    const rows = await searchDocumentsForImport('orcamento', appointmentQuoteSearch);
    setAppointmentQuoteResults(rows);
    setAppointmentSelectedQuoteId(rows[0] ? String(rows[0].id) : '');
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

  async function saveCalendarEdit() {
    if (!calendarEditData) return;
    const editedDate = parseBrDateTime(calendarEditData.date);
    const normalizedDate = editedDate ? formatBrDateTime(editedDate) : calendarEditData.date;
    const updated = {
      ...calendarEditData,
      date: normalizedDate,
      dayKey: toCalendarDateKey(normalizedDate),
    };

    setCalendarAppointments((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );

    if (isSupabaseConfigured && supabase && !updated.id.startsWith('local-')) {
      const sb = supabase;
      await sb
        .from('documents_v2')
        .update({
          customer_name_snapshot: updated.customer,
          phone_snapshot: updated.phone,
          plate_snapshot: updated.plate,
          vehicle_snapshot: updated.vehicleDetails,
          scheduled_for: editedDate ? editedDate.toISOString() : null,
          notes: updated.note,
        })
        .eq('id', updated.id)
        .eq('doc_type', 'agendamento');
    }

    setCalendarEditData(null);
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
        price_table: patch.priceTable,
      })
      .eq('id', id);
  }

  async function addClient() {
    const nextLocalClientId = Math.max(nextClientId, ...clients.map((client) => client.id)) + 1;

    if (isSupabaseConfigured && supabase) {
      const sb = supabase;
      const payload = {
        name: 'NOVO CLIENTE',
        phone: '67 90000-0000',
        plate: 'AAA-0000',
        price_table: 1,
      };

      const { data, error } = await sb.from('clients_v2').insert(payload).select('id, name, phone, plate, price_table').single();
      if (!error && data) {
        const candidateId = Number(data.id);
        const safeId = clients.some((client) => client.id === candidateId) ? nextLocalClientId : candidateId;
        const dbClient: ClientRow = {
          id: safeId,
          name: data.name || payload.name,
          phone: data.phone || payload.phone,
          plate: data.plate || payload.plate,
          priceTable: Number(data.price_table) === 2 ? 2 : 1,
        };
        setClients((prev) => [dbClient, ...prev]);
        setNextClientId((prev) => Math.max(prev, nextLocalClientId + 1, dbClient.id + 1));
        return;
      }
    }

    const newClient: ClientRow = {
      id: nextLocalClientId,
      name: 'NOVO CLIENTE',
      phone: '67 90000-0000',
      plate: 'AAA-0000',
      priceTable: 1,
    };
    setClients((prev) => [newClient, ...prev]);
    setNextClientId((prev) => Math.max(prev + 1, nextLocalClientId + 1));
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
      if (isSupabaseConfigured && supabase) {
        const sb = supabase;
        const payload = {
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

        if (!error && data) {
          setServiceCatalogData((prev) => [
            {
              id: Number(data.id),
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
        }
      }

      setServiceCatalogData((prev) => [
        {
          id: null,
          itemType: productModalData.itemType,
          description: productModalData.description,
          priceTable1: productModalData.priceTable1,
          priceTable2: productModalData.priceTable2,
          quantity: productModalData.quantity,
        },
        ...prev,
      ]);
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

  async function removeProduct(id: number | null, index: number) {
    setServiceCatalogData((prev) => prev.filter((_, idx) => idx !== index));

    if (!isSupabaseConfigured || !supabase || id === null) return;

    const sb = supabase;
    await sb.from('service_catalog_v2').update({ is_active: false }).eq('id', id);
  }

  function updateFinancialEntry(id: number, patch: Partial<FinancialEntry>) {
    setFinancialEntries((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));

    if (patch.description !== undefined && patch.description.trim() === '') {
      setFinancialEntries((prev) => prev.map((entry) => (entry.id === id ? { ...entry, description: 'LANCAMENTO' } : entry)));
    }
  }

  async function persistFinancialEntry(id: number) {
    const current = financialEntries.find((entry) => entry.id === id);
    if (!current) return;

    if (!isSupabaseConfigured || !supabase) return;

    const sb = supabase;
    await sb
      .from('financial_entries_v2')
      .update({
        entry_date: current.date,
        description: current.description || 'LANCAMENTO',
        amount: current.amount,
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
      surcharge?: number;
      note: string;
      scheduledFor?: string;
    },
    items: ServiceItem[]
  ) {
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
    setSavedQuote(payload);

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
        note: quoteData.note,
      },
      quoteData.items
    );

    setIsSaving(false);
    if (result.ok && result.id) {
      setLastSavedDocumentIds((prev) => ({ ...prev, orcamento: String(result.id) }));
    }
    window.alert(result.ok ? 'Orcamento salvo com sucesso no banco.' : 'Orcamento salvo localmente (falha no banco).');
    setScreen('dashboard');
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
      note: appointmentData.note,
    };

    setIsSaving(true);
    setSavedAppointment(payload);
    setCalendarAppointments((prev) => [
      {
        id: `local-${Date.now()}`,
        dayKey: toCalendarDateKey(payload.date),
        date: payload.date,
        customer: payload.customer,
        phone: payload.phone,
        plate: payload.plate,
        vehicleDetails: payload.vehicleDetails,
        note: payload.note,
        total: appointmentData.items.reduce((acc, item) => acc + item.price * item.quantity, 0) - appointmentData.discount,
      },
      ...prev,
    ]);

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
              .eq('id', item.id as number)
          )
      );
    }

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
        surcharge: saleData.surcharge,
        note: saleData.note,
      },
      saleData.items
    );
    setIsSaving(false);
    if (result.ok && result.id) {
      setLastSavedDocumentIds((prev) => ({ ...prev, venda: String(result.id) }));
    }

    setReceipts((prev) => [newReceipt, ...prev]);
    setNextReceiptId((prev) => prev + 1);
    window.alert(result.ok ? 'Venda finalizada e salva no banco.' : 'Venda finalizada localmente (falha no banco).');
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
      items: [{ description: saleRow.vehicle || 'SERVICO', quantity: 1, price: saleRow.total }],
      subtotal: saleRow.subtotal,
      discount: saleRow.discount,
      total: saleRow.total,
      note: saleRow.note,
      serviceTimeDays: saleRow.timeDays,
      laborRequired: saleRow.laborRequired,
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

  async function handleLogin() {
    setAuthMessage('');

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setAuthMessage('Informe email e senha.');
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setIsLocalMode(true);
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
    setIsLocalMode(false);
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
    setIsLocalMode(false);
    setIsAuthenticated(false);
    setScreen('auth-login');
  }

  function enterLocalMode() {
    setIsLocalMode(true);
    setIsAuthenticated(true);
    setAuthMessage('Modo local ativo. Dados podem ser salvos apenas localmente quando o Supabase falhar.');
    setScreen('dashboard');
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

  function exportFinancialCSV() {
    const header = 'ID,Data,Descricao,Tipo,Valor\n';
    const body = filteredFinancialEntries
      .map((row) => {
        const type = row.amount < 0 ? 'DESPESA' : 'RECEITA';
        return `${row.id},${row.date},"${row.description.replaceAll('"', '""')}",${type},${row.amount.toFixed(2)}`;
      })
      .join('\n');

    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `financeiro-filtrado-${Date.now()}.csv`;
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
            <button onClick={enterLocalMode}>Entrar em modo local</button>
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
              <div className="clients-toolbar">
                <button className="btn-cyan lg" onClick={addClient}>NOVO CLIENTE</button>
                <input
                  className="input-look"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Buscar por nome, telefone ou placa"
                />
              </div>

              <div className="clients-columns">
                <section className="clients-table-card">
                  <header>
                    <strong>TABELA 1 - CLIENTE FINAL</strong>
                    <span>{clientsTable1.length} cliente(s)</span>
                  </header>
                  {clientsTable1.map((client, index) => (
                    <div className="menu-row editable client-row" key={`${client.id}-table1-${index}`}>
                      <input className="input-look" value={client.name} onChange={(event) => updateClient(client.id, { name: event.target.value })} />
                      <input className="input-look" value={client.phone} onChange={(event) => updateClient(client.id, { phone: event.target.value })} />
                      <input className="input-look plate" value={client.plate} onChange={(event) => updateClient(client.id, { plate: event.target.value.toUpperCase() })} />
                      <select className="input-look" value={client.priceTable} onChange={(event) => updateClient(client.id, { priceTable: Number(event.target.value) as PriceTable })}>
                        <option value={1}>TABELA 1 - CLIENTE FINAL</option>
                        <option value={2}>TABELA 2 - FRANQUEADO</option>
                      </select>
                      <button className="item-delete" onClick={() => removeClient(client.id)}>X</button>
                    </div>
                  ))}
                  {clientsTable1.length === 0 && <div className="receipt-empty">Nenhum cliente na Tabela 1 para este filtro.</div>}
                </section>

                <section className="clients-table-card">
                  <header>
                    <strong>TABELA 2 - FRANQUEADO</strong>
                    <span>{clientsTable2.length} cliente(s)</span>
                  </header>
                  {clientsTable2.map((client, index) => (
                    <div className="menu-row editable client-row" key={`${client.id}-table2-${index}`}>
                      <input className="input-look" value={client.name} onChange={(event) => updateClient(client.id, { name: event.target.value })} />
                      <input className="input-look" value={client.phone} onChange={(event) => updateClient(client.id, { phone: event.target.value })} />
                      <input className="input-look plate" value={client.plate} onChange={(event) => updateClient(client.id, { plate: event.target.value.toUpperCase() })} />
                      <select className="input-look" value={client.priceTable} onChange={(event) => updateClient(client.id, { priceTable: Number(event.target.value) as PriceTable })}>
                        <option value={1}>TABELA 1 - CLIENTE FINAL</option>
                        <option value={2}>TABELA 2 - FRANQUEADO</option>
                      </select>
                      <button className="item-delete" onClick={() => removeClient(client.id)}>X</button>
                    </div>
                  ))}
                  {clientsTable2.length === 0 && <div className="receipt-empty">Nenhum cliente na Tabela 2 para este filtro.</div>}
                </section>
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

      {screen === 'menu-products' && (
        <main className="panel panel-form">
          <h2 className="panel-title">CADASTRO</h2>
          <section className="form-grid menu-single">
            <div className="form-main">
              <div className="line search-bar">
                <strong>BUSCA:</strong> 
                <input 
                  className="input-look" 
                  value={productSearchQuery} 
                  onChange={(event) => setProductSearchQuery(event.target.value)} 
                  placeholder="nome do item..."
                />
              </div>
              <div className="mini-actions receipt-actions">
                <button className="btn-cyan lg" onClick={addProduct}>NOVO CADASTRO</button>
              </div>
              {filteredProducts.length === 0 ? (
                <div className="no-results">Nenhum item encontrado</div>
              ) : (
                filteredProducts.map((item, index) => {
                  const actualIndex = serviceCatalogData.findIndex(
                    (p) => p.id === item.id || (p.description === item.description && p.itemType === item.itemType)
                  );
                  const isOutOfStock = item.quantity <= 0;
                  return (
                    <div className={`menu-row editable ${isOutOfStock ? 'out-of-stock' : ''}`} key={`${item.description}-${index}`}>
                      <span className="product-name">{item.itemType}</span>
                      <span className="product-name">{item.description}</span>
                      <span className={`product-qty ${isOutOfStock ? 'out-of-stock' : ''}`}>
                        QTD: {formatNumberValue(item.quantity)}
                        {isOutOfStock && <strong className="stock-alert">SEM ESTOQUE</strong>}
                      </span>
                      <span className="product-price">T1 {formatMoney(item.priceTable1)}</span>
                      <span className="product-price">T2 {formatMoney(item.priceTable2)}</span>
                      <div className="item-actions">
                        <button className="item-edit" onClick={() => openEditProductModal(actualIndex)}>✎</button>
                        <button className="item-delete" onClick={() => void removeProduct(item.id, actualIndex)}>✕</button>
                      </div>
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
              </div>

              <div className="line"><strong>TOTAL GERAL (BASE COMPLETA):</strong> <span>{formatMoney(financialTotal)}</span></div>
              <div className="mini-actions receipt-actions">
                <button className="btn-cyan lg" onClick={addFinancialEntry}>NOVO LANCAMENTO</button>
                <button className="btn-yellow lg" onClick={exportFinancialCSV}>EXPORTAR CSV FILTRADO</button>
              </div>
              {pagedFinancialRows.map((entry) => (
                <div className="menu-row editable financial-row" key={entry.id}>
                  <input
                    className="input-look"
                    type="date"
                    value={entry.date}
                    onChange={(event) => updateFinancialEntry(entry.id, { date: event.target.value })}
                    onBlur={() => void persistFinancialEntry(entry.id)}
                  />
                  <input
                    className="input-look"
                    value={entry.description}
                    onChange={(event) => updateFinancialEntry(entry.id, { description: event.target.value })}
                    onBlur={() => void persistFinancialEntry(entry.id)}
                  />
                  <input
                    className="input-look"
                    type="number"
                    step="0.01"
                    value={entry.amount}
                    onChange={(event) => updateFinancialEntry(entry.id, { amount: Number(event.target.value) || 0 })}
                    onBlur={() => void persistFinancialEntry(entry.id)}
                  />
                  <span className={`financial-kind ${entry.amount < 0 ? 'expense' : 'income'}`}>{entry.kindLabel}</span>
                  <span className="financial-balance-cell">{formatMoney(entry.runningBalance)}</span>
                  <button className="item-delete" onClick={() => void removeFinancialEntry(entry.id)}>X</button>
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
                    <span>TOTAL</span>
                  </div>
                  {filteredFinancialSalesRows.map((sale) => (
                    <div className="financial-sales-row" key={sale.id}>
                      <span>{sale.date}</span>
                      <span>{sale.customer}</span>
                      <span>{sale.plate || 'SEM PLACA'}</span>
                      <span>{sale.vehicle || 'SEM VEICULO'}</span>
                      <span>{formatMoney(sale.total)}</span>
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
              <div className="line"><strong>CLIENTES CADASTRADOS:</strong> <span>{formatNumberValue(clients.length)}</span></div>
              <div className="line"><strong>ITENS CADASTRADOS:</strong> <span>{formatNumberValue(serviceCatalogData.length)}</span></div>
              <div className="line"><strong>RECIBOS GERADOS:</strong> <span>{formatNumberValue(receipts.length)}</span></div>
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

      {screen === 'appointment-calendar' && (
        <main className="panel panel-form panel-calendar">
          <h2 className="panel-title">CALENDARIO DE AGENDAMENTOS</h2>
          <section className="calendar-layout">
            <div className="calendar-main">
              <div className="calendar-toolbar">
                <button className="calendar-nav" onClick={() => moveCalendarMonth(-1)}>‹</button>
                <div className="calendar-month-label">{calendarMonthLabel}</div>
                <button className="calendar-nav" onClick={() => moveCalendarMonth(1)}>›</button>
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

            <aside className="calendar-side">
              <div className="calendar-side-header">
                <strong>{new Date(`${calendarSelectedDate}T12:00:00`).toLocaleDateString('pt-BR')}</strong>
                <span>{formatNumberValue(calendarSelectedAppointments.length)} agendamento(s)</span>
              </div>

              <div className="calendar-side-list">
                {calendarSelectedAppointments.length === 0 ? (
                  <div className="calendar-empty">Nenhum agendamento neste dia.</div>
                ) : (
                  calendarSelectedAppointments.map((appointment) => (
                    <article className="calendar-card" key={appointment.id} onClick={() => openCalendarEdit(appointment)} style={{ cursor: 'pointer' }}>
                      <div className="calendar-card-title">{appointment.customer || 'SEM CLIENTE'}</div>
                      <div className="calendar-card-line">{appointment.plate || 'SEM PLACA'}</div>
                      <div className="calendar-card-line">{appointment.vehicleDetails.split('\n')[0] || 'SEM VEICULO'}</div>
                      <div className="calendar-card-line">{appointment.date}</div>
                      <div className="calendar-card-line">{formatMoney(appointment.total)}</div>
                      {appointment.note && <div className="calendar-card-note">OBS: {appointment.note}</div>}
                    </article>
                  ))
                )}
              </div>
            </aside>
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
              <button onClick={() => handleMenuAction('Cadastro')}>CADASTRO</button>
              <button onClick={() => handleMenuAction('Agenda')}>AGENDA</button>
              <button onClick={() => handleMenuAction('Relatorios')}>RELATORIOS</button>
              <button onClick={() => handleMenuAction('Vendas')}>LISTAR VENDAS</button>
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
                    <span></span>
                  </div>

                  {pagedSalesHistory.map((sale) => (
                    <div className="sales-history-grid-row" key={sale.id}>
                      <span className="muted">{sale.createdAt}</span>
                      <span className="strong">{sale.customer}</span>
                      <span className="plate">{sale.plate || 'SEM PLACA'}</span>
                      <span className="money">{formatMoney(sale.total)}</span>
                      <button className="btn-cyan sales-history-select-btn" onClick={() => void selectSaleForReceipt(sale.id, true)}>SELECIONAR</button>
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
              <button className="btn-back" onClick={() => setScreen('dashboard')}>←</button>
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
        />
      )}

      {screen === 'new-appointment' && (
        <main className="panel panel-form">
          <h2 className="panel-title">NOVO AGENDAMENTO</h2>
          <section className="sale-tools sale-tools-search">
            <input className="input-look" value={appointmentQuoteSearch} onChange={(event) => setAppointmentQuoteSearch(event.target.value)} placeholder="Pesquisar orcamento por nome, data, valor, telefone, placa, veiculo ou observacao" />
            <button className="tool-blue" onClick={() => void runAppointmentQuoteSearch()}>PESQUISAR ORCAMENTO</button>
            <select className="input-look" value={appointmentSelectedQuoteId} onChange={(event) => setAppointmentSelectedQuoteId(event.target.value)}>
              <option value="">Selecione um orcamento</option>
              {appointmentQuoteResults.map((row) => (
                <option key={row.id} value={row.id}>{`${row.customer} | ${row.phone} | ${row.plate} | ${row.createdAt} | ${formatMoney(row.total)}`}</option>
              ))}
            </select>
            <button className="tool-yellow" onClick={() => void importQuoteToAppointmentBySearch()}>IMPORTAR</button>
          </section>
          <section className="form-grid">
            <div className="form-main">
              <div className="line"><strong>DATA:</strong> <input type="datetime-local" className="input-look" value={appointmentData.date} onChange={(event) => setAppointmentData((prev) => ({ ...prev, date: event.target.value }))} title={toDisplayAppointmentDate(appointmentData.date)} /></div>
              <div className="line"><strong>CLIENTE:</strong> <input list="client-suggestions" className="input-look" value={appointmentData.customer} onChange={(event) => setAppointmentData((prev) => ({ ...prev, customer: event.target.value }))} onBlur={(event) => applyMatchedClient('appointment', event.target.value)} /> <select className="input-look" value={appointmentData.customerType} onChange={(event) => setAppointmentData((prev) => ({ ...prev, customerType: event.target.value }))}><option value={getCustomerTypeLabel(1)}>{getCustomerTypeLabel(1)}</option><option value={getCustomerTypeLabel(2)}>{getCustomerTypeLabel(2)}</option></select></div>
              <div className="line line-mini"><strong>LISTAR</strong> <button onClick={addItemToAppointment}>+</button></div>
              <ServiceRows
                items={appointmentData.items}
                onChangeItem={(index, patch) => updateItems('appointment', index, patch)}
                onRemoveItem={(index) => removeItem('appointment', index)}
              />
              <div className="line"><strong>OBSERVACAO:</strong> <textarea className="vehicle-card note-input" value={appointmentData.note} onChange={(event) => setAppointmentData((prev) => ({ ...prev, note: event.target.value }))} /></div>
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
          finalizeSale={() => void finalizeSale()}
          isSaving={isSaving}
          formatMoney={formatMoney}
          receipts={receipts}
          setScreen={setScreen}
          applyMatchedClient={applyMatchedClient}
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
                      onChange={(event) => setPrintSettings((prev) => ({ ...prev, companyName: event.target.value }))}
                    />
                  </label>
                  <label>
                    CNPJ/CPF
                    <input
                      className="input-look"
                      value={printSettings.companyDocument}
                      onChange={(event) => setPrintSettings((prev) => ({ ...prev, companyDocument: event.target.value }))}
                    />
                  </label>
                  <label>
                    TELEFONE DA EMPRESA
                    <input
                      className="input-look"
                      value={printSettings.companyPhone}
                      onChange={(event) => setPrintSettings((prev) => ({ ...prev, companyPhone: event.target.value }))}
                    />
                  </label>
                  <label>
                    EMAIL DA EMPRESA
                    <input
                      className="input-look"
                      value={printSettings.companyEmail}
                      onChange={(event) => setPrintSettings((prev) => ({ ...prev, companyEmail: event.target.value }))}
                    />
                  </label>
                  <label className="wide">
                    ENDERECO DA EMPRESA
                    <input
                      className="input-look"
                      value={printSettings.companyAddress}
                      onChange={(event) => setPrintSettings((prev) => ({ ...prev, companyAddress: event.target.value }))}
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
                      onChange={(event) =>
                        setPrintSettings((prev) => ({ ...prev, validityDays: Math.max(0, Number(event.target.value) || 0) }))
                      }
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
        onSave={saveCalendarEdit}
        onClose={() => setCalendarEditData(null)}
        onDataChange={(patch) => setCalendarEditData((prev) => prev ? { ...prev, ...patch } : prev)}
      />

      <datalist id="client-suggestions">
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