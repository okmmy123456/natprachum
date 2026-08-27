'use client';

import { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Link as MuiLink, Alert, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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
  const router = useRouter();
  const dispatch = useAppDispatch();

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
          disabled={loading}
          sx={{ 
            mt: 4, 
            mb: 3, 
            height: 54, 
            borderRadius: 2,
            fontSize: '1.1rem',
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
