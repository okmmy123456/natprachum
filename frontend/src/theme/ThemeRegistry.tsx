'use client';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getAppTheme } from './theme';
import { ReactNode, useState, useEffect, useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';

export default function ThemeRegistry({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  // Safe default until Redux hydrates
  const themeMode = useAppSelector((state) => state.settings?.theme || 'light');
  const theme = useMemo(() => getAppTheme(themeMode), [themeMode]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Render nothing on the server to prevent Hydration errors with Emotion
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
