import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  role_name?: string;
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  accessToken: null,
  loading: true, // Initially true while we check for stored tokens
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; access_token: string; refresh_token?: string }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.access_token;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      
      // We store access token in memory/redux state, but could use cookie for persistence
      const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
      Cookies.set('access_token', action.payload.access_token, { secure: isSecure, sameSite: 'strict' });
      if (action.payload.refresh_token) {
        Cookies.set('refresh_token', action.payload.refresh_token, { expires: 30, secure: isSecure, sameSite: 'strict' });
      }
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.loading = false;
      
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setCredentials, updateUser, logout, setLoading, setError } = authSlice.actions;
export default authSlice.reducer;
