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

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
      {items.map((item) => (
        <div className="et-row" key={item.description}>
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

  const quoteTotal = useMemo(() => quoteItems.reduce((acc, item) => acc + item.price * item.quantity, 0), []);
  const appointmentTotal = useMemo(() => appointmentItems.reduce((acc, item) => acc + item.price * item.quantity, 0), []);
  const saleTotal = useMemo(() => saleItems.reduce((acc, item) => acc + item.price * item.quantity, 0), []);

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
                <strong>HB20 1.0</strong>
                <span>QUA-9J17</span>
                <small>27/04/2026 08:00</small>
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
              <div className="line"><strong>VEICULO:</strong> <span>RAM 1500 CLASSIC 2023</span></div>
              <div className="line line-mini"><strong>LISTAR</strong> <b>+</b></div>
              <ServiceRows items={quoteItems} />
            </div>

            <aside className="vehicle-info vehicle-empty" />
          </section>

          <footer className="panel-footer">
            <div className="footer-left">
              <div className="line footer-time"><strong>TEMPO DE SERVICO</strong> <span>1D</span></div>
              <div className="mini-actions">
                <button className="btn-yellow">INSERIR DESCONTO</button>
                <button className="btn-cyan">INSERIR OBSERVACAO</button>
              </div>
              <div className="total">TOTAL: <span>{formatMoney(quoteTotal)}</span></div>
            </div>
            <div className="footer-right">
              <button className="btn-back" onClick={() => setScreen('dashboard')}>←</button>
              <button className="btn-finish">FINALIZAR ORCAMENTO</button>
            </div>
          </footer>
        </main>
      )}

      {screen === 'new-appointment' && (
        <main className="panel panel-form">
          <h2 className="panel-title">NOVO AGENDAMENTO</h2>
          <section className="form-grid">
            <div className="form-main">
              <div className="line"><strong>DATA:</strong> <span>27/04/2026 08:00</span></div>
              <div className="line"><strong>CLIENTE:</strong> <span>MILENNA DE OLIVEIRA FELICIANO</span> <small className="badge">CLIENTE FINAL</small></div>
              <div className="line line-mini"><strong>LISTAR</strong> <b>+</b></div>
              <ServiceRows items={appointmentItems} />
            </div>

            <aside className="vehicle-info">
              <div className="line side-top"><strong>TEL:</strong> <span>67 99260-0928</span></div>
              <div className="line side-top"><strong>MAO DE OBRA</strong></div>
              <div className="line side-top"><strong>PLACA:</strong> <span>QUA-9J17</span></div>
              <div className="vehicle-card">
                HYUNDAI H20 1.0<br />
                MANUAL<br />
                2019/2019<br />
                FLEX
              </div>
            </aside>
          </section>

          <footer className="panel-footer">
            <div className="footer-left">
              <div className="mini-actions">
                <button className="btn-yellow">INSERIR DESCONTO</button>
                <button className="btn-cyan">INSERIR OBSERVACAO</button>
              </div>
              <div className="total">TOTAL: <span>{formatMoney(appointmentTotal)}</span></div>
            </div>
            <div className="footer-right">
              <button className="btn-back" onClick={() => setScreen('dashboard')}>←</button>
              <button className="btn-finish">FINALIZAR AGENDAMENTO</button>
            </div>
          </footer>
        </main>
      )}

      {screen === 'new-sale' && (
        <main className="panel panel-form">
          <h2 className="panel-title">NOVA VENDA</h2>
          <section className="sale-tools">
            <button className="tool-blue">IMPORTAR ORCAMENTO</button>
            <button className="tool-yellow">IMPORTAR AGENDAMENTO</button>
          </section>

          <section className="form-grid">
            <div className="form-main">
              <div className="line"><strong>CLIENTE:</strong> <span>JOAO HENRIQUE DE ALMEIDA</span> <small className="badge">CLIENTE FINAL</small></div>
              <div className="line line-mini"><strong>LISTAR</strong> <b>+</b></div>
              <ServiceRows items={saleItems} />
            </div>

            <aside className="vehicle-info">
              <div className="line side-top"><strong>TEL:</strong> <span>67 99871-1313</span></div>
              <div className="line side-top"><strong>MAO DE OBRA</strong></div>
              <div className="line side-top"><strong>PLACA:</strong> <span>QAN-2H92</span></div>
              <div className="vehicle-card">
                VW AMAROK 3.0 V6<br />
                AUTO<br />
                2020/2021<br />
                DIESEL
              </div>
              <div className="line footer-time"><strong>TEMPO DE SERVICO</strong> <span>1D</span></div>
            </aside>
          </section>

          <footer className="panel-footer">
            <div className="footer-left">
              <div className="mini-actions">
                <button className="btn-yellow">INSERIR DESCONTO</button>
                <button className="btn-cyan">INSERIR OBSERVACAO</button>
              </div>
              <div className="total">TOTAL: <span>{formatMoney(saleTotal)}</span></div>
            </div>
            <div className="footer-right">
              <button className="btn-back" onClick={() => setScreen('dashboard')}>←</button>
              <button className="btn-dark">ENVIAR SERVICO</button>
              <button className="btn-finish">FINALIZAR VENDA</button>
            </div>
          </footer>
        </main>
      )}

      {screen === 'print-receipt' && (
        <main className="panel panel-form">
          <h2 className="panel-title">IMPRIMIR RECIBO</h2>

          <section className="receipt-filters">
            <div className="line"><strong>CLIENTE:</strong> <span className="input-look" /></div>
            <div className="line dual">
              <div><strong>DATA:</strong> <span className="input-look small" /></div>
              <div><strong>A</strong> <span className="input-look small" /></div>
            </div>
            <div className="line right"><strong>PLACA:</strong> <span className="input-look plate" /></div>
          </section>

          <section className="receipt-table">
            {receiptRows.map((row, index) => (
              <div className="receipt-row" key={row.customer + index}>
                <span>{row.date}</span>
                <span>{row.customer}</span>
                <span>{row.car}</span>
                <span>{row.plate}</span>
                <span>{formatMoney(row.total)}</span>
              </div>
            ))}
          </section>

          <footer className="panel-footer">
            <div className="footer-left">
              <div className="mini-actions">
                <button className="btn-yellow lg">PDF</button>
                <button className="btn-yellow lg">IMPRIMIR</button>
              </div>
            </div>
            <div className="footer-right">
              <button className="btn-back" onClick={() => setScreen('dashboard')}>←</button>
              <button className="btn-finish">FINALIZAR ORCAMENTO</button>
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