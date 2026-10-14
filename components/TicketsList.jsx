// components/TicketsList.jsx
import TicketCard from './TicketCard';

export default function TicketsList({
  tickets = [],
  onTicketClick,
  variant = 'default',
  isSelectable = false,
  quantities = {},
  onQuantityChange,
  userTicketCounts = {},
  isEventOwner = false
}) {
  if (!tickets.length) {
    return (
      <div style={{ color: "rgba(171,212,158,0.5)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
        No tickets available
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "21px" }}>
      {tickets.map((ticket) => (
        <TicketCard
          key={ticket._id || ticket.id}
          ticket={ticket}
          onClick={onTicketClick ? () => onTicketClick(ticket) : undefined}
          variant={variant}
          isSelectable={isSelectable}
          showQuantitySelector={isSelectable}
          selectedQuantity={quantities[ticket._id || ticket.id] || 0}
          onQuantityChange={onQuantityChange}
          userTicketCount={userTicketCounts[ticket._id || ticket.id] || 0}
          isEventOwner={isEventOwner}
        />
      ))}
    </div>
  );
}
