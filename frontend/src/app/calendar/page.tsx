'use client';

import { useEffect, useState, useRef } from 'react';
import { Box, Typography, Paper, CircularProgress, Popover, FormControl, InputLabel, Select, MenuItem, Grid, Card, CardActionArea, CardMedia, Alert, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import api, { BASE_URL } from '@/services/api';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('All');

  const router = useRouter();

  const calendarRef = useRef<FullCalendar>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const [popoverContent, setPopoverContent] = useState<any>(null);

  const [bookingSelection, setBookingSelection] = useState<{start: Date | null, end: Date | null}>({ start: null, end: null });
  const [isSplitView, setIsSplitView] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [selectedLocation, selectedRoomId]);

  const fetchRooms = async () => {
    try {
      const res = await api.get<any, any>('/rooms');
      if (res.success) {
        setRooms(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch rooms', error);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedLocation !== 'All') params.location = selectedLocation;
      if (selectedRoomId !== 'All') params.room_id = selectedRoomId;

      const res = await api.get<any, any>('/calendar/events', { params });
      if (res.success) {
        setEvents(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch calendar events', error);
    } finally {
      setLoading(false);
    }
  };

  const locations = Array.from(new Set(rooms.map(r => r.location).filter(Boolean)));
  const filteredRooms = selectedLocation === 'All' 
    ? rooms 
    : rooms.filter(r => r.location === selectedLocation);

  const handleLocationChange = (e: any) => {
    setSelectedLocation(e.target.value);
    setSelectedRoomId('All');
  };

  return (
    <MainLayout>
      <Box sx={{ mb: 3, position: 'relative', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'center', alignItems: 'center', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, position: { md: 'absolute' }, left: { md: 0 }, alignSelf: { xs: 'flex-start', md: 'auto' } }}>
          Booking Calendar
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', zIndex: 1 }}>
          <FormControl size="small" sx={{ minWidth: 200, bgcolor: 'white' }}>
            <InputLabel>สาขา (Location)</InputLabel>
            <Select
              value={selectedLocation}
              label="สาขา (Location)"
              onChange={handleLocationChange}
            >
              <MenuItem value="All">ทุกสาขา (All Locations)</MenuItem>
              {locations.map((loc: any) => (
                <MenuItem key={loc} value={loc}>{loc}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 200, bgcolor: 'white' }}>
            <InputLabel>ห้องประชุม (Room)</InputLabel>
            <Select
              value={selectedRoomId}
              label="ห้องประชุม (Room)"
              onChange={(e) => setSelectedRoomId(e.target.value)}
              disabled={filteredRooms.length === 0}
            >
              <MenuItem value="All">ทุกห้อง (All Rooms)</MenuItem>
              {filteredRooms.map((room) => (
                <MenuItem key={room.id} value={room.id.toString()}>
                  {room.room_name} (ความจุ: {room.capacity})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>💡 วิธีการจองห้องประชุม:</Typography>
        <ol style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem' }}>
          <li>คลิกเลือก <strong>วันที่</strong> ที่ต้องการจากปฏิทิน</li>
          <li>คลิกที่ตารางเวลา <strong>2 ครั้ง</strong> (ครั้งแรก=เริ่ม, ครั้งที่สอง=สิ้นสุด) หรือ <strong>ลากเมาส์คลุมช่วงเวลา</strong></li>
          <li>รายชื่อห้องประชุมจะแสดงขึ้นมาทางด้านขวา ให้คลิกเลือกห้องเพื่อไปหน้ายืนยันการจอง</li>
        </ol>
      </Alert>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: isSplitView ? 6 : 12 }} sx={{ transition: "all 0.3s ease-in-out" }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: 'calc(100vh - 220px)', minHeight: 600 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ 
                height: '100%',
                '& .fc': { height: '100%', fontFamily: 'inherit' }, '& .fc-timegrid-event-harness': { right: '30px !important' }, '& .fc-timegrid-event': { borderRadius: '4px', opacity: 0.9 },
                '& .fc-theme-standard th': { padding: '8px 0', backgroundColor: '#f8fafc' },
                '& .fc-button-primary': {
                  backgroundColor: '#4F46E5 !important',
                  borderColor: '#4F46E5 !important',
                  '&:hover': {
                    backgroundColor: '#3730A3 !important',
                    borderColor: '#3730A3 !important',
                  }
                }
              }}>
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                  initialView="timeGridWeek"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                  }}
                  events={[...events, ...(bookingSelection.start ? [{
                    id: 'temp-selection',
                    title: bookingSelection.end ? 'ช่วงเวลาที่คุณเลือก' : 'คลิกอีกครั้งเพื่อเลือกเวลาสิ้นสุด...',
                    start: bookingSelection.start,
                    end: bookingSelection.end || new Date(bookingSelection.start.getTime() + 30 * 60000),
                    backgroundColor: '#EAB308',
                    borderColor: '#EAB308',
                    textColor: '#fff'
                  }] : [])]}
                  slotMinTime="08:00:00"
                  slotMaxTime="18:00:00"
                  allDaySlot={false}
                  height="100%"
                  selectable={true}
                  selectMirror={true}
                  select={(info) => {
                    if (info.view.type !== 'dayGridMonth') {
                      const diff = info.end.getTime() - info.start.getTime();
                      if (diff > 1800000) {
                        if (info.start.toDateString() !== new Date(info.end.getTime() - 1000).toDateString()) {
                          alert('ไม่สามารถจองข้ามวันได้ กรุณาเลือกเวลาเริ่มต้นและสิ้นสุดภายในวันเดียวกัน');
                          if (calendarRef.current) {
                            calendarRef.current.getApi().unselect();
                          }
                          setBookingSelection({ start: null, end: null });
                          setIsSplitView(false);
                          return;
                        }
                        setBookingSelection({ start: info.start, end: info.end });
                        setIsSplitView(true);
                      }
                    }
                  }}
                  dateClick={(info) => {
                    const viewType = info.view.type;
                    if (viewType === 'dayGridMonth') {
                      if (calendarRef.current) {
                        calendarRef.current.getApi().changeView('timeGridDay', info.date);
                      }
                      return;
                    }
                    
                    if (viewType === 'timeGridWeek' || viewType === 'timeGridDay') {
                      if (!bookingSelection.start || (bookingSelection.start && bookingSelection.end)) {
                        setBookingSelection({ start: info.date, end: null });
                        setIsSplitView(false);
                      } else {
                        let start = bookingSelection.start;
                        let end = info.date;
                        if (start > end) {
                          const temp = start;
                          start = end;
                          end = temp;
                        }
                        
                        if (start.toDateString() !== end.toDateString()) {
                          alert('ไม่สามารถจองข้ามวันได้ กรุณาเลือกเวลาเริ่มต้นและสิ้นสุดภายในวันเดียวกัน');
                          setBookingSelection({ start: null, end: null });
                          setIsSplitView(false);
                          return;
                        }

                        if (start.getTime() === end.getTime()) {
                          end = new Date(start.getTime() + 30 * 60000);
                        }
                        setBookingSelection({ start, end });
                        setIsSplitView(true);
                      }
                    }
                  }}
                  eventClick={(info) => {
                      if (info.event.id === 'temp-selection') return;
                      if (info.event.start) {
                        setBookingSelection({ start: info.event.start, end: info.event.end });
                        setIsSplitView(true);
                      }
                    }}
                  eventMouseEnter={(info) => {
                    setPopoverContent(info.event);
                    setPopoverAnchor(info.el);
                  }}
                  eventMouseLeave={() => {
                    setPopoverAnchor(null);
                  }}
                />
                
                <Popover
                  id="mouse-over-popover"
                  sx={{
                    pointerEvents: 'none',
                  }}
                  open={Boolean(popoverAnchor)}
                  anchorEl={popoverAnchor}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                  }}
                  onClose={() => setPopoverAnchor(null)}
                  disableRestoreFocus
                >
                  {popoverContent && (
                    <Box sx={{ p: 1.5, maxWidth: 300, bgcolor: 'background.paper' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 0.5 }}>
                        {popoverContent.title}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Room:</strong> {popoverContent.extendedProps?.room_name}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Status:</strong> {popoverContent.extendedProps?.status_name}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Time:</strong> {popoverContent.start?.toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})} - {popoverContent.end?.toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})}
                      </Typography>
                    </Box>
                  )}
                </Popover>
              </Box>
            )}
          </Paper>
        </Grid>

        {isSplitView && (
          <Grid size={{ xs: 12, md: 6 }} sx={{ transition: "all 0.3s ease-in-out" }}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: "calc(100vh - 220px)", minHeight: 600, overflow: "auto", bgcolor: '#f8fafc' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  เลือกห้องประชุมที่ต้องการ
                </Typography>
                <Button variant="outlined" size="small" onClick={() => {
                  setBookingSelection({ start: null, end: null });
                  setIsSplitView(false);
                }}>
                  ยกเลิก (Cancel)
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filteredRooms.map(r => {
                  const sortedImages = r.RoomImages && r.RoomImages.length > 0 
                    ? [...r.RoomImages].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
                    : [];
                  const firstImage = sortedImages.length > 0 ? sortedImages[0] : null;
                  const imageUrl = firstImage
                    ? (firstImage.image_url.startsWith('http') ? firstImage.image_url : `${BASE_URL}${firstImage.image_url}`)
                    : 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800';

                  const equipments = r.RoomEquipments 
                    ? r.RoomEquipments.map((eq: any) => eq.Equipment?.equipment_name).filter(Boolean).join(', ')
                    : '';

                  return (
                  <Card 
                    key={r.id} 
                    elevation={1} 
                    sx={{ 
                      display: 'flex', 
                      borderRadius: 2, 
                      overflow: 'hidden',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
                      flexShrink: 0
                    }}
                  >
                    <CardActionArea 
                      sx={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch' }}
                      onClick={() => {
                        if (!bookingSelection.start || !bookingSelection.end) return;
                        
                        const date = bookingSelection.start.toISOString().split('T')[0];
                        const startTime = bookingSelection.start.toTimeString().substring(0, 5);
                        const endTime = bookingSelection.end.toTimeString().substring(0, 5);
                        
                        router.push(`/bookings?new=true&date=${date}&start=${startTime}&end=${endTime}&roomId=${r.id}`);
                      }}
                    >
                      <Box sx={{ 
                        position: 'relative', 
                        width: { xs: 100, sm: 140 },
                        minHeight: 120,
                        backgroundColor: '#eee'
                      }}>
                        <CardMedia
                          component="img"
                          image={imageUrl}
                          alt={r.room_name}
                          sx={{ 
                            position: 'absolute',
                            top: 0, left: 0, width: '100%', height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      </Box>
                      <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2, mb: 1 }}>
                          {r.room_name}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <strong>สาขา:</strong>&nbsp;{r.location} {r.additional_location ? `- ${r.additional_location}` : ''}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <strong>ความจุ:</strong>&nbsp;{r.capacity} ท่าน
                        </Typography>

                        {equipments && (
                          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'flex-start', mt: 0.5 }}>
                            <strong>อุปกรณ์:</strong>&nbsp;{equipments}
                          </Typography>
                        )}
                      </Box>
                    </CardActionArea>
                  </Card>
                )})}
                {filteredRooms.length === 0 && (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    ไม่พบห้องประชุมที่สาขานี้
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </MainLayout>
  );
}
