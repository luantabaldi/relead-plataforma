// Topbar.jsx
const Topbar = ({ pageTitle }) => {
  return (
    <header className="topbar">
      <div className="search">
        <Icon name="search" size={16}/>
        <input placeholder="Search transactions, reports…"/>
        <span style={{fontFamily:"var(--font-mono)",fontSize:10,letterSpacing:"0.04em",color:"var(--ink-50)",padding:"3px 6px",border:"1px solid var(--paper-300)",borderRadius:6}}>⌘K</span>
      </div>
      <div style={{flex:1}}></div>
      <button className="icon-btn"><Icon name="calendar" size={18}/></button>
      <button className="icon-btn">
        <Icon name="bell" size={18}/>
        <span className="ping"></span>
      </button>
      <div className="profile">
        <span className="av">SR</span>
        <div className="meta">
          <span className="nm">Sajibur R.</span>
          <span className="rl">CEO Assistant</span>
        </div>
        <Icon name="chevron-down" size={14}/>
      </div>
    </header>
  );
};

window.Topbar = Topbar;
