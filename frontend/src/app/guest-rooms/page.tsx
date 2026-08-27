'use client';

import { useEffect, useState, Suspense } from 'react';
import { 
  Box, Typography, Container, Grid, Card, CardMedia, CardContent, 
  CardActions, Button, Chip, CircularProgress, Divider, Paper, IconButton
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useSearchParams, useRouter } from 'next/navigation';
import api, { BASE_URL } from '@/services/api';
import Link from 'next/link';

function RoomCard({ room }: { room: any }) {
  const [imageIndex, setImageIndex] = useState(0);
  
  const images = (room.RoomImages || [])
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .slice(0, 3);
    
  const handlePrev = () => {
    setImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  
  const handleNext = () => {
    setImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };
  
  const currentImage = images[imageIndex];
  const imageUrl = currentImage 
    ? (currentImage.image_url.startsWith('http') ? currentImage.image_url : `${BASE_URL}${currentImage.image_url}`)
    : 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800';

  return (
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
      <Card 
        elevation={0}
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'grey.200',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
          }
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <CardMedia
            component="img"
            height="200"
            image={imageUrl}
            alt={room.room_name}
          />
          {images.length > 1 && (
            <>
              <IconButton 
                size="small" 
                onClick={handlePrev}
                sx={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' } }}
              >
                <ArrowBackIosNewIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={handleNext}
                sx={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' } }}
              >
                <ArrowForwardIosIcon fontSize="small" />
              </IconButton>
              <Box sx={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 0.5 }}>
                {images.map((_: any, i: number) => (
                  <Box key={i} sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: i === imageIndex ? 'primary.main' : 'rgba(255,255,255,0.7)' }} />
                ))}
              </Box>
            </>
          )}
          {room.auto_approve && (
            <Chip 
              label="Auto Approve" 
              size="small" 
              color="info" 
              sx={{ position: 'absolute', top: 12, right: 12, fontWeight: 'bold' }}
            />
          )}
        </Box>
        
        <CardContent sx={{ flexGrow: 1, p: 3 }}>
          <Typography gutterBottom variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
            {room.room_name}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mb: 1 }}>
            <LocationOnIcon sx={{ fontSize: 18, mr: 0.5 }} />
            <Typography variant="body2">{room.location}{room.additional_location ? ` - ${room.additional_location}` : ''}</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mb: 2 }}>
            <PeopleIcon sx={{ fontSize: 18, mr: 0.5 }} />
            <Typography variant="body2">Capacity: {room.capacity} people</Typography>
          </Box>

          {room.description && (
            <Typography variant="body2" color="text.secondary" sx={{ 
              mb: 2, 
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {room.description}
            </Typography>
          )}

          {room.RoomEquipments && room.RoomEquipments.length > 0 && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {room.RoomEquipments.slice(0, 3).map((eq: any, i: number) => (
                  <Chip key={i} label={eq.Equipment?.equipment_name || 'Equipment'} size="small" variant="outlined" />
                ))}
                {room.RoomEquipments.length > 3 && (
                  <Chip label={`+${room.RoomEquipments.length - 3}`} size="small" variant="outlined" />
                )}
              </Box>
            </>
          )}
        </CardContent>
        <CardActions sx={{ p: 2, pt: 0 }}>
          <Button 
            component={Link}
            href={`/booking?room_id=${room.id}`}
            variant="contained" 
            fullWidth
            size="large"
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
          >
            Book Now
          </Button>
        </CardActions>
      </Card>
    </Grid>
  );
}

function GuestRoomsContent() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const location = searchParams.get('location');
  const router = useRouter();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const res = await api.get<any, any>('/rooms', { params: { location } });
        if (res.success) {
          setRooms(res.data?.data || res.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch rooms:', error);
      } finally {
        setLoading(false);
      }
    };

    if (location) {
      fetchRooms();
    } else {
      router.push('/');
    }
  }, [location, router]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 6 }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              startIcon={<ArrowBackIcon />} 
              onClick={() => router.push('/')}
              sx={{ mr: 2, color: 'text.secondary' }}
            >
              Back
            </Button>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }} color="primary">
              Meeting Rooms - {location}
            </Typography>
          </Box>
          <Button 
            variant="outlined" 
            color="primary"
            startIcon={<EventAvailableIcon />}
            onClick={() => router.push(location ? `/guest-calendar?location=${encodeURIComponent(location)}` : '/guest-calendar')}
          >
            ดูตารางคิวห้อง (View Calendar)
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
            <CircularProgress />
          </Box>
        ) : rooms.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <EventAvailableIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              No meeting rooms found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              There are currently no active meeting rooms in {location}.
            </Typography>
            <Button variant="outlined" onClick={() => router.push('/')}>
              Select Another Location
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={4}>
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}

export default function GuestRoomsPage() {
  return (
    <Suspense fallback={
      <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    }>
      <GuestRoomsContent />
    </Suspense>
  );
}
