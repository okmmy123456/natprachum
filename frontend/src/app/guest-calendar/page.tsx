'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { Box, Typography, Container, Paper, CircularProgress, Popover, Button, Grid, Card, CardActionArea, CardMedia, Tooltip, Alert } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import api, { BASE_URL } from '@/services/api';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

function GuestCalendarContent() {
  const [events, setEvents] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const calendarRef = useRef<FullCalendar>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const [popoverContent, setPopoverContent] = useState<any>(null);
  const [bookingSelection, setBookingSelection] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null });
  const [isSplitView, setIsSplitView] = useState(false);
  const searchParams = useSearchParams();
  const location = searchParams.get('location');
  const router = useRouter();

  useEffect(() => {
    fetchEvents();
    fetchRooms();
  }, [location]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get<any, any>('/calendar/events', { params: { location } });
      if (res.success) {
        setEvents(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch calendar events', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await api.get<any, any>('/rooms', { params: { location } });
      if (res.success) {
        setRooms(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch rooms', error);
    }
  };

  const filteredEvents = selectedRoomId ? events.filter(e => e.extendedProps?.room_id === selectedRoomId) : events;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 6 }}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()} sx={{ color: 'text.secondary' }}>
              Back
            </Button>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }} color="primary">
              ตารางคิวห้องประชุม (Guest Calendar) {location ? `- ${location}` : ''}
            </Typography>
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
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: "calc(100vh - 180px)", minHeight: 600, overflow: "hidden" }}>
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
                    initialView="dayGridMonth"
                    headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                    }}
                    /* REPLACED EVENTS */
                    slotMinTime="08:00:00"
                    slotMaxTime="18:00:00"
                    allDaySlot={false}
                    height="100%"
                    /* REPLACED SELECTABLE */
                    /* REPLACED SELECTMIRROR */
                    events={[...filteredEvents, ...(bookingSelection.start ? [{
                        id: 'temp-selection',
                        title: bookingSelection.end ? 'ช่วงเวลาที่คุณเลือก' : 'คลิกอีกครั้งเพื่อเลือกเวลาสิ้นสุด...',
                        start: bookingSelection.start,
                        end: bookingSelection.end || new Date(bookingSelection.start.getTime() + 30 * 60000),
                        backgroundColor: '#EAB308',
                        borderColor: '#EAB308',
                        textColor: '#fff'
                      }] : [])]}
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
          <Grid size={{ xs: 12, md: 6 }} sx={{ transition: "all 0.3s ease-in-out", animation: "fadeIn 0.5s" }}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'transparent' }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>เลือกห้องประชุม</Typography>
              {bookingSelection.start && bookingSelection.end && (
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', bgcolor: '#f0fdf4', p: 1, borderRadius: 1 }}>
                  ✔ จองวันที่: {bookingSelection.start.toLocaleDateString('th-TH')} <br/>
                  🕒 เวลา: {bookingSelection.start.toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})} - {bookingSelection.end.toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})}
                </Typography>
              )}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: 'calc(100vh - 220px)', overflowY: 'auto', pr: 1 }}>
                <Card 
                  elevation={selectedRoomId === null ? 3 : 1}
                  sx={{ 
                    border: selectedRoomId === null ? '2px solid #4F46E5' : '1px solid #e0e0e0',
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                >
                  <CardActionArea onClick={() => setSelectedRoomId(null)} sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>แสดงทุกห้อง (All Rooms)</Typography>
                  </CardActionArea>
                </Card>

                {rooms.map(r => {
                  const sortedImages = r.RoomImages && r.RoomImages.length > 0 
                    ? [...r.RoomImages].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
                    : [];
                  const firstImage = sortedImages.length > 0 ? sortedImages[0] : null;
                  const imageUrl = firstImage
                    ? (firstImage.image_url.startsWith('http') ? firstImage.image_url : `${BASE_URL}${firstImage.image_url}`)
                    : 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800';

                  return (
                  <Card 
                    key={r.id} 
                    elevation={selectedRoomId === r.id ? 3 : 1}
                    sx={{ 
                      border: selectedRoomId === r.id ? '2px solid #4F46E5' : '1px solid #e0e0e0',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      mb: 2,
                      flexShrink: 0
                    }}
                  >
                    <Box 
                      sx={{ 
                        cursor: 'pointer', 
                        position: 'relative', 
                        overflow: 'hidden',
                        height: 180,
                        minHeight: 180,
                        backgroundColor: '#f5f5f5',
                        '&:hover .overlay': { opacity: 1 },
                        '&:hover .room-img': { transform: 'scale(1.05)' }
                      }} 
                      onClick={(e) => {
                        e.stopPropagation();
                        let url = `/booking?room_id=${r.id}`;
                        if (bookingSelection.start && bookingSelection.end) {
                          // Adjust for timezone locally
                          const year = bookingSelection.start.getFullYear();
                          const month = (bookingSelection.start.getMonth() + 1).toString().padStart(2, '0');
                          const day = bookingSelection.start.getDate().toString().padStart(2, '0');
                          const dateStr = `${year}-${month}-${day}`;
                          
                          const pad = (n: number) => n.toString().padStart(2, '0');
                          const start_time = `${pad(bookingSelection.start.getHours())}:${pad(bookingSelection.start.getMinutes())}`;
                          const end_time = `${pad(bookingSelection.end.getHours())}:${pad(bookingSelection.end.getMinutes())}`;
                          url += `&date=${dateStr}&start=${start_time}&end=${end_time}`;
                        }
                        router.push(url);
                      }}
                    >
                      <img 
                        className="room-img"
                        src={imageUrl}
                        alt={r.room_name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease-in-out' }}
                        onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800'; }}
                      />
                      <Box 
                        className="overlay"
                        sx={{ 
                          position: 'absolute', 
                          top: 0, bottom: 0, left: 0, right: 0, 
                          bgcolor: 'rgba(0,0,0,0.75)', 
                          color: 'white', 
                          p: 2, 
                          opacity: 0,
                          transition: 'opacity 0.3s ease-in-out',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          textAlign: 'center'
                        }}
                      >
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.3)', pb: 0.5 }}>
                          {r.room_name}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5, color: '#ddd' }}>
                          {r.location}{r.additional_location ? ` - ${r.additional_location}` : ''}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5, color: '#ddd' }}>
                          ความจุ: {r.capacity} ท่าน
                        </Typography>
                        {r.RoomEquipments && r.RoomEquipments.length > 0 && (
                          <Typography variant="body2" sx={{ mb: 1, color: '#ddd', fontSize: '0.75rem', mt: 0.5 }}>
                            อุปกรณ์: {r.RoomEquipments.map((eq: any) => eq.Equipment?.equipment_name).filter(Boolean).join(', ')}
                          </Typography>
                        )}
                        <Typography variant="subtitle2" sx={{ mt: 2, color: '#FFD700', fontWeight: 'bold' }}>
                          👉 คลิกเพื่อจองห้องนี้
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                )})}
              </Box>
            </Paper>
          </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  );
}

export default function GuestCalendarPage() {
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    }>
      <GuestCalendarContent />
    </Suspense>
  );
}
