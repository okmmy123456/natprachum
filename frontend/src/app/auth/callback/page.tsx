'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Typography, Paper, CircularProgress, Alert, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import api from '@/services/api';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('กำลังยืนยันตัวตนกับ TciConnect...');
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      setStatus('error');
      setMessage(errorDescription || error || 'การยืนยันตัวตนไม่สำเร็จหรือถูกยกเลิก');
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage('ไม่พบ Authorization Code จากระบบ TciConnect');
      return;
    }

    const exchangeCode = async () => {
      try {
        const redirectUri = `${window.location.origin}/auth/callback`;

        const res: any = await api.post('/auth/tciconnect/callback', {
          code,
          redirect_uri: redirectUri,
        });

        if (!res.success || !res.data) {
          throw new Error(res.message || 'เกิดข้อผิดพลาดในการแลกเปลี่ยน Token');
        }

        const { access_token, refresh_token, user } = res.data;

        // Dispatch credentials to Redux and Cookies
        dispatch(
          setCredentials({
            user,
            access_token,
            refresh_token,
          })
        );

        // Store event marker for cross-tab storage sync
        localStorage.setItem('tciconnect_auth_event', Date.now().toString());

        setStatus('success');
        setMessage('เข้าสู่ระบบสำเร็จ กำลังพาเข้าสู่ระบบ...');

        // If opened as a popup or child window, postMessage to opener
        if (window.opener && !window.opener.closed) {
          try {
            window.opener.postMessage(
              {
                type: 'TCICONNECT_AUTH_SUCCESS',
                access_token,
                refresh_token,
                user,
              },
              '*'
            );
          } catch (msgErr) {
            console.error('Failed to postMessage to opener:', msgErr);
          }

          // Close popup after brief delay
          setTimeout(() => {
            window.close();
            // If browser prevents close, redirect
            setTimeout(() => {
              router.replace('/dashboard');
            }, 500);
          }, 800);
        } else {
          // If opened in same tab or standalone
          setTimeout(() => {
            router.replace('/dashboard');
          }, 800);
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ TciConnect');
      }
    };

    exchangeCode();
  }, [searchParams, router, dispatch]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 50%, #10B981 100%)',
        p: 3,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: { xs: 4, sm: 5 },
          borderRadius: 4,
          maxWidth: 460,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        }}
      >
        <Box
          component="img"
          src="/favicon.svg"
          alt="NatPrachum Logo"
          sx={{ width: 64, height: 64, mb: 2, mx: 'auto' }}
        />

        <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>
          NatPrachum
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          ระบบยืนยันตัวตน TciConnect SSO
        </Typography>

        {status === 'loading' && (
          <Box sx={{ py: 3 }}>
            <CircularProgress size={52} thickness={4} sx={{ color: '#2563EB', mb: 3 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              กำลังตรวจสอบสิทธิ์...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {message}
            </Typography>
          </Box>
        )}

        {status === 'success' && (
          <Box sx={{ py: 3 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: '#10B981', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#10B981', mb: 1 }}>
              เข้าสู่ระบบสำเร็จ!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {message}
            </Typography>
          </Box>
        )}

        {status === 'error' && (
          <Box sx={{ py: 2 }}>
            <ErrorIcon sx={{ fontSize: 64, color: '#EF4444', mb: 2 }} />
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2, textAlign: 'left' }}>
              {message}
            </Alert>
            <Button
              variant="contained"
              fullWidth
              onClick={() => router.push('/auth/login')}
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontWeight: 700,
                backgroundColor: '#2563EB',
                '&:hover': { backgroundColor: '#1D4ED8' },
              }}
            >
              กลับสู่หน้าเข้าสู่ระบบ (Back to Login)
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
