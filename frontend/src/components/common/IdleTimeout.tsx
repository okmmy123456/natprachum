'use client';
import { useEffect, useState, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { logout } from '@/store/slices/authSlice';
import Cookies from 'js-cookie';

const TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours

export default function IdleTimeout() {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const dispatch = useDispatch();

  const handleLogout = () => {
    setOpen(false);
    router.push('/auth/login');
  };

  const resetTimer = () => {
    if (open || !Cookies.get('access_token')) return; // Don't reset if already timed out
    if (timerRef.current) clearTimeout(timerRef.current);
    
    timerRef.current = setTimeout(() => {
      setOpen(true);
      // Auto logout behind the scenes
      dispatch(logout());
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
    }, TIMEOUT_MS);
  };

  useEffect(() => {
    // Initial setup
    resetTimer();

    // Events to track activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    let throttleTimer = false;
    const handleActivity = () => {
      if (!throttleTimer && !open) {
        resetTimer();
        throttleTimer = true;
        setTimeout(() => { throttleTimer = false; }, 5000); // Throttled to every 5s
      }
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [open]);

  return (
    <Dialog open={open} >
      <DialogTitle sx={{ color: 'error.main', fontWeight: 'bold' }}>เซสชันหมดอายุ (Session Expired)</DialogTitle>
      <DialogContent>
        <Typography>
          คุณไม่ได้ใช้งานระบบเกิน 2 ชั่วโมง ระบบได้ทำการออกจากระบบอัตโนมัติเพื่อความปลอดภัย
          กรุณาเข้าสู่ระบบใหม่อีกครั้ง
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="primary" onClick={handleLogout}>
          ตกลง (Login Again)
        </Button>
      </DialogActions>
    </Dialog>
  );
}
