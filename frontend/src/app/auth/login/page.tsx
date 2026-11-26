'use client';

import { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Paper, Link as MuiLink, Alert, CircularProgress, Divider } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShieldIcon from '@mui/icons-material/Shield';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import api from '@/services/api';

const schema = yup.object().shape({
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required'),
  remember_me: yup.boolean().default(false),
});

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSsoLoading, setIsSsoLoading] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'TCICONNECT_AUTH_SUCCESS') {
        const { access_token, refresh_token, user } = event.data;
        if (access_token && user) {
          dispatch(setCredentials({ user, access_token, refresh_token }));
          router.push('/dashboard');
        }
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'tciconnect_auth_event') {
        router.push('/dashboard');
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
    };
  }, [dispatch, router]);

  const handleTciConnectLogin = async () => {
    try {
      setError('');
      setIsSsoLoading(true);

      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://172.10.3.106:5013';
      const redirectUri = `${currentOrigin}/auth/callback`;

      let authorizeUrl = `http://172.10.3.106:5009/api/oauth/authorize?client_id=app_natprachum_01&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;

      try {
        const res: any = await api.get('/auth/tciconnect/config');
        if (res?.success && res?.data) {
          const { authorizeUrl: baseAuth, clientId } = res.data;
          authorizeUrl = `${baseAuth}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
        }
      } catch (cfgErr) {
        console.warn('Failed to fetch SSO config, using defaults', cfgErr);
      }

      // Open in popup or new tab so current page is preserved
      const width = 560;
      const height = 680;
      const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
      const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);

      const popup = window.open(
        authorizeUrl,
        'tciconnect_sso',
        `width=${width},height=${height},left=${left},top=${top},status=yes,scrollbars=yes,resizable=yes`
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        window.open(authorizeUrl, '_blank');
      }
    } catch (err: any) {
      setError('ไม่สามารถเปิดหน้าต่าง TciConnect ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSsoLoading(false);
    }
  };

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data: any) => {
    try {
      setError('');
      setLoading(true);
      const response = await api.post<any, any>('/auth/login', data);
      
      if (response.success) {
        dispatch(setCredentials({
          user: response.data.user,
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token
        }));
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 4 } }}>
      <Button component={Link} href='/' startIcon={<ArrowBackIcon />} sx={{ mb: 3, color: 'text.secondary' }}>กลับหน้าหลัก (Back to Home)</Button>
      <Box sx={{ mb: 4, textAlign: 'left' }}>
        <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main', mb: 1.5, letterSpacing: '-0.5px' }}>
          NatPrachum
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
          Welcome back! Please login to your account.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField
          margin="normal"
          required
          fullWidth
          id="username"
          label="Username"
          autoComplete="username"
          autoFocus
          {...register('username')}
          error={!!errors.username}
          helperText={errors.username?.message}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': { borderRadius: 2 }
          }}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          label="Password"
          type="password"
          id="password"
          autoComplete="current-password"
          {...register('password')}
          error={!!errors.password}
          helperText={errors.password?.message}
          sx={{
            mb: 1,
            '& .MuiOutlinedInput-root': { borderRadius: 2 }
          }}
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          <MuiLink component={Link} href="/auth/forgot-password" variant="body2" sx={{ fontWeight: 600 }}>
            Forgot password?
          </MuiLink>
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading || isSsoLoading}
          sx={{ 
            mt: 4, 
            mb: 2, 
            height: 52, 
            borderRadius: 2,
            fontSize: '1.05rem',
            fontWeight: 700,
            textTransform: 'none',
            boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.39)',
            '&:hover': {
              boxShadow: '0 6px 20px rgba(79, 70, 229, 0.23)',
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.2s ease-in-out'
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
        </Button>

        <Box sx={{ my: 2.5, display: 'flex', alignItems: 'center' }}>
          <Divider sx={{ flexGrow: 1 }} />
          <Typography variant="body2" sx={{ px: 2, color: 'text.secondary', fontWeight: 600 }}>
            หรือ (OR)
          </Typography>
          <Divider sx={{ flexGrow: 1 }} />
        </Box>

        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={isSsoLoading || loading}
          onClick={handleTciConnectLogin}
          startIcon={isSsoLoading ? <CircularProgress size={20} color="inherit" /> : <ShieldIcon />}
          sx={{
            height: 52,
            borderRadius: 2,
            fontSize: '1rem',
            fontWeight: 700,
            textTransform: 'none',
            background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
            color: '#FFFFFF',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
            '&:hover': {
              background: 'linear-gradient(135deg, #172554 0%, #1D4ED8 100%)',
              boxShadow: '0 6px 20px rgba(37, 99, 235, 0.45)',
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          {isSsoLoading ? 'กำลังเปิดหน้าต่าง TciConnect...' : 'เข้าสู่ระบบด้วย TciConnect'}
        </Button>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body1" color="text.secondary">
            Don't have an account?{' '}
            <MuiLink component={Link} href="/auth/register" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Sign up
            </MuiLink>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
