import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  username: "",
  email: "",
  password: "",
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
    setPassword: (state, action) => {
      state.password = action.payload;
    },
    updateIsLoggedIn: (state, action) => {
      state.isLoggedIn = action.payload;
    },
  },
});

export const { setUsername, setEmail, setPassword, updateIsLoggedIn } =
  registerSlice.actions;
export default registerSlice.reducer;
