'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Typography, Card, CardContent, Grid, Button, Table, TableHead, TableRow, TableCell, TableBody, Paper, CircularProgress, TablePagination } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { CardMedia, IconButton } from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import api, { BASE_URL } from '@/services/api';

export default function RoomDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  
  const [room, setRoom] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  useEffect(() => {
    if (roomId) {
      fetchRoomDetails();
      fetchBookings();
    }
  }, [roomId]);

  const fetchRoomDetails = async () => {
    try {
      const res = await api.get<any, any>(`/rooms/${roomId}`);
      if (res.success) setRoom(res.data);
    } catch (error) { console.error(error); }
  };

  const fetchBookings = async () => {
    try {
      const res = await api.get<any, any>(`/bookings?room_id=${roomId}&limit=100`);
      if (res.success) {
        setBookings(res.data?.data || res.data || []);
      }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      </MainLayout>
    );
  }

  if (!room) {
    return (
      <MainLayout>
        <Typography color="error">Room not found.</Typography>
      </MainLayout>
    );
  }

  const images = (room?.RoomImages || []).sort((a: any, b: any) => a.sort_order - b.sort_order);

  const handlePrevImage = () => {
    setImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  
  const handleNextImage = () => {
    setImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <MainLayout>
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/rooms')}>Back to Rooms</Button>
      </Box>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            {images.length > 0 && (
              <Box sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="250"
                  image={images[imageIndex].image_url.startsWith('http') ? images[imageIndex].image_url : `${BASE_URL}${images[imageIndex].image_url}`}
                  alt={room.room_name}
                />
                {images.length > 1 && (
                  <>
                    <IconButton 
                      size="small" 
                      onClick={handlePrevImage}
                      sx={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' } }}
                    >
                      <ArrowBackIosNewIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={handleNextImage}
                      sx={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' } }}
                    >
                      <ArrowForwardIosIcon fontSize="small" />
                    </IconButton>
                    <Box sx={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center', width: '90%' }}>
                      {images.map((_: any, i: number) => (
                        <Box key={i} sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: i === imageIndex ? 'primary.main' : 'rgba(255,255,255,0.7)' }} />
                      ))}
                    </Box>
                  </>
                )}
              </Box>
            )}
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>{room.room_name}</Typography>
              <Typography color="text.secondary" sx={{ mb: 1 }}><strong>Location:</strong> {room.location}</Typography>
              <Typography color="text.secondary" sx={{ mb: 1 }}><strong>Capacity:</strong> {room.capacity} people</Typography>
              <Typography color="text.secondary" sx={{ mb: 1 }}>
                <strong>Person in charge:</strong> {room.Owners && room.Owners.length > 0 ? room.Owners.map((o: any) => `${o.first_name} ${o.last_name}`).join(', ') : 'None'}
              </Typography>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Remarks / Description</Typography>
                <Typography variant="body2">{room.description || 'No description provided.'}</Typography>
              </Box>
              
              {room.qr_code_url && (
                <Box sx={{ mt: 4, textAlign: 'center', p: 2, border: '1px dashed #ccc', borderRadius: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Scan to Book</Typography>
                  <img src={room.qr_code_url} alt="QR Code" style={{ width: '100%', maxWidth: 180, height: 'auto' }} />
                  <br />
                  <a href={room.qr_code_url} download={`room-${room.id}-qr.png`} style={{ textDecoration: 'none' }}>
                    <Button variant="outlined" size="small" sx={{ mt: 1 }}>Download QR Code</Button>
                  </a>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 8 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Booking History</Typography>
          <Paper sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.default' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Booked By</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Purpose</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookings.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>{new Date(b.booking_date).toLocaleDateString('en-GB')}</TableCell>
                    <TableCell>{b.start_time.substring(0, 5)} - {b.end_time.substring(0, 5)}</TableCell>
                    <TableCell>
                      {b.is_guest_booking ? (
                        <Typography variant="body2" color="secondary">Guest: {b.guest_name} {b.guest_phone ? `(${b.guest_phone})` : ''}</Typography>
                      ) : (
                        b.User ? `${b.User.first_name} ${b.User.last_name} ${b.User.mobile_phone || b.User.office_phone ? `(${b.User.mobile_phone || b.User.office_phone})` : ''}` : 'Unknown'
                      )}
                    </TableCell>
                    <TableCell>{b.purpose || '-'}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ 
                        color: b.Status?.status_code === 'approved' ? 'success.main' : 
                               b.Status?.status_code === 'rejected' ? 'error.main' : 'warning.main',
                        fontWeight: 500
                      }}>
                        {b.Status?.status_name || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {bookings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">No bookings found for this room.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={bookings.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="รายการต่อหน้า (Rows per page):"
            />
          </Paper>
        </Grid>
      </Grid>
    </MainLayout>
  );
}
