import "../styles/globals.css";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "../store";
import { Toaster } from "sonner";
import { LayoutProvider } from "../context/LayoutContext";
import { EventProvider } from "../context/EventContext";
import BottomNav from "../components/BottomNav";

// One shell. The BottomNav is mounted here, once, so it exists on every route —
// pages control only whether it is *shown* (via hooks/useHideBottomNav).
//
// EventProvider is mounted here too (CONS/UPD do the same, but it was dropped in
// the rebuilt shell). Without it, useEvent() throws during the *client* render —
// SSR renders nothing because PersistGate is still loading, so the build stays
// green and the failure only shows up in the browser.
function MyApp({ Component, pageProps }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <EventProvider>
          <LayoutProvider>
            <Component {...pageProps} />
            <BottomNav />
            <Toaster richColors position="top-right" />
          </LayoutProvider>
        </EventProvider>
      </PersistGate>
    </Provider>
  );
}

export default MyApp;
