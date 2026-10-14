import { useEffect } from "react";
import { Unity, useUnityContext } from "react-unity-webgl";

export default function UnityPlayer() {
  const {
    unityProvider,
    isLoaded,
    loadingProgression,
    unload,
  } = useUnityContext({
    loaderUrl: "/WebBuildPro/Build/WebBuild.loader.js",
    dataUrl: "/WebBuildPro/Build/WebBuild.data",
    frameworkUrl: "/WebBuildPro/Build/WebBuild.framework.js",
    codeUrl: "/WebBuildPro/Build/WebBuild.wasm",
    productName: "MOJ Project",
    productVersion: "0.1.0",
  });

  useEffect(() => {
    return () => {
      // Graceful unload with timeout
      const timer = setTimeout(() => {
        unload?.();
      }, 3000);
      return () => clearTimeout(timer);
    };
  }, [unload]);

  return (
    <div id="unity-container" className="w-full h-full relative">
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
          <p className="text-white font-code text-sm mb-4">
            LOADING EXPERIENCE
          </p>
          <div className="w-48 h-1 bg-white/20">
            <div
              className="h-full bg-white transition-all"
              style={{ width: `${loadingProgression * 100}%` }}
            />
          </div>
        </div>
      )}
      <Unity
        unityProvider={unityProvider}
        id="unity-canvas"
        style={{
          width: "100%",
          height: "100%",
          visibility: isLoaded ? "visible" : "hidden",
        }}
        devicePixelRatio={window.devicePixelRatio}
      />
    </div>
  );
}
