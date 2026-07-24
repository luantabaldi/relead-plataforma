// Sidebar.jsx
const Sidebar = ({ active, setActive }) => {
  const items = [
    { id: "overview", label: "Overview", icon: "grid", section: "home", dot: true },
    { id: "statement", label: "Legalcy statement", icon: "file", section: "home" },
    { id: "projection", label: "Financial projection", icon: "trend", section: "home" },
    { id: "account", label: "Account", icon: "user", section: "home" },
    { id: "savings", label: "Savings", icon: "piggy", section: "pocket" },
    { id: "emergency", label: "Emergency funds", icon: "shield", section: "pocket" },
  ];
  const home = items.filter(i => i.section === "home");
  const pocket = items.filter(i => i.section === "pocket");

  return (
    <aside className="sidebar">
      <div className="brand-lockup">
        <span className="mark">
          <svg width="20" height="20" viewBox="0 0 64 64" fill="none"><path d="M40 16 L24 48" stroke="#FBF8F3" strokeWidth="7" strokeLinecap="round"/></svg>
        </span>
        <span className="wm">Dash<em>.</em></span>
      </div>

      <div className="eyebrow">Home</div>
      {home.map(it => (
        <div key={it.id}
             className={"nav-item" + (active === it.id ? " active" : "")}
             onClick={() => setActive(it.id)}>
          <Icon name={it.icon} size={16}/>
          <span>{it.label}</span>
          {it.dot && active === it.id && <span className="nav-dot"></span>}
        </div>
      ))}

      <div className="eyebrow" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span>Pocket</span>
        <span style={{width:20,height:20,borderRadius:"50%",background:"var(--orange-600)",color:"#FBF8F3",display:"inline-flex",alignItems:"center",justifyContent:"center"}}>
          <Icon name="plus" size={12}/>
        </span>
      </div>
      {pocket.map(it => (
        <div key={it.id}
             className={"nav-item" + (active === it.id ? " active" : "")}
             onClick={() => setActive(it.id)}>
          <Icon name={it.icon} size={16}/>
          <span>{it.label}</span>
        </div>
      ))}

      <div className="sidebar-card">
        <div className="blob"></div>
        <div className="t">Unlock <em>40+</em> metrics</div>
        <div className="d">Insights that explain themselves. Try Pro for free.</div>
        <a className="b">15 day free trial <Icon name="arrow-up-right" size={12}/></a>
      </div>
    </aside>
  );
};

window.Sidebar = Sidebar;
