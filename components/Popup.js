// components/Popup.js
import { useRouter } from 'next/router';

export default function Popup({ children, onClose, closeHref }) {
  const router = useRouter();

  const handleClose = () => {
    if (onClose) { onClose(); return; }
    if (closeHref) { router.push(closeHref); return; }
    router.back();
  };

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
        backgroundColor: "rgba(0,0,0,0.75)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#151413", border: "1px solid #ABD49E",
          padding: "24px", maxWidth: "90%", width: "400px",
          maxHeight: "85vh", overflowY: "auto", position: "relative",
        }}
      >
        <button
          onClick={handleClose}
          style={{ position: "absolute", top: 12, left: 12, background: "none", border: "none", color: "#ABD49E", cursor: "pointer", fontSize: 18 }}
        >
          ←
        </button>
        <div style={{ paddingTop: "16px" }}>{children}</div>
      </div>
    </div>
  );
}
