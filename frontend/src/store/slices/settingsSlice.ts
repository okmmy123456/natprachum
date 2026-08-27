import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

interface SettingsState {
  theme: 'light' | 'dark';
  language: 'en' | 'th';
}

const getInitialTheme = (): 'light' | 'dark' => {
  const savedTheme = Cookies.get('theme');
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
  
  if (typeof window !== 'undefined' && window.matchMedia) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }
  return 'light';
};

const getInitialLanguage = (): 'en' | 'th' => {
  const savedLanguage = Cookies.get('language');
  if (savedLanguage === 'en' || savedLanguage === 'th') return savedLanguage;
  return 'th'; // Default to Thai as requested by system
};

const initialState: SettingsState = {
  theme: getInitialTheme(),
  language: getInitialLanguage(),
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
      Cookies.set('theme', action.payload, { expires: 365 });
    },
    setLanguage: (state, action: PayloadAction<'en' | 'th'>) => {
      state.language = action.payload;
      Cookies.set('language', action.payload, { expires: 365 });
    },
    toggleTheme: (state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      state.theme = newTheme;
      Cookies.set('theme', newTheme, { expires: 365 });
    }
  },
});

export const { setTheme, setLanguage, toggleTheme } = settingsSlice.actions;
export default settingsSlice.reducer;
