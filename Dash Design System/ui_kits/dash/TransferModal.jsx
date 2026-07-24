// TransferModal.jsx
const TransferModal = ({ open, onClose, onSend }) => {
  const [amount, setAmount] = React.useState("250.00");
  const [to, setTo] = React.useState("Checking · ••••2719");
  if (!open) return null;
  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <h3>Send a transfer</h3>
          <button className="icon-btn" onClick={onClose} style={{width:32,height:32}}><Icon name="x" size={14}/></button>
        </div>
        <div className="lead">Funds move instantly between your linked Dash wallets.</div>

        <div className="field big">
          <label>Amount · USD</label>
          <input value={"$" + amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}/>
        </div>
        <div className="field">
          <label>To</label>
          <input value={to} onChange={(e) => setTo(e.target.value)}/>
        </div>
        <div className="field">
          <label>Note <span style={{textTransform:"none",color:"var(--ink-50)",letterSpacing:"-0.02em",marginLeft:6}}>· optional</span></label>
          <input placeholder="What's this for?"/>
        </div>

        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={() => onSend(amount, to)}>
            Send transfer <Icon name="arrow-up-right" size={14}/>
          </button>
        </div>
      </div>
    </div>
  );
};

window.TransferModal = TransferModal;
