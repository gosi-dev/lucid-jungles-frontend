import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import registerReducer from "./registerSlice";
import { apiAuth } from "./apiAuth";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["registerSlice"],
};

const rootReducer = combineReducers({
  registerSlice: registerReducer,
  [apiAuth.reducerPath]: apiAuth.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          "persist/FLUSH",
          "persist/PAUSE",
          "persist/PURGE",
          "persist/REGISTER",
        ],
      },
    }).concat(apiAuth.middleware),
});

export const persistor = persistStore(store);
