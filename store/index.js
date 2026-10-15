import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer, createMigrate } from "redux-persist";
import storage from "redux-persist/lib/storage";
import registerReducer from "./registerSlice";
import { apiAuth } from "./apiAuth";

// Storage already in the wild may hold a version 0 blob from before registerSlice dropped
// its password field. Migrating (rather than only deleting the field) is what clears the
// plaintext copy off devices that already wrote one — rehydration merges persisted state
// over the initial state, so a stale key would otherwise survive in the store and on disk.
const migrations = {
  1: (state) => {
    if (!state || !state.registerSlice || !("password" in state.registerSlice)) return state;
    const { password, ...registerSlice } = state.registerSlice;
    return { ...state, registerSlice };
  },
};

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["registerSlice"],
  version: 1,
  migrate: createMigrate(migrations, { debug: false }),
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
