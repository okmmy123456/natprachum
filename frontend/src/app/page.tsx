'use client';

import { Box, Button, Typography, Container, Dialog, DialogTitle, DialogContent, Grid, Card, CardActionArea, TextField, DialogActions, CircularProgress } from '@mui/material';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import MapIcon from '@mui/icons-material/Map';
import DomainIcon from '@mui/icons-material/Domain';
import HistoryIcon from '@mui/icons-material/History';
import { useRouter } from 'next/navigation';
import api from '../services/api';
import { useAppSelector } from '../store/hooks';

export default function Home() {
  const [openLocationDialog, setOpenLocationDialog] = useState(false);
  
  // OTP States
  const [openOtpDialog, setOpenOtpDialog] = useState(false);
  const [otpStep, setOtpStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const router = useRouter();
  const { user, loading: authLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'SuperAdmin' || user.role === 'Admin') {
        router.push('/dashboard');
      } else {
        router.push('/bookings');
      }
    }
  }, [user, authLoading, router]);

  const handleLocationSelect = (location: string) => {
    setOpenLocationDialog(false);
    router.push(`/guest-calendar?location=${encodeURIComponent(location)}`);
  };

  const handleRequestOtp = async () => {
    if (!email) return setErrorMsg('Please enter your email');
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.post<any, any>('/history/request-otp', { email });
      if (res.success) {
        setOtpStep(2);
      } else {
        setErrorMsg(res.message || 'Failed to request OTP');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return setErrorMsg('Please enter the OTP');
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.post<any, any>('/history/verify-otp', { email, otp });
      if (res.success && res.data?.token) {
        localStorage.setItem('history_token', res.data.token);
        setOpenOtpDialog(false);
        router.push('/guest-history');
      } else {
        setErrorMsg(res.message || 'Invalid OTP');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #4F46E5 0%, #10B981 100%)',
        color: 'white',
      }}
    >
      <Container maxWidth="md" sx={{ textAlign: 'center' }}>
        <Typography variant="h1" sx={{ mb: 3, fontWeight: 800 }}>
          NatPrachum TCI DEMO
        </Typography>
        <Typography variant="h4" sx={{ mb: 6, fontWeight: 400, opacity: 0.9 }}>
          The intelligent way to manage and book your meeting rooms.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', mb: 4, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => setOpenLocationDialog(true)}
            sx={{
              backgroundColor: '#FFD700',
              color: '#333',
              px: 6,
              py: 2,
              fontSize: '1.2rem',
              fontWeight: 700,
              boxShadow: '0 4px 14px 0 rgba(255, 215, 0, 0.39)',
              '&:hover': {
                backgroundColor: '#F5C700',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px 0 rgba(255, 215, 0, 0.5)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            จองห้องประชุม (Book Meeting Room)
          </Button>

          <Button
            variant="contained"
            size="large"
            startIcon={<HistoryIcon />}
            onClick={() => {
              setOtpStep(1);
              setEmail('');
              setOtp('');
              setErrorMsg('');
              setOpenOtpDialog(true);
            }}
            sx={{
              backgroundColor: '#0ea5e9',
              color: '#fff',
              px: 6,
              py: 2,
              fontSize: '1.2rem',
              fontWeight: 700,
              boxShadow: '0 4px 14px 0 rgba(14, 165, 233, 0.39)',
              '&:hover': {
                backgroundColor: '#0284c7',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px 0 rgba(14, 165, 233, 0.5)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            ประวัติการจอง (Booking History)
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
          <Button
            component={Link}
            href="/auth/login"
            variant="contained"
            size="large"
            sx={{
              backgroundColor: 'white',
              color: '#4F46E5',
              px: 6,
              py: 2,
              fontSize: '1.1rem',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.9)',
              },
            }}
          >
            Login
          </Button>
          <Button
            component={Link}
            href="/auth/register"
            variant="outlined"
            size="large"
            sx={{
              borderColor: 'white',
              color: 'white',
              borderWidth: 2,
              px: 6,
              py: 2,
              fontSize: '1.1rem',
              fontWeight: 600,
              '&:hover': {
                borderWidth: 2,
                borderColor: 'white',
                backgroundColor: 'rgba(255,255,255,0.1)',
              },
            }}
          >
            Register
          </Button>
        </Box>
      </Container>

      {/* Location Selection Dialog */}
      <Dialog 
        open={openLocationDialog} 
        onClose={() => setOpenLocationDialog(false)}
        maxWidth="md"
        fullWidth
        sx={{ '& .MuiDialog-paper': 
          { borderRadius: 3, p: 2 }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.5rem', color: '#333' }}>
          เลือกสาขาที่ต้องการจอง (Select Location)
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1, mb: 2 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card 
                elevation={3} 
                sx={{ 
                  borderRadius: 3, 
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.05)' } 
                }}
              >
                <CardActionArea onClick={() => handleLocationSelect('บ้านโพธิ์')} sx={{ height: '100%', p: 3, textAlign: 'center' }}>
                  <LocationCityIcon sx={{ fontSize: 60, color: '#4F46E5', mb: 2 }} />
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>บ้านโพธิ์</Typography>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card 
                elevation={3} 
                sx={{ 
                  borderRadius: 3, 
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.05)' } 
                }}
              >
                <CardActionArea onClick={() => handleLocationSelect('บางพลี')} sx={{ height: '100%', p: 3, textAlign: 'center' }}>
                  <DomainIcon sx={{ fontSize: 60, color: '#10B981', mb: 2 }} />
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>บางพลี</Typography>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card 
                elevation={3} 
                sx={{ 
                  borderRadius: 3, 
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.05)' } 
                }}
              >
                <CardActionArea onClick={() => handleLocationSelect('ประตูน้ำ')} sx={{ height: '100%', p: 3, textAlign: 'center' }}>
                  <MapIcon sx={{ fontSize: 60, color: '#F59E0B', mb: 2 }} />
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>ประตูน้ำ</Typography>
                </CardActionArea>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>

      {/* OTP Dialog */}
      <Dialog 
        open={openOtpDialog} 
        onClose={() => setOpenOtpDialog(false)}
        maxWidth="xs"
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: 3, p: 2 } }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>
          {otpStep === 1 ? 'ดูประวัติการจอง' : 'ยืนยันรหัส OTP'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {errorMsg && (
              <Typography color="error" variant="body2" sx={{ mb: 2, textAlign: 'center' }}>
                {errorMsg}
              </Typography>
            )}
            
            {otpStep === 1 ? (
              <>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', textAlign: 'center' }}>
                  กรุณากรอกอีเมลของคุณเพื่อรับรหัส OTP สำหรับดูประวัติการจองห้องประชุม
                </Typography>
                <TextField
                  fullWidth
                  label="Email Address"
                  variant="outlined"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  disabled={loading}
                  autoFocus
                />
              </>
            ) : (
              <>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', textAlign: 'center' }}>
                  ระบบได้ส่งรหัส OTP ไปที่อีเมล <strong>{email}</strong> แล้ว (รหัสมีอายุ 5 นาที)
                </Typography>
                <TextField
                  fullWidth
                  label="6-digit OTP"
                  variant="outlined"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button onClick={() => setOpenOtpDialog(false)} disabled={loading}>ยกเลิก (Cancel)</Button>
          {otpStep === 1 ? (
            <Button variant="contained" onClick={handleRequestOtp} disabled={loading || !email}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'ส่ง OTP'}
            </Button>
          ) : (
            <Button variant="contained" onClick={handleVerifyOtp} disabled={loading || !otp}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'ยืนยัน (Verify)'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
