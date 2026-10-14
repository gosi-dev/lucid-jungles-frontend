import { useEffect, useRef } from "react";

export default function Marquee({ children, speed = 35 }) {
  const holderRef = useRef(null);

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;
    // Clone marquee content for infinite scroll
    const marquee = holder.querySelector(".Marquee");
    if (marquee && marquee.children.length > 0) {
      const clone = marquee.cloneNode(true);
      Array.from(clone.children).forEach((child) => {
        marquee.appendChild(child.cloneNode(true));
      });
    }
  }, []);

  return (
    <div ref={holderRef} className="maq-hol w-full overflow-hidden">
      <div
        className="Marquee flex flex-row gap-0 text-xs md:text-2xl"
        style={{ animationDuration: `${speed}s` }}
      >
        {children}
      </div>
    </div>
  );
}
