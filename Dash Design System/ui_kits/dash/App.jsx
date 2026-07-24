// App.jsx — Dash dashboard demo

const sampleRows = [
  { id: "r1", invoice: "INV_000076", activity: "Mobile app purchase",   glyph: "M", tone: "a", price: "$25,500", status: "Completed",   statusTone: "ok",   date: "17 Apr · 03:45 PM", checked: false },
  { id: "r2", invoice: "INV_000075", activity: "Hotel booking",          glyph: "H", tone: "b", price: "$32,750", status: "Pending",     statusTone: "warn", date: "15 Apr · 11:30 AM", checked: false },
  { id: "r3", invoice: "INV_000074", activity: "Flight ticket booking",  glyph: "F", tone: "c", price: "$40,200", status: "Completed",   statusTone: "ok",   date: "15 Apr · 12:00 PM", checked: false },
  { id: "r4", invoice: "INV_000073", activity: "Grocery purchase",       glyph: "G", tone: "d", price: "$50,200", status: "In progress", statusTone: "info", date: "14 Apr · 09:15 PM", checked: true  },
  { id: "r5", invoice: "INV_000072", activity: "Software license",       glyph: "S", tone: "a", price: "$15,900", status: "Completed",   statusTone: "ok",   date: "10 Apr · 06:00 AM", checked: false },
];

const App = () => {
  const [active, setActive] = React.useState("overview");
  const [transferOpen, setTransferOpen] = React.useState(false);
  const [rows, setRows] = React.useState(sampleRows);
  const [selectedId, setSelectedId] = React.useState("r4");
  const [toast, setToast] = React.useState(null);

  const toggle = (id) => setRows(rs => rs.map(r => r.id === id ? {...r, checked: !r.checked} : r));

  const sendTransfer = (amount, to) => {
    setTransferOpen(false);
    setToast({ amount, to });
    setTimeout(() => setToast(null), 3200);
  };

  return (
    <div className="app">
      <Sidebar active={active} setActive={setActive}/>
      <main>
        <Topbar/>
        <div className="page" data-screen-label="Overview">
          {/* Hero */}
          <div className="page-hero">
            <div>
              <div className="crumb"><b>Home</b> &nbsp;›&nbsp; Overview</div>
              <h2>Good morning, <em>Sajibur</em></h2>
              <div className="sub">Stay on top of your tasks, monitor progress, and track status.</div>
            </div>
            <div className="actions">
              <button className="btn secondary"><Icon name="filter" size={14}/> Filters</button>
              <button className="btn secondary"><Icon name="arrow-down" size={14}/> Export</button>
              <button className="btn primary" onClick={() => setTransferOpen(true)}>
                <Icon name="plus" size={14}/> Transfer
              </button>
            </div>
          </div>

          {/* Top stats: 4 columns */}
          <div className="grid cols-4">
            <StatCard label="Total balance" value="$689,372" delta="5%" deltaDir="up" deltaNote="than last month" icon="wallet"/>
            <StatCard label="Total earnings" value="$ 950" delta="7%" deltaDir="up" deltaNote="this month" icon="arrow-up" variant="accent"/>
            <StatCard label="Total spending" value="$ 700" delta="5%" deltaDir="down" deltaNote="this month" icon="arrow-down"/>
            <StatCard label="Total revenue" value="$ 850" delta="4%" deltaDir="up" deltaNote="this month" icon="trend"/>
          </div>

          {/* Chart + Wallets */}
          <div className="grid" style={{gridTemplateColumns: "1.6fr 1fr", marginTop: 20}}>
            <Chart/>
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              <WalletGroup/>
              <div className="card" style={{padding:20}}>
                <div className="label" style={{marginBottom:6}}>
                  <span>Monthly spending limit</span>
                  <Icon name="more" size={14}/>
                </div>
                <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:10}}>
                  <span className="num" style={{fontSize:18,fontFamily:"var(--font-sans-display)",fontWeight:600,letterSpacing:"-0.025em",color:"var(--ink-300)"}}>$1,400.00</span>
                  <span style={{font:"400 11px/1 var(--font-mono)",color:"var(--ink-50)",letterSpacing:"-0.02em"}}>of $5,500.00</span>
                </div>
                <div style={{height:8,background:"var(--paper-100)",borderRadius:999,overflow:"hidden"}}>
                  <div style={{width:"25%",height:"100%",background:"var(--orange-500)",borderRadius:999}}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Section */}
          <div className="section">
            <h3>Recent activity</h3>
            <div className="right">
              <span className="tag-pill">Team <Icon name="x" size={11}/></span>
              <span className="tag-pill">Insights <Icon name="x" size={11}/></span>
              <span className="tag-pill">Today <Icon name="x" size={11}/></span>
            </div>
          </div>

          {/* Table */}
          <ActivityTable rows={rows} onToggle={toggle} onSelect={setSelectedId} selectedId={selectedId}/>
        </div>
      </main>

      <TransferModal open={transferOpen} onClose={() => setTransferOpen(false)} onSend={sendTransfer}/>

      {toast && (
        <div className="toast">
          <span className="check"><Icon name="check" size={12}/></span>
          Transfer sent. <b>${toast.amount}</b> to {toast.to}.
        </div>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
