'use client';

import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Paper, Chip, IconButton, Button, 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Tooltip, TextField, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import TodayIcon from '@mui/icons-material/Today';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import MicIcon from '@mui/icons-material/Mic';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import DraggableTableContainer from '@/components/common/DraggableTableContainer';
import { useRouter } from 'next/navigation';

interface ResourceTimelineProps {
  rooms: any[];
  events: any[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  selectedLocation: string;
  onLocationChange: (loc: string) => void;
  locations: string[];
  isGuest?: boolean;
}

const START_HOUR = 8;  // 08:00
const END_HOUR = 18;   // 18:00
const TOTAL_HOURS = END_HOUR - START_HOUR; // 10 hours

export default function ResourceTimeline({
  rooms,
  events,
  currentDate,
  onDateChange,
  selectedLocation,
  onLocationChange,
  locations,
  isGuest = false,
}: ResourceTimelineProps) {
  const router = useRouter();
  const [roomSearch, setRoomSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [quickBookSlot, setQuickBookSlot] = useState<{ room: any; start: string; end: string } | null>(null);

  // Filter rooms by location and search
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const matchLoc = selectedLocation === 'All' || r.location === selectedLocation;
      const matchSearch = !roomSearch.trim() || r.room_name.toLowerCase().includes(roomSearch.toLowerCase().trim());
      return matchLoc && matchSearch;
    });
  }, [rooms, selectedLocation, roomSearch]);

  // Filter events matching the current date string (YYYY-MM-DD)
  const currentDateStr = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, '0');
    const d = String(currentDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [currentDate]);

  const dayEvents = useMemo(() => {
    return events.filter((ev) => {
      const evDate = ev.booking_date || (ev.start ? ev.start.split('T')[0] : '');
      return evDate === currentDateStr;
    });
  }, [events, currentDateStr]);

  // Date Navigation handlers
  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const [y, m, d] = e.target.value.split('-').map(Number);
      onDateChange(new Date(y, m - 1, d));
    }
  };

  // Helper: parse HH:mm to float hour (e.g. "09:30" => 9.5)
  const parseTimeToHour = (timeStr: string) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    return parseInt(parts[0], 10) + parseInt(parts[1] || '0', 10) / 60;
  };

  // Helper: format hour float to HH:mm string
  const formatHourString = (hourFloat: number) => {
    const h = Math.floor(hourFloat);
    const m = Math.round((hourFloat - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Handle clicking on an empty slot in the timeline
  const handleTimelineSlotClick = (e: React.MouseEvent<HTMLDivElement>, room: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const rawHour = START_HOUR + ratio * TOTAL_HOURS;
    const startH = Math.floor(rawHour);
    const endH = Math.min(END_HOUR, startH + 1);

    const startStr = `${String(startH).padStart(2, '0')}:00`;
    const endStr = `${String(endH).padStart(2, '0')}:00`;

    setQuickBookSlot({
      room,
      start: startStr,
      end: endStr,
    });
  };

  const thaiDateDisplay = useMemo(() => {
    return currentDate.toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [currentDate]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Top Controls Toolbar */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 2, 
          borderRadius: 2, 
          display: 'flex', 
          flexWrap: 'wrap', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: 2,
          backgroundColor: 'background.paper'
        }}
      >
        {/* Date Navigator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'action.hover', borderRadius: 2, p: 0.5 }}>
            <IconButton size="small" onClick={handlePrevDay} title="วันก่อนหน้า">
              <NavigateBeforeIcon />
            </IconButton>
            <Button 
              size="small" 
              onClick={handleToday} 
              startIcon={<TodayIcon fontSize="small" />}
              sx={{ px: 1.5, fontWeight: 600, textTransform: 'none' }}
            >
              วันนี้
            </Button>
            <IconButton size="small" onClick={handleNextDay} title="วันถัดไป">
              <NavigateNextIcon />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {thaiDateDisplay}
            </Typography>
            <input 
              type="date" 
              value={currentDateStr}
              onChange={handleDateInputChange}
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                color: '#334155'
              }}
            />
          </Box>
        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel>สาขา (Location)</InputLabel>
            <Select
              value={selectedLocation}
              label="สาขา (Location)"
              onChange={(e) => onLocationChange(e.target.value)}
            >
              <MenuItem value="All">ทุกสาขา (All Locations)</MenuItem>
              {locations.map((loc) => (
                <MenuItem key={loc} value={loc}>{loc}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField 
            size="small"
            placeholder="ค้นหาชื่อห้อง..."
            value={roomSearch}
            onChange={(e) => setRoomSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
              }
            }}
            sx={{ width: 170 }}
          />

          {!isGuest && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => router.push(`/bookings?new=true&date=${currentDateStr}`)}
              sx={{ fontWeight: 600, textTransform: 'none', px: 2.5 }}
            >
              + จองห้องประชุม
            </Button>
          )}
        </Box>
      </Paper>

      {/* Guide Banner */}
      <Box sx={{ 
        px: 2.5, 
        py: 1.5, 
        borderRadius: 2, 
        bgcolor: '#EEF2FF', 
        border: '1px solid #E0E7FF',
        display: 'flex', 
        flexWrap: 'wrap', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        gap: 1.5,
        fontSize: '0.85rem',
        color: '#312E81'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            💡 คำแนะนำ:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <b>คลิกเมาส์ค้างแล้วลากซ้าย-ขวา</b> เพื่อเลื่อนดูตารางเวลา หรือ <b>คลิกที่ช่องว่างของห้อง</b> เพื่อเลือกจองช่วงเวลานั้นทันที
          </Typography>
        </Box>

        {/* Legend */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: '0.8rem' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: '#4F46E5' }} />
            <span>อนุมัติแล้ว</span>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: '#D97706' }} />
            <span>รออนุมัติ</span>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: '#E2E8F0', border: '1px solid #CBD5E1' }} />
            <span>พักเที่ยง (12:00 - 13:00)</span>
          </Box>
        </Box>
      </Box>

      {/* Resource Timeline Table */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <DraggableTableContainer sx={{ maxHeight: 'calc(100vh - 280px)', minHeight: 480 }}>
          <Box sx={{ minWidth: 1300, position: 'relative' }}>
            
            {/* Table Header */}
            <Box sx={{ 
              display: 'flex', 
              position: 'sticky', 
              top: 0, 
              zIndex: 20, 
              bgcolor: '#F8FAFC', 
              borderBottom: '2px solid #E2E8F0' 
            }}>
              {/* Sticky Columns Header */}
              <Box sx={{ 
                width: 220, 
                minWidth: 220, 
                position: 'sticky', 
                left: 0, 
                zIndex: 30, 
                bgcolor: '#F1F5F9', 
                p: 1.5, 
                fontWeight: 700, 
                fontSize: '0.85rem',
                color: '#334155',
                borderRight: '1px solid #CBD5E1',
                display: 'flex',
                alignItems: 'center'
              }}>
                ห้องประชุม (Meeting Rooms)
              </Box>

              <Box sx={{ 
                width: 130, 
                minWidth: 130, 
                position: 'sticky', 
                left: 220, 
                zIndex: 30, 
                bgcolor: '#F1F5F9', 
                p: 1.5, 
                fontWeight: 600, 
                fontSize: '0.8rem',
                color: '#475569',
                borderRight: '1px solid #CBD5E1',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                สาขา / ที่ตั้ง
              </Box>

              <Box sx={{ 
                width: 90, 
                minWidth: 90, 
                position: 'sticky', 
                left: 350, 
                zIndex: 30, 
                bgcolor: '#F1F5F9', 
                p: 1.5, 
                fontWeight: 600, 
                fontSize: '0.8rem',
                color: '#475569',
                borderRight: '2px solid #CBD5E1',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                ความจุ
              </Box>

              {/* Time Slots Header (08:00 to 18:00) */}
              <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)' }}>
                {Array.from({ length: TOTAL_HOURS }).map((_, idx) => {
                  const hour = START_HOUR + idx;
                  const isLunch = hour === 12;
                  return (
                    <Box 
                      key={hour} 
                      sx={{ 
                        p: 1.5, 
                        textAlign: 'center', 
                        fontWeight: 700, 
                        fontSize: '0.8rem',
                        color: isLunch ? '#1E293B' : '#475569',
                        bgcolor: isLunch ? '#E2E8F0' : 'transparent',
                        borderRight: '1px solid #E2E8F0'
                      }}
                    >
                      {String(hour).padStart(2, '0')}:00 {isLunch ? '(พักเที่ยง)' : ''}
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Table Rows (Rooms) */}
            {filteredRooms.length === 0 ? (
              <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
                <Typography variant="body1">ไม่พบห้องประชุมที่ตรงกับเงื่อนไขการค้นหา</Typography>
              </Box>
            ) : (
              filteredRooms.map((room, roomIdx) => {
                // Find all bookings for this room today
                const roomBookings = dayEvents.filter(
                  (ev) => ev.extendedProps?.room_id === room.id || ev.room_id === room.id
                );

                const isEven = roomIdx % 2 === 0;

                return (
                  <Box 
                    key={room.id} 
                    sx={{ 
                      display: 'flex', 
                      height: 72, 
                      borderBottom: '1px solid #E2E8F0',
                      bgcolor: isEven ? '#FFFFFF' : '#FAFAFA',
                      '&:hover': { bgcolor: '#F8FAFC' }
                    }}
                  >
                    {/* Sticky Room Name */}
                    <Box sx={{ 
                      width: 220, 
                      minWidth: 220, 
                      position: 'sticky', 
                      left: 0, 
                      zIndex: 10, 
                      bgcolor: 'inherit', 
                      p: 1.5, 
                      borderRight: '1px solid #E2E8F0',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                      <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {room.room_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: #{room.id}
                      </Typography>
                    </Box>

                    {/* Sticky Location */}
                    <Box sx={{ 
                      width: 130, 
                      minWidth: 130, 
                      position: 'sticky', 
                      left: 220, 
                      zIndex: 10, 
                      bgcolor: 'inherit', 
                      p: 1, 
                      borderRight: '1px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Chip 
                        label={room.location || '-'} 
                        size="small" 
                        variant="outlined"
                        color={room.location === 'บางพลี' ? 'warning' : 'default'}
                        sx={{ fontSize: '0.75rem', fontWeight: 500 }}
                      />
                    </Box>

                    {/* Sticky Capacity */}
                    <Box sx={{ 
                      width: 90, 
                      minWidth: 90, 
                      position: 'sticky', 
                      left: 350, 
                      zIndex: 10, 
                      bgcolor: 'inherit', 
                      p: 1, 
                      borderRight: '2px solid #CBD5E1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'text.secondary',
                      fontWeight: 600,
                      fontSize: '0.8rem'
                    }}>
                      {room.capacity} ท่าน
                    </Box>

                    {/* Timeline Canvas for the room */}
                    <Box 
                      sx={{ 
                        flex: 1, 
                        position: 'relative', 
                        height: '100%',
                        cursor: 'cell'
                      }}
                      onClick={(e) => handleTimelineSlotClick(e, room)}
                      title="คลิกที่ช่องว่างเพื่อจองห้องนี้"
                    >
                      {/* Hourly Background Guidelines */}
                      <Box sx={{ 
                        position: 'absolute', 
                        inset: 0, 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(10, 1fr)',
                        pointerEvents: 'none'
                      }}>
                        {Array.from({ length: TOTAL_HOURS }).map((_, idx) => {
                          const hour = START_HOUR + idx;
                          const isLunch = hour === 12;
                          return (
                            <Box 
                              key={hour} 
                              sx={{ 
                                height: '100%', 
                                borderRight: '1px solid #F1F5F9',
                                bgcolor: isLunch ? 'rgba(226, 232, 240, 0.45)' : 'transparent'
                              }} 
                            />
                          );
                        })}
                      </Box>

                      {/* Booking Event Bars */}
                      {roomBookings.map((ev: any) => {
                        const startParts = (ev.start_time || (ev.start ? ev.start.split('T')[1] : '')).split(':');
                        const endParts = (ev.end_time || (ev.end ? ev.end.split('T')[1] : '')).split(':');

                        const startH = parseInt(startParts[0], 10) + parseInt(startParts[1] || '0', 10) / 60;
                        const endH = parseInt(endParts[0], 10) + parseInt(endParts[1] || '0', 10) / 60;

                        // Clamp to timeline range
                        const clampedStart = Math.max(START_HOUR, Math.min(END_HOUR, startH));
                        const clampedEnd = Math.max(START_HOUR, Math.min(END_HOUR, endH));

                        if (clampedEnd <= clampedStart) return null;

                        const leftPercent = ((clampedStart - START_HOUR) / TOTAL_HOURS) * 100;
                        const widthPercent = ((clampedEnd - clampedStart) / TOTAL_HOURS) * 100;

                        const isPending = ev.extendedProps?.status === 'pending';
                        const barColor = isPending ? '#D97706' : (ev.color || '#4F46E5');

                        const timeRangeText = `${ev.start_time || startParts.slice(0,2).join(':')} - ${ev.end_time || endParts.slice(0,2).join(':')}`;
                        const displayTitle = ev.booking_name || ev.title?.split(' - ')[0] || 'การจองห้อง';

                        return (
                          <Tooltip 
                            key={ev.id}
                            title={
                              <Box sx={{ p: 0.5 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{displayTitle}</Typography>
                                <Typography variant="caption" sx={{ display: 'block' }}>🕒 {timeRangeText}</Typography>
                                {ev.extendedProps?.organizer && (
                                  <Typography variant="caption" sx={{ display: 'block' }}>👤 ผู้จอง: {ev.extendedProps.organizer}</Typography>
                                )}
                                {ev.extendedProps?.department && (
                                  <Typography variant="caption" sx={{ display: 'block' }}>🏢 แผนก: {ev.extendedProps.department}</Typography>
                                )}
                                <Typography variant="caption" sx={{ display: 'block', color: isPending ? '#FCD34D' : '#86EFAC', fontWeight: 600 }}>
                                  ● {ev.extendedProps?.status_name || (isPending ? 'รออนุมัติ' : 'อนุมัติแล้ว')}
                                </Typography>
                              </Box>
                            }
                            arrow
                          >
                            <Box 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent({ ...ev, room });
                              }}
                              sx={{
                                position: 'absolute',
                                left: `${leftPercent}%`,
                                width: `calc(${widthPercent}% - 4px)`,
                                top: 8,
                                height: 56,
                                bgcolor: barColor,
                                color: '#FFFFFF',
                                borderRadius: 1.5,
                                p: 1,
                                overflow: 'hidden',
                                cursor: 'pointer',
                                zIndex: 5,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                                transition: 'all 0.15s ease',
                                '&:hover': {
                                  transform: 'translateY(-1px)',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                                  zIndex: 10
                                }
                              }}
                            >
                              <Typography variant="caption" noWrap sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                {displayTitle}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5, opacity: 0.9 }}>
                                <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                  {timeRangeText}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  {ev.extendedProps?.has_food && <RestaurantIcon sx={{ fontSize: 13 }} titleAccess="สั่งอาหาร" />}
                                  {ev.extendedProps?.has_equipment && <MicIcon sx={{ fontSize: 13 }} titleAccess="ใช้อุปกรณ์" />}
                                </Box>
                              </Box>
                            </Box>
                          </Tooltip>
                        );
                      })}
                    </Box>
                  </Box>
                );
              })
            )}

          </Box>
        </DraggableTableContainer>
      </Paper>

      {/* Booking Details Modal */}
      <Dialog 
        open={Boolean(selectedEvent)} 
        onClose={() => setSelectedEvent(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: selectedEvent?.color || 'primary.main', color: 'white', fontWeight: 700 }}>
          {selectedEvent?.booking_name || selectedEvent?.title || 'รายละเอียดการจอง'}
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          {selectedEvent && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">รหัสการจอง:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedEvent.extendedProps?.booking_no || `#${selectedEvent.id}`}</Typography>

                <Typography variant="body2" color="text.secondary">ห้องประชุม:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedEvent.room?.room_name || selectedEvent.extendedProps?.room_name} ({selectedEvent.room?.location || selectedEvent.extendedProps?.location})
                </Typography>

                <Typography variant="body2" color="text.secondary">วัน/เวลา:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {selectedEvent.booking_date || currentDateStr} | {selectedEvent.start_time || ''} - {selectedEvent.end_time || ''} น.
                </Typography>

                <Typography variant="body2" color="text.secondary">ผู้จอง:</Typography>
                <Typography variant="body2">{selectedEvent.extendedProps?.organizer || '-'}</Typography>

                <Typography variant="body2" color="text.secondary">แผนก / สังกัด:</Typography>
                <Typography variant="body2">{selectedEvent.extendedProps?.department || '-'}</Typography>

                <Typography variant="body2" color="text.secondary">จำนวนผู้เข้าร่วม:</Typography>
                <Typography variant="body2">{selectedEvent.extendedProps?.participant_count ? `${selectedEvent.extendedProps.participant_count} ท่าน` : '-'}</Typography>

                <Typography variant="body2" color="text.secondary">สถานะ:</Typography>
                <Box>
                  <Chip 
                    label={selectedEvent.extendedProps?.status_name || (selectedEvent.extendedProps?.status === 'pending' ? 'รออนุมัติ' : 'อนุมัติแล้ว')}
                    size="small"
                    color={selectedEvent.extendedProps?.status === 'pending' ? 'warning' : 'success'}
                  />
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: 'background.default' }}>
          <Button onClick={() => setSelectedEvent(null)}>ปิด</Button>
          {!isGuest && (
            <Button 
              variant="contained" 
              onClick={() => {
                const bookingId = selectedEvent.id;
                setSelectedEvent(null);
                router.push(`/bookings`);
              }}
            >
              ดูรายการในระบบจอง
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Quick Booking Modal */}
      <Dialog
        open={Boolean(quickBookSlot)}
        onClose={() => setQuickBookSlot(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          จองห้องประชุม: {quickBookSlot?.room?.room_name}
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          {quickBookSlot && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                คุณกำลังจะจองห้อง <strong>{quickBookSlot.room.room_name}</strong> ({quickBookSlot.room.location})
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  วันที่: {thaiDateDisplay}
                </Typography>
                <Typography variant="body2">
                  เวลา: <strong>{quickBookSlot.start} - {quickBookSlot.end} น.</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ความจุห้อง: {quickBookSlot.room.capacity} ท่าน
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setQuickBookSlot(null)}>ยกเลิก</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              if (!quickBookSlot) return;
              const { room, start, end } = quickBookSlot;
              setQuickBookSlot(null);
              if (isGuest) {
                router.push(`/booking?room_id=${room.id}&roomId=${room.id}&date=${currentDateStr}&start=${start}&end=${end}&location=${encodeURIComponent(room.location || '')}`);
              } else {
                router.push(`/bookings?new=true&date=${currentDateStr}&start=${start}&end=${end}&roomId=${room.id}&room_id=${room.id}`);
              }
            }}
          >
            ไปที่หน้ากรอกข้อมูลการจอง
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
