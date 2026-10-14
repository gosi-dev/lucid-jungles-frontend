import "../styles/globals.css";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "../store";
import { Toaster } from "sonner";
import { LayoutProvider } from "../context/LayoutContext";
import BottomNav from "../components/BottomNav";

// One shell. The BottomNav is mounted here, once, so it exists on every route —
// pages control only whether it is *shown* (via hooks/useHideBottomNav).
function MyApp({ Component, pageProps }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <LayoutProvider>
          <Component {...pageProps} />
          <BottomNav />
          <Toaster richColors position="top-right" />
        </LayoutProvider>
      </PersistGate>
    </Provider>
  );
}

export default MyApp;
