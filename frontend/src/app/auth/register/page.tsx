'use client';

import { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Link as MuiLink, Alert, CircularProgress, Grid, MenuItem } from '@mui/material';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'next/navigation';
import api from '@/services/api';

const schema = yup.object().shape({
  username: yup.string().required('Username is required').min(3, 'Minimum 3 characters').max(100, 'Maximum 100 characters'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase and number'),
  confirm_password: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Confirm password is required'),
  first_name: yup.string().required('First name is required'),
  last_name: yup.string().required('Last name is required'),
  position: yup.string().required('Position is required'),
  mobile_phone: yup.string().required('Phone number is required'),
  office_phone: yup.string().optional(),
  company_id: yup.string().required('Company is required'),
  site: yup.string().optional(),
  department_code: yup.string().optional(),
  department_name: yup.string().optional(),
});

const POSITIONS = [
  "เจ้าหน้าที่",
  "ผู้จัดการแผนก",
  "หัวหน้าแผนก",
  "ผู้จัดการโรงงาน"
];

const COMPANIES = [
  { id: "1", company_name: "THONGCHAI INDUSTRIES CO., LTD.", company_code: "TCI" },
  { id: "2", company_name: "THAI RADIATOR MFG. CO.,LTD.", company_code: "TRM" },
  { id: "3", company_name: "THONGCHAI MITOYO CO., LTD.", company_code: "TMC" },
  { id: "4", company_name: "AGS AUTO PARTS CO., LTD.", company_code: "AGS" },
  { id: "5", company_name: "TR ASIA CO.,LTD.", company_code: "TRA" },
  { id: "6", company_name: "TR TECHNICAL CENTER Co.,LTD.", company_code: "TTC" },
  { id: "7", company_name: "THONGCHAI MANUFACTURING CO.,LTD.", company_code: "TCM" }
];

export default function RegisterPage() {
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
      const { confirm_password, ...submitData } = data;
      const response = await api.post<any, any>('/auth/register', submitData);
      
      if (response.success) {
        setSuccess('Registration successful! Please check your email for the verification code.');
        setTimeout(() => {
          router.push(`/auth/verify-otp?email=${data.email}`);
        }, 2000);
      }
    } catch (err: any) {
      if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        setError(err.errors.map((e: any) => e.message).join(', '));
      } else {
        setError(err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 4, borderRadius: 3, maxWidth: 600, width: '100%', mx: 'auto' }}>
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
          Create Account
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Join NatPrachum TCI DEMO today
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              required
              fullWidth
              label="First Name"
              {...register('first_name')}
              error={!!errors.first_name}
              helperText={errors.first_name?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              required
              fullWidth
              label="Last Name"
              {...register('last_name')}
              error={!!errors.last_name}
              helperText={errors.last_name?.message}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              required
              fullWidth
              label="Username"
              {...register('username')}
              error={!!errors.username}
              helperText={errors.username?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              required
              fullWidth
              select
              label="ตำแหน่ง (Position)"
              defaultValue=""
              {...register('position')}
              error={!!errors.position}
              helperText={errors.position?.message}
            >
              {POSITIONS.map((pos) => (
                <MenuItem key={pos} value={pos}>{pos}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              required
              fullWidth
              select
              label="บริษัท (Company)"
              defaultValue=""
              {...register('company_id')}
              error={!!errors.company_id}
              helperText={errors.company_id?.message}
            >
              {COMPANIES.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.company_code} - {c.company_name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="ไซส (Site)"
              {...register('site')}
              error={!!errors.site}
              helperText={errors.site?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="รหัสแผนก (Department Code)"
              {...register('department_code')}
              error={!!errors.department_code}
              helperText={errors.department_code?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="ชื่อแผนก (Department Name)"
              {...register('department_name')}
              error={!!errors.department_name}
              helperText={errors.department_name?.message}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              required
              fullWidth
              label="เบอร์โทรศัพท์ (Mobile Phone)"
              {...register('mobile_phone')}
              error={!!errors.mobile_phone}
              helperText={errors.mobile_phone?.message}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="เบอร์โต๊ะทำงาน (Office Phone)"
              {...register('office_phone')}
              error={!!errors.office_phone}
              helperText={errors.office_phone?.message}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              required
              fullWidth
              label="Email Address"
              type="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              required
              fullWidth
              label="Password"
              type="password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              required
              fullWidth
              label="Confirm Password"
              type="password"
              {...register('confirm_password')}
              error={!!errors.confirm_password}
              helperText={errors.confirm_password?.message}
            />
          </Grid>
        </Grid>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading || !!success}
          sx={{ mt: 4, mb: 2, height: 48 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
        </Button>

        <Box sx={{ textAlign: 'center', mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{' '}
            <MuiLink component={Link} href="/auth/login" sx={{ fontWeight: 600 }}>
              Sign in
            </MuiLink>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Forgot your password?{' '}
            <MuiLink component={Link} href="/auth/forgot-password" sx={{ fontWeight: 600 }}>
              Reset it here
            </MuiLink>
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
