'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Grid, Paper, Typography, Box, CircularProgress, Card, CardContent, FormControl, Select, MenuItem, InputLabel } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import api from '@/services/api';
import MainLayout from '@/components/layout/MainLayout';
import { useAppSelector } from '@/store/hooks';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface DashboardStats {
  totalUsers: number;
  totalRooms: number;
  totalBookings: number;
  todaysBookings: number;
  pendingApprovals: number;
  totalFoodBookings: number;
}

interface DashboardAnalytics {
  mostUsedRooms: any[];
  bookingTrends: any[];
  departmentUsage: any[];
  customerCompanyVisits: any[];
  popularMenus: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57', '#a4de6c', '#8dd1e1'];

export default function DashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const { user, loading: authLoading } = useAppSelector((state) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login');
      } else if (user.role !== 'SuperAdmin' && user.role !== 'Admin') {
        router.push('/bookings');
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let dateFrom = '';
        let dateTo = '';
        
        if (selectedYear === 'all') {
          dateFrom = '2000-01-01';
          dateTo = '2099-12-31';
        } else {
          const yearNum = parseInt(selectedYear);
          if (selectedMonth === 'all') {
            dateFrom = new Date(yearNum, 0, 1).toISOString().slice(0, 10);
            dateTo = new Date(yearNum, 11, 31).toISOString().slice(0, 10);
          } else {
            const monthNum = parseInt(selectedMonth);
            dateFrom = new Date(yearNum, monthNum, 1).toISOString().slice(0, 10);
            dateTo = new Date(yearNum, monthNum + 1, 0).toISOString().slice(0, 10);
          }
        }

        const [statsRes, analyticsRes] = await Promise.all([
          api.get<any, any>('/dashboard/stats'),
          api.get<any, any>(`/dashboard/analytics?date_from=${dateFrom}&date_to=${dateTo}`)
        ]);
        
        if (statsRes.success) {
          setStats(statsRes.data);
        }
        if (analyticsRes.success) {
          setAnalytics(analyticsRes.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear, selectedMonth]);

  const StatCard = ({ title, value, icon, color }: any) => (
    <Card elevation={1} sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" variant="subtitle2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {loading ? <CircularProgress size={24} /> : value}
            </Typography>
          </Box>
          <Box sx={{ 
            backgroundColor: `${color}.light`, 
            color: `${color}.dark`,
            p: 1.5, 
            borderRadius: 2,
            display: 'flex',
          }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const currentYearNum = new Date().getFullYear();
  const years = ['all', ...Array.from({length: 10}, (_, i) => (currentYearNum - 3 + i).toString())];
  const months = [
    { value: 'all', label: 'ทุกเดือน (All)' },
    { value: '0', label: 'มกราคม (Jan)' },
    { value: '1', label: 'กุมภาพันธ์ (Feb)' },
    { value: '2', label: 'มีนาคม (Mar)' },
    { value: '3', label: 'เมษายน (Apr)' },
    { value: '4', label: 'พฤษภาคม (May)' },
    { value: '5', label: 'มิถุนายน (Jun)' },
    { value: '6', label: 'กรกฎาคม (Jul)' },
    { value: '7', label: 'สิงหาคม (Aug)' },
    { value: '8', label: 'กันยายน (Sep)' },
    { value: '9', label: 'ตุลาคม (Oct)' },
    { value: '10', label: 'พฤศจิกายน (Nov)' },
    { value: '11', label: 'ธันวาคม (Dec)' }
  ];

  return (
    <MainLayout>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {t('dashboard.title', 'Dashboard')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>เดือน (Month)</InputLabel>
            <Select
              value={selectedMonth}
              label="เดือน (Month)"
              onChange={(e) => setSelectedMonth(e.target.value as string)}
              disabled={selectedYear === 'all'}
            >
              {months.map(m => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>ปี (Year)</InputLabel>
            <Select
              value={selectedYear}
              label="ปี (Year)"
              onChange={(e) => {
                setSelectedYear(e.target.value as string);
                if (e.target.value === 'all') setSelectedMonth('all');
              }}
            >
              <MenuItem value="all">ทุกปี (All Time)</MenuItem>
              {years.filter(y => y !== 'all').map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <StatCard 
                title={t('dashboard.todays_bookings', 'Today\'s Bookings')} 
                value={stats?.todaysBookings || 0} 
                icon={<EventAvailableIcon />} 
                color="primary" 
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <StatCard 
                title={t('dashboard.pending_approvals', 'Pending Approvals')} 
                value={stats?.pendingApprovals || 0} 
                icon={<PendingActionsIcon />} 
                color="warning" 
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <StatCard 
                title="Food Orders" 
                value={stats?.totalFoodBookings || 0} 
                icon={<RestaurantIcon />} 
                color="success" 
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <StatCard 
                title={t('dashboard.total_rooms', 'Total Rooms')} 
                value={stats?.totalRooms || 0} 
                icon={<MeetingRoomIcon />} 
                color="secondary" 
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <StatCard 
                title={t('dashboard.total_users', 'Total Users')} 
                value={stats?.totalUsers || 0} 
                icon={<PeopleIcon />} 
                color="info" 
              />
            </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Paper elevation={1} sx={{ p: 3, height: '100%', minHeight: 400 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Recent Bookings Overview
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ height: 300, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics?.bookingTrends || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" name="Bookings" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Paper>
          </Grid>
          
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={1} sx={{ p: 3, height: '100%', minHeight: 400 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Most Used Rooms
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ height: 300, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.mostUsedRooms?.map(r => ({ name: r.Room?.room_name || 'Unknown', count: r.booking_count })) || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Bookings" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={1} sx={{ p: 3, height: '100%', minHeight: 400 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Top Customer Companies (Visits)
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ height: 300, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.customerCompanyVisits || []} layout="vertical" margin={{ left: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="customer_company" type="category" width={100} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="visit_count" name="Visits" fill="#FFBB28" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={1} sx={{ p: 3, height: '100%', minHeight: 400 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Top Booking Departments
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ height: 300, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.departmentUsage?.map(d => ({ name: d.User?.Department?.department_name || 'Unknown', count: d.booking_count })) || []} layout="vertical" margin={{ left: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Bookings" fill="#0088FE" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={1} sx={{ p: 3, height: '100%', minHeight: 400 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Popular Food Menus
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ height: 300, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics?.popularMenus || []}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {(analytics?.popularMenus || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Paper>
          </Grid>

        </Grid>
      )}
    </MainLayout>
  );
}
