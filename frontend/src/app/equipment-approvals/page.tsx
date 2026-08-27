'use client';

import { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import api from '@/services/api';
import dayjs from 'dayjs';

export default function EquipmentApprovalsPage() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Equipment Rejection State
  const [rejectingEqId, setRejectingEqId] = useState<number | null>(null);
  const [rejectEqReason, setRejectEqReason] = useState('');
  
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await api.get<any, any>('/approvals/pending-equipment');
      if (res.success) setPending(res.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleApproveEquipment = async (id: number) => {
    if (!confirm('Are you sure you want to approve the EQUIPMENT request for this booking?')) return;
    try {
      setProcessing(true);
      const res = await api.put<any, any>(`/approvals/${id}/equipment/approve`, {});
      if (res.success) fetchPending();
    } catch (error: any) { alert(error.message || 'Failed to approve equipment'); }
    finally { setProcessing(false); }
  };

  const handleRejectEquipment = async () => {
    if (!rejectingEqId || !rejectEqReason) return;
    try {
      setProcessing(true);
      const res = await api.put<any, any>(`/approvals/${rejectingEqId}/equipment/reject`, { reason: rejectEqReason });
      if (res.success) {
        setRejectingEqId(null);
        setRejectEqReason('');
        fetchPending();
      }
    } catch (error: any) { alert(error.message || 'Failed to reject equipment'); }
    finally { setProcessing(false); }
  };

  return (
    <MainLayout>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Equipment Approvals</Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : pending.length === 0 ? (
        <Typography color="text.secondary" align="center" sx={{ py: 8 }}>No pending equipment requests to approve.</Typography>
      ) : (
        <Grid container spacing={3}>
          {pending.map(b => {
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
                    
                    {b.edit_notes && (
                      <Box sx={{ mb: 2, p: 1.5, bgcolor: 'rgba(237, 108, 2, 0.1)', borderRadius: 1, border: '1px dashed', borderColor: 'warning.main' }}>
                        <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600 }}>
                          ⚠️ มีการแก้ไข/ขออุปกรณ์เพิ่ม:
                        </Typography>
                        <Typography variant="body2" color="warning.main" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                          {b.edit_notes}
                        </Typography>
                      </Box>
                    )}

                    {b.BookingEquipments && b.BookingEquipments.length > 0 ? (
                      <Box sx={{ mt: 2, p: 1.5, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.main' }}>
                        <Typography variant="subtitle2" color="info.main" sx={{ mb: 0.5 }}>รายการอุปกรณ์ที่ขอ:</Typography>
                        <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'text.secondary', fontSize: '0.875rem' }}>
                          {b.BookingEquipments.map((eq: any, idx: number) => (
                            <li key={idx}>{eq.Equipment?.equipment_name || 'Unknown Item'}</li>
                          ))}
                        </ul>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
                        ไม่มีรายการอุปกรณ์ที่ระบุ (หรืออาจถูกลบไปแล้ว)
                      </Typography>
                    )}
                  </CardContent>

                  {/* Equipment Approval Actions */}
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'secondary.main', fontWeight: 600 }}>Equipment Action</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button variant="contained" color="secondary" fullWidth disabled={processing} onClick={() => handleApproveEquipment(b.id)}>Approve Eq.</Button>
                      <Button variant="outlined" color="error" fullWidth disabled={processing} onClick={() => setRejectingEqId(b.id)}>Reject Eq.</Button>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Equipment Reject Dialog */}
      <Dialog open={!!rejectingEqId} onClose={() => !processing && setRejectingEqId(null)} fullWidth maxWidth="sm">
        <DialogTitle>Reject EQUIPMENT Request</DialogTitle>
        <DialogContent dividers>
          <TextField 
            label="Reason for equipment rejection" 
            fullWidth 
            multiline 
            rows={3} 
            sx={{ mt: 1 }} 
            value={rejectEqReason} 
            onChange={(e) => setRejectEqReason(e.target.value)} 
            required 
            autoFocus 
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectingEqId(null)} disabled={processing}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleRejectEquipment} disabled={processing || !rejectEqReason}>Reject Equipment</Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
