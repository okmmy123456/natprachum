'use client';

import { Box, Container, Typography, Card, CardContent, Chip, CircularProgress, Button, Grid, Divider, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../services/api';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RoomIcon from '@mui/icons-material/Room';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import RestaurantIcon from '@mui/icons-material/Restaurant';

interface Booking {
  id: number;
  booking_name: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  participant_count: number;
  Status: {
    status_name: string;
    status_code: string;
  };
  Room: {
    room_name: string;
    location: string;
  };
  FoodOrder?: {
    id: number;
    food_status: string;
  };
}

export default function GuestHistoryPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [canceling, setCanceling] = useState(false);
  const router = useRouter();

  const fetchHistory = async () => {
    const token = localStorage.getItem('history_token');
    if (!token) return;
    try {
      const res = await api.get<any, any>('/history/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.success) {
        setBookings(res.data);
      } else {
        setError(res.message || 'Failed to fetch history');
        if (res.message?.includes('token') || res.message?.includes('Unauthorized')) {
          localStorage.removeItem('history_token');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('history_token');
    if (!token) {
      router.push('/');
      return;
    }
    fetchHistory();
  }, [router]);

  const handleEdit = (id: number) => {
    router.push(`/booking?edit=${id}`);
  };

  
  const handleDownloadFoodPDF = async (foodOrderId: number) => {
    try {
      const token = localStorage.getItem('history_token');
      if (!token) return;
      const response: any = await api.get(`/history/food-orders/${foodOrderId}/pdf`, { 
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob' 
      });
      const url = window.URL.createObjectURL(new Blob([response], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      alert(error.message || 'Failed to download PDF');
    }
  };

const handleCancelClick = (id: number) => {
    setSelectedBookingId(id);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedBookingId) return;
    const token = localStorage.getItem('history_token');
    setCanceling(true);
    try {
      const res = await api.put<any, any>(
        `/history/bookings/${selectedBookingId}/cancel`,
        { cancel_reason: cancelReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.success) {
        setCancelModalOpen(false);
        fetchHistory();
      } else {
        alert(res.message || 'Failed to cancel booking');
      }
    } catch (err: any) {
      alert(err.message || 'Error canceling booking');
    } finally {
      setCanceling(false);
    }
  };

  const getStatusColor = (code: string) => {
    switch (code) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      case 'cancelled': return 'default';
      default: return 'primary';
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f3f4f6', py: 6 }}>
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton onClick={() => router.push('/')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }} color="primary">
            ประวัติการจองของคุณ (Your Booking History)
          </Typography>
        </Box>

        {error ? (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="error" variant="h6" gutterBottom>{error}</Typography>
            <Button variant="contained" onClick={() => router.push('/')} sx={{ mt: 2 }}>
              กลับไปหน้าแรก (Back to Home)
            </Button>
          </Card>
        ) : bookings.length === 0 ? (
          <Card sx={{ p: 6, textAlign: 'center', borderRadius: 4 }}>
            <Typography variant="h6" color="text.secondary">
              ไม่พบประวัติการจองสำหรับอีเมลนี้
              <br />(No booking history found for this email)
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {bookings.map((b) => (
              <Grid size={{ xs: 12 }} key={b.id}>
                <Card sx={{ borderRadius: 4, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {b.booking_name}
                      </Typography>
                      <Chip 
                        label={b.Status?.status_name || b.Status?.status_code} 
                        color={getStatusColor(b.Status?.status_code) as any}
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                        <RoomIcon sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">{b.Room?.room_name} ({b.Room?.location})</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                        <EventIcon sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">{b.booking_date}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                        <AccessTimeIcon sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">
                          {b.start_time.substring(0, 5)} - {b.end_time.substring(0, 5)}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {b.FoodOrder && (
                        <Button variant="outlined" color="secondary" size="small" startIcon={<PictureAsPdfIcon />} onClick={() => handleDownloadFoodPDF(b.FoodOrder!.id)}>
                          พิมพ์ใบจองอาหาร
                        </Button>
                      )}
                      {(b.Status?.status_code === 'pending' || b.Status?.status_code === 'approved') && (
                        <>
                          <Button variant="outlined" color="primary" size="small" onClick={() => handleEdit(b.id)}>
                            แก้ไข (Edit)
                          </Button>
                          <Button variant="outlined" color="error" size="small" onClick={() => handleCancelClick(b.id)}>
                            ยกเลิก (Cancel)
                          </Button>
                        </>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      <Dialog open={cancelModalOpen} onClose={() => setCancelModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>ยืนยันการยกเลิกการจอง</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="เหตุผลที่ยกเลิก (Cancel Reason)"
            type="text"
            fullWidth
            variant="outlined"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelModalOpen(false)} color="inherit">ปิด (Close)</Button>
          <Button onClick={handleConfirmCancel} color="error" variant="contained" disabled={!cancelReason.trim() || canceling}>
            {canceling ? <CircularProgress size={24} /> : 'ยืนยันยกเลิก (Confirm Cancel)'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
