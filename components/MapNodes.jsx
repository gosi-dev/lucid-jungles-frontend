import { useState, memo } from "react";
import { useRouter } from "next/router";
import { FaCaretRight } from "react-icons/fa";
import HoverCardPro from "./HoverCardPro";

/* ─── DojoNode (Landing / Kura — navigates to /dojo) ─── */
export function DojoNode({ data }) {
  const router = useRouter();
  const [showPopup, setShowPopup] = useState(false);
  return (
    <div
      className="relative cursor-pointer w-[220px] h-[200px]"
      onClick={() => setShowPopup((v) => !v)}
    >
      {/* Building placeholder — swap for a real Dojo SVG/PNG when available */}
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#151413] border-2 border-[#ABD49E]">
        <span className="text-[#ABD49E] text-4xl mb-2">⛩</span>
        <p className="text-[#ABD49E] font-bold text-sm tracking-widest">THE DOJO</p>
      </div>

      {/* Popup card */}
      <div
        className={`${
          showPopup ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        } absolute cursor-default w-[280px] h-max flex flex-col gap-1 transition-opacity duration-100`}
        style={{ bottom: "105%", right: "0", zIndex: 9999 }}
        onClick={(e) => e.stopPropagation()}
      >
        <aside className="w-full flex flex-row items-start justify-start">
          <div className="w-full flex flex-col border-[2px] border-primary">
            <h2 className="w-full h-10 flex items-center justify-start px-4 bg-secondary text-primary text-base uppercase">
              Bonzo's Dojo
            </h2>
            <div className="w-full bg-[#151413] flex items-center justify-center text-[#ABD49E] text-xs px-4 py-4 text-center leading-relaxed">
              A private fitness Fanbase. Join to get your AI weekly programme and track your body shape journey.
            </div>
          </div>
        </aside>
        <h2
          className="w-full h-12 cursor-pointer flex items-center justify-between px-4 bg-primary text-secondary border-[2px] border-secondary text-base"
          onClick={() => router.push("/dojo")}
        >
          ENTER DOJO <FaCaretRight size={18} />
        </h2>
      </div>
    </div>
  );
}

/* ─── KuraNode (Landing → /kura) ─── */
export function KuraNode({ data, selected }) {
  const router = useRouter();
  return (
    <HoverCardPro
      className=""
      hoverCardContent={
        <div className="w-max h-12 p-0.5 bg-primary flex flex-row items-center gap-1">
          <p className="h-full px-4 flex items-center justify-center text-primary bg-secondary">
            YOUR KURA
          </p>
          <p
            className="h-full flex flex-row items-center gap-4 text-secondary border-[1.5px] border-secondary px-4 cursor-pointer"
            onClick={() => router.push("/kura")}
          >
            ENTER HOME <FaCaretRight size={18} />
          </p>
        </div>
      }
      hoverCardClassName="!z-[999] cursor-pointer text-xl text-primary -top-[20%] left-[80%] bg-secondary"
      onHoverCardClick={() => null}
    >
      <div
        className={`cursor-pointer transition-all duration-200 w-[100px] h-[100px] ${
          selected
            ? "border-[#151413] bg-[#FFF212]"
            : "border-[#FFF212] bg-[#FFF212] hover:border-gray-400"
        }`}
        onClick={data?.onClick}
      >
        <img src="/Kura.svg" alt="KURA" className="w-full h-full" />
      </div>
    </HoverCardPro>
  );
}

/* ─── MojNode (Landing — clickable with popup) ─── */
export function MojNode({ data }) {
  const router = useRouter();
  const [showPopup, setShowPopup] = useState(false);
  return (
    <div
      className="relative cursor-pointer w-[500px] h-[400px]"
      onClick={() => setShowPopup((v) => !v)}
    >
      <img src="/assets/building/MOJ-HOME.png" alt="Structure" className="w-full h-full" />
      <div
        className={`${
          showPopup ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        } absolute cursor-default w-[320px] h-max flex flex-col gap-1 transition-opacity duration-100`}
        style={{ bottom: "100%", right: "0", zIndex: 9999 }}
      >
        <aside className="w-full flex flex-row items-start justify-start">
          <div className="aspect-[4/3] flex flex-col border-[2px] border-primary">
            <h2 className="w-full h-12 flex items-center justify-start px-4 bg-secondary text-primary text-xl uppercase !text-center">
              Old Secretariat
            </h2>
            <div className="w-full h-full bg-primary flex items-center justify-center text-secondary text-center">
              <img src="/cathedral.png" alt="Old-Secretariat" className="w-full h-full object-cover" />
            </div>
          </div>
        </aside>
        <h2
          className="w-full h-12 cursor-pointer flex items-center justify-between px-4 bg-primary text-secondary border-[2px] border-secondary text-xl"
          onClick={(e) => { e.stopPropagation(); router.push("/moj"); }}
        >
          EXPLORE LOCATION <FaCaretRight size={18} />
        </h2>
      </div>
    </div>
  );
}

/* ─── MojNodeStatic (MOJ page — no popup) ─── */
export function MojNodeStatic({ data }) {
  return (
    <div className="relative cursor-pointer w-[500px] h-[400px]">
      <img src="/assets/building/MOJ-HOME.png" alt="Structure" className="w-full h-full" />
    </div>
  );
}

/* ─── CCStudiosNode (Landing — clickable with popup) ─── */
export function CCStudiosNode({ data }) {
  const [showPopup, setShowPopup] = useState(false);
  return (
    <div
      className="relative cursor-pointer w-[500px] h-[400px]"
      onClick={() => setShowPopup((v) => !v)}
    >
      <img src="/assets/building/CC-Studios.png" alt="CC Studios" className="w-full h-full object-contain" />
      <div
        className={`${
          showPopup ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        } absolute cursor-default w-[320px] h-max flex flex-col gap-1 transition-opacity duration-100`}
        style={{ bottom: "100%", right: "0", zIndex: 9999 }}
      >
        <aside className="w-full flex flex-row items-start justify-start">
          <div className="aspect-[4/3] flex flex-col border-[2px] border-primary">
            <h2 className="w-full h-12 flex items-center justify-start px-4 bg-secondary text-primary text-xl uppercase !text-center">
              Cappuccino Studiox
            </h2>
            <div className="w-full h-full bg-primary flex items-center justify-center text-secondary text-center">
              <img src="/CC-Studios-popup.png" alt="Cappuccino-Studiox" className="w-full h-full object-cover" />
            </div>
          </div>
        </aside>
        <h2
          className="w-full h-12 cursor-pointer flex items-center justify-between px-4 bg-primary text-secondary border-[2px] border-secondary text-xl"
          onClick={(e) => { e.stopPropagation(); window.location.href = "/cappuccinostudiox/index.html"; }}
        >
          EXPLORE LOCATION <FaCaretRight size={18} />
        </h2>
      </div>
    </div>
  );
}

/* ─── Home (furniture/desk node in Kura personal space) ─── */
export function HomeNode({ data }) {
  return (
    <div className="relative w-[150px] h-[150px] p-2 flex flex-col items-center justify-start gap-2">
      <HoverCardPro
        className=""
        hoverCardContent={<p className="flex flex-row items-center gap-2 px-4 h-full">KURA <FaCaretRight size={6} /></p>}
        hoverCardClassName="z-50 h-[22px] w-[52px] cursor-pointer text-[8px] flex items-center justify-center text-primary hover:text-white top-[-20%] left-[80%] p-2 bg-secondary hover:bg-primary border border-primary hover:border-white"
        onHoverCardClick={() => null}
      >
        <div className="cursor-pointer transition-all duration-200 w-[35px] h-[35px]">
          <img src="/Your-Kura.svg" alt="KURA" className="w-full h-full" />
        </div>
      </HoverCardPro>
      <HoverCardPro
        className=""
        hoverCardContent={<p className="w-max whitespace-nowrap flex flex-row items-center gap-2 px-4 h-full">DREAM DESK <FaCaretRight size={6} /></p>}
        hoverCardClassName="z-50 h-[28px] w-[85px] cursor-pointer text-[9px] flex items-center justify-center text-primary hover:text-white top-[-20%] left-[80%] p-2 bg-secondary hover:bg-primary border border-primary hover:border-white"
        onHoverCardClick={() => null}
      >
        <div className="cursor-pointer transition-all duration-200 w-[75px] h-auto">
          <img src="/assets/Table-and-chair.svg" alt="KURA" className="w-full h-full" />
        </div>
      </HoverCardPro>
      <HoverCardPro
        className="!absolute bottom-0 right-0"
        hoverCardContent={<p className="flex flex-row items-center gap-2 px-4 h-full">RADIO <FaCaretRight size={6} /></p>}
        hoverCardClassName="z-50 h-[25px] w-[60px] cursor-pointer text-[9px] flex items-center justify-center text-primary hover:text-white top-[-25%] left-[65%] p-2 bg-secondary hover:bg-primary border border-primary hover:border-white"
        onHoverCardClick={() => null}
      >
        <div className="self-end cursor-pointer transition-all duration-200 w-[40px] h-[40px] pb-2">
          <img src="/RadioOnRock.svg" alt="KURA" className="w-full h-full" />
        </div>
      </HoverCardPro>
    </div>
  );
}

/* ─── Bonzo (with speech bubble, used in Kura/Mapframe) ─── */
export function BonzoNode({ data, selected }) {
  return (
    <HoverCardPro
      className=""
      hoverCardContent={
        <div className="w-max h-12 p-0.5 bg-primary flex flex-row items-center gap-1">
          <p className="h-full px-4 flex items-center justify-center text-primary bg-secondary">BONZO</p>
          <p className="h-full flex flex-row items-center gap-4 text-secondary border-[1.5px] border-secondary px-4">VISIT FRIEND <FaCaretRight size={18} /></p>
        </div>
      }
      hoverCardClassName="!z-[999] cursor-pointer text-sm md:text-xl text-primary -top-[20%] left-[80%] bg-secondary"
      onHoverCardClick={() => null}
    >
      <div className={`cursor-pointer transition-all duration-200 w-[100px] h-[100px] ${selected ? "border-[#151413] bg-[#FFF212]" : "border-[#FFF212] bg-[#FFF212] hover:border-gray-400"}`}>
        <img src="/Bonzo.svg" alt="KURA" className="w-full h-full" />
        <aside className="absolute !z-[999] -top-2 left-[110%] max-w-[500px] cursor-pointer text-xl text-primary text-center w-max bg-primary p-0.5 border border-secondary">
          <p className="w-full h-full py-3 px-6 flex items-center justify-center bg-secondary">
            HAHA! THANKS BRO! ITS CAPPUCCINO CREME CHECK YOUR MAP, I JUST SHARED THEIR JUNGLE LOCATION WITH YOU.
          </p>
        </aside>
      </div>
    </HoverCardPro>
  );
}

/* ─── BonzoNode2 (simpler, used on Landing) ─── */
export function BonzoNode2({ data }) {
  return (
    <HoverCardPro
      className=""
      hoverCardContent={
        <div className="w-max h-12 p-0.5 bg-primary flex flex-row items-center gap-1">
          <p className="h-full px-4 flex items-center justify-center text-primary bg-secondary">BONZO</p>
          <p className="h-full flex flex-row items-center gap-4 text-secondary border-[1.5px] border-secondary px-4">VISIT FRIEND <FaCaretRight size={18} /></p>
        </div>
      }
      hoverCardClassName="!z-[999] cursor-pointer text-xl text-primary -top-[20%] left-[80%] bg-secondary"
      onHoverCardClick={() => null}
    >
      <div className="cursor-pointer transition-all duration-200 w-[100px] h-[100px]">
        <img src="/Bonzo.svg" alt="KURA" className="w-full h-full" />
      </div>
    </HoverCardPro>
  );
}

/* ─── Mide (About page map — friend with speech bubble) ─── */
export function MideNode({ data, selected }) {
  return (
    <>
      <HoverCardPro
        className=""
        hoverCardContent={
          <div className="w-max h-12 p-0.5 bg-primary flex flex-row items-center gap-1">
            <p className="h-full px-4 flex items-center justify-center text-primary bg-secondary">YOU</p>
            <p className="h-full flex flex-row items-center gap-4 text-secondary border-[1.5px] border-secondary px-4">ENTER HOME <FaCaretRight size={18} /></p>
          </div>
        }
        hoverCardClassName="!z-[999] cursor-pointer text-xl text-primary -bottom-[20%] left-[80%] bg-secondary"
        onHoverCardClick={() => null}
      >
        <div className={`cursor-pointer transition-all duration-200 w-[100px] h-[100px] ${selected ? "border-[#151413] bg-[#FFF212]" : "border-[#FFF212] bg-[#FFF212] hover:border-gray-400"}`}>
          <img src="/Mide.png" alt="KURA" className="w-full h-full" />
          <aside className="absolute !z-[999] -top-2 right-[110%] max-w-[500px] cursor-pointer text-xl text-secondary text-center w-max bg-secondary p-0.5 border border-primary">
            <p className="w-full h-full py-3 px-6 flex items-center justify-center bg-primary">
              YO BONZO! WHERE YOU BE GETTING YOUR CLOTHES? THEY GOT A STORE ON HERE? BEEN SCROLLING THROUGH YOUR FIT CHECKS AND I LIKE WHAT I SEE
            </p>
          </aside>
        </div>
      </HoverCardPro>
    </>
  );
}

/* ─── CustomMapNode (generic yellow box) ─── */
export function CustomMapNode({ data, selected }) {
  return (
    <div
      className={`relative !z-[1001] px-2 py-2 shadow-md border-2 cursor-pointer transition-all duration-200 w-[100px] h-[100px] ${
        selected ? "border-[#151413] bg-[#FFF212]" : "border-[#FFF212] bg-[#FFF212] hover:border-gray-400"
      }`}
      onClick={data?.onClick}
    >
      <div className="flex items-center">
        <div className="ml-2">
          <div className="text-sm font-bold text-[#151413]">{data?.title}</div>
          <div className="text-gray-500 text-xs">{data?.description}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── CustomMapNodeAbout (About/Mapframe — Cappuccino Studios card) ─── */
export function CustomMapNodeAbout({ data }) {
  return (
    <div className="relative z-50 w-[320px] h-max flex flex-col gap-1 cursor-pointer" onClick={data?.onClick}>
      <aside className="w-full flex flex-row items-start justify-start">
        <div className="aspect-[4/3] flex flex-col border-[2px] border-primary">
          <h2 className="w-full h-12 flex items-center justify-start px-4 bg-secondary text-primary text-xl">CAPPUCCINO STUDIOS</h2>
          <div className="w-full h-full bg-primary flex items-center justify-center text-secondary text-center">
            <img src="/lobby-cat.png" alt="cathedral" className="w-full h-full object-cover" />
          </div>
        </div>
      </aside>
      <h2 className="w-full h-12 flex items-center justify-between px-4 bg-primary text-secondary border-[2px] border-secondary text-xl">
        EXPLORE LOCATION <FaCaretRight size={18} />
      </h2>
    </div>
  );
}

/* ─── Tree Nodes ─── */
export function TreeNode({ data }) {
  return (
    <div className={`relative !z-10 w-[250px] h-[250px] ${data?.className || ""}`}>
      <img src="/assets/shrubs/Tree-1.svg" alt="FLORA" className={`w-full h-full ${data?.className || ""}`} />
    </div>
  );
}
export function TreeNode2({ data }) {
  return (
    <div className={`relative !z-10 w-[250px] h-[250px] ${data?.className || ""}`}>
      <img src="/assets/shrubs/Tree-2.svg" alt="FLORA" className={`w-full h-full ${data?.className || ""}`} />
    </div>
  );
}
export function TreeNode3({ data }) {
  return (
    <div className={`relative !z-10 w-[300px] h-[300px] ${data?.className || ""}`}>
      <img src="/assets/shrubs/Tree-2.svg" alt="FLORA" className={`w-full h-full ${data?.className || ""}`} />
    </div>
  );
}
export function TreeNode13({ data }) {
  return (
    <div className={`relative !z-10 w-[250px] h-[250px] ${data?.className || ""}`}>
      <img src="/assets/shrubs/Tree%2013.svg" alt="FLORA" className={`w-full h-full ${data?.className || ""}`} />
    </div>
  );
}
export function TreeNode33({ data }) {
  return (
    <div className={`relative !z-10 w-[250px] h-[250px] ${data?.className || ""}`}>
      <img src="/assets/shrubs/Tree%2033.svg" alt="FLORA" className={`w-full h-full ${data?.className || ""}`} />
    </div>
  );
}
export function TreeNode44({ data }) {
  return (
    <div className={`relative !z-10 w-[250px] h-[250px] ${data?.className || ""}`}>
      <img src="/assets/shrubs/Tree%2044.svg" alt="FLORA" className={`w-full h-full ${data?.className || ""}`} />
    </div>
  );
}
export function SmallTreeNode({ data }) {
  return (
    <div className={`relative !z-10 w-[45px] h-[45px] ${data?.className || ""}`}>
      <img src="/assets/shrubs/Small-Tree-1.svg" alt="FLORA" className={`w-full h-full ${data?.className || ""}`} />
    </div>
  );
}
export function SmallTreeNode2({ data }) {
  return (
    <div className={`relative !z-10 w-[45px] h-[45px] ${data?.className || ""}`}>
      <img src="/assets/shrubs/Small-Tree-2.svg" alt="FLORA" className={`w-full h-full ${data?.className || ""}`} />
    </div>
  );
}
export function SmallTreeNode3({ data }) {
  return (
    <div className={`relative !z-10 w-[45px] h-[45px] ${data?.className || ""}`}>
      <img src="/assets/shrubs/Small-Tree-3.svg" alt="FLORA" className={`w-full h-full ${data?.className || ""}`} />
    </div>
  );
}

/* ─── Rock Nodes ─── */
export function RockNode({ data }) {
  return (
    <div className={`relative !z-[1] w-[150px] h-[150px] ${data?.className || ""}`}>
      <img src="/Rock.svg" alt="FLORA" className="w-full h-full" />
    </div>
  );
}
export function RockNode2({ data }) {
  return (
    <div className={`relative !z-[1] w-[150px] h-[150px] ${data?.className || ""}`}>
      <img src="/Rock1.svg" alt="FLORA" className="w-full h-full" />
    </div>
  );
}

/* ─── BuildingNode ─── */
export function BuildingNode({ data }) {
  return (
    <div className="cursor-pointer w-[200px] h-[300px]">
      <img src="/assets/building/building-1.svg" alt="Structure" className="w-full h-full" />
    </div>
  );
}

/* ─── RoadNode ─── */
export function RoadNode({ data }) {
  return (
    <div className="relative !z-[5] duration-200 w-[1601px] h-[2000px]">
      <img src="/assets/roads/Road-1.svg" alt="ROAD" className="w-full h-full" />
    </div>
  );
}
