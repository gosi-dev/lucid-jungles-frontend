// components/EventProfileModal.jsx
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/router";

export default function EventProfileModal({ entity, onClose, eventName = "Event Name" }) {
  const router = useRouter();

  if (!entity) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#151413", zIndex: 10000, padding: "20px", overflowY: "auto", paddingBottom: "80px" }}>
      <div style={{ maxWidth: "400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "20px", position: "relative", height: "32px" }}>
          <button onClick={onClose} style={{ position: "absolute", left: 0, background: "none", border: "none", color: "#ABD49E", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <ArrowLeft size={22} />
          </button>
          <div style={{ color: "#ABD49E", fontSize: 16, textAlign: "center", flex: 1 }}>{eventName}</div>
        </div>

        {/* Image placeholder */}
        <div style={{ width: "100%", height: "300px", backgroundColor: "rgba(171,212,158,0.1)", border: "1px solid #ABD49E", marginBottom: "20px" }} />

        {/* Attendee */}
        {entity.type === 'ATTENDEE' && (
          <div>
            <h3 style={{ color: "#ABD49E", fontSize: 20, marginBottom: 8 }}>{entity.name}</h3>
            <p style={{ color: "rgba(171,212,158,0.8)", fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
              Event attendee with interest in immersive experiences and creative networking.
            </p>
            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
              {["ATTENDEE", "INNOVATION", "CREATIVE"].map(tag => (
                <span key={tag} style={{ padding: "4px 10px", border: "1px solid #ABD49E", color: "#ABD49E", fontSize: 12 }}>{tag}</span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ flex: 1, height: 42, backgroundColor: "#ABD49E", color: "#151413", border: "none", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>CONNECT</button>
              <button onClick={() => router.push(`/profile/${entity.id}`)} style={{ flex: 1, height: 42, backgroundColor: "transparent", color: "#ABD49E", border: "1px solid #ABD49E", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>VIEW PROFILE</button>
            </div>
          </div>
        )}

        {/* Talent */}
        {entity.type === 'TALENT' && (
          <div>
            <h1 style={{ color: "#ABD49E", fontSize: 26, fontWeight: 700, marginBottom: 8 }}>{entity.name}</h1>
            <h3 style={{ color: "#ABD49E", fontSize: 15, opacity: 0.9, marginBottom: 20 }}>{entity.role}</h3>
            <p style={{ color: "rgba(171,212,158,0.8)", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              {entity.bio || "Talent at this event."}
            </p>
            <div style={{ height: 1, backgroundColor: "#ABD49E", opacity: 0.3, margin: "20px 0" }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ flex: 1, height: 42, backgroundColor: "#ABD49E", color: "#151413", border: "none", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>CONTACT</button>
              <button onClick={() => router.push(`/profile/${entity.id}`)} style={{ flex: 1, height: 42, backgroundColor: "transparent", color: "#ABD49E", border: "1px solid #ABD49E", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>VIEW PROFILE</button>
            </div>
          </div>
        )}

        {/* Exhibitor */}
        {entity.type === 'EXHIBITOR' && (
          <div>
            <h1 style={{ color: "#ABD49E", fontSize: 28, fontWeight: 700, marginBottom: 10 }}>{entity.name || "COMPANY NAME"}</h1>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <span style={{ color: "rgba(171,212,158,0.9)", fontSize: 15 }}>{entity.description || "PRODUCT/SERVICE DESCRIPTION"}</span>
              <span style={{ color: "#ABD49E", fontSize: 11, padding: "3px 8px", border: "1px solid rgba(171,212,158,0.7)" }}>VENDOR</span>
            </div>
            <div style={{ display: "flex", gap: 10, margin: "20px 0" }}>
              <button style={{ flex: 1, height: 42, backgroundColor: "transparent", color: "#ABD49E", border: "1px solid #ABD49E", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>CONTACT</button>
              <button style={{ flex: 1, height: 42, backgroundColor: "transparent", color: "#ABD49E", border: "1px solid #ABD49E", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>VIEW PORTFOLIO</button>
            </div>
            <h2 style={{ color: "#ABD49E", fontSize: 18, textAlign: "center", margin: "28px 0 14px" }}>Available Products and Services</h2>
            <div style={{ height: 1, backgroundColor: "#ABD49E", opacity: 0.3, marginBottom: 20 }} />
            {entity.products?.map((p, i) => (
              <div key={i} style={{ border: "1px solid #ABD49E", padding: "20px", marginBottom: 16 }}>
                <div style={{ color: "#ABD49E", fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{p.name}</div>
                <div style={{ color: "rgba(171,212,158,0.8)", fontSize: 13, marginBottom: 12 }}>{p.description}</div>
                <div style={{ display: "flex", border: "1px solid rgba(171,212,158,0.3)" }}>
                  <div style={{ flex: 1, padding: "8px 12px", borderRight: "1px solid rgba(171,212,158,0.3)", color: "#ABD49E", fontSize: 13, fontWeight: 600 }}>₦{p.price?.toLocaleString()}</div>
                  <div style={{ padding: "8px 12px" }}>
                    <div style={{ color: "rgba(171,212,158,0.6)", fontSize: 9, letterSpacing: 1 }}>WAIT TIME</div>
                    <div style={{ color: "#ABD49E", fontSize: 12 }}>{p.waitTime || "—"}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
