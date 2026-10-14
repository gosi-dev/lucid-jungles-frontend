import "../styles/globals.css";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "../store";
import { Toaster } from "sonner";
import { LayoutProvider } from "../context/LayoutContext";

function MyApp({ Component, pageProps }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <LayoutProvider>
          <Component {...pageProps} />
          <Toaster richColors position="top-right" />
        </LayoutProvider>
      </PersistGate>
    </Provider>
  );
}

export default MyApp;
