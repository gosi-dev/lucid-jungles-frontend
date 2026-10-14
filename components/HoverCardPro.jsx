import { useState } from "react";

export default function HoverCardPro({
  className = "",
  hoverCardClassName = "",
  hoverCardContent,
  children,
  onHoverCardClick,
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`${className} relative`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      <div
        onClick={onHoverCardClick}
        className={`absolute ${hoverCardClassName} ${
          isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
        } transition-opacity duration-100`}
      >
        {hoverCardContent}
      </div>
    </div>
  );
}
