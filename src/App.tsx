import { useEffect, useMemo, useState } from 'react';
import logoEtork from './assets/logoetork.png';
import logoEtorkBrasil from './assets/logoetorkbrasil.png';

type Screen =
  | 'intro-brand'
  | 'intro-system'
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
  date: string;
  customer: string;
  car: string;
  plate: string;
  total: number;
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
  { date: '25/04/2026', customer: 'JOAO HENRIQUE DE ALMEIDA', car: 'AMAROK V6', plate: 'QAN-2H95', total: 4300 },
  { date: '25/04/2026', customer: 'CLEBER ANTUNES RICARDO FREITAS', car: 'RAM 3500 NIGHT', plate: 'QAU-1V55', total: 12100 },
  { date: '25/04/2026', customer: 'LEANDRO RODRIGUES QUEIROZ', car: 'S10 LTZ', plate: 'QAN-2H95', total: 4300 },
  { date: '25/04/2026', customer: 'CLEBER ANTUNES RICARDO FREITAS', car: 'RAM 3500 NIGHT', plate: 'QAU-1V55', total: 12100 },
  { date: '24/04/2026', customer: 'JOAO HENRIQUE DE ALMEIDA', car: 'AMAROK V6', plate: 'QAN-2H95', total: 4300 },
  { date: '24/04/2026', customer: 'CLEBER ANTUNES RICARDO FREITAS', car: 'RAM 3500 NIGHT', plate: 'QAU-1V55', total: 12100 },
  { date: '24/04/2026', customer: 'JOAO HENRIQUE DE ALMEIDA', car: 'AMAROK V6', plate: 'QAN-2H95', total: 4300 },
  { date: '23/04/2026', customer: 'CLEBER ANTUNES RICARDO FREITAS', car: 'RAM 3500 NIGHT', plate: 'QAU-1V55', total: 12100 },
];

const serviceCatalog: Array<{ description: string; price: number }> = [
  { description: 'REMAP STAGE 1', price: 1800 },
  { description: 'REMAP STG2 DPF/EGR', price: 2000 },
  { description: 'DIFUSOR INOX 2,5" POLEGADAS', price: 1400 },
  { description: 'DIFUSOR INOX 3" POLEGADAS', price: 1500 },
  { description: 'ESCAPE FINAL 4" POLEGADAS', price: 1800 },
  { description: 'ADD HARDCUT', price: 400 },
  { description: 'DOWNPIPE + INTERMEDIARIO AMAROK V6', price: 2200 },
];

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseBrDate(value: string) {
  const [day, month, year] = value.split('/').map(Number);
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
}

function parseMoneyInput(raw: string) {
  const normalized = raw.trim().replace(/\s+/g, '').replace(/\./g, '').replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function cloneItems(items: ServiceItem[]) {
  return items.map((item) => ({ ...item }));
}

function AppHeader({ now }: { now: Date }) {
  const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
  const day = now.toLocaleDateString('pt-BR');

  return (
    <header className="et-header">
      <div className="et-brand-block">
        <img className="et-brand-logo" src={logoEtorkBrasil} alt="Etork Brasil" />
        <div className="et-brand-user">usuario: ADMIN</div>
      </div>
      <div className="et-clock-wrap">
        <div className="et-clock">{time}</div>
        <div className="et-day">{day}</div>
      </div>
    </header>
  );
}

function ServiceRows({ items }: { items: ServiceItem[] }) {
  return (
    <div className="et-table">
      {items.map((item, index) => (
        <div className="et-row" key={`${item.description}-${index}`}>
          <div className="et-cell et-service">{item.description}</div>
          <div className="et-cell et-qty">{item.quantity}</div>
          <div className="et-cell et-money">{formatMoney(item.price)}</div>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [screen, setScreen] = useState<Screen>('intro-brand');
  const [now, setNow] = useState(() => new Date());
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

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (screen !== 'intro-brand') return;

    const firstStep = window.setTimeout(() => setScreen('intro-system'), 1800);
    const secondStep = window.setTimeout(() => setScreen('dashboard'), 3600);

    return () => {
      window.clearTimeout(firstStep);
      window.clearTimeout(secondStep);
    };
  }, [screen]);

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
    const menu = serviceCatalog.map((item, idx) => `${idx + 1}. ${item.description} - ${formatMoney(item.price)}`).join('\n');
    const pick = window.prompt(`Selecione o servico pelo numero:\n\n${menu}`);
    if (!pick) return null;
    const index = Number(pick) - 1;
    if (!Number.isInteger(index) || !serviceCatalog[index]) {
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
      description: serviceCatalog[index].description,
      quantity: qty,
      price: serviceCatalog[index].price,
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

  function finalizeQuote() {
    const payload: SavedQuote = {
      vehicle: quoteData.vehicle,
      items: cloneItems(quoteData.items),
      discount: quoteData.discount,
      timeDays: quoteData.timeDays,
      note: quoteData.note,
    };
    setSavedQuote(payload);
    window.alert('Orcamento salvo com sucesso.');
    setScreen('dashboard');
  }

  function finalizeAppointment() {
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
    setSavedAppointment(payload);
    window.alert('Agendamento salvo com sucesso.');
    setScreen('dashboard');
  }

  function importQuoteToSale() {
    const source = savedQuote || {
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
    window.alert('Orcamento importado para a venda.');
  }

  function importAppointmentToSale() {
    const source = savedAppointment || {
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
    window.alert('Agendamento importado para a venda.');
  }

  function finalizeSale() {
    const nowDate = now.toLocaleDateString('pt-BR');
    const car = saleData.vehicleDetails.split('\n')[0] || saleData.vehicleDetails;
    const newReceipt: ReceiptRow = {
      date: nowDate,
      customer: saleData.customer,
      car,
      plate: saleData.plate,
      total: saleTotal,
    };

    setReceipts((prev) => [newReceipt, ...prev]);
    window.alert('Venda finalizada e adicionada aos recibos.');
    setScreen('print-receipt');
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
        <h1>SISTEMA ETORK</h1>
      </main>
    );
  }

  return (
    <div className="et-shell">
      <AppHeader now={now} />

      {screen === 'dashboard' && (
        <main className="panel panel-dashboard">
          <h2 className="panel-title">SERVICOS</h2>
          <section className="dashboard-layout">
            <aside className="left-actions">
              <button>PESQUISAR</button>
              <button>CLIENTES</button>
              <button>FINANCEIRO</button>
              <button>PRODUTOS</button>
              <button>RELATORIOS</button>
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
              <div className="line"><strong>VEICULO:</strong> <span>{quoteData.vehicle}</span></div>
              <div className="line line-mini"><strong>LISTAR</strong> <button onClick={addItemToQuote}>+</button></div>
              <ServiceRows items={quoteData.items} />
              {quoteData.note && <div className="note-box">OBS: {quoteData.note}</div>}
            </div>

            <aside className="vehicle-info vehicle-empty" />
          </section>

          <footer className="panel-footer">
            <div className="footer-left">
              <div className="line footer-time"><strong>TEMPO DE SERVICO</strong> <span>1D</span></div>
              <div className="mini-actions">
                <button className="btn-yellow" onClick={() => askAndApplyDiscount(quoteData.discount, (next) => setQuoteData((prev) => ({ ...prev, discount: next })))}>INSERIR DESCONTO</button>
                <button className="btn-cyan" onClick={() => askAndApplyNote(quoteData.note, (next) => setQuoteData((prev) => ({ ...prev, note: next })))}>INSERIR OBSERVACAO</button>
              </div>
              <div className="total">TOTAL: <span>{formatMoney(quoteTotal)}</span></div>
            </div>
            <div className="footer-right">
              <button className="btn-back" onClick={() => setScreen('dashboard')}>←</button>
              <button className="btn-finish" onClick={finalizeQuote}>FINALIZAR ORCAMENTO</button>
            </div>
          </footer>
        </main>
      )}

      {screen === 'new-appointment' && (
        <main className="panel panel-form">
          <h2 className="panel-title">NOVO AGENDAMENTO</h2>
          <section className="form-grid">
            <div className="form-main">
              <div className="line"><strong>DATA:</strong> <span>{appointmentData.date}</span></div>
              <div className="line"><strong>CLIENTE:</strong> <span>{appointmentData.customer}</span> <small className="badge">CLIENTE FINAL</small></div>
              <div className="line line-mini"><strong>LISTAR</strong> <button onClick={addItemToAppointment}>+</button></div>
              <ServiceRows items={appointmentData.items} />
              {appointmentData.note && <div className="note-box">OBS: {appointmentData.note}</div>}
            </div>

            <aside className="vehicle-info">
              <div className="line side-top"><strong>TEL:</strong> <span>{appointmentData.phone}</span></div>
              <div className="line side-top"><strong>{appointmentData.laborRequired ? 'MAO DE OBRA' : 'SEM MAO DE OBRA'}</strong></div>
              <div className="line side-top"><strong>PLACA:</strong> <span>{appointmentData.plate}</span></div>
              <div className="vehicle-card">{appointmentData.vehicleDetails.split('\n').map((line) => <div key={line}>{line}</div>)}</div>
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
              <button className="btn-finish" onClick={finalizeAppointment}>FINALIZAR AGENDAMENTO</button>
            </div>
          </footer>
        </main>
      )}

      {screen === 'new-sale' && (
        <main className="panel panel-form">
          <h2 className="panel-title">NOVA VENDA</h2>
          <section className="sale-tools">
            <button className="tool-blue" onClick={importQuoteToSale}>IMPORTAR ORCAMENTO</button>
            <button className="tool-yellow" onClick={importAppointmentToSale}>IMPORTAR AGENDAMENTO</button>
          </section>

          <section className="form-grid">
            <div className="form-main">
              <div className="line"><strong>CLIENTE:</strong> <span>{saleData.customer}</span> <small className="badge">{saleData.customerType}</small></div>
              <div className="line line-mini"><strong>LISTAR</strong> <button onClick={addItemToSale}>+</button></div>
              <ServiceRows items={saleData.items} />
              {saleData.note && <div className="note-box">OBS: {saleData.note}</div>}
            </div>

            <aside className="vehicle-info">
              <div className="line side-top"><strong>TEL:</strong> <span>{saleData.phone}</span></div>
              <div className="line side-top"><strong>{saleData.laborRequired ? 'MAO DE OBRA' : 'SEM MAO DE OBRA'}</strong></div>
              <div className="line side-top"><strong>PLACA:</strong> <span>{saleData.plate}</span></div>
              <div className="vehicle-card">{saleData.vehicleDetails.split('\n').map((line) => <div key={line}>{line}</div>)}</div>
              <div className="line footer-time"><strong>TEMPO DE SERVICO</strong> <span>{saleData.timeDays}D</span></div>
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
              <button className="btn-finish" onClick={finalizeSale}>FINALIZAR VENDA</button>
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
            {filteredReceipts.map((row, index) => (
              <div className="receipt-row" key={row.customer + index}>
                <span>{row.date}</span>
                <span>{row.customer}</span>
                <span>{row.car}</span>
                <span>{row.plate}</span>
                <span>{formatMoney(row.total)}</span>
              </div>
            ))}
            {filteredReceipts.length === 0 && <div className="receipt-empty">Nenhum recibo encontrado para os filtros selecionados.</div>}
          </section>

          <footer className="panel-footer">
            <div className="footer-left">
              <div className="mini-actions">
                <button className="btn-yellow lg" onClick={exportReceiptCSV}>PDF</button>
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

      <button className="skip-intro" onClick={() => setScreen('dashboard')}>IR PARA O SISTEMA</button>
      <img className="brand-watermark" src={logoEtork} alt="Etork" />
    </div>
  );
}

export default App;