import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getToken, removeToken, setToken } from "@web/libs/tokens";
import { IUser } from "@web/libs/user";
import { authApi } from "./authApi";

export interface AuthState {
  user: IUser | null;
  isAuthenticated: boolean;
  accessToken: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  accessToken: getToken() || null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: IUser; accessToken: string }>,
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      setToken(action.payload.accessToken);
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.accessToken = null;
      removeToken();
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        authApi.endpoints.login.matchFulfilled,
        (state, { payload }) => {
          state.user = payload.data.user;
          state.isAuthenticated = true;
          state.accessToken = payload.data.accessToken;
          setToken(payload.data.accessToken);
        },
      )
      .addMatcher(
        authApi.endpoints.getProfile.matchFulfilled,
        (state, { payload }) => {
          state.user = payload.data;
          state.isAuthenticated = true;
          state.accessToken = getToken();
        },
      )
      .addMatcher(authApi.endpoints.getProfile.matchRejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.accessToken = null;
        removeToken();
      })
      .addMatcher(
        authApi.endpoints.updateProfile.matchFulfilled,
        (state, { payload }) => {
          state.user = payload.data;
        },
      );
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice;
