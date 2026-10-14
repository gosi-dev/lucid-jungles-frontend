// components/EventCard.jsx
import Link from "next/link";

export default function EventCard({ event, href }) {
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
  };

  return (
    <div style={{ width: "100%", paddingLeft: "16px", paddingRight: "16px", marginBottom: "16px", backgroundColor: "#151413", height: "275px" }}>
      <Link href={href || `/events/${event._id}`} style={{ display: "block", textDecoration: "none" }}>
        <div style={{ backgroundColor: "#1A1A1A", width: "100%" }}>
          {/* Image */}
          <div style={{ width: "100%", height: "180px", backgroundColor: "#151413" }}>
            {event.image || event.coverImage ? (
              <img src={event.image || event.coverImage} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", backgroundColor: "rgba(171,212,158,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "rgba(171,212,158,0.3)", fontSize: 12 }}>NO IMAGE</span>
              </div>
            )}
          </div>

          {/* Title bar */}
          <div style={{ width: "100%", height: "32px", backgroundColor: "#ABD49E", paddingLeft: "10px", display: "flex", alignItems: "center" }}>
            <span style={{ color: "#151413", fontFamily: "monospace", fontWeight: 700, fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase" }}>{event.title}</span>
          </div>

          {/* Location / Date / Time */}
          <div style={{ width: "100%", height: "32px", display: "flex", alignItems: "center", border: "1px solid rgba(171,212,158,0.4)" }}>
            <div style={{ height: "100%", display: "flex", alignItems: "center", width: "60%", borderRight: "1px solid #ABD49E", padding: "5px", overflow: "hidden" }}>
              <span style={{ color: "#ABD49E", fontSize: 11, whiteSpace: "nowrap" }}>{event.location}</span>
            </div>
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", width: "20%", borderRight: "1px solid #ABD49E" }}>
              <span style={{ color: "rgba(171,212,158,0.8)", fontSize: 11 }}>{formatDate(event.date)}</span>
            </div>
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", width: "20%" }}>
              <span style={{ color: "rgba(171,212,158,0.8)", fontSize: 11 }}>{event.time || "-"}</span>
            </div>
          </div>

          {/* Price & Tags */}
          <div style={{ width: "100%", height: "32px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px", border: "1px solid rgba(171,212,158,0.4)", borderTop: "none" }}>
            <span style={{ color: "#ABD49E", fontSize: 11 }}>
              {event.ticketPrice === "0" || event.price === "FREE" ? "FREE" : (event.price || (event.tickets?.[0]?.price ? `₦${event.tickets[0].price}` : "FREE"))}
            </span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {event.tags?.slice(0, 3).map((tag, i) => (
                <span key={i} style={{ color: "#9CA3AF", fontSize: 10, border: "1px solid #4B5563", padding: "1px 6px" }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
