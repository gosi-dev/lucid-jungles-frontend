import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import NavBar from "../components/NavBar";
import AnimatedPage from "../components/AnimatedPage";

function useCounter(targetSeconds) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setCount((c) => {
        if (c >= 100) { clearInterval(interval); return 100; }
        return c + Math.ceil(100 / (targetSeconds * 20));
      });
    }, 50);
    return () => clearInterval(interval);
  }, [targetSeconds]);
  return Math.min(count, 100);
}

export default function MOJ() {
  const router = useRouter();
  const progress = useCounter(3);
  const [camryParking, setCamryParking] = useState(false);
  const camryTriggered = useRef(false);
  const golfAnimRef = useRef(null);
  const camryTurnAnimRef = useRef(null);

  useEffect(() => {
    const randomizeGolf = () => {
      const anim = golfAnimRef.current;
      if (!anim) return;
      if (Math.random() < 0.5) {
        anim.setAttribute('path', 'M1270,-60 L1270,910 Q1270,940 1330,940 L1800,940');
        anim.setAttribute('dur', '20s');
      } else {
        anim.setAttribute('path', 'M1270,-60 L1270,870 Q1270,895 1210,895 L-80,895');
        anim.setAttribute('dur', '25s');
      }
    };
    const randomizeCamry = () => {
      const anim = camryTurnAnimRef.current;
      if (!anim) return;
      if (Math.random() < 0.6) {
        anim.setAttribute('path', 'M1800,895 L1370,895 Q1314,895 1314,839 L1314,-60');
      } else {
        anim.setAttribute('path', 'M1800,895 L-80,895');
      }
    };
    randomizeGolf();
    randomizeCamry();
    const ga = golfAnimRef.current;
    const ca = camryTurnAnimRef.current;
    ga?.addEventListener('repeatEvent', randomizeGolf);
    ca?.addEventListener('repeatEvent', randomizeCamry);
    return () => {
      ga?.removeEventListener('repeatEvent', randomizeGolf);
      ca?.removeEventListener('repeatEvent', randomizeCamry);
    };
  }, []);

  return (
    <AnimatedPage>
      <Head>
        <title>MOJ — Lucid Jungles</title>
      </Head>
      <main
        className="relative w-[100dvw] h-[100dvh] font-CodeSaver overflow-hidden bg-[#151413]"
        onClick={() => {
          if (progress >= 100 && !camryTriggered.current) {
            camryTriggered.current = true;
            setCamryParking(true);
          }
        }}
      >
        {/* Green border frame matching Figma design */}
        <section className="absolute inset-0 z-30 pointer-events-none p-[3px]">
          <div className="w-full h-full border-[6px] border-[#ABD49E]" />
        </section>

        <NavBar audioControls={false} theme="moj" />

        {/* MOJ Frame base illustration + animated assets */}
        <div className="absolute inset-0">
          <img
            src="/MOJ Frame 4.svg"
            alt="Ministry of Jungle"
            className="w-full h-full object-cover"
            draggable={false}
          />
          {/* Animated assets overlay — Z-ORDER: Humans → Parked Cars → Road Vehicles */}
          <svg
            viewBox="0 0 1708 1097"
            className="absolute inset-0 w-full h-full pointer-events-none"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              {/* Walkable outdoor zones — humans outside these vanish (under roof) */}
              <clipPath id="outdoor">
                <rect x="506" y="336" width="220" height="126" />
                <rect x="854" y="336" width="221" height="126" />
                <rect x="506" y="462" width="114" height="68" />
                <rect x="535" y="618" width="85" height="144" />
                <rect x="952" y="462" width="94" height="298" />
                <rect x="668" y="702" width="222" height="60" />
              </clipPath>
              {/* Road visible zone — hides vehicles behind tree canopies */}
              <clipPath id="road-visible">
                {/* Full viewport */}
                <rect x="0" y="0" width="1708" height="1097" />
              </clipPath>
              {/* Tree overlay masks — vehicles disappear behind these */}
              <mask id="tree-mask">
                <rect x="0" y="0" width="1708" height="1097" fill="white" />
                {/* Left trees near H-road (x=443-530 y=798-901) */}
                <ellipse cx="490" cy="845" rx="55" ry="50" fill="black" />
                {/* Mid-left trees near H-road (x=560-635 y=810-865) */}
                <ellipse cx="595" cy="838" rx="40" ry="32" fill="black" />
                {/* Center-left trees (x=630-690 y=798-865) */}
                <ellipse cx="660" cy="835" rx="35" ry="35" fill="black" />
                {/* Right trees near intersection (x=1316-1467 y=758-890) */}
                <ellipse cx="1390" cy="825" rx="80" ry="65" fill="black" />
                {/* Center-right tree near road (x=875-922 y=814-872) */}
                <ellipse cx="900" cy="843" rx="30" ry="30" fill="black" />
                {/* Far-right trees near V-road (x=1176-1221 y=806-872) */}
                <ellipse cx="1195" cy="845" rx="35" ry="30" fill="black" />
                {/* Bottom-left road trees (x=80-205 y=957-1093) */}
                <ellipse cx="145" cy="1020" rx="75" ry="70" fill="black" />
                {/* Bottom trees (x=226-412 y=950-1050) */}
                <ellipse cx="330" cy="995" rx="55" ry="45" fill="black" />
                {/* Bottom center-left trees (x=405-556 y=969-1091) */}
                <ellipse cx="480" cy="1030" rx="80" ry="60" fill="black" />
                {/* Bottom center trees (x=556-675 y=938-1038) */}
                <ellipse cx="620" cy="980" rx="55" ry="45" fill="black" />
                {/* Bottom large tree cluster (x=663-887 y=927-1076) */}
                <ellipse cx="770" cy="990" rx="75" ry="60" fill="black" />
                {/* Bottom right trees (x=856-1061 y=934-1073) */}
                <ellipse cx="950" cy="1000" rx="70" ry="55" fill="black" />
                {/* Bottom far-right trees (x=1108-1226 y=957-1097) */}
                <ellipse cx="1165" cy="1030" rx="65" ry="55" fill="black" />
                {/* Bottom V-road trees (x=1225-1311 y=965-1055) */}
                <ellipse cx="1265" cy="1010" rx="45" ry="40" fill="black" />
                {/* Compound fence-side trees left (x=676-806 y=795-840) */}
                <ellipse cx="740" cy="815" rx="40" ry="22" fill="black" />
                {/* Compound fence-side trees right (x=831-887 y=795-840) */}
                <ellipse cx="858" cy="815" rx="30" ry="22" fill="black" />
                {/* Compound fence bottom-left row (x=509-665 y=763-825) */}
                <ellipse cx="587" cy="795" rx="80" ry="32" fill="black" />
                {/* Compound fence bottom-right row (x=893-1071 y=771-834) */}
                <ellipse cx="980" cy="800" rx="92" ry="35" fill="black" />
                {/* Bottom-right large tree cluster near road (x=734-887 y=944-1076) */}
                <ellipse cx="800" cy="1010" rx="80" ry="70" fill="black" />
                {/* Far-bottom-right trees (x=856-998 y=934-1062) */}
                <ellipse cx="920" cy="985" rx="60" ry="55" fill="black" />
                {/* Bottom-right road edge trees (x=1041-1226 y=957-1097) */}
                <ellipse cx="1130" cy="1020" rx="70" ry="60" fill="black" />
              </mask>
            </defs>

            {/* ——— HUMANS clipped to outdoor zones (vanish when entering buildings) ——— */}
            <g clipPath="url(#outdoor)">

              {/* H1-2: Left parking — walk ABOVE cars (y<350) toward entrance then vanish */}
              <g>
                <animateMotion dur="24s" repeatCount="indefinite" path="M640,345 L680,342 L720,340 L720,310 L720,340 L680,342 L640,345" />
                <image href="/Human.svg" x="-6" y="-7" width="11" height="13" />
              </g>
              <g>
                <animateMotion dur="28s" repeatCount="indefinite" begin="-8s" path="M520,348 L620,345 L710,340 L710,300 L710,340 L620,345 L520,348" />
                <image href="/Human.svg" x="-6" y="-7" width="11" height="13" />
              </g>

              {/* H3-4: Left parking — patrol BELOW cars (y>415) */}
              <g>
                <animateMotion dur="16s" repeatCount="indefinite" begin="-6s" path="M515,425 L580,420 L650,428 L580,420 L515,425" />
                <image href="/Human.svg" x="-6" y="-7" width="11" height="13" />
              </g>
              <g>
                <animateMotion dur="20s" repeatCount="indefinite" begin="-1s" path="M630,440 L680,435 L720,442 L680,435 L630,440" />
                <image href="/Human.svg" x="-6" y="-7" width="11" height="13" />
              </g>

              {/* H5-6: Right parking — walk ABOVE cars (y<350) toward entrance then vanish */}
              <g>
                <animateMotion dur="26s" repeatCount="indefinite" begin="-4s" path="M970,348 L910,345 L860,340 L860,310 L860,340 L910,345 L970,348" />
                <image href="/Human.svg" x="-6" y="-7" width="11" height="13" />
              </g>
              <g>
                <animateMotion dur="22s" repeatCount="indefinite" begin="-12s" path="M1065,348 L970,345 L870,340 L870,300 L870,340 L970,345 L1065,348" />
                <image href="/Human.svg" x="-6" y="-7" width="11" height="13" />
              </g>

              {/* H7-8: Right parking — patrol BELOW cars (y>415) */}
              <g>
                <animateMotion dur="21s" repeatCount="indefinite" begin="-8s" path="M860,420 L930,418 L1000,425 L930,418 L860,420" />
                <image href="/Human.svg" x="-6" y="-7" width="11" height="13" />
              </g>
              <g>
                <animateMotion dur="15s" repeatCount="indefinite" begin="-4s" path="M965,435 L1020,430 L1065,438 L1020,430 L965,435" />
                <image href="/Human.svg" x="-6" y="-7" width="11" height="13" />
              </g>

              {/* H9-11: Left corridor (x=510-615, y=470-525) */}
              <g>
                <animateMotion dur="24s" repeatCount="indefinite" path="M515,475 L560,490 L610,480 L560,490 L515,475" />
                <image href="/Human.svg" x="-6" y="-7" width="11" height="13" />
              </g>
              <g>
                <animateMotion dur="20s" repeatCount="indefinite" begin="-7s" path="M520,495 L570,510 L610,500 L570,510 L520,495" />
                <image href="/Human.svg" x="-6" y="-7" width="11" height="13" />
              </g>
              <g>
                <animateMotion dur="26s" repeatCount="indefinite" begin="-3s" path="M540,485 L590,475 L610,490 L590,475 L540,485" />
                <image href="/Human.svg" x="-6" y="-7" width="11" height="13" />
              </g>

              {/* H12-13: Right corridor (x=955-1040, y=470-750) */}
              <g>
                <animateMotion dur="30s" repeatCount="indefinite" begin="-2s" path="M965,480 L1010,520 L1040,590 L1010,650 L965,720 L1010,650 L1040,590 L1010,520 L965,480" />
                <image href="/Human.svg" x="-6" y="-7" width="11" height="13" />
              </g>
              <g>
                <animateMotion dur="28s" repeatCount="indefinite" begin="-9s" path="M1040,490 L1000,560 L970,640 L1000,560 L1040,490" />
                <image href="/Human.svg" x="-6" y="-7" width="11" height="13" />
              </g>

              {/* H14-15: Bottom walkway (x=670-885, y=705-755) */}
              <g>
                <animateMotion dur="32s" repeatCount="indefinite" path="M675,720 L740,725 L810,718 L880,724 L810,718 L740,725 L675,720" />
                <image href="/Human.svg" x="-6" y="-7" width="11" height="13" />
              </g>
              <g>
                <animateMotion dur="25s" repeatCount="indefinite" begin="-6s" path="M880,735 L810,740 L740,733 L670,738 L740,733 L810,740 L880,735" />
                <image href="/Human.svg" x="-6" y="-7" width="11" height="13" />
              </g>

              {/* H16: Left lower corridor (x=540-615, y=625-755) */}
              <g>
                <animateMotion dur="28s" repeatCount="indefinite" begin="-5s" path="M545,635 L580,680 L610,730 L580,680 L545,635" />
                <image href="/Human.svg" x="-6" y="-7" width="11" height="13" />
              </g>

            </g>

            {/* ——— 3 CAMRY OVERLAYS replacing 3 of the baked-in Golfs ——— */}
            <image href="/Camry.svg" x="562" y="355" width="23" height="49" />
            <image href="/Camry.svg" x="689" y="355" width="23" height="49" />
            <image href="/Camry.svg" x="927" y="355" width="23" height="49" />

            {/* ——— 2 GOLF PARKED next to Camrys ——— */}
            <image href="/Golf.svg" x="588" y="358" width="25" height="43" />
            <image href="/Golf.svg" x="897" y="358" width="25" height="43" />

            {/* ——— CAMRY DRIVES IN AND PARKS (triggered by click after loading) ——— */}
            {camryParking && (
              <g>
                <animateMotion
                  dur="6s"
                  fill="freeze"
                  repeatCount="1"
                  rotate="auto"
                  path="M790,958 L790,928 Q790,880 790,840 L790,780 Q790,750 790,720 L790,460 L790,390 L660,370"
                />
                <g transform="rotate(90)">
                  <image href="/Camry.svg" x="-12" y="-25" width="23" height="49" />
                </g>
              </g>
            )}

            {/* ——— VEHICLES ON ROAD — masked behind trees ——— */}
            <g mask="url(#tree-mask)">

              {/* Danfo ← LEFT, upper lane y=895 (sole occupant, 32px tall) */}
              <g>
                <animateMotion dur="20s" repeatCount="indefinite" path="M1800,895 L-80,895" />
                <g transform="rotate(-90)"><image href="/Danfo.svg" x="-16" y="-32" width="32" height="64" /></g>
              </g>

              {/* Okada → RIGHT, lower lane y=933 (14px tall) */}
              <g>
                <animateMotion dur="12s" repeatCount="indefinite" begin="-4s" path="M-30,933 L1800,933" />
                <g transform="rotate(90)"><image href="/Okada.svg" x="-7" y="-12" width="14" height="23" /></g>
              </g>

              {/* Keke Napep → RIGHT, lower lane y=951 (13px tall) */}
              <g>
                <animateMotion dur="18s" repeatCount="indefinite" begin="-8s" path="M-50,951 L1800,951" />
                <g transform="rotate(180)"><image href="/Keke Napep.svg" x="-17" y="-7" width="34" height="13" /></g>
              </g>

              {/* Camry → RIGHT, lower lane y=968 (23px tall) */}
              <g>
                <animateMotion dur="20s" repeatCount="indefinite" begin="-7s" path="M-60,968 L1800,968" />
                <g transform="rotate(90)"><image href="/Camry.svg" x="-12" y="-25" width="23" height="49" /></g>
              </g>

              {/* Golf ↓ DOWN vertical road then turns RIGHT 50% / LEFT 50% (re-randomized each cycle via repeatEvent) */}
              <g>
                <animateMotion ref={golfAnimRef} dur="20s" repeatCount="indefinite" rotate="auto"
                  path="M1270,-60 L1270,910 Q1270,940 1330,940 L1800,940" />
                <g transform="rotate(90)"><image href="/Golf.svg" x="-13" y="-22" width="25" height="43" /></g>
              </g>

              {/* Camry ← LEFT then turns UP 60% / goes straight 40% (re-randomized each cycle via repeatEvent) */}
              <g>
                <animateMotion ref={camryTurnAnimRef} dur="20s" repeatCount="indefinite" begin="-10s" rotate="auto"
                  path="M1800,895 L1370,895 Q1314,895 1314,839 L1314,-60" />
                <g transform="rotate(90)"><image href="/Camry.svg" x="-12" y="-25" width="23" height="49" /></g>
              </g>

            </g>
          </svg>
        </div>

        {/* Bottom action bar */}
        <div className="absolute z-[31] bottom-14 left-0 w-[99dvw] h-9 md:h-14 mx-2 px-4 md:px-6 flex flex-row items-center justify-between">
          <Link
            href="/"
            className="h-full w-max px-4 md:px-6 bg-[#151413] hover:bg-[#ABD49E] flex items-center transition-all ease-in-out duration-300 justify-center font-semibold text-[#ABD49E] hover:text-[#151413] text-xs md:text-lg border-[1.5px] border-[#ABD49E] hover:border-[#151413]"
          >
            BACK TO MAP
          </Link>
          <div className="relative h-full">
            <aside
              className={`transition-all ease-in-out duration-500 absolute top-0 right-0 w-max md:w-[450px] text-xs md:text-lg ${
                progress >= 100
                  ? "opacity-0 pointer-events-none"
                  : "opacity-100 pointer-events-auto"
              } h-full border-[1.5px] bg-[#151413] border-[#ABD49E] flex flex-row items-center justify-between gap-3 px-4 md:px-6 text-[#ABD49E] font-semibold`}
            >
              <span
                className="transition-all ease-in-out duration-150 absolute top-0 left-0 h-full bg-[#ABD49E]"
                style={{ width: `${progress}%` }}
              />
              <p className="relative z-40">LOADING EXPERIENCE</p>
              <p className="relative z-40 text-[#151413] flex flex-row items-center gap-1">
                {progress} %
              </p>
            </aside>
            <aside
              onClick={() => router.push("/immersive")}
              className={`transition-all ease-in-out duration-500 absolute top-0 right-0 w-max md:w-[300px] ${
                progress >= 100
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none"
              } text-xs md:text-lg h-full border-[1.5px] hover:bg-[#151413] bg-[#ABD49E] hover:border-[#ABD49E] border-[#151413] flex flex-row items-center justify-center gap-3 px-4 md:px-6 hover:text-[#ABD49E] text-[#151413] font-semibold cursor-pointer`}
            >
              <p className="relative z-40">ENTER EXPERIENCE</p>
            </aside>
          </div>
        </div>
      </main>
    </AnimatedPage>
  );
}
