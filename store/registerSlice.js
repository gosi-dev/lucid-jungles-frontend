import { createSlice } from "@reduxjs/toolkit";

// What this device remembers about the signed-in user, and nothing else. The typed
// password deliberately has no place here: every form keeps its own input in local
// component state, and this slice is the one thing redux-persist writes to
// localStorage, so a password field would have been a plaintext copy on disk.
const initialState = {
  username: "",
  email: "",
  isLoggedIn: false,
};

const registerSlice = createSlice({
  name: "registerSlice",
  initialState,
  reducers: {
    setUsername: (state, action) => {
      state.username = action.payload;
    },
    setEmail: (state, action) => {
      state.email = action.payload;
    },
    updateIsLoggedIn: (state, action) => {
      state.isLoggedIn = action.payload;
    },
  },
});

export const { setUsername, setEmail, updateIsLoggedIn } = registerSlice.actions;
export default registerSlice.reducer;
