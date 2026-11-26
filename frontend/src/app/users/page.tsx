'use client';

import DraggableTableContainer from '@/components/common/DraggableTableContainer';

import { useEffect, useState, useCallback } from 'react';
import { Switch, FormControlLabel, 
  Box, Button, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, CircularProgress,
  TablePagination, InputAdornment
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import MainLayout from '@/components/layout/MainLayout';
import api from '@/services/api';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalUsers, setTotalUsers] = useState(0);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '', is_active: true,
    role_id: ''
  });

  const fetchRoles = async () => {
    try {
      const res = await api.get<any, any>('/roles');
      if (res.success) setRoles(res.data?.data || res.data || []);
    } catch (error) { console.error('Failed to fetch roles', error); }
  };

  const fetchUsers = useCallback(async (currentPage: number, currentLimit: number, currentSearch: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (currentPage + 1).toString(),
        limit: currentLimit.toString(),
      });
      if (currentSearch.trim()) {
        params.append('search', currentSearch.trim());
      }
      const res = await api.get<any, any>(`/users?${params.toString()}`);
      if (res.success) {
        setUsers(res.data || []);
        setTotalUsers(res.meta?.total ?? (res.data?.length || 0));
      }
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(page, rowsPerPage, search);
  }, [fetchUsers, page, rowsPerPage, search]);

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleEdit = (user: any) => {
    setEditingId(user.id);
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email, is_active: user.is_active,
      role_id: user.role_id ? user.role_id.toString() : ''
    });
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!editingId) return; // Only support editing for now
    try {
      setSaving(true);
      // Update details
      const updateRes = await api.put<any, any>(`/users/${editingId}`, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email, is_active: formData.is_active
      });
      
      // Update role
      if (formData.role_id) {
        await api.put<any, any>(`/users/${editingId}/role`, { role_id: Number(formData.role_id) });
      }

      if (updateRes.success) {
        setOpenDialog(false);
        fetchUsers(page, rowsPerPage, search);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          User Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search name, username, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ width: { xs: '100%', sm: 280 } }}
          />
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingId(null);
              setFormData({ first_name: '', last_name: '', email: '', is_active: true, role_id: '' });
              setOpenDialog(true);
            }}
          >
            Add User
          </Button>
        </Box>
      </Box>

      <DraggableTableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ backgroundColor: 'background.default' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Username</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.first_name} {user.last_name}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={user.Role?.role_name || 'User'} 
                      size="small" 
                      color={user.Role?.role_code === 'SuperAdmin' ? 'error' : 'primary'} 
                      variant="outlined" 
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.is_active ? 'Active' : 'Inactive'} 
                      size="small" 
                      color={user.is_active ? 'success' : 'default'} 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary" onClick={() => handleEdit(user)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
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
        count={totalUsers}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        labelRowsPerPage="แสดงต่อหน้า (Rows per page):"
      />

      <Dialog open={openDialog} onClose={() => !saving && setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField 
              label="First Name" 
              fullWidth 
              value={formData.first_name} 
              onChange={e => setFormData({...formData, first_name: e.target.value})} 
            />
            <TextField 
              label="Last Name" 
              fullWidth 
              value={formData.last_name} 
              onChange={e => setFormData({...formData, last_name: e.target.value})} 
            />
            <TextField 
              label="Email" 
              fullWidth 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select 
                label="Role" 
                value={formData.role_id} 
                onChange={e => setFormData({...formData, role_id: e.target.value})}
              >
                {roles.map(r => (
                  <MenuItem key={r.id} value={r.id.toString()}>{r.role_name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel control={<Switch checked={formData.is_active || false} onChange={e => setFormData({...formData, is_active: e.target.checked})} color="success" />} label="Active Account" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={24} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
