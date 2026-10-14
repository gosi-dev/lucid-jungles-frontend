import { useState, useEffect, useCallback, useRef, memo } from "react";
import Head from "next/head";
import { useLottie } from "lottie-react";
import { motion, AnimatePresence } from "framer-motion";
import rotatePhoneAnimation from "../data/rotatePhoneAnimation";

/* ── Tapscreen: Lottie "rotate phone" modal ── */
const tapscreenVariants = {
  start: { opacity: 0 },
  end: { opacity: 1, transition: { duration: 0.4, ease: "anticipate" } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

function Tapscreen({ handleClick }) {
  const optionsRef = useRef({ animationData: rotatePhoneAnimation, loop: true });
  const { View } = useLottie(optionsRef.current);

  return (
    <motion.div
      variants={tapscreenVariants}
      initial="start"
      animate="end"
      exit="exit"
      className="modal"
    >
      <div className="modal__image">{View}</div>
      <p>Please rotate your phone to landscape mode</p>
      <button className="modal__button" onClick={handleClick}>
        Got it!
      </button>
    </motion.div>
  );
}

/* ── usePortrait: media-query based (max-width: 56.25em) ── */
function usePortrait() {
  const [portrait, setPortrait] = useState(false);

  useEffect(() => {
    const check = () => {
      setPortrait(window.matchMedia("(max-width: 56.25em)").matches);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return portrait;
}

/* ── useIsLandscape: innerWidth > innerHeight ── */
function useIsLandscape() {
  const [landscape, setLandscape] = useState(false);

  useEffect(() => {
    const check = () => {
      setLandscape(window.innerWidth > window.innerHeight);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return landscape;
}

/* ── Webgl: the immersive Unity component ── */
const Webgl = memo(function Webgl() {
  const [loading, setLoading] = useState(true);
  const [dpr, setDpr] = useState(1);
  const [loadingProgression, setLoadingProgression] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const portrait = usePortrait();
  const landscape = useIsLandscape();
  const unityInstanceRef = useRef(null);

  // Initialise DPR on mount
  useEffect(() => {
    setDpr(window.devicePixelRatio);
  }, []);

  /* Back navigation: unload Unity then hard-navigate to /MOJ */
  const handleBack = useCallback(
    async (e) => {
      if (e && e.preventDefault) e.preventDefault();
      try {
        const inst = unityInstanceRef.current;
        if (inst) {
          await Promise.race([
            inst.Quit(),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error("Unity quit timeout")),
                3000
              )
            ),
          ]);
        }
      } catch (err) {
        console.warn("Unity unload timed out, forcing navigation:", err);
      }
      window.location.href = "/moj";
    },
    []
  );

  useEffect(() => {
    window.addEventListener("popstate", handleBack);
    return () => window.removeEventListener("popstate", handleBack);
  }, [handleBack]);

  /* Hide loading bar when Unity is loaded & orientation is OK */
  useEffect(() => {
    if (isLoaded && (!portrait || (portrait && landscape))) {
      setLoading(false);
    }
  }, [isLoaded, portrait, landscape]);

  /* Track devicePixelRatio changes */
  useEffect(() => {
    const mql = window.matchMedia(
      `screen and (resolution: ${dpr}dppx)`
    );
    const handler = () => setDpr(window.devicePixelRatio);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [dpr]);

  /* Fullscreen + orientation lock for portrait devices */
  const handleFullscreen = useCallback(() => {
    const lockOrientation = () => {
      if (!landscape && screen.orientation && screen.orientation.lock) {
        screen.orientation.lock("landscape-primary").catch((err) => {
          console.warn(`Orientation lock failed: ${err.message}`);
        });
      }
    };
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().then(lockOrientation).catch((err) => {
        alert(`Error entering fullscreen: ${err.message}`);
      });
    }
  }, [landscape]);

  /* Manual Unity initialisation via script injection */
  useEffect(() => {
    const canvas = document.querySelector("#unity-canvas");
    if (!canvas) return;

    const config = {
      dataUrl: "/WebBuildPro/Build/WebBuild.data",
      frameworkUrl: "/WebBuildPro/Build/WebBuild.framework.js",
      codeUrl: "/WebBuildPro/Build/WebBuild.wasm",
      streamingAssetsUrl: "StreamingAssets",
      companyName: "DefaultCompany",
      productName: "MOJ Project",
      productVersion: "0.1.0",
      showBanner: (msg, type) => {
        const warningEl = document.querySelector("#unity-warning");
        if (!warningEl) return;
        const div = document.createElement("div");
        div.textContent = msg;
        if (type === "error") {
          div.style.cssText = "background:red;padding:10px;";
        } else if (type === "warning") {
          div.style.cssText = "background:yellow;padding:10px;";
          setTimeout(() => {
            if (warningEl.contains(div)) warningEl.removeChild(div);
          }, 5000);
        }
        warningEl.appendChild(div);
      },
    };

    const script = document.createElement("script");
    script.src = "/WebBuildPro/Build/WebBuild.loader.js";
    script.onload = () => {
      if (window.createUnityInstance) {
        window.createUnityInstance(canvas, config, (progress) => {
          setLoadingProgression(progress);
        })
          .then((instance) => {
            unityInstanceRef.current = instance;
            setIsLoaded(true);
            setLoading(false);
            const fsBtn = document.querySelector("#unity-fullscreen-button");
            if (fsBtn) {
              fsBtn.addEventListener("click", () =>
                instance.SetFullscreen(1)
              );
            }
          })
          .catch((err) => {
            console.error("Unity init error:", err);
          });
      }
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div
      id="unity-container"
      className={`${
        portrait && !landscape ? "unity-mobile" : "unity-desktop"
      } !w-screen !h-screen`}
    >
      <AnimatePresence>
        {!landscape && portrait && (
          <Tapscreen handleClick={handleFullscreen} />
        )}
      </AnimatePresence>

      <canvas
        id="unity-canvas"
        width={window.innerWidth}
        height={window.innerHeight}
        className={`${
          portrait && !landscape ? "unity-mobile" : ""
        } max-w-[100dvw] max-h-[100dvh]`}
        tabIndex={-1}
      />

      <div
        id="unity-loading-bar"
        style={{ display: loading ? "block" : "none" }}
      >
        <div id="unity-logo" />
        <div id="unity-progress-bar-empty">
          <div
            id="unity-progress-bar-full"
            style={{ width: `${loadingProgression * 100}%` }}
          />
        </div>
      </div>

      <div id="unity-warning" />

      <div id="unity-footer">
        <div id="unity-logo-title-footer" />
        <div
          id="unity-fullscreen-button"
          onClick={() => {
            if (document.documentElement.requestFullscreen) {
              document.documentElement.requestFullscreen();
            }
          }}
        />
        <div id="unity-build-title">MOJ Project</div>
      </div>
    </div>
  );
});

Webgl.displayName = "Webgl";

/* ── Page wrapper: client-only rendering ── */
export default function ImmersivePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <>
      <Head>
        <title>Immersive — Lucid Jungles</title>
      </Head>
      <Webgl />
    </>
  );
}
