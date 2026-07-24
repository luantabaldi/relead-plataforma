// Icons.jsx — Lucide-style SVG icons used across the kit.
// 1.5 stroke, currentColor. Sized to inherit via CSS.

const Icon = ({ name, size = 18 }) => {
  const s = { width: size, height: size };
  const props = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: s,
  };
  switch (name) {
    case "grid":
      return (<svg {...props}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>);
    case "file":
      return (<svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>);
    case "trend":
      return (<svg {...props}><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>);
    case "user":
      return (<svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>);
    case "wallet":
      return (<svg {...props}><rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20"/></svg>);
    case "piggy":
      return (<svg {...props}><path d="M19 8c1.5 0 3 1 3 3v3l-2 1v3h-4v-2H9v2H5v-3a7 7 0 0 1 7-7h2c1 0 2 .3 3 1Z"/><path d="M15 9v-3"/><circle cx="8" cy="11" r=".5" fill="currentColor"/></svg>);
    case "shield":
      return (<svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>);
    case "search":
      return (<svg {...props}><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>);
    case "bell":
      return (<svg {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>);
    case "calendar":
      return (<svg {...props}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>);
    case "settings":
      return (<svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>);
    case "arrow-up-right":
      return (<svg {...props}><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>);
    case "arrow-down":
      return (<svg {...props}><path d="M12 5v14M5 12l7 7 7-7"/></svg>);
    case "arrow-up":
      return (<svg {...props}><path d="M12 19V5M5 12l7-7 7 7"/></svg>);
    case "swap":
      return (<svg {...props}><path d="m7 16 4-4-4-4"/><path d="M17 8l-4 4 4 4"/><path d="M7 12h8M9 12h8"/></svg>);
    case "send":
      return (<svg {...props}><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>);
    case "plus":
      return (<svg {...props}><path d="M12 5v14M5 12h14"/></svg>);
    case "filter":
      return (<svg {...props}><path d="M22 3H2l8 9.46V19l4 2v-8.54z"/></svg>);
    case "more":
      return (<svg {...props}><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/><circle cx="5" cy="12" r="1" fill="currentColor"/></svg>);
    case "chevron-down":
      return (<svg {...props}><path d="m6 9 6 6 6-6"/></svg>);
    case "check":
      return (<svg {...props}><path d="M20 6 9 17l-5-5"/></svg>);
    case "x":
      return (<svg {...props}><path d="M18 6 6 18M6 6l12 12"/></svg>);
    case "logout":
      return (<svg {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>);
    default:
      return null;
  }
};

window.Icon = Icon;
