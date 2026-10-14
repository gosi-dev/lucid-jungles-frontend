// components/ProductsCard.jsx
// Layout: image LEFT (~38%) + info RIGHT, bottom row: price | WAIT TIME | value
// Matches design frame 10.
import Link from "next/link";

export default function ProductsCard({ product }) {
  const displayPrice = product.price === "0" ? "FREE" : (product.price || "—");
  const waitTime     = product.time || product.waitTime || "—";
  const description  = product.description || product.location || "";
  const discount     = product.discount || "";

  return (
    <div style={{ width: "100%", paddingInline: 16, marginBottom: 12 }}>
      <Link href={`/products/${product._id}`} style={{ display: "block", textDecoration: "none" }}>
        <div style={{ border: "1px solid rgba(171,212,158,0.3)", backgroundColor: "#1A1A1A" }}>

          {/* Top row: image left + info right */}
          <div style={{ display: "flex" }}>
            {/* Square image — ~38% width */}
            <div style={{ width: "38%", flexShrink: 0, aspectRatio: "1 / 1", background: "#151413", overflow: "hidden" }}>
              {product.image ? (
                <img src={product.image} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(171,212,158,0.04)" }}>
                  <span style={{ color: "rgba(171,212,158,0.2)", fontFamily: "monospace", fontSize: 10 }}>NO IMAGE</span>
                </div>
              )}
            </div>

            {/* Info right */}
            <div style={{ flex: 1, padding: "12px 12px 10px", display: "flex", flexDirection: "column", justifyContent: "flex-start", gap: 6 }}>
              <p style={{ color: "#ABD49E", fontFamily: "Averia Sans Libre, sans-serif", fontSize: 16, fontWeight: 700, lineHeight: 1.25 }}>
                {product.title}
              </p>
              {description && (
                <p style={{ color: "rgba(171,212,158,0.7)", fontFamily: "monospace", fontSize: 10, letterSpacing: "0.03em", lineHeight: 1.4 }}>
                  {description}
                </p>
              )}
              {discount && (
                <p style={{ color: "rgba(171,212,158,0.6)", fontFamily: "monospace", fontSize: 10, letterSpacing: "0.04em" }}>
                  {discount}
                </p>
              )}
            </div>
          </div>

          {/* Bottom row: price | WAIT TIME | value */}
          <div style={{ display: "flex", borderTop: "1px solid rgba(171,212,158,0.2)" }}>
            <div style={{ flex: 2, padding: "7px 10px", borderRight: "1px solid rgba(171,212,158,0.2)" }}>
              <span style={{ color: "#ABD49E", fontFamily: "monospace", fontSize: 10, letterSpacing: "0.04em" }}>
                {displayPrice}
              </span>
            </div>
            <div style={{ flex: 1, padding: "7px 6px", borderRight: "1px solid rgba(171,212,158,0.2)", textAlign: "center" }}>
              <span style={{ color: "rgba(171,212,158,0.55)", fontFamily: "monospace", fontSize: 9, letterSpacing: "0.04em" }}>
                WAIT TIME
              </span>
            </div>
            <div style={{ flex: 1, padding: "7px 6px", textAlign: "center" }}>
              <span style={{ color: "#ABD49E", fontFamily: "monospace", fontSize: 9, letterSpacing: "0.04em" }}>
                {waitTime}
              </span>
            </div>
          </div>

        </div>
      </Link>
    </div>
  );
}
