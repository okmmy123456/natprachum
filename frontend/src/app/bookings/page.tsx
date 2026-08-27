'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { 
  Box, Button, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, Grid, IconButton, Tooltip,
  FormControlLabel, Checkbox, Divider, Collapse, RadioGroup, Radio,
  FormLabel, Accordion, AccordionSummary, AccordionDetails, ListItemText, TablePagination,
  Tabs, Tab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import RemoveCircleOutlinedIcon from '@mui/icons-material/RemoveCircleOutlined';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DevicesIcon from '@mui/icons-material/Devices';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { CardMedia } from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import api, { BASE_URL } from '@/services/api';
import { format } from 'date-fns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';
import { useAppSelector } from '@/store/hooks';

interface DinerRow {
  diner_name: string;
  company?: string;
  department?: string;
  department_code?: string;
}

const emptyDinerRow = (): DinerRow => ({ diner_name: '', company: '', department: '', department_code: '' });

const safeParseJSON = (data: any) => {
  if (!data) return [];
  if (typeof data !== 'string') return data;
  try { return JSON.parse(data); } catch (e) { return Array.isArray(data) ? data : []; }
};

export default function BookingsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === 'SuperAdmin' || user?.role === 'Admin' || user?.role_name === 'SuperAdmin' || user?.role_name === 'Admin' || user?.role_name === 'Super Admin';
  
  useEffect(() => {
    console.log('Current User in Bookings:', user);
    console.log('Is Admin:', isAdmin);
  }, [user]);

  const [currentTab, setCurrentTab] = useState<'my_bookings' | 'all_bookings' | 'guest_bookings'>('my_bookings');

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState<string | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  
  const [formData, setFormData] = useState({
    booking_name: '',
    room_id: searchParams.get('roomId') || '',
    participant_count: '',
    booking_date: searchParams.get('date') || '',
    start_time: searchParams.get('start') || '',
    end_time: searchParams.get('end') || '',
    purpose: '',
    phone_number: ''
  });

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setOpenDialog(true);
      // Remove query params from url without reloading
      router.replace('/bookings', { scroll: false });
    }
  }, [searchParams, router]);

  // Food order state
  const [hasFoodOrder, setHasFoodOrder] = useState(false);
  const [foodForm, setFoodForm] = useState<{
    company_name: string;
    customer_company: string;
    internal_companies: string[];
    welcome_sign_needed: boolean;
    welcome_sign_text: string;
    breakfast_time: string;
    breakfast_items: string[];
    lunch_time: string;
    lunch_items: string[];
    afternoon_time: string;
    afternoon_items: string[];
    additional_notes: string;
  }>({
    company_name: 'THONGCHAI INDUSTRIES CO., LTD.',
    customer_company: '',
    internal_companies: [],
    welcome_sign_needed: false,
    welcome_sign_text: '',
    breakfast_time: '',
    breakfast_items: ['', '', '', '', '', ''],
    lunch_time: '',
    lunch_items: ['', '', '', '', '', '', '', ''],
    afternoon_time: '',
    afternoon_items: ['', '', '', '', '', ''],
    additional_notes: '',
  });
  const [guestDiners, setGuestDiners] = useState<DinerRow[]>([emptyDinerRow(), emptyDinerRow(), emptyDinerRow()]);
  const [internalDiners, setInternalDiners] = useState<DinerRow[]>([emptyDinerRow(), emptyDinerRow(), emptyDinerRow()]);

  // Food order detail dialog
  const [foodDetailOpen, setFoodDetailOpen] = useState(false);
  const [foodDetailData, setFoodDetailData] = useState<any>(null);
  const [foodDetailLoading, setFoodDetailLoading] = useState(false);

  const [dbCompanies, setDbCompanies] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  
  const [equipments, setEquipments] = useState<any[]>([]);
  const [additionalEquipments, setAdditionalEquipments] = useState<string[]>([]);
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
    fetchBookings();
  }, [currentTab]);

  useEffect(() => {
    fetchRooms();
    fetchCompanies();
    fetchEquipments();
  }, []);

  useEffect(() => {
    if (formData.room_id) {
      fetchSchedule(formData.room_id);
    } else {
      setSchedule([]);
    }
  }, [formData.room_id]);

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

  const fetchCompanies = async () => {
    try {
      const res = await api.get<any, any>('/master/companies');
      if (res.success) {
        setDbCompanies(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch companies', error);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      let params = {};
      if (currentTab === 'my_bookings') params = { my_bookings: 'true' };
      if (currentTab === 'guest_bookings') params = { is_guest_booking: 'true' };
      
      const res = await api.get<any, any>('/bookings', { params });
      if (res.success) {
        setBookings(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch bookings', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await api.get<any, any>('/rooms');
      if (res.success) setRooms(res.data?.data || res.data || []);
    } catch (error) { console.error('Failed to fetch rooms', error); }
  };

  const fetchEquipments = async () => {
    try {
      const res = await api.get<any, any>('/master/equipments');
      if (res.success) setEquipments(res.data?.data || res.data || []);
    } catch (error) { console.error('Failed to fetch equipments', error); }
  };

  const handleBook = async () => {
    try {
      setSaving(true);
      const payload: any = {
        ...formData,
        room_id: Number(formData.room_id),
        participant_count: Number(formData.participant_count),
        additional_equipments: additionalEquipments.map(Number)
      };

      if (hasFoodOrder) {
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
      
      let res;
      if (editId) {
        res = await api.put<any, any>(`/bookings/${editId}`, payload);
      } else {
        res = await api.post<any, any>('/bookings', payload);
      }
      
      if (res.success) {
        setOpenDialog(false);
        fetchBookings();
      }
    } catch (error: any) {
      alert(error.message || 'Failed to save booking');
    } finally {
      setSaving(false);
    }
  };

  const resetFoodForm = () => {
    setHasFoodOrder(false);
    setFoodForm({
      company_name: 'THONGCHAI INDUSTRIES CO., LTD.',
      customer_company: '',
      internal_companies: [],
      welcome_sign_needed: false,
      welcome_sign_text: '',
      breakfast_time: '',
      breakfast_items: ['', '', '', '', '', ''],
      lunch_time: '',
      lunch_items: ['', '', '', '', '', '', '', ''],
      afternoon_time: '',
      afternoon_items: ['', '', '', '', '', ''],
      additional_notes: '',
    });
    setGuestDiners([emptyDinerRow(), emptyDinerRow(), emptyDinerRow()]);
    setInternalDiners([emptyDinerRow(), emptyDinerRow(), emptyDinerRow()]);
  };

  const handleOpenDialog = async (booking?: any) => {
    if (booking) {
      setEditId(booking.id);
      setEditStatus(booking.Status?.status_code || null);
      setFormData({
        booking_name: booking.booking_name,
        room_id: booking.room_id.toString(),
        participant_count: booking.participant_count.toString(),
        booking_date: booking.booking_date,
        start_time: booking.start_time.slice(0, 5),
        end_time: booking.end_time.slice(0, 5),
        purpose: booking.purpose || '',
        phone_number: booking.phone_number || ''
      });
      
      setAdditionalEquipments(booking.BookingEquipments ? booking.BookingEquipments.map((e: any) => e.equipment_id.toString()) : []);
      setSelectedLocation('All');
      
      try {
        setLoading(true);
        const res = await api.get<any, any>(`/bookings/${booking.id}`);
        if (res.success && res.data.FoodOrder) {
          const fo = res.data.FoodOrder;
          setHasFoodOrder(true);
          setFoodForm({
            company_name: fo.company_name || 'THONGCHAI INDUSTRIES CO., LTD.',
            customer_company: fo.customer_company || '',
            internal_companies: fo.internal_companies ? safeParseJSON(fo.internal_companies) : [],
            welcome_sign_needed: fo.welcome_sign_needed,
            welcome_sign_text: fo.welcome_sign_text || '',
            breakfast_time: fo.breakfast_time || '',
            breakfast_items: safeParseJSON(fo.breakfast_items).concat(Array(6).fill('')).slice(0, 6),
            lunch_time: fo.lunch_time || '',
            lunch_items: safeParseJSON(fo.lunch_items).concat(Array(9).fill('')).slice(0, 9),
            afternoon_time: fo.afternoon_time || '',
            afternoon_items: safeParseJSON(fo.afternoon_items).concat(Array(6).fill('')).slice(0, 6),
            additional_notes: fo.additional_notes || '',
          });
          
          if (fo.Diners && fo.Diners.length > 0) {
            const gd = fo.Diners.filter((d: any) => d.diner_type === 'guest').map((d: any) => ({ diner_name: d.diner_name, company: d.department || '' }));
            const idiners = fo.Diners.filter((d: any) => d.diner_type === 'internal').map((d: any) => ({ diner_name: d.diner_name, department: d.department || '', department_code: d.department_code || '' }));
            
            setGuestDiners(gd.length > 0 ? gd : [emptyDinerRow(), emptyDinerRow(), emptyDinerRow()]);
            setInternalDiners(idiners.length > 0 ? idiners : [emptyDinerRow(), emptyDinerRow(), emptyDinerRow()]);
          } else {
            setGuestDiners([emptyDinerRow(), emptyDinerRow(), emptyDinerRow()]);
            setInternalDiners([emptyDinerRow(), emptyDinerRow(), emptyDinerRow()]);
          }
        } else {
          resetFoodForm();
        }
      } catch (err) {
        console.error('Failed to fetch full booking', err);
        resetFoodForm();
      } finally {
        setLoading(false);
      }
    } else {
      setEditId(null);
      setEditStatus(null);
      setFormData({ booking_name: '', room_id: '', participant_count: '', booking_date: '', start_time: '', end_time: '', purpose: '', phone_number: '' });
      setAdditionalEquipments([]);
      setSelectedLocation('All');
      resetFoodForm();
    }
    setOpenDialog(true);
  };

  const handleCancel = async (id: number) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        const res = await api.put<any, any>(`/bookings/${id}/cancel`, { cancel_reason: 'User cancelled' });
        if (res.success) fetchBookings();
      } catch (error: any) { alert(error.message || 'Failed to cancel booking'); }
    }
  };

  const handleDownloadPDF = async (id: number) => {
    try {
      const response: any = await api.get(`/food-orders/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to view PDF', error);
      alert('Failed to open PDF');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        const res = await api.delete<any, any>(`/bookings/${id}`);
        if (res.success) fetchBookings();
      } catch (error: any) { alert(error.message || 'Failed to delete booking'); }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      case 'cancelled': return 'default';
      default: return 'primary';
    }
  };

  const getFoodStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getFoodStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'อนุมัติแล้ว';
      case 'pending': return 'รออนุมัติ';
      case 'rejected': return 'ปฏิเสธ';
      default: return status;
    }
  };

  const handleViewFoodOrder = async (bookingId: number) => {
    try {
      setFoodDetailLoading(true);
      setFoodDetailOpen(true);
      const res = await api.get<any, any>(`/food-orders/booking/${bookingId}`);
      if (res.success) {
        setFoodDetailData(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch food order', error);
    } finally {
      setFoodDetailLoading(false);
    }
  };

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

  const addGuestDiner = () => setGuestDiners([...guestDiners, emptyDinerRow()]);
  const removeGuestDiner = (index: number) => {
    if (guestDiners.length > 1) setGuestDiners(guestDiners.filter((_, i) => i !== index));
  };
  const updateGuestDiner = (index: number, field: keyof DinerRow, value: string) => {
    const newDiners = [...guestDiners];
    newDiners[index] = { ...newDiners[index], [field]: value };
    setGuestDiners(newDiners);
  };

  const addInternalDiner = () => setInternalDiners([...internalDiners, emptyDinerRow()]);
  const removeInternalDiner = (index: number) => {
    if (internalDiners.length > 1) setInternalDiners(internalDiners.filter((_, i) => i !== index));
  };
  const updateInternalDiner = (index: number, field: keyof DinerRow, value: string) => {
    const newDiners = [...internalDiners];
    newDiners[index] = { ...newDiners[index], [field]: value };
    setInternalDiners(newDiners);
  };

  return (
    <MainLayout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Bookings
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          New Booking
        </Button>
      </Box>

      <Dialog open={profileDialogOpen} onClose={() => setProfileDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>ข้อมูลผู้จอง</DialogTitle>
        <DialogContent dividers>
          {selectedProfile && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 4 }}><Typography sx={{ fontWeight: 600 }}>ชื่อ-นามสกุล:</Typography></Grid>
              <Grid size={{ xs: 8 }}>
                <Typography>
                  {selectedProfile.is_guest_booking 
                    ? `${selectedProfile.guest_name} (Guest)` 
                    : `${selectedProfile.User?.first_name} ${selectedProfile.User?.last_name}`}
                </Typography>
              </Grid>
              
              <Grid size={{ xs: 4 }}><Typography sx={{ fontWeight: 600 }}>อีเมล:</Typography></Grid>
              <Grid size={{ xs: 8 }}>
                <Typography>
                  {selectedProfile.is_guest_booking ? selectedProfile.guest_email : selectedProfile.User?.email}
                </Typography>
              </Grid>
              
              <Grid size={{ xs: 4 }}><Typography sx={{ fontWeight: 600 }}>เบอร์มือถือ:</Typography></Grid>
              <Grid size={{ xs: 8 }}>
                <Typography>
                  {selectedProfile.is_guest_booking ? selectedProfile.guest_phone : (selectedProfile.User?.mobile_phone || '-')}
                </Typography>
              </Grid>

              {!selectedProfile.is_guest_booking && (
                <>
                  <Grid size={{ xs: 4 }}><Typography sx={{ fontWeight: 600 }}>เบอร์โต๊ะทำงาน:</Typography></Grid>
                  <Grid size={{ xs: 8 }}>
                    <Typography>
                      {selectedProfile.User?.office_phone || '-'}
                    </Typography>
                  </Grid>
                </>
              )}

              {selectedProfile.is_guest_booking ? (
                <>
                  <Grid size={{ xs: 4 }}><Typography sx={{ fontWeight: 600 }}>บริษัท:</Typography></Grid>
                  <Grid size={{ xs: 8 }}><Typography>{selectedProfile.guest_company_id || '-'}</Typography></Grid>
                  
                  <Grid size={{ xs: 4 }}><Typography sx={{ fontWeight: 600 }}>รหัสแผนก:</Typography></Grid>
                  <Grid size={{ xs: 8 }}><Typography>{selectedProfile.guest_department_code || '-'}</Typography></Grid>
                  
                  <Grid size={{ xs: 4 }}><Typography sx={{ fontWeight: 600 }}>ชื่อแผนก:</Typography></Grid>
                  <Grid size={{ xs: 8 }}><Typography>{selectedProfile.guest_department_name || '-'}</Typography></Grid>
                </>
              ) : (
                <>
                  <Grid size={{ xs: 4 }}><Typography sx={{ fontWeight: 600 }}>บริษัท:</Typography></Grid>
                  <Grid size={{ xs: 8 }}><Typography>{selectedProfile.User?.Company?.company_name ? `${selectedProfile.User.Company.company_code} - ${selectedProfile.User.Company.company_name}` : '-'}</Typography></Grid>
                  
                  <Grid size={{ xs: 4 }}><Typography sx={{ fontWeight: 600 }}>รหัสแผนก:</Typography></Grid>
                  <Grid size={{ xs: 8 }}><Typography>{selectedProfile.User?.department_code || '-'}</Typography></Grid>

                  <Grid size={{ xs: 4 }}><Typography sx={{ fontWeight: 600 }}>ชื่อแผนก:</Typography></Grid>
                  <Grid size={{ xs: 8 }}><Typography>{selectedProfile.User?.department_name || '-'}</Typography></Grid>
                </>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileDialogOpen(false)}>ปิด</Button>
        </DialogActions>
      </Dialog>

      {isAdmin && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={currentTab} 
            onChange={(_, newValue) => {
              setCurrentTab(newValue);
              setPage(0); // Reset pagination when switching tabs
            }}
          >
            <Tab label="การจองของฉัน" value="my_bookings" />
            <Tab label="การจองทั้งหมด" value="all_bookings" />
            <Tab label="การจองของ Guest" value="guest_bookings" />
          </Tabs>
        </Box>
      )}

      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ backgroundColor: 'background.default' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Booking No</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>ชื่อผู้จอง</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Room</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('booking_form.topic')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('booking_form.date')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('booking_form.start_time')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>อาหาร</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>อุปกรณ์</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                  No bookings found
                </TableCell>
              </TableRow>
            ) : (
              bookings.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((booking) => (
                <TableRow key={booking.id} hover>
                  <TableCell>{booking.booking_no}</TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      onClick={() => {
                        setSelectedProfile(booking);
                        setProfileDialogOpen(true);
                      }}
                      sx={{ cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                    >
                      {booking.is_guest_booking ? `${booking.guest_name} (Guest)` : `${booking.User?.first_name || ''} ${booking.User?.last_name || ''}`.trim() || 'Unknown'}
                    </Typography>
                  </TableCell>
                  <TableCell>{booking.Room?.room_name}</TableCell>
                  <TableCell>{booking.booking_name}</TableCell>
                  <TableCell>
                    {format(new Date(booking.booking_date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>{booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={booking.Status?.status_name?.toUpperCase()} 
                      size="small" 
                      color={getStatusColor(booking.Status?.status_code) as any} 
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    {booking.FoodOrder ? (
                      <Tooltip title="ดูรายละเอียดจองอาหาร">
                        <Chip
                          icon={<RestaurantIcon sx={{ fontSize: 16 }} />}
                          label={getFoodStatusLabel(booking.FoodOrder.food_status)}
                          size="small"
                          color={getFoodStatusColor(booking.FoodOrder.food_status) as any}
                          sx={{ fontWeight: 600, cursor: 'pointer' }}
                          onClick={() => handleViewFoodOrder(booking.id)}
                        />
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" color="text.disabled">-</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {booking.BookingEquipments && booking.BookingEquipments.length > 0 ? (
                      <Tooltip title={
                        booking.equipment_status === 'rejected' 
                          ? `ไม่อนุมัติ: ${booking.equipment_reject_reason || 'ไม่มีเหตุผล'}` 
                          : `ขออุปกรณ์: ${booking.BookingEquipments.map((e: any) => e.Equipment?.equipment_name || 'ไม่ระบุ').join(', ')}`
                      }>
                        <Chip
                          icon={<DevicesIcon sx={{ fontSize: 16 }} />}
                          label={
                            booking.equipment_status === 'approved' ? 'อนุมัติแล้ว' :
                            booking.equipment_status === 'rejected' ? 'ไม่อนุมัติ' : 'รออนุมัติ'
                          }
                          size="small"
                          color={
                            booking.equipment_status === 'approved' ? 'success' :
                            booking.equipment_status === 'rejected' ? 'error' : 'warning'
                          }
                          sx={{ fontWeight: 600 }}
                        />
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" color="text.disabled">-</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {['pending', 'approved'].includes(booking.Status?.status_code) && (
                      <>
                        <Tooltip title='Edit Booking'>
                          <IconButton size="small" color="primary" onClick={() => handleOpenDialog(booking)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {booking.Status?.status_code === 'pending' && (
                          <Tooltip title="Cancel Booking">
                            <IconButton size="small" color="warning" onClick={() => handleCancel(booking.id)}>
                              <BlockIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </>
                    )}
                    {booking.Status?.status_code === 'approved' && (
                      <Tooltip title="Cancel Booking">
                        <IconButton size="small" color="warning" onClick={() => handleCancel(booking.id)}>
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete Booking">
                      <IconButton size="small" color="error" onClick={() => handleDelete(booking.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

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

      <Dialog open={openDialog} onClose={() => !saving && setOpenDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>{editId ? (editStatus === 'approved' ? 'Edit Food Order' : 'Edit Booking') : 'New Booking'}</DialogTitle>
        <DialogContent dividers sx={{ maxHeight: '80vh', overflowY: 'auto' }}>
          <Grid container spacing={4} direction={{ xs: 'column-reverse' as any, md: 'row' as any }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            

            
            <TextField 
              label={t('booking_form.topic')} 
              fullWidth 
              required 
              disabled={editStatus === 'approved'}
              value={formData.booking_name}
              onChange={(e) => setFormData({...formData, booking_name: e.target.value})}
            />
            
            <FormControl fullWidth required>
              <InputLabel>Location (สถานที่)</InputLabel>
              <Select
                value={selectedLocation}
                label="Location (สถานที่)"
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  setFormData({...formData, room_id: ''}); // Reset room selection when location changes
                  setAdditionalEquipments([]);
                  setImageIndex(0);
                }}
                disabled={editStatus === 'approved'}
              >
                <MenuItem value="All">ทั้งหมด (All Locations)</MenuItem>
                {Array.from(new Set(rooms.map(r => r.location).filter(Boolean))).map((loc: any) => (
                  <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required >
              <InputLabel>Room</InputLabel>
              <Select
                value={formData.room_id}
                label={t('booking_form.room')}
                onChange={(e) => {
                  setFormData({...formData, room_id: e.target.value});
                  setAdditionalEquipments([]);

                  setImageIndex(0);
                }}
              >
                {(selectedLocation === 'All' ? rooms : rooms.filter(r => r.location === selectedLocation)).map((room) => (
                  <MenuItem key={room.id} value={room.id.toString()}>{room.room_name} ({room.capacity} pax)</MenuItem>
                ))}
              </Select>
            </FormControl>

            {formData.room_id && (() => {
              const selectedRoom = rooms.find(r => r.id.toString() === formData.room_id);
              const roomEquipmentIds = selectedRoom?.RoomEquipments?.map((re: any) => re.equipment_id.toString()) || [];
              
              return (
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>Equipment in Room:</Typography>
                  {roomEquipmentIds.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {roomEquipmentIds.map((eqId: string) => {
                        const eq = equipments.find(e => e.id.toString() === eqId);
                        return <Chip key={eqId} label={eq ? eq.equipment_name : eqId} size="small" color="success" variant="outlined" />;
                      })}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>No equipment built-in.</Typography>
                  )}

                  <FormControl fullWidth >
                    <InputLabel>Request Additional Equipment</InputLabel>
                    <Select
                      multiple
                      value={additionalEquipments}
                      label="Request Additional Equipment"
                      onChange={(e) => setAdditionalEquipments(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[])}
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
                            <Checkbox checked={isInRoom || additionalEquipments.indexOf(eq.id.toString()) > -1} />
                            <ListItemText primary={eq.equipment_name} secondary={isInRoom ? 'Already in room' : ''} />
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Box>
              );
            })()}

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField 
                    label={t('booking_form.date')} 
                    type="date" 
                    slotProps={{ inputLabel: { shrink: true } }} 
                    fullWidth 
                    required
                    disabled={editStatus === 'approved'}
                    value={formData.booking_date}
                    onChange={(e) => setFormData({...formData, booking_date: e.target.value})}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TimePicker
                    label={t('booking_form.start_time')}
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
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TimePicker
                    label={t('booking_form.end_time')}
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
              </Grid>
            </LocalizationProvider>

            
            <TextField 
              label={t('booking_form.participants')} 
              type="number" 
              fullWidth 
              required
              
              disabled={editStatus === 'approved'}
                value={formData.participant_count}
              onChange={(e) => setFormData({...formData, participant_count: e.target.value})}
            />


            <TextField 
              label={t('booking_form.purpose')} 
              multiline 
              rows={2} 
              fullWidth 
              
              disabled={editStatus === 'approved'}
                value={formData.purpose}
              onChange={(e) => setFormData({...formData, purpose: e.target.value})}
            />

              <>
                <Divider sx={{ my: 1 }} />
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={hasFoodOrder} 
                      onChange={(e) => setHasFoodOrder(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <RestaurantIcon color="primary" />
                      <Typography sx={{ fontWeight: 600 }}>ต้องการจองอาหาร</Typography>
                    </Box>
                  }
                />

                <Collapse in={hasFoodOrder} timeout="auto" unmountOnExit>
                  <Box sx={{ 
                    mt: 1, p: 2, 
                    border: '2px solid',
                    borderColor: 'primary.light',
                    borderRadius: 2,
                    backgroundColor: 'rgba(25, 118, 210, 0.02)'
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <RestaurantIcon /> ใบจองอาหาร
                    </Typography>

                    <FormControl size="small" fullWidth sx={{ mb: 2 }}>
                      <InputLabel>บริษัทผู้จัดทำ</InputLabel>
                      <Select
                        value={foodForm.company_name}
                        label="บริษัทผู้จัดทำ"
                        onChange={(e) => setFoodForm({ ...foodForm, company_name: e.target.value })}
                      >
                        {dbCompanies.map(c => (
                          <MenuItem key={c.id} value={c.company_name}>{c.company_code} - {c.company_name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Box sx={{ mb: 2 }}>
                      <FormControlLabel
                        control={
                          <Checkbox 
                            checked={foodForm.welcome_sign_needed} 
                            onChange={(e) => setFoodForm({ ...foodForm, welcome_sign_needed: e.target.checked })}
                          />
                        }
                        label={<Typography sx={{ fontWeight: 600 }}>ต้องการป้ายต้อนรับ</Typography>}
                      />
                      <Collapse in={foodForm.welcome_sign_needed}>
                        <TextField
                          label="ข้อความป้ายต้อนรับ"
                          fullWidth
                          size="small"
                          sx={{ mt: 1 }}
                          value={foodForm.welcome_sign_text}
                          onChange={(e) => setFoodForm({ ...foodForm, welcome_sign_text: e.target.value })}
                          placeholder="เช่น ยินดีต้อนรับ บริษัท ABC..."
                        />
                      </Collapse>
                    </Box>

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
                            <Grid size={{ xs: 12, sm: 6 }} key={`breakfast-${idx}`}>
                              <TextField
                                label={`เมนูที่ ${idx + 1}`}
                                size="small"
                                fullWidth
                                value={item}
                                onChange={(e) => updateBreakfastItem(idx, e.target.value)}
                                placeholder={`อาหารเช้า ${idx + 1}`}
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
                            <Grid size={{ xs: 12, sm: 6 }} key={`lunch-${idx}`}>
                              <TextField
                                label={`เมนูที่ ${idx + 1}`}
                                size="small"
                                fullWidth
                                value={item}
                                onChange={(e) => updateLunchItem(idx, e.target.value)}
                                placeholder={`อาหารเที่ยง ${idx + 1}`}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion defaultExpanded sx={{ mb: 1, '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: 'action.hover' }}>
                        <Typography sx={{ fontWeight: 600 }}>🧋 รายการอาหารบ่าย</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ mb: 2 }}>
                           <TextField label="เวลาจัดส่งอาหารบ่าย (เช่น 14:30)" size="small" value={foodForm.afternoon_time} onChange={(e) => setFoodForm({...foodForm, afternoon_time: e.target.value})} sx={{ width: 250 }} />
                        </Box>
                        <Grid container spacing={1.5}>
                          {foodForm.afternoon_items.map((item, idx) => (
                            <Grid size={{ xs: 12, sm: 6 }} key={`afternoon-${idx}`}>
                              <TextField
                                label={`เมนูที่ ${idx + 1}`}
                                size="small"
                                fullWidth
                                value={item}
                                onChange={(e) => updateAfternoonItem(idx, e.target.value)}
                                placeholder={`อาหารบ่าย ${idx + 1}`}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion defaultExpanded sx={{ mb: 1, '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
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
                          placeholder="เช่น บริษัท ABC จำกัด"
                        />
                        {guestDiners.map((diner, idx) => (
                          <Box key={`guest-${idx}`} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <Typography sx={{ minWidth: 30, fontWeight: 500, color: 'text.secondary' }}>{idx + 1}.</Typography>
                            <TextField
                              label="ชื่อ"
                              size="small"
                              fullWidth
                              value={diner.diner_name}
                              onChange={(e) => updateGuestDiner(idx, 'diner_name', e.target.value)}
                            />
                            <IconButton size="small" color="error" onClick={() => removeGuestDiner(idx)} disabled={guestDiners.length <= 1}>
                              <RemoveCircleOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ))}
                        <Button 
                          size="small" 
                          startIcon={<AddCircleOutlinedIcon />} 
                          onClick={addGuestDiner}
                          sx={{ mt: 0.5 }}
                        >
                          เพิ่มรายชื่อ
                        </Button>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion defaultExpanded sx={{ mb: 1, '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: 'action.hover' }}>
                        <Typography sx={{ fontWeight: 600 }}>🏢 ผู้รับประทานอาหาร - พนักงาน</Typography>
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
                          <Box key={`internal-${idx}`} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <Typography sx={{ minWidth: 30, fontWeight: 500, color: 'text.secondary' }}>{idx + 1}.</Typography>
                            <TextField
                              label="ชื่อ"
                              size="small"
                              sx={{ flex: 2 }}
                              value={diner.diner_name}
                              onChange={(e) => updateInternalDiner(idx, 'diner_name', e.target.value)}
                            />
                            <TextField
                              label="แผนก"
                              size="small"
                              sx={{ flex: 1 }}
                              value={diner.department}
                              onChange={(e) => updateInternalDiner(idx, 'department', e.target.value)}
                            />
                            <TextField
                              label="รหัสแผนก"
                              size="small"
                              sx={{ flex: 1 }}
                              value={diner.department_code}
                              onChange={(e) => updateInternalDiner(idx, 'department_code', e.target.value)}
                            />
                            <IconButton size="small" color="error" onClick={() => removeInternalDiner(idx)} disabled={internalDiners.length <= 1}>
                              <RemoveCircleOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ))}
                        <Button 
                          size="small" 
                          startIcon={<AddCircleOutlinedIcon />} 
                          onClick={addInternalDiner}
                          sx={{ mt: 0.5 }}
                        >
                          เพิ่มรายชื่อ
                        </Button>
                      </AccordionDetails>
                    </Accordion>

                    <TextField
                      label="รายการเพิ่มเติม / หมายเหตุ"
                      multiline
                      rows={2}
                      fullWidth
                      sx={{ mt: 1 }}
                      value={foodForm.additional_notes}
                      onChange={(e) => setFoodForm({ ...foodForm, additional_notes: e.target.value })}
                    />

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      หมายเหตุ: กรณีต้อนรับลูกค้า กรุณาส่งใบจองอาหารล่วงหน้าอย่างน้อย 1 วันทำการ 
                      ถ้ากรณีฉุกเฉินที่ลูกค้าเข้ามาโดยไม่ได้แจ้งให้ทราบล่วงหน้า กรุณาส่งก่อน 10.00 น. ของวันดังกล่าว
                    </Typography>
                  </Box>
                </Collapse>
              </>
            </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Box sx={{ position: 'sticky', top: 0 }}>
                
                {formData.room_id && (() => {
                  const selectedRoom = rooms.find(r => r.id.toString() === formData.room_id);
                  const images = (selectedRoom?.RoomImages || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
                  
                  return (
                    <Box sx={{ mb: 3 }}>
                      {images.length > 0 ? (
                        <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', boxShadow: 1 }}>
                          <CardMedia
                            component="img"
                            height="220"
                            image={images[imageIndex]?.image_url.startsWith('http') ? images[imageIndex].image_url : `${BASE_URL}${images[imageIndex]?.image_url}`}
                            alt={selectedRoom?.room_name}
                          />
                          {images.length > 1 && (
                            <>
                              <IconButton 
                                size="small" 
                                onClick={() => setImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                                sx={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' } }}
                              >
                                <ArrowBackIosNewIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={() => setImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                                sx={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' } }}
                              >
                                <ArrowForwardIosIcon fontSize="small" />
                              </IconButton>
                              <Box sx={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
                                {images.map((_: any, i: number) => (
                                  <Box 
                                    key={i} 
                                    onClick={() => setImageIndex(i)}
                                    sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: i === imageIndex ? 'primary.main' : 'rgba(255,255,255,0.7)', cursor: 'pointer' }} 
                                  />
                                ))}
                              </Box>
                            </>
                          )}
                        </Box>
                      ) : (
                         <Box sx={{ height: 220, bgcolor: 'grey.200', backgroundImage: `url('https://placehold.co/400x220/png?text=No+Image')`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 2 }} />
                      )}
                    </Box>
                  );
                })()}

                <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}>
                  การจองห้องที่กำลังจัดประชุม
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{t('booking_form.upcoming')}</Typography>
                {loadingSchedule ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress size={30} /></Box>
                ) : !formData.room_id ? (
                  <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 2, border: '1px dashed grey' }}>
                    <Typography variant="body2" color="text.secondary">{t('booking_form.select_room')}</Typography>
                  </Box>
                ) : schedule.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {schedule.map((s: any, i: number) => {
                      const isOngoing = s.Status?.status_code === 'approved';
                      return (
                        <Paper key={i} sx={{ p: 2, borderRadius: 2, borderLeft: '4px solid', borderColor: isOngoing ? 'success.main' : 'warning.main', bgcolor: 'white' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>{s.booking_name}</Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                            {new Date(s.booking_date).toLocaleDateString('en-GB')} • {s.start_time.slice(0,5)} - {s.end_time.slice(0,5)}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>By: {s.User?.first_name || s.guest_name}</Typography>
                            <Chip size="small" label={s.Status?.status_name || 'Reserved'} color={isOngoing ? 'success' : 'warning'} sx={{ height: 20, fontSize: '0.7rem' }} />
                          </Box>
                        </Paper>
                      );
                    })}
                  </Box>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 2, border: '1px dashed grey' }}>
                    <Typography variant="body2" color="text.secondary">{t('booking_form.no_upcoming').split('\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}</Typography>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={saving}>{t('booking_form.cancel')}</Button>
          <Button 
            variant="contained" 
            onClick={handleBook}
            disabled={saving || (editStatus !== 'approved' && (!formData.booking_name || !formData.room_id || !formData.booking_date || !formData.start_time || !formData.end_time || !formData.participant_count))}
          >
            {saving ? <CircularProgress size={24} color="inherit" /> : (editId ? t('booking_form.save') : t('booking_form.book'))}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={foodDetailOpen} onClose={() => setFoodDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RestaurantIcon color="primary" /> รายละเอียดจองอาหาร
        </DialogTitle>
        <DialogContent dividers>
          {foodDetailLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : foodDetailData ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ fontWeight: 600 }}>สถานะ:</Typography>
                <Chip
                  label={getFoodStatusLabel(foodDetailData.food_status)}
                  color={getFoodStatusColor(foodDetailData.food_status) as any}
                  sx={{ fontWeight: 600 }}
                />
                {foodDetailData.FoodApprover && (
                  <Typography variant="body2" color="text.secondary">
                    โดย {foodDetailData.FoodApprover.first_name} {foodDetailData.FoodApprover.last_name}
                  </Typography>
                )}
              </Box>

              {foodDetailData.food_reject_reason && (
                <Typography color="error" variant="body2">เหตุผลที่ปฏิเสธ: {foodDetailData.food_reject_reason}</Typography>
              )}

              <Box>
                <Typography sx={{ fontWeight: 600, mb: 0.5 }}>บริษัท:</Typography>
                <Typography>{foodDetailData.company_name || '-'}</Typography>
              </Box>

              {foodDetailData.welcome_sign_needed && (
                <Box>
                  <Typography sx={{ fontWeight: 600, mb: 0.5 }}>ป้ายต้อนรับ:</Typography>
                  <Typography>{foodDetailData.welcome_sign_text || 'ต้องการ (ไม่ระบุข้อความ)'}</Typography>
                </Box>
              )}

              {(() => {
                const breakfast = safeParseJSON(foodDetailData.breakfast_items);
                const legacySnacks = safeParseJSON(foodDetailData.snack_items);
                const morningItems = breakfast.length > 0 ? breakfast : legacySnacks;
                return morningItems.length > 0 ? (
                  <Box>
                    <Typography sx={{ fontWeight: 600, mb: 0.5 }}>☕ รายการอาหารเช้า / เบรคเช้า:</Typography>
                    <Box sx={{ pl: 2 }}>
                      {morningItems.map((s: string, i: number) => (
                        <Typography key={i} variant="body2">{i + 1}. {s}</Typography>
                      ))}
                    </Box>
                  </Box>
                ) : null;
              })()}

              {(() => {
                const lunches = safeParseJSON(foodDetailData.lunch_items);
                return lunches.length > 0 ? (
                  <Box>
                    <Typography sx={{ fontWeight: 600, mb: 0.5 }}>🍱 รายการอาหารมื้อเที่ยง:</Typography>
                    <Box sx={{ pl: 2 }}>
                      {lunches.map((l: string, i: number) => (
                        <Typography key={i} variant="body2">{i + 1}. {l}</Typography>
                      ))}
                    </Box>
                  </Box>
                ) : null;
              })()}

              {(() => {
                const afternoon = safeParseJSON(foodDetailData.afternoon_items);
                return afternoon.length > 0 ? (
                  <Box>
                    <Typography sx={{ fontWeight: 600, mb: 0.5 }}>🍰 รายการเบรคบ่าย:</Typography>
                    <Box sx={{ pl: 2 }}>
                      {afternoon.map((s: string, i: number) => (
                        <Typography key={i} variant="body2">{i + 1}. {s}</Typography>
                      ))}
                    </Box>
                  </Box>
                ) : null;
              })()}

              {/* Diners */}
              {foodDetailData.Diners && foodDetailData.Diners.length > 0 && (
                <Box>
                  <Typography sx={{ fontWeight: 600, mb: 0.5 }}>ผู้รับประทานอาหาร:</Typography>
                  {/* Guest diners */}
                  {(() => {
                    const guests = foodDetailData.Diners.filter((d: any) => d.diner_type === 'guest');
                    return guests.length > 0 ? (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>ลูกค้าบริษัท:</Typography>
                        <Box sx={{ pl: 2 }}>
                          {guests.map((d: any, i: number) => (
                            <Typography key={d.id} variant="body2">{i + 1}. {d.diner_name}</Typography>
                          ))}
                        </Box>
                      </Box>
                    ) : null;
                  })()}
                  {/* Internal diners */}
                  {(() => {
                    const internals = foodDetailData.Diners.filter((d: any) => d.diner_type === 'internal');
                    return internals.length > 0 ? (
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>พนักงาน TI / TMC:</Typography>
                        <Box sx={{ pl: 2 }}>
                          {internals.map((d: any, i: number) => (
                            <Typography key={d.id} variant="body2">
                              {i + 1}. {d.diner_name} {d.department ? `(แผนก: ${d.department}${d.department_code ? `, รหัส: ${d.department_code}` : ''})` : ''}
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                    ) : null;
                  })()}
                </Box>
              )}

              {/* Additional notes */}
              {foodDetailData.additional_notes && (
                <Box>
                  <Typography sx={{ fontWeight: 600, mb: 0.5 }}>รายการเพิ่มเติม / หมายเหตุ:</Typography>
                  <Typography variant="body2">{foodDetailData.additional_notes}</Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Typography color="text.secondary">ไม่พบข้อมูลจองอาหาร</Typography>
          )}
        </DialogContent>
        <DialogActions>
          {foodDetailData && (
            <Button 
              variant="outlined" 
              color="secondary" 
              startIcon={<PictureAsPdfIcon />}
              onClick={() => handleDownloadPDF(foodDetailData.id)}
            >
              พิมพ์ใบจอง (PDF)
            </Button>
          )}
          <Button onClick={() => setFoodDetailOpen(false)}>ปิด</Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
