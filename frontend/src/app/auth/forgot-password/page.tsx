'use client';

import { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Alert, CircularProgress, Link as MuiLink } from '@mui/material';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'next/navigation';
import api from '@/services/api';

const schema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
});

export default function ForgotPasswordPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data: any) => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      const response = await api.post<any, any>('/auth/forgot-password', data);
      
      if (response.success) {
        setSuccess('If this email exists, a reset code has been sent. Please check your inbox.');
        setTimeout(() => {
          router.push(`/auth/reset-password?email=${data.email}`);
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 4, borderRadius: 3, maxWidth: 500, width: '100%', mx: 'auto' }}>
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
          Forgot Password
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Enter your email address to receive a password reset code.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField
          margin="normal"
          required
          fullWidth
          label="Email Address"
          type="email"
          autoFocus
          {...register('email')}
          error={!!errors.email}
          helperText={errors.email?.message}
        />
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading || !!success}
          sx={{ mt: 3, mb: 2, height: 48 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Code'}
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
