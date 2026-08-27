'use client';

import { useState } from 'react';
import { 
  Box, Button, Typography, Paper, Grid, Card, CardContent, 
  Select, MenuItem, FormControl, InputLabel, TextField
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import AssessmentIcon from '@mui/icons-material/Assessment';
import MainLayout from '@/components/layout/MainLayout';
import api from '@/services/api';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('daily');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      setLoading(true);
      // Construct URL for export
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/reports/${reportType}/export?format=${format}&date=${date}`;
      
      // We can open in a new tab to download the file
      window.open(url, '_blank');
    } catch (error) {
      console.error('Export failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Reports & Analytics
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <AssessmentIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Generate Booking Report
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  label="Report Type"
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <MenuItem value="daily">Daily Report</MenuItem>
                  <MenuItem value="monthly">Monthly Report</MenuItem>
                  <MenuItem value="yearly">Yearly Report</MenuItem>
                  <MenuItem value="room_usage">Room Usage Report</MenuItem>
                </Select>
              </FormControl>

              {reportType === 'daily' && (
                <TextField
                  label="Date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  fullWidth
                />
              )}
              {reportType === 'monthly' && (
                <TextField
                  label="Month"
                  type="month"
                  value={date.slice(0, 7)}
                  onChange={(e) => setDate(e.target.value + '-01')}
                  slotProps={{ inputLabel: { shrink: true } }}
                  fullWidth
                />
              )}

              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExport('excel')}
                  disabled={loading}
                  fullWidth
                >
                  Export Excel
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExport('pdf')}
                  disabled={loading}
                  fullWidth
                >
                  Export PDF
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Quick Stats
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Card variant="outlined" sx={{ backgroundColor: 'action.hover' }}>
                  <CardContent>
                    <Typography color="text.secondary" variant="body2">Completed Bookings</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>142</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Card variant="outlined" sx={{ backgroundColor: 'action.hover' }}>
                  <CardContent>
                    <Typography color="text.secondary" variant="body2">Cancelled Bookings</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>12</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Card variant="outlined" sx={{ backgroundColor: 'action.hover' }}>
                  <CardContent>
                    <Typography color="text.secondary" variant="body2">Most Popular Room</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1 }}>Boardroom A</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </MainLayout>
  );
}
