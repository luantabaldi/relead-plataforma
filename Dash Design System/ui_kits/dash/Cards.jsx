// Cards.jsx — stat cards and wallet cards
const StatCard = ({ label, value, delta, deltaDir = "up", deltaNote, icon, variant = "default" }) => {
  return (
    <div className={"card" + (variant !== "default" ? " " + variant : "")}>
      <div className="label">
        <span>{label}</span>
        <span className="ic-circle"><Icon name={icon} size={14}/></span>
      </div>
      <div className="num">{value}</div>
      {delta && (
        <div className="delta">
          <span className={deltaDir === "up" ? "up" : "down"}>
            {deltaDir === "up" ? "↑" : "↓"} {delta}
          </span>
          {deltaNote && <span className="muted">{deltaNote}</span>}
        </div>
      )}
    </div>
  );
};

const WalletGroup = () => {
  return (
    <div className="card" style={{padding: 20, gap: 14}}>
      <div className="label">
        <span>Wallets <span style={{color:"var(--ink-100)",marginLeft:8}}>| Total 3 wallets</span></span>
        <Icon name="more" size={14}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
        <Wallet flag="🇺🇸" code="USD" amount="$22,678.00" limit="Limit: $10k/mo" active/>
        <Wallet flag="🇩🇪" code="EUR" amount="€18,345.00" limit="Limit: €8k/mo" active/>
        <Wallet flag="🇬🇧" code="GBP" amount="£15,000.00" limit="Limit: £7.5k/mo" active={false}/>
      </div>
    </div>
  );
};

const Wallet = ({ flag, code, amount, limit, active }) => {
  // Tiny dot instead of emoji flag to stay on-brand
  const colors = { USD: "#2F8F5C", EUR: "#C58B2A", GBP: "#5B6FA3" };
  return (
    <div className="wallet-card">
      <div className="flag">
        <span style={{width:14,height:14,borderRadius:"50%",background:colors[code]||"#999",display:"inline-block"}}></span>
        {code}
        <Icon name="more" size={12}/>
      </div>
      <div className="amt">{amount}</div>
      <div className="lim">{limit}</div>
      <div className={"st" + (active ? "" : " in")}>{active ? "● Active" : "● Inactive"}</div>
    </div>
  );
};

window.StatCard = StatCard;
window.WalletGroup = WalletGroup;
window.Wallet = Wallet;
