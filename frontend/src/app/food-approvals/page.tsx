'use client';

import { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip,
  Divider, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoIcon from '@mui/icons-material/Info';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import MainLayout from '@/components/layout/MainLayout';
import api from '@/services/api';
import dayjs from 'dayjs';
import { useAppSelector } from '@/store/hooks';

export default function FoodApprovalsPage() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await api.get<any, any>('/food-orders/pending');
      if (res.success) setPending(res.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
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

  const handleApprove = async (id: number) => {
    if (!confirm('คุณต้องการอนุมัติคำขอจองอาหารนี้หรือไม่?')) return;
    try {
      setProcessing(true);
      const res = await api.put<any, any>(`/food-orders/${id}/approve`, {});
      if (res.success) fetchPending();
    } catch (error: any) { alert(error.message || 'ไม่สามารถอนุมัติได้'); }
    finally { setProcessing(false); }
  };

  const handleReject = async () => {
    if (!rejectingId || !rejectReason) return;
    try {
      setProcessing(true);
      const res = await api.put<any, any>(`/food-orders/${rejectingId}/reject`, { reject_reason: rejectReason });
      if (res.success) {
        setRejectingId(null);
        setRejectReason('');
        fetchPending();
      }
    } catch (error: any) { alert(error.message || 'ไม่สามารถปฏิเสธได้'); }
    finally { setProcessing(false); }
  };

  const parseJsonSafe = (jsonStr: string | null | undefined): string[] => {
    if (!jsonStr) return [];
    try { return JSON.parse(jsonStr); } catch { return []; }
  };

  return (
    <MainLayout>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <RestaurantIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>อนุมัติจองอาหาร</Typography>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : pending.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <RestaurantIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography color="text.secondary">ไม่มีคำขอจองอาหารที่รออนุมัติ</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {pending.map(fo => {
            const booking = fo.Booking;
            const breakfastItems = parseJsonSafe(fo.breakfast_items);
            const lunches = parseJsonSafe(fo.lunch_items);
            const afternoonItems = parseJsonSafe(fo.afternoon_items);
            const guestDiners = (fo.Diners || []).filter((d: any) => d.diner_type === 'guest');
            const internalDiners = (fo.Diners || []).filter((d: any) => d.diner_type === 'internal');

            return (
              <Grid size={{ xs: 12, lg: 6 }} key={fo.id}>
                <Card sx={{ 
                  height: '100%', display: 'flex', flexDirection: 'column',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: 6 }
                }}>
                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{booking?.booking_name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {booking?.booking_no}
                        </Typography>
                      </Box>
                      <Chip label="รออนุมัติ" color="warning" size="small" sx={{ fontWeight: 600 }} />
                    </Box>

                    {/* Edit Details */}
                    {fo.food_edit_details && parseJsonSafe(fo.food_edit_details).length > 0 && (
                      <Box sx={{ mb: 2, p: 1.5, backgroundColor: 'warning.light', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.dark', mb: 0.5 }}>
                          ⚠️ มีการแก้ไขข้อมูลในส่วนของ:
                        </Typography>
                        <ul style={{ margin: 0, paddingLeft: 20, color: '#b45309', fontSize: '0.875rem' }}>
                          {parseJsonSafe(fo.food_edit_details).map((change: string, idx: number) => (
                            <li key={idx}>{change}</li>
                          ))}
                        </ul>
                      </Box>
                    )}

                    {/* Booking info */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2, p: 1.5, backgroundColor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant="body2"><strong>ห้อง:</strong> {booking?.Room?.room_name}</Typography>
                      <Typography variant="body2"><strong>วันที่:</strong> {booking ? dayjs(booking.booking_date).format('DD/MM/YYYY') : '-'}</Typography>
                      <Typography variant="body2"><strong>เวลา:</strong> {booking?.start_time?.substring(0, 5)} - {booking?.end_time?.substring(0, 5)}</Typography>
                      <Typography variant="body2"><strong>ผู้จอง:</strong> {booking?.User ? `${booking.User.first_name} ${booking.User.last_name}` : '-'}</Typography>
                    </Box>

                    {/* Company */}
                    <Typography variant="body2" sx={{ mb: 1 }}><strong>บริษัท:</strong> {fo.company_name || '-'}</Typography>

                    {/* Welcome sign */}
                    {fo.welcome_sign_needed && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>ป้ายต้อนรับ:</strong> {fo.welcome_sign_text || 'ต้องการ'}
                      </Typography>
                    )}

                    {/* Breakfast */}
                    {breakfastItems.length > 0 && (
                      <Accordion disableGutters sx={{ mb: 0.5, '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>🥞 อาหารเช้า (เวลา: {fo.breakfast_time || '-'})</Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                          {breakfastItems.map((s: string, i: number) => (
                            <Typography variant="body2" key={i}>{i + 1}. {s}</Typography>
                          ))}
                        </AccordionDetails>
                      </Accordion>
                    )}

                    {/* Lunch */}
                    {lunches.length > 0 && (
                      <Accordion disableGutters sx={{ mb: 0.5, '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>🍱 อาหารเที่ยง (เวลา: {fo.lunch_time || '-'})</Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                          {lunches.map((l: string, i: number) => (
                            <Typography variant="body2" key={i}>{i + 1}. {l}</Typography>
                          ))}
                        </AccordionDetails>
                      </Accordion>
                    )}

                    {/* Afternoon */}
                    {afternoonItems.length > 0 && (
                      <Accordion disableGutters sx={{ mb: 0.5, '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>🧋 อาหารบ่าย (เวลา: {fo.afternoon_time || '-'})</Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                          {afternoonItems.map((s: string, i: number) => (
                            <Typography variant="body2" key={i}>{i + 1}. {s}</Typography>
                          ))}
                        </AccordionDetails>
                      </Accordion>
                    )}

                    {/* Diners */}
                    {(guestDiners.length > 0 || internalDiners.length > 0) && (
                      <Accordion disableGutters sx={{ mb: 0.5, '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>👤 ผู้รับประทาน ({guestDiners.length + internalDiners.length} คน)</Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                          {guestDiners.length > 0 && (
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>ลูกค้าบริษัท:</Typography>
                              {guestDiners.map((d: any, i: number) => (
                                <Typography variant="body2" key={d.id}>{i + 1}. {d.diner_name}</Typography>
                              ))}
                            </Box>
                          )}
                          {internalDiners.length > 0 && (
                            <Box>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>พนักงาน TI/TMC:</Typography>
                              {internalDiners.map((d: any, i: number) => (
                                <Typography variant="body2" key={d.id}>
                                  {i + 1}. {d.diner_name} {d.department ? `(${d.department})` : ''}
                                </Typography>
                              ))}
                            </Box>
                          )}
                        </AccordionDetails>
                      </Accordion>
                    )}

                    {/* Additional notes */}
                    {fo.additional_notes && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>หมายเหตุ:</strong> {fo.additional_notes}
                      </Typography>
                    )}
                  </CardContent>

                  {/* Action buttons */}
                  <Box sx={{ p: 2, pt: 1, display: 'flex', gap: 1 }}>
                    {user?.role === 'Manager' ? (
                      <>
                        <Button 
                          variant="contained" 
                          color="success" 
                          fullWidth 
                          disabled={processing} 
                          onClick={() => handleApprove(fo.id)}
                          startIcon={<CheckCircleIcon />}
                        >
                          อนุมัติ
                        </Button>
                        <Button 
                          variant="outlined" 
                          color="error" 
                          fullWidth 
                          disabled={processing} 
                          onClick={() => setRejectingId(fo.id)}
                          startIcon={<CancelIcon />}
                        >
                          ไม่อนุมัติ
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="contained" 
                        color="primary" 
                        fullWidth 
                        disabled={processing} 
                        onClick={() => handleApprove(fo.id)}
                        startIcon={<InfoIcon />}
                      >
                        รับทราบ
                      </Button>
                    )}
                  </Box>
                  <Box sx={{ px: 2, pb: 2 }}>
                    <Button 
                      variant="outlined" 
                      color="secondary" 
                      fullWidth 
                      startIcon={<PictureAsPdfIcon />}
                      onClick={() => handleDownloadPDF(fo.id)}
                    >
                      พิมพ์ใบจอง (PDF)
                    </Button>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Reject dialog */}
      <Dialog open={!!rejectingId} onClose={() => !processing && setRejectingId(null)} fullWidth maxWidth="sm">
        <DialogTitle>ปฏิเสธคำขอจองอาหาร</DialogTitle>
        <DialogContent dividers>
          <TextField 
            label="เหตุผลที่ปฏิเสธ" 
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
          <Button onClick={() => setRejectingId(null)} disabled={processing}>ยกเลิก</Button>
          <Button variant="contained" color="error" onClick={handleReject} disabled={processing || !rejectReason}>ปฏิเสธ</Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
