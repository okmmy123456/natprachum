'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Box, Button, Typography, Paper, TextField, CircularProgress, 
  Alert, Grid, Card, CardContent, Divider, Select, MenuItem, Checkbox, ListItemText, InputLabel, FormControl, Chip 
, Accordion, AccordionSummary, AccordionDetails, FormControlLabel, Collapse, IconButton , Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import PeopleIcon from '@mui/icons-material/People';
import { CardMedia } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';

import api, { BASE_URL } from '@/services/api';

interface DinerRow {
  diner_name: string;
  company?: string;
  department?: string;
  department_code?: string;
}
const emptyDinerRow = (): DinerRow => ({ diner_name: '', company: '', department: '', department_code: '' });

function BookingForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = searchParams.get('room_id');
  const editId = searchParams.get('edit');
  const isEditing = !!editId;

  const [room, setRoom] = useState<any>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<{id: number, email: string} | null>(null);

  const [equipments, setEquipments] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    additional_equipments: [] as string[],
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    guest_company_id: '',
    guest_department_code: '',
    guest_department_name: '',
    booking_name: '',
    participant_count: '',
    booking_date: searchParams.get('date') || new Date().toLocaleDateString('en-CA'),
    start_time: searchParams.get('start') || '',
    end_time: searchParams.get('end') || '',
    purpose: ''
  });
  const [requestFood, setRequestFood] = useState(false);
  const [foodForm, setFoodForm] = useState({
    company_name: 'THONGCHAI INDUSTRIES CO., LTD.',
    customer_company: '',
    internal_companies: [] as string[],
    welcome_sign_needed: false,
    welcome_sign_text: '',
    breakfast_time: '',
    breakfast_items: ['', '', '', '', '', ''],
    lunch_time: '',
    lunch_items: ['', '', '', '', '', '', '', '', ''],
    afternoon_time: '',
    afternoon_items: ['', '', '', '', '', ''],
    additional_notes: '',
  });
  const [guestDiners, setGuestDiners] = useState<DinerRow[]>([emptyDinerRow(), emptyDinerRow(), emptyDinerRow()]);
  const [internalDiners, setInternalDiners] = useState<DinerRow[]>([emptyDinerRow(), emptyDinerRow(), emptyDinerRow()]);
  const [dbCompanies, setDbCompanies] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  const updateBreakfastItem = (index: number, value: string) => {
    const newItems = [...foodForm.breakfast_items];
    newItems[index] = value;
    setFoodForm({ ...foodForm, breakfast_items: newItems });
  };

  const updateLunchItem = (index: number, value: string) => {
    const newItems = [...foodForm.lunch_items];
    newItems[index] = value;
    setFoodForm({ ...foodForm, lunch_items: newItems });
  };

  const updateAfternoonItem = (index: number, value: string) => {
    const newItems = [...foodForm.afternoon_items];
    newItems[index] = value;
    setFoodForm({ ...foodForm, afternoon_items: newItems });
  };

  const updateGuestDiner = (index: number, field: keyof DinerRow, value: string) => {
    const newDiners = [...guestDiners];
    newDiners[index] = { ...newDiners[index], [field]: value };
    setGuestDiners(newDiners);
  };

  const updateInternalDiner = (index: number, field: keyof DinerRow, value: string) => {
    const newDiners = [...internalDiners];
    newDiners[index] = { ...newDiners[index], [field]: value };
    setInternalDiners(newDiners);
  };


  useEffect(() => {
    
    const fetchMasterData = async () => {
      try {
        const [compRes, depRes] = await Promise.all([
          api.get<any, any>('/master/companies'),
          api.get<any, any>('/master/departments')
        ]);
        if (compRes.success) setDbCompanies(compRes.data);
        if (depRes.success) setDepartments(depRes.data);
      } catch (err) {
        console.error('Failed to fetch master data', err);
      }
    };
    fetchMasterData();

    const fetchEquipments = async () => {
      try {
        const res = await api.get<any, any>('/master/equipments');
        if (res.success) {
          setEquipments(res.data?.data || res.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch equipments', err);
      }
    };
    fetchEquipments();

    if (roomId) {
      fetchRoomDetails(roomId);
      fetchSchedule(roomId);
    } else if (editId) {
      fetchEditBooking(editId);
    } else {
      setLoading(false);
      setError('No room specified.');
    }
  }, [roomId, editId]);

  const fetchEditBooking = async (id: string) => {
    const token = localStorage.getItem('history_token');
    if (!token) {
      router.push('/');
      return;
    }
    try {
      setLoading(true);
      const res = await api.get<any, any>(`/history/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.success && res.data) {
        const b = res.data;
        setFormData({
          ...formData,
          guest_name: b.guest_name || '',
          guest_email: b.guest_email || '',
          guest_phone: b.guest_phone || '',
          guest_company_id: b.guest_company_id || '',
          guest_department_code: b.guest_department_code || '',
          guest_department_name: b.guest_department_name || '',
          booking_name: b.booking_name || '',
          participant_count: String(b.participant_count || ''),
          booking_date: b.booking_date || '',
          start_time: b.start_time?.substring(0, 5) || '',
          end_time: b.end_time?.substring(0, 5) || '',
          purpose: b.purpose || '',
          additional_equipments: b.BookingEquipments?.map((eq: any) => String(eq.equipment_id)) || []
        });

        if (b.FoodOrder && b.FoodOrder.has_food_order !== false) {
          setRequestFood(true);
          const fo = b.FoodOrder;
          
          let parsedB = Array(6).fill('');
          if (fo.breakfast_items && fo.breakfast_items !== '[]') {
            try { parsedB = JSON.parse(fo.breakfast_items); } catch(e){}
            while(parsedB.length < 6) parsedB.push('');
          }
          let parsedL = Array(9).fill('');
          if (fo.lunch_items && fo.lunch_items !== '[]') {
            try { parsedL = JSON.parse(fo.lunch_items); } catch(e){}
            while(parsedL.length < 9) parsedL.push('');
          }
          let parsedA = Array(6).fill('');
          if (fo.afternoon_items && fo.afternoon_items !== '[]') {
            try { parsedA = JSON.parse(fo.afternoon_items); } catch(e){}
            while(parsedA.length < 6) parsedA.push('');
          }

          setFoodForm({
            ...foodForm,
            company_name: fo.company_name || '',
            customer_company: fo.customer_company || '',
            internal_companies: fo.internal_companies ? JSON.parse(fo.internal_companies) : [],
            welcome_sign_needed: fo.welcome_sign_needed || false,
            welcome_sign_text: fo.welcome_sign_text || '',
            breakfast_time: fo.breakfast_time || '',
            breakfast_items: parsedB,
            lunch_time: fo.lunch_time || '',
            lunch_items: parsedL,
            afternoon_time: fo.afternoon_time || '',
            afternoon_items: parsedA,
            additional_notes: fo.additional_notes || fo.remarks || '',
          });

          // Diners
          const dbGuestDiners = fo.Diners?.filter((d: any) => d.diner_type === 'guest') || [];
          const gd = Array(3).fill(emptyDinerRow());
          dbGuestDiners.forEach((d: any, i: number) => { if(i < 3) gd[i] = { diner_name: d.diner_name, department: d.department || '', company: '', department_code: '' } });
          setGuestDiners(gd);

          const dbInternalDiners = fo.Diners?.filter((d: any) => d.diner_type === 'internal') || [];
          const idn = Array(3).fill(emptyDinerRow());
          dbInternalDiners.forEach((d: any, i: number) => { if(i < 3) idn[i] = { diner_name: d.diner_name, department: d.department || '', company: '', department_code: '' } });
          setInternalDiners(idn);
        }

        await fetchRoomDetails(String(b.room_id));
        await fetchSchedule(String(b.room_id));
      } else {
        setError('Booking not found');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching booking');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async (id: string) => {
    try {
      setLoadingSchedule(true);
      const res = await api.get<any, any>(`/rooms/${id}/schedule`);
      if (res.success) {
        setSchedule(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch schedule', err);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const fetchRoomDetails = async (id: string) => {
    try {
      setLoading(true);
      const res = await api.get<any, any>(`/rooms/${id}`);
      if (res.success) {
        setRoom(res.data);
      } else {
        setError('Room not found.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch room details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalRoomId = roomId || String(room?.id);
    if (!finalRoomId) return;
    
    try {
      setSubmitting(true);
      setError('');
      
      const payload: any = {
        ...formData,
        room_id: parseInt(finalRoomId),
        participant_count: parseInt(formData.participant_count),
        additional_equipments: formData.additional_equipments.map(Number)
      };

      if (requestFood) {
        payload.food_order = {
          has_food_order: true,
          company_name: foodForm.company_name,
          customer_company: foodForm.customer_company,
          internal_companies: foodForm.internal_companies,
          welcome_sign_needed: foodForm.welcome_sign_needed,
          welcome_sign_text: foodForm.welcome_sign_text,
          breakfast_time: foodForm.breakfast_time,
          breakfast_items: foodForm.breakfast_items.filter(s => s.trim() !== ''),
          lunch_time: foodForm.lunch_time,
          lunch_items: foodForm.lunch_items.filter(s => s.trim() !== ''),
          afternoon_time: foodForm.afternoon_time,
          afternoon_items: foodForm.afternoon_items.filter(s => s.trim() !== ''),
          additional_notes: foodForm.additional_notes,
          guest_diners: guestDiners.filter(d => d.diner_name.trim() !== ''),
          internal_diners: internalDiners.filter(d => d.diner_name.trim() !== ''),
        };
      } else {
        payload.food_order = { has_food_order: false };
      }
      
      if (isEditing) {
        const token = localStorage.getItem('history_token');
        const res = await api.put<any, any>(`/history/bookings/${editId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.success) setSuccess(true);
        else setError(res.message || 'Failed to update booking');
      } else {
        const res = await api.post<any, any>('/bookings/guest', payload);
          if (res.success) {
            setSuccess(true);
            if (res.data && res.data.id) {
              setCreatedBooking({ id: res.data.id, email: formData.guest_email });
            }
          } else {
          setError(res.message || 'Failed to submit booking');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !room) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
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
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', py: 6, px: 2 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, textAlign: 'center', color: 'primary.main' }}>
          Book Meeting Room
        </Typography>

        {room && (
          <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            {images.length > 0 ? (
              <Box sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="300"
                  image={images[imageIndex].image_url.startsWith('http') ? images[imageIndex].image_url : `${BASE_URL}${images[imageIndex].image_url}`}
                  alt={room.room_name}
                />
                {images.length > 1 && (
                  <>
                    <IconButton 
                      size="small" 
                      onClick={handlePrevImage}
                      sx={{ position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' } }}
                    >
                      <ArrowBackIosNewIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={handleNextImage}
                      sx={{ position: 'absolute', top: '50%', right: 16, transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' } }}
                    >
                      <ArrowForwardIosIcon fontSize="small" />
                    </IconButton>
                    <Box sx={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', width: '90%' }}>
                      {images.map((_: any, i: number) => (
                        <Box 
                          key={i} 
                          onClick={() => setImageIndex(i)}
                          sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: i === imageIndex ? 'primary.main' : 'rgba(255,255,255,0.7)', cursor: 'pointer' }} 
                        />
                      ))}
                    </Box>
                  </>
                )}
              </Box>
            ) : (
              <Box sx={{ height: 300, bgcolor: 'grey.200', backgroundImage: `url('https://placehold.co/800x300/png?text=No+Image')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            )}
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>{room.room_name}</Typography>
              <Box sx={{ display: 'flex', gap: 3, color: 'text.secondary', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOnIcon sx={{ fontSize: 20, mr: 0.5 }} />
                  <Typography variant="body2">{room.location}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PeopleIcon sx={{ fontSize: 20, mr: 0.5 }} />
                  <Typography variant="body2">Up to {room.capacity} people</Typography>
                </Box>
              </Box>
              <Typography variant="body2">{room.description}</Typography>
            </CardContent>
          </Card>
        )}

        {success ? (
          <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              {isEditing 
                ? 'แก้ไขการจองสำเร็จและส่งอีเมลแจ้งผู้ดูแลห้องแล้ว! (Booking updated successfully!)'
                : 'Booking request submitted successfully! Your booking is pending approval.'}
            </Alert>
            <Button variant="contained" onClick={() => router.push(isEditing ? '/guest-history' : '/auth/login')}>
              {isEditing ? 'กลับไปหน้าประวัติ (Back to History)' : 'Go to Login'}
              </Button>
              <Dialog open={!isEditing && requestFood && createdBooking !== null} onClose={() => setCreatedBooking(null)}>
                <DialogTitle>พิมพ์ใบจองอาหาร (Food Booking Form)</DialogTitle>
                <DialogContent>
                  <Typography gutterBottom>
                    คุณได้ทำรายการจองอาหาร กรุณาดาวน์โหลดหรือพิมพ์ใบจองอาหารเพื่อใช้เป็นหลักฐาน
                  </Typography>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setCreatedBooking(null)}>ปิด (Close)</Button>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={async () => {
                      if (!createdBooking) return;
                      try {
                        const res = await api.post('/bookings/guest/pdf', {
                          booking_id: createdBooking.id,
                          guest_email: createdBooking.email
                        }, { responseType: 'blob' });
                        
                        const url = window.URL.createObjectURL(new Blob([res as any]));
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', `FoodOrder-${createdBooking.id}.pdf`);
                        document.body.appendChild(link);
                        link.click();
                      } catch(err) {
                        alert('Failed to download PDF');
                      }
                    }}
                  >
                    ดาวน์โหลด PDF (Download)
                  </Button>
                </DialogActions>
              </Dialog>
            </Paper>
        ) : (
          <Grid container spacing={4} direction={{ xs: 'column-reverse' as any, md: 'row' as any }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Booking Details</Typography>
                
                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                
                <form onSubmit={handleSubmit}>
<LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <Divider textAlign="left"><Typography variant="body2" color="text.secondary">Guest Information</Typography></Divider>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="Full Name" name="guest_name" required value={formData.guest_name} onChange={handleChange} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="Email" type="email" name="guest_email" required value={formData.guest_email} onChange={handleChange} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="Phone Number" name="guest_phone" required value={formData.guest_phone} onChange={handleChange} />
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>บริษัท (Company)</InputLabel>
                    <Select
                      name="guest_company_id"
                      value={formData.guest_company_id}
                      label="บริษัท (Company)"
                      onChange={(e) => setFormData({...formData, guest_company_id: e.target.value as string})}
                    >
                      <MenuItem value=""><em>None</em></MenuItem>
                      {dbCompanies.map(c => (
                        <MenuItem key={c.id} value={c.id.toString()}>{c.company_name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="รหัสแผนก (Dept Code)" name="guest_department_code" value={formData.guest_department_code} onChange={handleChange} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="ชื่อแผนก (Dept Name)" name="guest_department_name" value={formData.guest_department_name} onChange={handleChange} />
                </Grid>
                
                <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                  <Divider textAlign="left"><Typography variant="body2" color="text.secondary">Meeting Details</Typography></Divider>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth label="Meeting Title" name="booking_name" required value={formData.booking_name} onChange={handleChange} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField fullWidth label="Date" type="date" name="booking_date" slotProps={{ inputLabel: { shrink: true } }} required value={formData.booking_date} onChange={handleChange} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TimePicker
                    label="Start Time"
                    ampm={false}
                    format="HH:mm"
                    minTime={dayjs().set('hour', 8).set('minute', 0).set('second', 0).set('millisecond', 0)}
                    maxTime={dayjs().set('hour', 17).set('minute', 0).set('second', 0).set('millisecond', 0)}
                    shouldDisableTime={(value, view) => view === 'hours' && (value.hour() < 8 || value.hour() > 17)}
                    value={formData.start_time ? dayjs(`2000-01-01T${formData.start_time}`) : null}
                    onChange={(newValue) => setFormData({...formData, start_time: newValue ? newValue.format('HH:mm') : ''})}
                    slotProps={{ textField: { fullWidth: true, required: true, disabled: false } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TimePicker
                    label="End Time"
                    ampm={false}
                    format="HH:mm"
                    minTime={dayjs().set('hour', 8).set('minute', 0).set('second', 0).set('millisecond', 0)}
                    maxTime={dayjs().set('hour', 17).set('minute', 0).set('second', 0).set('millisecond', 0)}
                    shouldDisableTime={(value, view) => view === 'hours' && (value.hour() < 8 || value.hour() > 17)}
                    value={formData.end_time ? dayjs(`2000-01-01T${formData.end_time}`) : null}
                    onChange={(newValue) => setFormData({...formData, end_time: newValue ? newValue.format('HH:mm') : ''})}
                    slotProps={{ textField: { fullWidth: true, required: true, disabled: false } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField fullWidth label="Participants" type="number" name="participant_count" required value={formData.participant_count} onChange={handleChange} />
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                  <TextField fullWidth multiline rows={3} label="Purpose" name="purpose" value={formData.purpose} onChange={handleChange} />
                </Grid>
                
                <Grid size={{ xs: 12 }}>
                  {room && (() => {
                    const roomEquipmentIds = room?.RoomEquipments?.map((re: any) => re.equipment_id.toString()) || [];
                    
                    return (
                      <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle2" gutterBottom color="text.secondary">Equipment in Room:</Typography>
                        {roomEquipmentIds.length > 0 ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                            {roomEquipmentIds.map((eqId: string) => {
                              const eq = equipments.find(e => e.id.toString() === eqId);
                              return <Chip key={eqId} label={eq ? eq.equipment_name : eqId} size="small" color="success" variant="outlined" />;
                            })}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>No equipment built-in.</Typography>
                        )}
      
                        <FormControl fullWidth>
                          <InputLabel>Request Additional Equipment (Optional)</InputLabel>
                          <Select
                            multiple
                            value={formData.additional_equipments || []}
                            label="Request Additional Equipment (Optional)"
                            onChange={(e) => setFormData({ ...formData, additional_equipments: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[] })}
                            renderValue={(selected) => (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((value) => {
                                  const eq = equipments.find(e => e.id.toString() === value);
                                  return <Chip key={value} label={eq ? eq.equipment_name : value} size="small" color="primary" />;
                                })}
                              </Box>
                            )}
                          >
                            {equipments.map((eq) => {
                              const isInRoom = roomEquipmentIds.includes(eq.id.toString());
                              return (
                                <MenuItem key={eq.id} value={eq.id.toString()} disabled={isInRoom}>
                                  <Checkbox checked={isInRoom || (formData.additional_equipments || []).indexOf(eq.id.toString()) > -1} />
                                  <ListItemText primary={eq.equipment_name} secondary={isInRoom ? 'Already in room' : ''} />
                                </MenuItem>
                              );
                            })}
                          </Select>
                        </FormControl>
                      </Box>
                    );
                  })()}
                </Grid>
                
                <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
            {/* Food Order Section */}
            <Box sx={{ mt: 3, mb: 3 }}>
              <FormControlLabel
                control={<Checkbox checked={requestFood} onChange={(e) => setRequestFood(e.target.checked)} />}
                label={<Typography sx={{ fontWeight: 'bold' }}>ต้องการสั่งอาหาร / เครื่องดื่มเบรค</Typography>}
              />
              
              <Collapse in={requestFood}>
                <Paper variant="outlined" sx={{ p: 3, mt: 2, borderRadius: 2, borderColor: 'primary.light', bgcolor: '#fafafa' }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RestaurantIcon color="primary" /> แบบฟอร์มสั่งอาหารและเครื่องดื่ม
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Accordion defaultExpanded sx={{ '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: 'action.hover' }}>
                        <Typography sx={{ fontWeight: 600 }}>🏷️ ข้อมูลพื้นฐานการสั่งอาหาร</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <TextField
                          label="บริษัทผู้จัดทำ"
                          size="small"
                          fullWidth
                          sx={{ mb: 2 }}
                          value={foodForm.company_name}
                          onChange={(e) => setFoodForm({ ...foodForm, company_name: e.target.value })}
                        />
                        <FormControlLabel
                          control={<Checkbox checked={foodForm.welcome_sign_needed} onChange={(e) => setFoodForm({ ...foodForm, welcome_sign_needed: e.target.value === 'true' || e.target.checked })} />}
                          label="ต้องการให้ตั้งป้ายต้อนรับ"
                        />
                        <Collapse in={foodForm.welcome_sign_needed}>
                          <TextField
                            label="ข้อความบนป้ายต้อนรับ"
                            size="small"
                            fullWidth
                            sx={{ mt: 1 }}
                            value={foodForm.welcome_sign_text}
                            onChange={(e) => setFoodForm({ ...foodForm, welcome_sign_text: e.target.value })}
                            placeholder="เช่น ยินดีต้อนรับ บริษัท ABC..."
                          />
                        </Collapse>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion defaultExpanded sx={{ '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: 'action.hover' }}>
                        <Typography sx={{ fontWeight: 600 }}>🥞 รายการอาหารเช้า</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ mb: 2 }}>
                            <TextField label="เวลาจัดส่งอาหารเช้า (เช่น 08:30)" size="small" value={foodForm.breakfast_time} onChange={(e) => setFoodForm({...foodForm, breakfast_time: e.target.value})} sx={{ width: 250 }} />
                        </Box>
                        <Grid container spacing={1.5}>
                          {foodForm.breakfast_items.map((item, idx) => (
                            <Grid size={{ xs: 12, sm: 6 }} key={'breakfast-'+idx}>
                              <TextField
                                label={'เมนูที่ ' + (idx + 1)}
                                size="small"
                                fullWidth
                                value={item}
                                onChange={(e) => updateBreakfastItem(idx, e.target.value)}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion defaultExpanded sx={{ '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: 'action.hover' }}>
                        <Typography sx={{ fontWeight: 600 }}>🍱 รายการอาหารมื้อเที่ยง</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ mb: 2 }}>
                            <TextField label="เวลาจัดส่งอาหารเที่ยง (เช่น 12:00)" size="small" value={foodForm.lunch_time} onChange={(e) => setFoodForm({...foodForm, lunch_time: e.target.value})} sx={{ width: 250 }} />
                        </Box>
                        <Grid container spacing={1.5}>
                          {foodForm.lunch_items.map((item, idx) => (
                            <Grid size={{ xs: 12, sm: 6 }} key={'lunch-'+idx}>
                              <TextField
                                label={'เมนูที่ ' + (idx + 1)}
                                size="small"
                                fullWidth
                                value={item}
                                onChange={(e) => updateLunchItem(idx, e.target.value)}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion defaultExpanded sx={{ '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: 'action.hover' }}>
                        <Typography sx={{ fontWeight: 600 }}>👤 ผู้รับประทานอาหาร - ลูกค้าบริษัท</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <TextField
                          label="ชื่อบริษัทลูกค้า"
                          size="small"
                          fullWidth
                          sx={{ mb: 2 }}
                          value={foodForm.customer_company}
                          onChange={(e) => setFoodForm({ ...foodForm, customer_company: e.target.value })}
                        />
                        {guestDiners.map((diner, idx) => (
                          <Box key={'guest-'+idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <Typography sx={{ minWidth: 30, fontWeight: 500, color: 'text.secondary' }}>{idx + 1}.</Typography>
                            <TextField
                              label="ชื่อ"
                              size="small"
                              sx={{ flex: 2 }}
                              value={diner.diner_name}
                              onChange={(e) => updateGuestDiner(idx, 'diner_name', e.target.value)}
                            />
                            <TextField
                              label="แผนก"
                              size="small"
                              sx={{ flex: 1 }}
                              value={diner.department}
                              onChange={(e) => updateGuestDiner(idx, 'department', e.target.value)}
                            />
                          </Box>
                        ))}
                      </AccordionDetails>
                    </Accordion>

                    <Accordion defaultExpanded sx={{ '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: 'action.hover' }}>
                        <Typography sx={{ fontWeight: 600 }}>🏢 ผู้รับประทานอาหาร - พนักงานภายใน</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                          <Typography sx={{ fontWeight: 600, mb: 1.5, color: 'primary.main' }}>บริษัทกลุ่ม ({dbCompanies.map(c => c.company_code).join('/')})</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            {dbCompanies.map(c => (
                              <FormControlLabel
                                key={c.company_code}
                                control={
                                  <Checkbox
                                    checked={foodForm.internal_companies.includes(c.company_code)}
                                    onChange={(e) => {
                                      const newComps = e.target.checked 
                                        ? [...foodForm.internal_companies, c.company_code]
                                        : foodForm.internal_companies.filter(code => code !== c.company_code);
                                      setFoodForm({ ...foodForm, internal_companies: newComps });
                                    }}
                                  />
                                }
                                label={c.company_code}
                              />
                            ))}
                          </Box>
                        </Box>
                        {internalDiners.map((diner, idx) => (
                          <Box key={'internal-'+idx} sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <Typography sx={{ minWidth: 30, fontWeight: 500, color: 'text.secondary' }}>{idx + 1}.</Typography>
                            <TextField
                              label="ชื่อพนักงาน"
                              size="small"
                              sx={{ flex: { xs: '1 1 100%', sm: 2 }, minWidth: 150 }}
                              value={diner.diner_name}
                              onChange={(e) => updateInternalDiner(idx, 'diner_name', e.target.value)}
                            />
                            <FormControl size="small" sx={{ flex: { xs: '1 1 100%', sm: 1 }, minWidth: 120 }}>
                              <InputLabel>แผนก</InputLabel>
                              <Select
                                value={diner.department_code}
                                label="แผนก"
                                onChange={(e) => {
                                  const dpt = departments.find(d => d.department_code === e.target.value);
                                  updateInternalDiner(idx, 'department_code', e.target.value as string);
                                  if (dpt) updateInternalDiner(idx, 'department', dpt.department_name);
                                }}
                              >
                                {departments.map(d => (
                                  <MenuItem key={d.department_code} value={d.department_code}>
                                    {d.department_name} ({d.department_code})
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Box>
                        ))}
                      </AccordionDetails>
                    </Accordion>

                    <TextField
                      label="หมายเหตุ / รายการเพิ่มเติม"
                      multiline
                      rows={2}
                      fullWidth
                      sx={{ mt: 1 }}
                      value={foodForm.additional_notes}
                      onChange={(e) => setFoodForm({ ...foodForm, additional_notes: e.target.value })}
                    />
                  </Box>
                </Paper>
              </Collapse>
            </Box>


                  <Button type="submit" variant="contained" size="large" fullWidth disabled={submitting} sx={{ py: 1.5, borderRadius: 2, fontWeight: 600 }}>
                    {submitting ? <CircularProgress size={24} color="inherit" /> : 'Confirm Booking'}
                  </Button>
                </Grid>
              </Grid>
            </LocalizationProvider>
</form>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', position: 'sticky', top: 24 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
                การจองห้องที่กำลังจัดประชุม
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upcoming or ongoing reserved time slots
              </Typography>
            </Box>
            {loadingSchedule ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={30} />
              </Box>
            ) : schedule.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {schedule.map((s: any, i: number) => {
                  const d = new Date(s.booking_date).toLocaleDateString('en-GB');
                  const userPhone = s.User?.mobile_phone || s.User?.office_phone;
                  const phone = s.User ? userPhone : s.guest_phone;
                  const bookerName = s.User ? `${s.User.first_name} ${s.User.last_name}` : s.guest_name;
                  const booker = `${bookerName}${phone ? ` (${phone})` : ''}`;
                  const title = s.booking_name || 'Meeting';
                  return (
                    <Box key={i} sx={{ p: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.100', borderRadius: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: 'primary.dark' }}>
                        {title}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>📅 {d}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>⏰ {s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: '1px dashed', borderColor: 'primary.200' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                          <PeopleIcon sx={{ fontSize: 14, mr: 0.5 }} /> {booker}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: s.Status?.status_name === 'Approved' ? 'success.main' : 'warning.main' }}>
                          สถานะ: {s.Status?.status_name}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 2, border: '1px dashed grey' }}>
                <Typography variant="body2" color="text.secondary">No upcoming bookings.<br/>The room is completely free!</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    )}
      </Box>
    </Box>
  );
}

export default function GuestBookingPage() {
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
        <CircularProgress />
      </Box>
    }>
      <BookingForm />
    </Suspense>
  );
}
