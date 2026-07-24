// ActivityTable.jsx
const ActivityTable = ({ rows, onToggle, onSelect, selectedId }) => {
  return (
    <div className="card" style={{padding: 22}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
        <div>
          <h3 style={{margin:0,font:"500 22px/1.1 var(--font-display)",letterSpacing:"-0.01em",color:"var(--ink-300)"}}>Recent activities</h3>
          <div style={{font:"400 12px/1.4 var(--font-mono)",color:"var(--ink-50)",letterSpacing:"-0.02em",marginTop:4}}>Last 7 days · 6 transactions</div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <div className="search" style={{width:220,padding:"8px 14px"}}>
            <Icon name="search" size={14}/>
            <input placeholder="Search…"/>
          </div>
          <button className="btn secondary" style={{padding:"10px 16px"}}>
            <Icon name="filter" size={14}/> Filter
          </button>
        </div>
      </div>
      <table>
        <thead><tr>
          <th style={{width:24}}></th>
          <th>Order ID</th>
          <th>Activity</th>
          <th>Price</th>
          <th>Status</th>
          <th>Date</th>
          <th style={{width:24}}></th>
        </tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}
                className={"row" + (selectedId === r.id ? " selected" : "")}
                onClick={() => onSelect(r.id)}>
              <td onClick={(e)=>{e.stopPropagation(); onToggle(r.id);}}>
                <span className={"checkbox" + (r.checked ? " on" : "")}></span>
              </td>
              <td className="num">{r.invoice}</td>
              <td>
                <div className="activity-cell">
                  <span className={"activity-ic " + r.tone}>{r.glyph}</span>
                  {r.activity}
                </div>
              </td>
              <td className="num">{r.price}</td>
              <td><span className={"chip " + r.statusTone}><span className="dot"></span>{r.status}</span></td>
              <td>{r.date}</td>
              <td><Icon name="more" size={14}/></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

window.ActivityTable = ActivityTable;
