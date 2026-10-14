// components/SuccessPopup.jsx
import Link from 'next/link';

export default function SuccessPopup({
  title = "Success!",
  message = "",
  primaryLabel = "Continue",
  primaryHref = "/",
  secondaryLabel,
  secondaryHref,
  onPrimary,
  onSecondary
}) {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      backgroundColor: "#151413", zIndex: 2000,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{ textAlign: "center", maxWidth: "340px", width: "100%" }}>
        <div style={{ fontSize: 48, marginBottom: 24 }}>✓</div>
        <h1 style={{ color: "#ABD49E", fontSize: 24, fontWeight: 700, marginBottom: 16 }}>{title}</h1>
        {message && <p style={{ color: "rgba(171,212,158,0.8)", fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>{message}</p>}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {onPrimary ? (
            <button onClick={onPrimary} style={{ width: "100%", height: 48, backgroundColor: "#ABD49E", color: "#151413", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", letterSpacing: 1 }}>
              {primaryLabel}
            </button>
          ) : (
            <Link href={primaryHref} style={{ display: "block", width: "100%", height: 48, backgroundColor: "#ABD49E", color: "#151413", fontWeight: 700, fontSize: 14, letterSpacing: 1, textDecoration: "none", lineHeight: "48px", textAlign: "center" }}>
              {primaryLabel}
            </Link>
          )}

          {(secondaryLabel || secondaryHref) && (
            onSecondary ? (
              <button onClick={onSecondary} style={{ width: "100%", height: 48, backgroundColor: "transparent", color: "#ABD49E", border: "1px solid #ABD49E", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                {secondaryLabel}
              </button>
            ) : (
              <Link href={secondaryHref || "/"} style={{ display: "block", width: "100%", height: 48, border: "1px solid #ABD49E", color: "#ABD49E", fontWeight: 600, fontSize: 14, textDecoration: "none", lineHeight: "48px", textAlign: "center" }}>
                {secondaryLabel}
              </Link>
            )
          )}
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 20, color: "rgba(171,212,158,0.4)", fontSize: 11 }}>
        Powered by Lucid Jungles
      </div>
    </div>
  );
}
