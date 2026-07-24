// Chart.jsx — Profit & Loss bar chart, hatched orange style.

const Chart = () => {
  // 8 months of paired (profit, loss) bars
  const data = [
    { m: "Jan", profit: 18, loss: 35 },
    { m: "Feb", profit: 32, loss: 28 },
    { m: "Mar", profit: 25, loss: 38 },
    { m: "Apr", profit: 42, loss: 32 },
    { m: "May", profit: 48, loss: 26 },
    { m: "Jun", profit: 38, loss: 40 },
    { m: "Jul", profit: 50, loss: 30 },
    { m: "Aug", profit: 45, loss: 35 },
  ];
  const max = 60;
  const chartH = 200;

  return (
    <div className="card chart-card">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
        <div>
          <h3>Total income</h3>
          <div className="sub">View your income in a certain period of time</div>
        </div>
        <div className="legend">
          <span><span className="sw" style={{background:"#171E45"}}></span>Profit</span>
          <span><span className="sw" style={{background:"#AEB4CD"}}></span>Loss</span>
        </div>
      </div>
      <div style={{marginTop:16}}>
        <div style={{fontFamily:"var(--font-mono)",fontSize:10,letterSpacing:"0.04em",textTransform:"uppercase",color:"var(--ink-50)",marginBottom:8}}>
          Profit and Loss · 2026
        </div>
        <svg viewBox={`0 0 800 ${chartH + 30}`} style={{width:"100%",height:240}}>
          <defs>
            <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="#C8CCDF"/>
              <line x1="0" y1="0" x2="0" y2="6" stroke="#828BB0" strokeWidth="3"/>
            </pattern>
          </defs>
          {[0,1,2,3,4].map(i => (
            <line key={i} x1="0" x2="800"
                  y1={chartH - (i/4)*chartH} y2={chartH - (i/4)*chartH}
                  stroke="#E1E5EB" strokeWidth="1" strokeDasharray="2 3"/>
          ))}
          {data.map((d, i) => {
            const cx = 40 + i * 95;
            const ph = (d.profit / max) * chartH;
            const lh = (d.loss / max) * chartH;
            return (
              <g key={i}>
                <rect x={cx} y={chartH - ph} width="22" height={ph} fill="#171E45" rx="2"/>
                <rect x={cx + 28} y={chartH - lh} width="22" height={lh} fill="url(#hatch)" rx="2"/>
                <text x={cx + 25} y={chartH + 20} fill="#6E665A"
                      fontFamily="Google Sans Flex, sans-serif" fontSize="11" textAnchor="middle"
                      letterSpacing="-0.3">{d.m}</text>
              </g>
            );
          })}
          {[0,10,20,30,40,50].map(v => (
            <text key={v} x="0" y={chartH - (v/max)*chartH + 4} fill="#6E665A"
                  fontFamily="Google Sans Flex, sans-serif" fontSize="10" letterSpacing="-0.3"
                  fontWeight="500">
              {v}k
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
};

window.Chart = Chart;
