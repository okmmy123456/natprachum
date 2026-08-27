const fs = require('fs');
const path = 'frontend/src/app/guest-bookings/page.tsx';

const code = `
'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Grid, Card, CardContent
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MainLayout from '@/components/layout/MainLayout';
import api from '@/services/api';
import dayjs from 'dayjs';

export default function GuestBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<any, any>('/bookings?is_guest_booking=true');
      if (res.success) {
        setBookings(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch guest bookings', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleView = (booking: any) => {
    setSelectedBooking(booking);
    setViewOpen(true);
  };

  const renderStatus = (status: any) => {
    if (!status) return <Chip label="Unknown" />;
    return (
      <Chip 
        label={status.status_name} 
        size="small"
        sx={{ 
          backgroundColor: status.color || '#e0e0e0',
          color: '#fff',
          fontWeight: 'bold'
        }}
      />
    );
  };

  return (
    <MainLayout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Guest Bookings History
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: 'background.default' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Booking No.</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Guest Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Room</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date & Time</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      No guest bookings found
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings.map((booking) => (
                    <TableRow key={booking.id} hover>
                      <TableCell>{booking.booking_no}</TableCell>
                      <TableCell>{booking.guest_name}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{booking.guest_email}</Typography>
                        <Typography variant="body2" color="textSecondary">{booking.guest_phone}</Typography>
                      </TableCell>
                      <TableCell>{booking.Room?.room_name}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {dayjs(booking.booking_date).format('DD MMM YYYY')}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)}
                        </Typography>
                      </TableCell>
                      <TableCell>{renderStatus(booking.Status)}</TableCell>
                      <TableCell align="right">
                        <IconButton color="primary" onClick={() => handleView(booking)}>
                          <VisibilityIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* View Dialog */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Guest Booking Details</DialogTitle>
        <DialogContent dividers>
          {selectedBooking && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Booking Information</Typography>
                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography><strong>No:</strong> {selectedBooking.booking_no}</Typography>
                  <Typography><strong>Name:</strong> {selectedBooking.booking_name}</Typography>
                  <Typography><strong>Purpose:</strong> {selectedBooking.purpose}</Typography>
                  <Typography><strong>Participants:</strong> {selectedBooking.participant_count} persons</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Guest Details</Typography>
                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography><strong>Name:</strong> {selectedBooking.guest_name}</Typography>
                  <Typography><strong>Email:</strong> {selectedBooking.guest_email}</Typography>
                  <Typography><strong>Phone:</strong> {selectedBooking.guest_phone || '-'}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">Schedule & Room</Typography>
                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography><strong>Room:</strong> {selectedBooking.Room?.room_name} ({selectedBooking.Room?.location})</Typography>
                  <Typography>
                    <strong>Date & Time:</strong> {dayjs(selectedBooking.booking_date).format('DD MMMM YYYY')} 
                    {' '}({selectedBooking.start_time?.slice(0, 5)} - {selectedBooking.end_time?.slice(0, 5)})
                  </Typography>
                </Box>
              </Grid>
              {selectedBooking.additional_note && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Additional Notes</Typography>
                  <Typography sx={{ mt: 1 }}>{selectedBooking.additional_note}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
`;

fs.mkdirSync('frontend/src/app/guest-bookings', { recursive: true });
fs.writeFileSync(path, code);
console.log('Created guest-bookings/page.tsx');
