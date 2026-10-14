// components/Drawer.jsx
export default function Drawer({
  children,
  title = "Location",
  showList = false,
  onToggleList = () => {},
  thumbnail = null,
  showFilters = false,
  filterContent = null,
}) {
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#151413",
        height: showList ? "70vh" : "74px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        zIndex: 150,
        transition: "height 0.4s ease",
        border: "1px solid #ABD49E",
        borderBottom: "none",
      }}
    >
      {/* Handle header — always visible, 74px tall */}
      <div
        style={{
          position: "relative",
          flexShrink: 0,
          height: "74px",
          cursor: "pointer",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
        onClick={onToggleList}
      >
        {/* Up / down arrow indicator at top-centre */}
        <div
          style={{
            position: "absolute",
            top: 8,
            left: "50%",
            transform: "translateX(-50%)",
            color: "#ABD49E",
            fontSize: 10,
            lineHeight: 1,
            pointerEvents: "none",
          }}
        >
          {showList ? "▼" : "▲"}
        </div>

        {/* 16 px left gap */}
        <div style={{ width: 16, flexShrink: 0 }} />

        {/* Thumbnail square */}
        <div
          style={{
            width: 42,
            height: 42,
            flexShrink: 0,
            backgroundColor: "#151413",
            border: "1px solid #ABD49E",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {thumbnail ? (
            <img
              src={thumbnail}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="2" y="2" width="18" height="18" stroke="#ABD49E" strokeWidth="1.5"/>
              <path d="M7 14L11 10L15 14" stroke="#ABD49E" strokeWidth="1.5"/>
            </svg>
          )}
        </div>

        {/* Green label strip */}
        <div
          style={{
            flex: 1,
            height: 42,
            backgroundColor: "#ABD49E",
            display: "flex",
            alignItems: "center",
            paddingLeft: 16,
            paddingRight: 16,
          }}
        >
          <span
            style={{
              color: "#151413",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "CodeSaver, monospace",
              letterSpacing: 1,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </span>
          {showFilters && (
            <div
              style={{ marginLeft: "auto" }}
              onClick={(e) => e.stopPropagation()}
            >
              {filterContent}
            </div>
          )}
        </div>
      </div>

      {/* Scrollable content area (open state) */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          backgroundColor: "#151413",
          padding: showList ? "12px 15px 20px" : 0,
        }}
      >
        {showList && children}
      </div>
    </div>
  );
}

