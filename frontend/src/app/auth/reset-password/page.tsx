'use client';

import { useState, Suspense } from 'react';
import { Box, Button, TextField, Typography, Paper, Alert, CircularProgress, Link as MuiLink } from '@mui/material';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/services/api';

const schema = yup.object().shape({
  otp_code: yup.string().required('OTP code is required').length(6, 'OTP code must be 6 digits'),
  new_password: yup.string().required('New password is required').min(6, 'Minimum 6 characters'),
  confirm_password: yup.string().oneOf([yup.ref('new_password')], 'Passwords must match').required('Confirm password is required'),
});

function ResetPasswordForm() {
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
    try {
      if (!email) {
        setError('Missing email address. Please start the forgot password process again.');
        return;
      }

      setError('');
      setSuccess('');
      setLoading(true);
      
      const payload = {
        email,
        otp_code: data.otp_code,
        new_password: data.new_password
      };
      
      const response = await api.post<any, any>('/auth/reset-password', payload);
      
      if (response.success) {
        setSuccess('Password reset successfully! You can now log in.');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 4, borderRadius: 3, maxWidth: 500, width: '100%', mx: 'auto' }}>
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
          Reset Password
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Enter the 6-digit code sent to <strong>{email}</strong>
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
          autoFocus
          {...register('otp_code')}
          error={!!errors.otp_code}
          helperText={errors.otp_code?.message}
          slotProps={{ htmlInput: { maxLength: 6, style: { textAlign: 'center', fontSize: '24px', letterSpacing: '8px' } } }}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          label="New Password"
          type="password"
          {...register('new_password')}
          error={!!errors.new_password}
          helperText={errors.new_password?.message}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          label="Confirm New Password"
          type="password"
          {...register('confirm_password')}
          error={!!errors.confirm_password}
          helperText={errors.confirm_password?.message}
        />
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading || !!success || !email}
          sx={{ mt: 3, mb: 2, height: 48 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
        </Button>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <MuiLink component={Link} href="/auth/login" sx={{ fontWeight: 600 }}>
            Back to Login
          </MuiLink>
        </Box>
      </Box>
    </Paper>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<CircularProgress />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
