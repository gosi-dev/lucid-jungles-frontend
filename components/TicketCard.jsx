// components/TicketCard.jsx
export default function TicketCard({
  ticket,
  onClick,
  isSelectable = false,
  showQuantitySelector = false,
  selectedQuantity = 0,
  onQuantityChange,
  variant = 'default',
  userTicketCount = 0,
  isEventOwner = false
}) {
  const priceDisplay = ticket.price
    ? (typeof ticket.price === 'number' ? `₦${ticket.price.toLocaleString()}` : ticket.price)
    : '₦0';

  const borderColor = isSelectable && selectedQuantity > 0 ? '#ABD49E' : 'rgba(171,212,158,0.4)';
  const bgColor = isSelectable && selectedQuantity > 0 ? 'rgba(171,212,158,0.1)' : 'transparent';

  // Purchased variant
  if (variant === 'purchased') {
    return (
      <div
        onClick={onClick}
        style={{
          width: "100%", height: "203px", border: `1px solid ${borderColor}`,
          backgroundColor: "#1A1A1A", borderRadius: "8px", overflow: "hidden",
          display: "flex", flexDirection: "column", cursor: onClick ? "pointer" : "default"
        }}
      >
        <div style={{ height: "32px", borderBottom: "1px solid rgba(171,212,158,0.4)", display: "flex", alignItems: "center", paddingLeft: "10px" }}>
          <span style={{ color: "#ABD49E", fontWeight: 600, fontSize: 13 }}>{ticket.title || ticket.eventName || "Event Name"}</span>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "15px 10px 10px 20px", flex: 1 }}>
            <div style={{ color: "#ABD49E", fontSize: 24, fontWeight: 700 }}>{ticket.name || ticket.type || "Ticket Tier"}</div>
            <div style={{ color: "rgba(171,212,158,0.8)", fontSize: 13, marginTop: "8px", lineHeight: 1.4 }}>{ticket.description || ticket.perks || ""}</div>
          </div>
          <div style={{ borderTop: "1px solid rgba(171,212,158,0.4)", height: "39px", display: "flex" }}>
            <div style={{ width: "60%", borderRight: "1px solid rgba(171,212,158,0.4)", display: "flex", alignItems: "center", paddingLeft: "10px" }}>
              <span style={{ color: "#ABD49E", fontSize: 12, fontWeight: 600, overflow: "hidden", whiteSpace: "nowrap" }}>{ticket.location || "Event Location"}</span>
            </div>
            <div style={{ width: "20%", borderRight: "1px solid rgba(171,212,158,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "rgba(171,212,158,0.8)", fontSize: 11 }}>{ticket.date ? ticket.date.split('|')[0].trim() : "Nov 22"}</span>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "rgba(171,212,158,0.8)", fontSize: 11 }}>{ticket.time || "10:00AM"}</span>
            </div>
          </div>
        </div>
        <div style={{ height: "32px", borderTop: "1px solid rgba(171,212,158,0.4)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px" }}>
          <span style={{ color: "rgba(171,212,158,0.7)", fontSize: 11 }}>{ticket.purchaseDate || "Purchased Date"}</span>
          <span style={{ color: "#ABD49E", fontSize: 11, fontWeight: 500 }}>{ticket.ticketCount || 1} ticket{(ticket.ticketCount || 1) !== 1 ? 's' : ''}</span>
        </div>
      </div>
    );
  }

  // Default / purchase variant
  let quantityContent;
  if (isEventOwner) {
    quantityContent = <span style={{ color: "rgba(171,212,158,0.8)", fontSize: 11 }}>{ticket.quantity || ticket.available || 0} left</span>;
  } else if (userTicketCount > 0) {
    quantityContent = <span style={{ color: "#ABD49E", fontSize: 11, fontWeight: 500 }}>You: {userTicketCount}</span>;
  } else if (showQuantitySelector) {
    quantityContent = (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "0 4px" }}>
        <button onClick={(e) => { e.stopPropagation(); if (onQuantityChange && selectedQuantity > 0) onQuantityChange(ticket._id || ticket.id, selectedQuantity - 1); }}
          style={{ width: 22, height: 22, border: "1px solid rgba(171,212,158,0.4)", background: "transparent", color: "#ABD49E", borderRadius: 4, cursor: "pointer", fontSize: 14 }}>−</button>
        <span style={{ color: "#ABD49E", fontWeight: 600, fontSize: 13, minWidth: 20, textAlign: "center" }}>{selectedQuantity}</span>
        <button onClick={(e) => { e.stopPropagation(); if (onQuantityChange) onQuantityChange(ticket._id || ticket.id, selectedQuantity + 1); }}
          style={{ width: 22, height: 22, border: "1px solid rgba(171,212,158,0.4)", background: "transparent", color: "#ABD49E", borderRadius: 4, cursor: "pointer", fontSize: 14 }}>+</button>
      </div>
    );
  } else {
    quantityContent = <span style={{ color: "rgba(171,212,158,0.8)", fontSize: 11 }}>Buy</span>;
  }

  return (
    <div
      onClick={onClick}
      style={{
        width: "100%", height: "139px",
        border: `${isSelectable && selectedQuantity > 0 ? '2px' : '1px'} solid ${borderColor}`,
        backgroundColor: bgColor, borderRadius: "8px", overflow: "hidden",
        display: "flex", flexDirection: "column",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div style={{ padding: "15px 10px 15px 20px" }}>
        <div style={{ color: "#ABD49E", fontSize: 26, fontWeight: 700 }}>{ticket.name || ticket.type || "Ticket Tier"}</div>
      </div>
      <div style={{ padding: "0 10px 10px 20px", flex: 1 }}>
        <div style={{ color: "rgba(171,212,158,0.8)", fontSize: 12, lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {ticket.description || ticket.perks || "Ticket description and perks"}
        </div>
      </div>
      <div style={{ borderTop: "1px solid rgba(171,212,158,0.4)", height: "39px", display: "flex" }}>
        <div style={{ width: "60%", borderRight: "1px solid rgba(171,212,158,0.4)", display: "flex", alignItems: "center", paddingLeft: "10px" }}>
          <span style={{ color: "#ABD49E", fontWeight: 600, fontSize: 13 }}>{priceDisplay}</span>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {quantityContent}
        </div>
        <div style={{ width: "80px", borderLeft: "1px solid rgba(171,212,158,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {ticket.status ? (
            <span style={{ color: "rgba(171,212,158,0.7)", fontSize: 9, textAlign: "center", padding: "0 4px", letterSpacing: 0.5 }}>{ticket.status}</span>
          ) : (
            <span style={{ color: "rgba(171,212,158,0.7)", fontSize: 9 }}>
              {(ticket.sold || 0)}/{ticket.quantity || '∞'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
