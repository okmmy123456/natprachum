'use client';

import { useState, Suspense } from 'react';
import { Box, Button, TextField, Typography, Paper, Alert, CircularProgress } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/services/api';

const schema = yup.object().shape({
  otp_code: yup.string().required('OTP code is required').length(6, 'OTP must be exactly 6 digits'),
});

function VerifyOTPForm() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data: any) => {
    if (!email) {
      setError('Email is missing');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      const response = await api.post<any, any>('/auth/verify-otp', {
        email,
        otp_code: data.otp_code,
        type: 'register'
      });
      
      if (response.success) {
        setSuccess('Email verified successfully! You can now log in.');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
          Verify Email
        </Typography>
        <Typography variant="body1" color="text.secondary">
          We sent a verification code to <strong>{email}</strong>
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField
          margin="normal"
          required
          fullWidth
          label="6-Digit OTP Code"
          {...register('otp_code')}
          error={!!errors.otp_code}
          helperText={errors.otp_code?.message}
          slotProps={{ htmlInput: { maxLength: 6, style: { textAlign: 'center', fontSize: '24px', letterSpacing: '8px' } } }}
        />
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading || !!success}
          sx={{ mt: 3, mb: 2, height: 48 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify'}
        </Button>
      </Box>
    </Paper>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={<CircularProgress />}>
      <VerifyOTPForm />
    </Suspense>
  );
}
