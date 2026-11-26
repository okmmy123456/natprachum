'use client';

import DraggableTableContainer from '@/components/common/DraggableTableContainer';

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TablePagination,
  TextField, InputAdornment, Chip, CircularProgress,
  useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import api from '../../../services/api';
import { useAppSelector } from '../../../store/hooks';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface ActivityLog {
  id: number;
  action: string;
  module: string;
  description: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  User?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function SystemLogsPage() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Protect route
  useEffect(() => {
    if (user && user.role !== 'SuperAdmin') {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0); // Reset page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get<any, any>('/logs/activity', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: debouncedSearch,
          sortBy: 'created_at',
          sortOrder: 'desc'
        }
      });
      if (res.success && res.data) {
        setLogs(res.data.data);
        setTotalCount(res.data.total);
      }
    } catch (error) {
      console.error('Failed to fetch activity logs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'SuperAdmin') {
      fetchLogs();
    }
  }, [page, rowsPerPage, debouncedSearch, user]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getModuleColor = (module: string) => {
    switch (module) {
      case 'auth': return 'secondary';
      case 'bookings': return 'primary';
      case 'users': return 'info';
      case 'rooms': return 'success';
      case 'food_orders': return 'warning';
      default: return 'default';
    }
  };

  if (user?.role !== 'SuperAdmin') {
    return null; // Will redirect in useEffect
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.text.primary }}>
        System Logs
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: theme.palette.text.secondary }}>
        Monitor system activities and user actions (SuperAdmin only)
      </Typography>

      <Paper sx={{ width: '100%', mb: 2, borderRadius: 2, boxShadow: theme.shadows[2], overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', borderBottom: `1px solid ${theme.palette.divider}` }}>
          <TextField
            size="small"
            variant="outlined"
            placeholder="Search action, module, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }
            }}
            sx={{ width: { xs: '100%', sm: 300 } }}
          />
        </Box>

        <DraggableTableContainer>
          <Table sx={{ minWidth: 750 }}>
            <TableHead sx={{ backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc' }}>
              <TableRow>
                <TableCell width="15%">Date/Time</TableCell>
                <TableCell width="15%">User</TableCell>
                <TableCell width="10%">Module</TableCell>
                <TableCell width="15%">Action</TableCell>
                <TableCell width="35%">Description</TableCell>
                <TableCell width="10%">IP Address</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No logs found.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      {log.created_at ? format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss') : '-'}
                    </TableCell>
                    <TableCell>
                      {log.User ? (
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {log.User.first_name} {log.User.last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {log.User.email}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">System</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={log.module} 
                        size="small" 
                        color={getModuleColor(log.module) as any} 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{log.action}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ 
                        maxWidth: 300, 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis' 
                      }} title={log.description}>
                        {log.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {log.ip_address || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DraggableTableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
}
