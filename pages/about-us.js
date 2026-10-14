import { useEffect, useRef, useMemo } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { motion, useAnimation } from "framer-motion";
import ReactFlow, { Background, useNodesState, useEdgesState } from "reactflow";
import "reactflow/dist/style.css";
import isMobile from "is-mobile";
import { v4 as uuidv4 } from "uuid";
import { FaCaretRight } from "react-icons/fa";
import NavBar from "../components/NavBar";
import AnimatedPage from "../components/AnimatedPage";
import HoverCardPro from "../components/HoverCardPro";
import {
  KuraNode,
  BonzoNode,
  MideNode,
  CustomMapNodeAbout,
  RoadNode,
  BuildingNode,
  TreeNode,
  TreeNode2,
  TreeNode3,
} from "../components/MapNodes";

const mapframeNodeTypes = {
  KuraNode,
  BonzoNode,
  MideNode,
  customMapNode: CustomMapNodeAbout,
  RoadNode,
  BuildingNode,
  TreeNode,
  TreeNode2,
  TreeNode3,
};

function Mapframe() {
  const rfInstance = useRef(null);
  const mobile = isMobile();

  const setCenter = (x, y, zoom = 1.2) => {
    const inst = rfInstance.current;
    if (inst) inst.setCenter(x, y, { zoom, duration: 1500 });
  };

  const initialNodes = useMemo(() => [
    { id: "111", type: "customMapNode", position: { x: 550, y: 270 }, draggable: false, data: { title: "Home Base", description: "Starting point", onClick: () => setCenter(-100, 800, 1.2) }, style: { zIndex: 10 } },
    { id: uuidv4(), type: "BuildingNode", position: { x: 820, y: 460 }, draggable: false, data: { title: "Home Base", description: "Starting point" }, style: { zIndex: 5 } },
    { id: uuidv4(), type: "BonzoNode", position: { x: -200, y: 300 }, draggable: false, data: { title: "Bonzo", description: "Starting point" }, style: { zIndex: 10 } },
    { id: "101", type: "MideNode", position: { x: 500, y: 100 }, draggable: false, data: { title: "Home Base", description: "Starting point", onClick: () => setCenter(600, 700, 1.2) }, style: { zIndex: 10 } },
    { id: "122", type: "TreeNode", position: { x: 200, y: -100 }, draggable: false, data: { title: "Shrub", description: "Lucid Flora" } },
    { id: "124", type: "TreeNode2", position: { x: -50, y: -100 }, draggable: false, data: { title: "Shrub", description: "Lucid Flora" } },
    { id: uuidv4(), type: "TreeNode", position: { x: 850, y: -120 }, draggable: false, data: { title: "Shrub", description: "Lucid Flora" } },
    { id: uuidv4(), type: "TreeNode2", position: { x: -580, y: -50 }, draggable: false, data: { title: "Shrub", description: "Lucid Flora" } },
    { id: uuidv4(), type: "TreeNode", position: { x: 650, y: 40 }, draggable: false, data: { title: "Shrub", description: "Lucid Flora" } },
    { id: uuidv4(), type: "TreeNode2", position: { x: 800, y: 200 }, draggable: false, data: { title: "Shrub", description: "Lucid Flora" } },
    { id: uuidv4(), type: "TreeNode", position: { x: 300, y: 150 }, draggable: false, data: { title: "Shrub", description: "Lucid Flora" } },
    { id: uuidv4(), type: "TreeNode2", position: { x: 480, y: 300 }, draggable: false, data: { title: "Shrub", description: "Lucid Flora" } },
    { id: uuidv4(), type: "TreeNode", position: { x: -410, y: 100 }, draggable: false, data: { title: "Shrub", description: "Lucid Flora" } },
    { id: uuidv4(), type: "TreeNode", position: { x: -530, y: 380 }, draggable: false, data: { title: "Shrub", description: "Lucid Flora" } },
    { id: uuidv4(), type: "TreeNode", position: { x: -290, y: 380 }, draggable: false, data: { title: "Shrub", description: "Lucid Flora" } },
    { id: uuidv4(), type: "TreeNode2", position: { x: -100, y: 250 }, draggable: false, data: { title: "Shrub", description: "Lucid Flora" } },
    { id: uuidv4(), type: "TreeNode", position: { x: 100, y: 380 }, draggable: false, data: { title: "Shrub", description: "Lucid Flora" } },
    { id: uuidv4(), type: "TreeNode3", position: { x: 300, y: 400 }, draggable: false, data: { title: "Shrub", description: "Lucid Flora" } },
    { id: uuidv4(), type: "TreeNode", position: { x: 1050, y: 300 }, draggable: false, data: { title: "Shrub", description: "Lucid Flora" } },
    { id: uuidv4(), type: "TreeNode", position: { x: 1050, y: 500 }, draggable: false, data: { title: "Shrub", description: "Lucid Flora" } },
    { id: uuidv4(), type: "TreeNode2", position: { x: -400, y: 600 }, draggable: false, data: { title: "Shrub", description: "Lucid Flora" } },
    { id: uuidv4(), type: "TreeNode2", position: { x: 120, y: 600 }, draggable: false, data: { title: "Shrub", description: "Lucid Flora" } },
    { id: uuidv4(), type: "TreeNode", position: { x: 520, y: 520 }, draggable: false, data: { title: "Shrub", description: "Lucid Flora" } },
  ], []);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState([]);

  const defaultViewport = useMemo(() => ({
    x: 0, y: -50, zoom: mobile ? 0.2 : 1,
  }), [mobile]);

  return (
    <div className="w-full aspect-[1625/1556] md:aspect-[1625/984] border-[2px] border-[#ABD49E]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={mapframeNodeTypes}
        defaultViewport={defaultViewport}
        proOptions={{ hideAttribution: true }}
        onInit={(instance) => { rfInstance.current = instance; }}
        translateExtent={[[-600, -300], [1200, 800]]}
        nodesDraggable={false}
        nodesConnectable={false}
        panOnDrag
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
      >
        <Background variant="lines" gap={100} size={1} color="#333" className="bg-[#151413]" />
      </ReactFlow>
    </div>
  );
}

export default function About() {
  const router = useRouter();
  const controls = useAnimation();

  useEffect(() => {
    const run = async () => {
      await controls.start({ clipPath: "inset(0% 0% 0% 0%)", transition: { duration: 2 } });
      await controls.start({ opacity: 0, pointerEvents: "none", transition: { delay: 1, duration: 1, ease: "easeOut" } });
    };
    run();
  }, [controls]);

  return (
    <AnimatedPage>
      <Head>
        <title>About Us — Lucid Jungles</title>
      </Head>

      {/* Logo overlay animation */}
      <motion.div
        className="fixed inset-0 z-[9999] bg-[#151413] flex items-center justify-center"
        initial={{ opacity: 1, clipPath: "inset(0% 50% 0% 50%)" }}
        animate={controls}
      >
        <img src="/assets/LOGO.svg" alt="Lucid Jungles" className="w-[200px]" />
      </motion.div>

      <div className="relative bg-[#151413] text-4xl text-[#ABD49E] font-CodeSaver pt-[120px] md:pt-[180px] lg:pt-[250px]">
        <div className="w-full px-[4vw] md:px-[2.75dvw]">
          <NavBar audioControls theme="moj" />

          {/* ABOUT US heading */}
          <h1 className="h-auto text-[18vw] mb-[40px] md:mb-[80px] lg:mb-[112px] text-center">ABOUT US</h1>

          {/* Intro text - two columns */}
          <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-[2vw] text-lg md:text-xl lg:text-2xl px-[20px] md:px-[50px] lg:px-[75px] py-6 md:py-8 lg:py-10 uppercase">
            <p className="w-full text-left">LUCID JUNGLES IS A SOCIAL GAMING NETWORK.</p>
            <p className="w-full text-right md:max-w-[650px]">
              It&apos;s a space to explore, create, and connect through interactive worlds, digital tools, and evolving stories.
            </p>
          </div>

          {/* Embedded Mapframe */}
          <Mapframe />

          {/* KURA section — MOBILE flow layout */}
          <section className="lg:hidden w-full mt-6 px-4 md:px-8 py-4 uppercase flex flex-col items-center gap-6">
            {/* Paragraph text */}
            <p className="text-lg md:text-xl w-full text-left">
              At the heart of the jungle is KṺRA, your evolving ai guide, designed to help you reconnect with yourself and form meaningful connections, as you explore dreamlike worlds and unlock real world thrills.
            </p>

            {/* Dream Log */}
            <HoverCardPro
              className="z-10 w-full h-[45px] md:h-[55px] text-sm md:text-base text-[#ABD49E] border-[1.5px] border-[#ABD49E] cursor-pointer flex items-center px-3"
              hoverCardContent={<p className="text-[#151413]">TRACK &amp; ANALYZE YOUR DREAMS</p>}
              hoverCardClassName="z-50 bg-[#ABD49E] text-[#151413] w-max pointer-events-none bottom-[100%] left-[50%] p-2"
            >
              <p>DREAM LOG: APRIL 21 - I HAD THAT DREAM AGAIN</p>
            </HoverCardPro>

            {/* GOAL 47% bar */}
            <div className="w-full h-[45px] md:h-[55px] flex flex-row items-center border-[1px] border-[#ABD49E]">
              <p className="h-full px-4 bg-[#ABD49E] text-[#151413] flex items-center text-sm md:text-base">GOAL</p>
              <p className="h-full flex-1 px-4 flex items-center justify-end text-sm md:text-base">47 %</p>
            </div>

            {/* KURA icon */}
            <HoverCardPro
              className=""
              hoverCardContent={
                <p className="flex flex-row items-center gap-1 px-1">
                  KURA <FaCaretRight size={18} />
                </p>
              }
              hoverCardClassName="z-50 bg-[#ABD49E] cursor-pointer text-base text-[#151413] hover:text-[#ABD49E] w-max top-[20%] left-[80%] p-1 hover:bg-[#151413] border border-[#151413] hover:border-[#ABD49E]"
              onHoverCardClick={() => router.push("/kura")}
            >
              <div className="w-[120px] h-[120px] md:w-[160px] md:h-[160px] border-[1.5px] border-[#ABD49E] p-3 md:p-4">
                <img src="/kura-bare.svg" alt="Kura" className="w-full h-full" />
              </div>
            </HoverCardPro>

            {/* TASKS COMPLETED / MAY 13 */}
            <HoverCardPro
              className="z-10 text-base cursor-pointer"
              hoverCardContent={<p className="text-[#151413]">KEEP TRACK OF YOUR TASKS</p>}
              hoverCardClassName="z-50 bg-[#ABD49E] text-[#151413] w-max pointer-events-none top-[70%] left-[-10%] p-2 border border-[#151413]"
            >
              <div className="w-[160px] h-[160px] md:w-[200px] md:h-[200px] border-[1.5px] border-[#ABD49E]">
                <p className="bg-[#ABD49E] text-[#151413] px-3 py-1 text-sm md:text-base">TASKS COMPLETED</p>
                <div className="flex flex-col items-center justify-center h-[calc(100%-32px)]">
                  <p className="text-xs">MAY</p>
                  <p className="text-5xl leading-none">13</p>
                </div>
              </div>
            </HoverCardPro>

            {/* REAL WORLD EXPERIENCES & THRILLS */}
            <div className="w-full border-[1.5px] border-[#ABD49E]">
              <img src="/cathedral.png" alt="Real world experiences" className="w-full aspect-[484/315] object-cover" />
              <h2 className="w-full px-3 py-2 bg-[#ABD49E] text-[#151413] text-sm md:text-base">REAL WORLD EXPERIENCES &amp; THRILLS</h2>
            </div>

            {/* 7/10 TASKS DONE + STYLE GUIDE side by side */}
            <div className="w-full flex flex-row gap-4">
              <div className="w-[140px] h-[140px] md:w-[180px] md:h-[180px] shrink-0 border-[1.5px] border-[#ABD49E] bg-[#ABD49E]">
                <p className="bg-[#151413] text-[#ABD49E] border-b border-[#ABD49E] px-2 py-1 text-xs md:text-sm">7/10 TASKS DONE</p>
                <div className="flex flex-col items-center justify-center h-[calc(100%-24px)] text-[#151413]">
                  <p className="text-xs">MAY</p>
                  <p className="text-5xl leading-none">14</p>
                </div>
              </div>
              <div className="flex-1 border-[1.5px] border-[#ABD49E] flex flex-col">
                <div className="w-full flex-1 flex items-center justify-center bg-[#151413]">
                  <img src="/SandOilWashJeans.png" alt="Style guide" className="h-full object-contain" />
                </div>
                <h2 className="w-full px-3 py-2 bg-[#ABD49E] text-[#151413] text-sm md:text-base">STYLE GUIDE MAY 13</h2>
              </div>
            </div>

            {/* DREAM LIKE WORLDS */}
            <div className="w-full border-[1.5px] border-[#ABD49E]">
              <div className="w-full aspect-[404/280] bg-[#151413]">
                <img src="/dream.png" alt="Dream like worlds" className="w-full h-full object-cover" />
              </div>
              <h2 className="w-full px-3 py-2 bg-[#ABD49E] text-[#151413] text-sm md:text-base">DREAM LIKE WORLDS</h2>
            </div>
          </section>

          {/* KURA section — DESKTOP absolute layout */}
          <section className="hidden lg:block relative w-full mt-[2vw] px-[4vw] py-[2vw] uppercase" style={{ minHeight: 'clamp(400px, 55vw, 854px)' }}>
            {/* Paragraph text */}
            <p className="text-2xl max-w-[37vw]">
              At the heart of the jungle is KṺRA, your evolving ai guide, designed to help you reconnect with yourself and form meaningful connections, as you explore dreamlike worlds and unlock real world thrills.
            </p>

            {/* Dream Log */}
            <div className="absolute left-[7%] top-[27%]">
              <HoverCardPro
                className="z-10 w-[35vw] max-w-[553px] h-[65px] text-xl text-[#ABD49E] border-[1.5px] border-[#ABD49E] cursor-pointer flex items-center px-[1vw]"
                hoverCardContent={<p className="text-[#151413]">TRACK &amp; ANALYZE YOUR DREAMS</p>}
                hoverCardClassName="z-50 bg-[#ABD49E] text-[#151413] w-max pointer-events-none bottom-[100%] left-[50%] p-[1vw]"
              >
                <p>DREAM LOG: APRIL 21 - I HAD THAT DREAM AGAIN</p>
              </HoverCardPro>
            </div>

            {/* GOAL 47% bar */}
            <div className="absolute left-[4%] top-[38%] w-[38vw] max-w-[600px] h-[65px] flex flex-row items-center border-[1px] border-[#ABD49E]">
              <p className="h-full px-[1.5vw] bg-[#ABD49E] text-[#151413] flex items-center text-xl">GOAL</p>
              <p className="h-full flex-1 px-[2vw] flex items-center justify-end text-xl">47 %</p>
            </div>

            {/* KURA icon */}
            <div className="absolute left-[43.5%] top-[38%]">
              <HoverCardPro
                className=""
                hoverCardContent={
                  <p className="flex flex-row items-center gap-[0.5vw] px-[0.5vw]">
                    KURA <FaCaretRight size={18} />
                  </p>
                }
                hoverCardClassName="z-50 bg-[#ABD49E] cursor-pointer text-xl text-[#151413] hover:text-[#ABD49E] w-max top-[20%] left-[80%] p-[0.5vw] hover:bg-[#151413] border border-[#151413] hover:border-[#ABD49E]"
                onHoverCardClick={() => router.push("/kura")}
              >
                <div className="w-[9vw] h-[9vw] max-w-[141px] max-h-[141px] border-[1.5px] border-[#ABD49E] p-[1.5vw]">
                  <img src="/kura-bare.svg" alt="Kura" className="w-full h-full" />
                </div>
              </HoverCardPro>
            </div>

            {/* TASKS COMPLETED / MAY 13 */}
            <div className="absolute left-[53.5%] top-[11%]">
              <HoverCardPro
                className="z-10 text-xl cursor-pointer"
                hoverCardContent={<p className="text-[#151413]">KEEP TRACK OF YOUR TASKS</p>}
                hoverCardClassName="z-50 bg-[#ABD49E] text-[#151413] w-max pointer-events-none top-[70%] left-[-10%] p-[1vw] border border-[#151413]"
              >
                <div className="w-[13.4vw] h-[13.4vw] max-w-[208px] max-h-[208px] border-[1.5px] border-[#ABD49E]">
                  <p className="bg-[#ABD49E] text-[#151413] px-[1vw] py-[0.4vw] text-xl">TASKS COMPLETED</p>
                  <div className="flex flex-col items-center justify-center h-[calc(100%-40px)]">
                    <p className="text-base">MAY</p>
                    <p className="text-[3.8vw] leading-none">13</p>
                  </div>
                </div>
              </HoverCardPro>
            </div>

            {/* REAL WORLD EXPERIENCES & THRILLS */}
            <div className="absolute left-[69%] top-[5%] w-[31vw] max-w-[484px] border-[1.5px] border-[#ABD49E]">
              <img src="/cathedral.png" alt="Real world experiences" className="w-full aspect-[484/315] object-cover" />
              <h2 className="w-full px-[1vw] py-[0.6vw] bg-[#ABD49E] text-[#151413] text-xl">REAL WORLD EXPERIENCES &amp; THRILLS</h2>
            </div>

            {/* 7/10 TASKS DONE / MAY 14 */}
            <div className="absolute left-[9%] top-[56%] w-[13.4vw] h-[13.4vw] max-w-[208px] max-h-[208px] border-[1.5px] border-[#ABD49E] bg-[#ABD49E]">
              <p className="bg-[#151413] text-[#ABD49E] border-b border-[#ABD49E] px-[0.6vw] py-[0.3vw] text-base">7/10 TASKS DONE</p>
              <div className="flex flex-col items-center justify-center h-[calc(100%-32px)] text-[#151413]">
                <p className="text-base">MAY</p>
                <p className="text-[3.8vw] leading-none">14</p>
              </div>
            </div>

            {/* STYLE GUIDE MAY 13 */}
            <div className="absolute left-[23.5%] top-[56%] w-[19.3vw] max-w-[300px] h-[22vw] max-h-[342px] border-[1.5px] border-[#ABD49E]">
              <div className="w-full h-[82%] flex items-center justify-center bg-[#151413]">
                <img src="/SandOilWashJeans.png" alt="Style guide" className="h-full object-contain" />
              </div>
              <h2 className="w-full px-[1vw] py-[0.6vw] bg-[#ABD49E] text-[#151413] text-xl">STYLE GUIDE MAY 13</h2>
            </div>

            {/* DREAM LIKE WORLDS */}
            <div className="absolute left-[53.5%] top-[56%] w-[26vw] max-w-[404px] h-[22vw] max-h-[342px] border-[1.5px] border-[#ABD49E]">
              <div className="w-full h-[82%] bg-[#151413]">
                <img src="/dream.png" alt="Dream like worlds" className="w-full h-full object-cover" />
              </div>
              <h2 className="w-full px-[1vw] py-[0.6vw] bg-[#ABD49E] text-[#151413] text-xl">DREAM LIKE WORLDS</h2>
            </div>
          </section>

          {/* Focus statements */}
          <div className="w-full flex flex-col md:flex-row items-start justify-between gap-4 md:gap-[2vw] text-lg md:text-xl lg:text-2xl px-[20px] md:px-[50px] lg:px-[75px] py-5 md:py-6 lg:py-8 mt-0 uppercase">
            <p className="w-full text-left md:max-w-[650px]">
              In the Jungle the focus isn&apos;t on contents, doom scrolling, and cheap dopamine.
            </p>
            <p className="w-full text-right md:max-w-[600px]">
              The focus is on your evolution, true connectivity, and self expression. The focus is on you and the world you&apos;re building.
            </p>
          </div>

          {/* IN THE JUNGLE YOU CAN + list */}
          <div className="mt-5 md:mt-6 lg:mt-8 px-[20px] md:px-[50px] lg:px-[75px]">
            <h1 className="text-[8.5vw] md:text-[10.5vw] lg:text-[11.5vw] text-center uppercase leading-[125%]">IN THE JUNGLE</h1>
            <h1 className="text-[8.5vw] md:text-[10.5vw] lg:text-[11.5vw] text-center uppercase leading-[75%]">YOU CAN</h1>

            <div className="w-full flex flex-col gap-4 md:gap-5 lg:gap-6 text-lg md:text-xl lg:text-2xl uppercase mt-8 md:mt-[40px] lg:mt-[60px]">
              <div className="w-full flex flex-row items-center gap-2 md:gap-4 border-b border-[#ABD49E]/30 pb-4 md:pb-6">
                <FaCaretRight size={16} />
                <p>EXPLORE EVOLVING SPACES, BOTH FICTIONAL AND REAL-WORLD REIMAGINED</p>
              </div>
              <div className="w-full flex flex-row items-center gap-2 md:gap-4 border-b border-[#ABD49E]/30 pb-4 md:pb-6">
                <FaCaretRight size={16} />
                <p>CREATE YOUR KṺRA, YOUR AI GUIDE THAT LEARNS AND GROWS WITH YOU</p>
              </div>
              <div className="w-full flex flex-row items-center gap-2 md:gap-4 border-b border-[#ABD49E]/30 pb-4 md:pb-6">
                <FaCaretRight size={16} />
                <p>CUSTOMIZE AVATARS, SPACES, AND DIGITAL ASSETS</p>
              </div>
              <div className="w-full flex flex-row items-center gap-2 md:gap-4 border-b border-[#ABD49E]/30 pb-4 md:pb-6">
                <FaCaretRight size={16} />
                <p>COMPLETE QUESTS, LEVEL UP, AND UNLOCK PHYSICAL OR DIGITAL REWARDS</p>
              </div>
              <div className="w-full flex flex-row items-center gap-2 md:gap-4 border-b border-[#ABD49E]/30 pb-4 md:pb-6">
                <FaCaretRight size={16} />
                <p>COLLABORATE THROUGH STORY-BASED MISSIONS AND COMMUNITY EVENTS</p>
              </div>
              <div className="w-full flex flex-row items-center gap-2 md:gap-4 border-b border-[#ABD49E]/30 pb-4 md:pb-6">
                <FaCaretRight size={16} />
                <p>COLLECT OR SHARE YOUR WORK, STYLE, AND STORY IN A WORLD THAT TRULY VALUES IT</p>
              </div>
              <div className="w-full flex flex-row items-center gap-2 md:gap-4 pb-4 md:pb-6">
                <FaCaretRight size={16} />
                <p>ACCESS REAL WORLD OPPORTUNITIES THROUGH EXHIBITIONS, CREATOR FEATURES, SALES IN OUR MARKETPLACE, OR STUDIO COMMISSIONS</p>
              </div>
            </div>
          </div>

          {/* Scale & Infrastructure */}
          <div className="w-full flex flex-col md:flex-row items-start justify-between gap-4 md:gap-[2vw] text-lg md:text-xl lg:text-2xl px-[20px] md:px-[50px] lg:px-[75px] py-5 md:py-6 lg:py-8 mt-0 uppercase">
            <p className="w-full text-left md:max-w-[650px]">
              Aside from being an immersive playground, Lucid Jungles is a modular system for building immersive experiences at scale.
            </p>
            <p className="w-full text-right md:max-w-[600px]">
              IT IS a digital studio and infrastructure for brands, institutions, and creators to build their own interactive worlds.
            </p>
          </div>

          {/* WHAT WE OFFER section */}
          <aside className="relative text-center px-[20px] md:px-[50px] lg:px-[75px] py-[30px] md:py-[80px] lg:py-[160px]">
            <h1 className="h-auto w-full text-center whitespace-nowrap text-[9vw] md:text-[11.5vw] lg:text-[11.5vw]">WHAT WE OFFER</h1>
            <p className="mt-4 md:mt-0 md:absolute md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 border-[1.5px] border-[#151413] bg-[#151413] flex items-center justify-center rounded-full z-10 mx-auto w-max">
              <span className="w-full h-full px-4 md:px-6 lg:px-8 py-2 md:py-3 lg:py-4 text-xs md:text-base lg:text-2xl border-[1.5px] border-[#ABD49E] rounded-full whitespace-nowrap">
                FOR CREATORS, BRANDS &amp; INSTITUTIONS
              </span>
            </p>
          </aside>

          {/* Offerings */}
          <div className="w-full flex flex-col gap-4 md:gap-5 lg:gap-6 text-lg md:text-xl lg:text-2xl uppercase px-[20px] md:px-[50px] lg:px-[75px]">
            <div className="w-full flex flex-row items-center gap-2 md:gap-4 border-b border-[#ABD49E]/30 pb-4 md:pb-6">
              <FaCaretRight size={16} />
              <p>CUSTOM WEBSITES OR WORLDS FOR STORYTELLING</p>
            </div>
            <div className="w-full flex flex-row items-center gap-2 md:gap-4 border-b border-[#ABD49E]/30 pb-4 md:pb-6">
              <FaCaretRight size={16} />
              <p>GPS ENABLED GAMIFIED AR MAPS FOR EVENTS &amp; LOCATIONS</p>
            </div>
            <div className="w-full flex flex-row items-center gap-2 md:gap-4 border-b border-[#ABD49E]/30 pb-4 md:pb-6">
              <FaCaretRight size={16} />
              <p>INTERACTIVE BRAND EXPERIENCES &amp; SPONSORSHIPS</p>
            </div>
            <div className="w-full flex flex-row items-center gap-2 md:gap-4 pb-4 md:pb-6">
              <FaCaretRight size={16} />
              <p>AI-GUIDED IMMERSIVE EXPERIENCES</p>
            </div>
          </div>

          {/* Tools for creators */}
          <div className="w-full flex flex-col md:flex-row items-start justify-between gap-4 md:gap-[2vw] text-lg md:text-xl lg:text-2xl px-[20px] md:px-[50px] lg:px-[75px] py-5 md:py-6 lg:py-8 mt-0 uppercase">
            <p className="w-full text-left md:max-w-[650px]">
              We provide the tools for creators to build their own communities, host immersive experiences, and participate in a growing digital economy.
            </p>
            <p className="w-full text-right md:max-w-[700px]">
              We&apos;re building a space where digital culture grows from the root of real communities. We start with the story and end with the infrastructure. Everything in between is yours to shape.
            </p>
          </div>
        </div>

        {/* Marquee */}
        <section className="maq-hol w-full overflow-hidden my-5 md:my-10 relative z-10">
          <div className="Marquee flex flex-row gap-0 text-base md:text-xl lg:text-2xl">
            <p className="whitespace-nowrap w-max">AS LONG AS YOU CAN DREAM, YOU BELONG IN THE JUNGLE .</p>
            <p className="whitespace-nowrap w-max">AS LONG AS YOU CAN DREAM, YOU BELONG IN THE JUNGLE .</p>
            <p className="whitespace-nowrap w-max">AS LONG AS YOU CAN DREAM, YOU BELONG IN THE JUNGLE .</p>
            <p className="whitespace-nowrap w-max">AS LONG AS YOU CAN DREAM, YOU BELONG IN THE JUNGLE .</p>
            <p className="whitespace-nowrap w-max">AS LONG AS YOU CAN DREAM, YOU BELONG IN THE JUNGLE .</p>
          </div>
        </section>

        <div className="w-full px-[4vw] md:px-[2.75dvw]">
          {/* WHY WE EXIST section */}
          <aside className="relative text-center px-[20px] md:px-[50px] lg:px-[75px] mt-10 md:mt-[60px] lg:mt-[100px] pt-4 md:pt-5 lg:pt-6 pb-8 md:pb-[40px] lg:pb-[60px]">
            <h1 className="h-auto w-full whitespace-nowrap" style={{ fontSize: 'min(12vw, calc((100vw - 150px) / 6))' }}>WHY WE EXIST</h1>
            <p className="absolute top-[15%] left-[5%] border-[1.5px] border-[#151413] bg-[#151413] flex items-center justify-center z-10">
              <span className="w-full h-full px-2 md:px-4 lg:px-8 py-1 md:py-2 lg:py-4 text-xs md:text-base lg:text-2xl border-[1.5px] border-[#ABD49E]">FOR BUILDERS</span>
            </p>
            <p className="absolute top-[15%] right-[5%] border-[1.5px] border-[#151413] bg-[#151413] flex items-center justify-center z-10">
              <span className="w-full h-full px-2 md:px-4 lg:px-8 py-1 md:py-2 lg:py-4 text-xs md:text-base lg:text-2xl border-[1.5px] border-[#ABD49E]">FOR BUSINESSES</span>
            </p>
            <p className="absolute bottom-[-10%] left-[5%] border-[1.5px] border-[#151413] bg-[#151413] flex items-center justify-center z-10">
              <span className="w-full h-full px-2 md:px-4 lg:px-8 py-1 md:py-2 lg:py-4 text-xs md:text-base lg:text-2xl border-[1.5px] border-[#ABD49E]">FOR CREATORS</span>
            </p>
            <p className="absolute bottom-[-10%] right-[5%] border-[1.5px] border-[#151413] bg-[#151413] flex items-center justify-center z-10">
              <span className="w-full h-full px-2 md:px-4 lg:px-8 py-1 md:py-2 lg:py-4 text-xs md:text-base lg:text-2xl border-[1.5px] border-[#ABD49E]">FOR EXPLORERS</span>
            </p>
          </aside>

          {/* Interactive experience section */}
          <div className="w-full p-2 md:p-4 lg:p-6 mt-5 md:mt-6 lg:mt-8 aspect-[4/3] lg:aspect-[1625/1060] flex items-center justify-center">
            <section className="relative w-full h-full p-3 md:p-4 lg:p-[2vw] border-[3px] lg:border-[clamp(3px,0.35vw,5px)] border-[#ABD49E] flex flex-col items-center justify-start overflow-hidden">
              {/* Compass + location + timer — top cluster */}
              <HoverCardPro
                className="w-max text-[10px] leading-none md:text-xl"
                hoverCardContent={
                  <p className="text-[#151413] max-w-[70vw] md:max-w-[42vw]">
                    GPS ENABLED GAMEFIED AR MAPS; OUR SOLUTION TO WAYFINDING &amp; ITENARY MANAGEMENT FOR EVENTS, STORES &amp; TOURIST LOCATIONS
                  </p>
                }
                hoverCardClassName="z-50 bg-[#ABD49E] text-[#151413] w-max pointer-events-none bottom-[130%] right-[40%] p-2 md:p-[1vw]"
              >
                <div className="relative z-30 flex flex-col items-center justify-center gap-0.5 md:gap-[0.5vw] text-center text-white">
                  <img src="/coordinates.svg" alt="coordinates" className="bg-white p-0.5 md:p-[0.3vw] w-5 md:w-[2.5vw] md:max-w-[40px]" />
                  <p className="text-[10px] md:text-[clamp(10px,1.3vw,20px)] px-1 md:px-[0.3vw] bg-white text-black">100M AWAY. TOP FLOOR</p>
                </div>
              </HoverCardPro>
              <div className="w-full flex flex-row items-center justify-end mt-1 md:mt-2 lg:justify-between lg:mt-[1vw]">
                <div className="flex flex-row items-center gap-1 md:gap-[1vw]">
                  <h2 className="h-full bg-white px-2 md:px-[0.8vw] py-0.5 text-[10px] md:text-[clamp(10px,1.3vw,20px)] flex flex-row items-center text-black font-semibold">00:00:00:00   0XP</h2>
                </div>
              </div>

              {/* --- MOBILE: 4 text bars stacked vertically --- */}
              <div className="flex lg:hidden flex-col w-full flex-1 relative z-20 mt-0 justify-between pb-1">
                {/* 1. FIND THE BOY — left aligned */}
                <HoverCardPro
                  className="w-max text-[10px] md:text-sm leading-tight self-start"
                  hoverCardContent={<p className="text-[#151413] max-w-[60vw]">TASKS CREATED FOR VISITORS, MAKING EVERY EXPERIENCE ENGAGING</p>}
                  hoverCardClassName="absolute z-50 bg-[#ABD49E] text-[#151413] w-max pointer-events-none top-[150%] left-[50%] p-2"
                >
                  <div className="py-0.5 md:py-1 pr-1.5 pl-2 md:pr-2.5 md:pl-3 bg-black/80 flex flex-row items-center gap-1 text-[10px] md:text-sm leading-tight text-white">
                    <p>FIND THE BOY WHO LOST HIS HEAD!</p>
                    <img src="/Tasks0.svg" alt="" className="w-3 md:w-4" />
                  </div>
                </HoverCardPro>

                {/* 2. COCACOLA TASK — right aligned */}
                <div className="py-0.5 md:py-1 pr-2 pl-1.5 md:pr-3 md:pl-2.5 bg-black/80 flex flex-row items-center gap-1 text-[10px] md:text-sm leading-tight text-white self-end">
                  <img src="/Tasks.svg" alt="" className="w-3 md:w-4" />
                  <p>COCACOLA TASK COMPLETED!</p>
                </div>

                {/* 3. RED COKE BAR — right aligned */}
                <HoverCardPro
                  className="w-max text-[10px] leading-tight self-end"
                  hoverCardContent={<p className="text-[#151413] max-w-[60vw]">OPPORTUNITIES FOR CUSTOM BRAND SPONSORSHIPS</p>}
                  hoverCardClassName="absolute z-50 bg-[#ABD49E] text-[#151413] w-max pointer-events-none top-[130%] right-[40%] p-2"
                >
                  <div className="py-0.5 md:py-1 px-2 md:px-3 bg-[#E9040C] flex flex-row items-center gap-1 text-[10px] md:text-sm leading-tight text-white">
                    <img src="/coke-logo.svg" alt="" className="w-3.5 md:w-5" />
                    <p className="uppercase">you have won a trip to the etj DREAM ARENA!</p>
                  </div>
                </HoverCardPro>

                {/* 4. HUNT CLUE — centered at bottom */}
                <HoverCardPro
                  className="text-[10px] md:text-sm leading-tight w-[85%] mx-auto py-1 md:py-1.5 px-2 md:px-3 bg-black/80 text-center text-white"
                  hoverCardContent={<p className="text-[#151413] max-w-[60vw]">YOUR AI ASSISTANT (KURA) GUIDES VISITORS THROUGH YOUR WORLD</p>}
                  hoverCardClassName="z-50 bg-[#ABD49E] text-[#151413] w-max pointer-events-none bottom-[125%] left-[-20%] p-2"
                >
                  <p className="text-[10px] md:text-sm leading-tight text-center">
                    WHEN YOU FIND THE HUNT CLUE, TAP THE EYE BUTTON TO YOUR RIGHT TO SCAN IT WITH YOUR PHONES CAMERA, AND INTERACT.
                  </p>
                </HoverCardPro>
              </div>

              {/* --- DESKTOP: original layout --- */}
              <div className="hidden lg:flex w-full flex-row items-start justify-between mt-[1vw]">
                <HoverCardPro
                  className="w-max text-xl"
                  hoverCardContent={<p className="text-[#151413] max-w-[26vw]">TASKS CREATED FOR VISITORS, MAKING EVERY EXPERIENCE ENGAGING</p>}
                  hoverCardClassName="absolute z-50 bg-[#ABD49E] text-[#151413] w-max pointer-events-none top-[150%] left-[50%] p-[1vw]"
                >
                  <div className="relative z-20 py-[0.4vw] pr-[1vw] pl-[3vw] bg-black/80 flex flex-row items-center justify-end gap-[0.5vw] text-[clamp(10px,1.3vw,20px)] text-center text-white">
                    <p>FIND THE BOY WHO LOST HIS HEAD!</p>
                    <img src="/Tasks0.svg" alt="" className="w-[2vw] max-w-[32px]" />
                  </div>
                </HoverCardPro>
                <div className="w-max flex flex-col items-end justify-start gap-[1vw]">
                  <div className="relative z-20 py-[0.4vw] pr-[3vw] pl-[1vw] bg-black/80 flex flex-row items-center justify-end gap-[0.5vw] text-[clamp(10px,1.3vw,20px)] text-center text-white">
                    <img src="/Tasks.svg" alt="" className="w-[2vw] max-w-[32px]" />
                    <p>COCACOLA TASK COMPLETED!</p>
                  </div>
                  <HoverCardPro
                    className="w-max text-xl"
                    hoverCardContent={<p className="text-[#151413] max-w-[34vw]">OPPORTUNITIES FOR CUSTOM BRAND SPONSORSHIPS</p>}
                    hoverCardClassName="absolute z-50 bg-[#ABD49E] text-[#151413] w-max pointer-events-none top-[130%] right-[40%] p-[1vw]"
                  >
                    <div className="relative z-20 py-[1vw] px-[1.2vw] bg-[#E9040C] flex flex-row items-center justify-end gap-[0.5vw] text-[clamp(10px,1.3vw,20px)] text-center text-white">
                      <img src="/coke-logo.svg" alt="" className="w-[2vw] max-w-[32px]" />
                      <p className="uppercase">you have won a trip to the etj DREAM ARENA!</p>
                    </div>
                  </HoverCardPro>
                </div>
              </div>
              <HoverCardPro
                className="text-xl !absolute w-full max-w-[48vw] z-20 bottom-[7.5%] left-1/2 -translate-x-1/2 py-[1vw] px-[1.5vw] bg-black/80 text-center text-white hidden lg:block"
                hoverCardContent={<p className="text-[#151413] max-w-[24vw]">YOUR AI ASSISTANT (KURA) GUIDES VISITORS THROUGH YOUR WORLD</p>}
                hoverCardClassName="z-50 bg-[#ABD49E] text-[#151413] w-max pointer-events-none bottom-[125%] left-[-20%] p-[1vw]"
              >
                <div>
                  <p className="text-xl text-center">
                    WHEN YOU FIND THE HUNT CLUE, TAP THE EYE BUTTON TO YOUR RIGHT TO SCAN IT WITH YOUR PHONES CAMERA, AND INTERACT.
                  </p>
                </div>
              </HoverCardPro>

              <img src="/crosshair.svg" alt="crosshair" className="w-[40vw] md:w-[30vw] h-auto absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
              <img src="/experience-image.png" alt="VR-Image" className="w-full h-full absolute z-10 top-0 left-0 pointer-events-none object-cover" />
              <img src="/SurfEye.svg" alt="VR-Image" className="w-12 md:w-[5vw] md:max-w-[112px] h-max absolute z-10 bottom-[15%] md:bottom-[20%] right-[5%] md:right-[10%] pointer-events-none" />
            </section>
          </div>

          {/* Mission statement */}
          <div className="w-full flex flex-col md:flex-row items-start justify-between gap-4 md:gap-[2vw] text-lg md:text-xl lg:text-2xl px-[20px] md:px-[50px] lg:px-[75px] py-5 md:py-6 lg:py-8 mt-0 uppercase">
            <p className="w-full text-left md:max-w-[650px]">
              We exist because we&apos;ve seen the power of dreams change lives, and we understand that play, culture, and tech can shape real change, especially when led by the youth, the bold and the imaginative.
            </p>
            <p className="w-full text-right md:max-w-[700px]">
              This is human social evolution as a living, explorable space, powered by story, sustained by system, and owned by the people who use it.
            </p>
          </div>
        </div>

        {/* Bottom Marquee */}
        <section className="maq-hol w-full overflow-hidden my-5 md:my-[60px]">
          <div className="Marquee flex flex-row gap-0 text-base md:text-xl lg:text-2xl">
            <p className="whitespace-nowrap w-max">ENTER THE JUNGLE. FOLLOW YOUR DREAMS .</p>
            <p className="whitespace-nowrap w-max">ENTER THE JUNGLE. FOLLOW YOUR DREAMS .</p>
            <p className="whitespace-nowrap w-max">ENTER THE JUNGLE. FOLLOW YOUR DREAMS .</p>
            <p className="whitespace-nowrap w-max">ENTER THE JUNGLE. FOLLOW YOUR DREAMS .</p>
            <p className="whitespace-nowrap w-max">ENTER THE JUNGLE. FOLLOW YOUR DREAMS .</p>
          </div>
        </section>

        {/* Kura footer */}
        <div className="w-full flex items-center justify-center mt-10 md:mt-[60px] lg:mt-[100px] pb-[10dvh] md:pb-[15dvh] lg:pb-[20dvh]">
          <HoverCardPro
            className=""
            hoverCardContent={
              <p className="flex flex-row items-center gap-[0.5vw] px-[0.5vw]">
                KURA <FaCaretRight size={18} />
              </p>
            }
            hoverCardClassName="z-50 bg-[#ABD49E] cursor-pointer text-[clamp(14px,1.3vw,20px)] text-[#151413] hover:text-[#ABD49E] w-max top-[20%] left-[80%] p-[0.5vw] hover:bg-[#151413] border border-[#151413] hover:border-[#ABD49E]"
            onHoverCardClick={() => router.push("/kura")}
          >
            <div className="w-[clamp(80px,9vw,141px)] aspect-square border-[1.5px] border-[#ABD49E] p-[1.5vw]">
              <img src="/kura-bare.svg" alt="Kura" className="w-full h-full" />
            </div>
          </HoverCardPro>
        </div>
      </div>
    </AnimatedPage>
  );
}
