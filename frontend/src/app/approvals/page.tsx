'use client';

import { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Divider } from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import api from '@/services/api';
import dayjs from 'dayjs';

export default function ApprovalsPage() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Room Rejection State
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await api.get<any, any>('/approvals/pending-room');
      if (res.success) setPending(res.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id: number) => {
    if (!confirm('Are you sure you want to approve this ROOM booking?')) return;
    try {
      setProcessing(true);
      const res = await api.put<any, any>(`/approvals/${id}/approve`, {});
      if (res.success) fetchPending();
    } catch (error: any) { alert(error.message || 'Failed to approve room'); }
    finally { setProcessing(false); }
  };

  const handleReject = async () => {
    if (!rejectingId || !rejectReason) return;
    try {
      setProcessing(true);
      const res = await api.put<any, any>(`/approvals/${rejectingId}/reject`, { reason: rejectReason });
      if (res.success) {
        setRejectingId(null);
        setRejectReason('');
        fetchPending();
      }
    } catch (error: any) { alert(error.message || 'Failed to reject room'); }
    finally { setProcessing(false); }
  };

  return (
    <MainLayout>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Pending Approvals</Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : pending.length === 0 ? (
        <Typography color="text.secondary" align="center" sx={{ py: 8 }}>No pending bookings to approve.</Typography>
      ) : (
        <Grid container spacing={3}>
          {pending.map(b => {
            const isRoomPending = b.Status?.status_code === 'pending';
            const isEquipmentPending = b.equipment_status === 'pending';

            return (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={b.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>{b.booking_name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Room:</strong> {b.Room?.room_name} ({b.Room?.location})
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Date & Time:</strong> {dayjs(b.booking_date).format('DD/MM/YYYY')} {b.start_time.substring(0, 5)} - {b.end_time.substring(0, 5)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Booked By:</strong> {b.is_guest_booking ? `Guest: ${b.guest_name}` : (b.User ? `${b.User.first_name} ${b.User.last_name}` : 'Unknown')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      <strong>Purpose:</strong> {b.purpose || '-'}
                    </Typography>
                    {b.edit_notes && (
                      <Box sx={{ mb: 2, p: 1.5, bgcolor: 'rgba(237, 108, 2, 0.1)', borderRadius: 1, border: '1px dashed', borderColor: 'warning.main' }}>
                        <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600 }}>
                          ⚠️ ข้อมูลที่ถูกแก้ไข/ขอเพิ่ม:
                        </Typography>
                        <Typography variant="body2" color="warning.main" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                          {b.edit_notes}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>

                  {/* Room Approval Actions */}
                  {isRoomPending && (
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main', fontWeight: 600 }}>Room Approval</Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="contained" color="success" fullWidth disabled={processing} onClick={() => handleApprove(b.id)}>Approve Room</Button>
                        <Button variant="outlined" color="error" fullWidth disabled={processing} onClick={() => setRejectingId(b.id)}>Reject Room</Button>
                      </Box>
                    </Box>
                  )}
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Room Reject Dialog */}
      <Dialog open={!!rejectingId} onClose={() => !processing && setRejectingId(null)} fullWidth maxWidth="sm">
        <DialogTitle>Reject ROOM Booking</DialogTitle>
        <DialogContent dividers>
          <TextField 
            label="Reason for room rejection" 
            fullWidth 
            multiline 
            rows={3} 
            sx={{ mt: 1 }} 
            value={rejectReason} 
            onChange={(e) => setRejectReason(e.target.value)} 
            required 
            autoFocus 
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectingId(null)} disabled={processing}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleReject} disabled={processing || !rejectReason}>Reject Room</Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
