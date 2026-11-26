'use client';

import DraggableTableContainer from '@/components/common/DraggableTableContainer';

import { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Paper, Tabs, Tab, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Switch, FormControlLabel, CircularProgress, MenuItem,
  Select, InputLabel, FormControl
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import MainLayout from '@/components/layout/MainLayout';
import { useAppSelector } from '@/store/hooks';
import api from '@/services/api';

const TABS = [
  { label: 'Companies', entity: 'companies' },
  { label: 'Sites', entity: 'sites' },
  { label: 'Departments', entity: 'departments' },
  { label: 'Equipments', entity: 'equipments' },
];

const ENTITY_CONFIG: Record<string, any[]> = {
  companies: [
    { key: 'company_code', label: 'Company Code', type: 'text', required: true },
    { key: 'company_name', label: 'Company Name', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'phone', label: 'Phone', type: 'text' },
    { key: 'address', label: 'Address', type: 'text' },
  ],
  sites: [
    { key: 'site_code', label: 'Site Code', type: 'text', required: true },
    { key: 'site_name', label: 'Site Name', type: 'text', required: true },
    { key: 'company_id', label: 'Company', type: 'select', required: true },
    { key: 'address', label: 'Address', type: 'text' },
  ],
  departments: [
    { key: 'department_code', label: 'Department Code', type: 'text', required: true },
    { key: 'department_name', label: 'Department Name', type: 'text', required: true },
    { key: 'company_id', label: 'Company', type: 'select', required: true },
  ],
  equipments: [
    { key: 'equipment_code', label: 'Equipment Code', type: 'text', required: true },
    { key: 'equipment_name', label: 'Equipment Name', type: 'text', required: true },
    { key: 'icon', label: 'Icon String', type: 'text' },
  ]
};

export default function MasterDataPage() {
  const { user } = useAppSelector((state: any) => state.auth);
  const [tabIndex, setTabIndex] = useState(0);
  const [data, setData] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog state
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({});

  const activeEntity = TABS[tabIndex].entity;
  const activeConfig = ENTITY_CONFIG[activeEntity];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any, any>(`/master/${activeEntity}`);
      if (res.success) {
        setData(res.data || []);
      }
      
      // Fetch companies if needed for selects
      if (['sites', 'departments'].includes(activeEntity)) {
        const cRes = await api.get<any, any>('/master/companies');
        if (cRes.success) setCompanies(cRes.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  }, [activeEntity]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpen = (item?: any) => {
    if (item) {
      setEditId(item.id);
      setFormData(item);
    } else {
      setEditId(null);
      setFormData({ is_active: true });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let res;
      if (editId) {
        res = await api.put<any, any>(`/master/${activeEntity}/${editId}`, formData);
      } else {
        res = await api.post<any, any>(`/master/${activeEntity}`, formData);
      }
      if (res.success) {
        setOpen(false);
        fetchData();
      } else {
        alert(res.message || 'Failed to save');
      }
    } catch (error: any) {
      alert('An error occurred');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this record?')) {
      try {
        const res = await api.delete<any, any>(`/master/${activeEntity}/${id}`);
        if (res.success) {
          fetchData();
        } else {
          alert(res.message || 'Failed to delete');
        }
      } catch (error) {
        alert('An error occurred');
      }
    }
  };

  return (
    <MainLayout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Master Data
        </Typography>
        {(user?.role === 'SuperAdmin' || user?.role === 'Admin') && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Add New {TABS[tabIndex].label.slice(0, -1)}
          </Button>
        )}
      </Box>

      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <Tabs 
          value={tabIndex} 
          onChange={(e, v) => setTabIndex(v)} 
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {TABS.map((tab, idx) => (
            <Tab key={tab.entity} label={tab.label} value={idx} />
          ))}
        </Tabs>

        <Box sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
          ) : (
            <DraggableTableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: 'background.default' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, width: 80 }}>ID</TableCell>
                    {activeConfig.map((col) => (
                      <TableCell key={col.key} sx={{ fontWeight: 600 }}>{col.label}</TableCell>
                    ))}
                    <TableCell sx={{ fontWeight: 600, width: 100 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 120 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow><TableCell colSpan={activeConfig.length + 3} align="center">No records found</TableCell></TableRow>
                  ) : (
                    data.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>{row.id}</TableCell>
                        {activeConfig.map((col) => {
                          if (col.type === 'select' && col.key === 'company_id') {
                            const comp = companies.find(c => c.id === row.company_id);
                            return <TableCell key={col.key}>{comp ? comp.company_code : row.company_id}</TableCell>;
                          }
                          return <TableCell key={col.key}>{row[col.key]}</TableCell>;
                        })}
                        <TableCell>
                          <Box sx={{ 
                            px: 1, py: 0.5, borderRadius: 1, display: 'inline-block', fontSize: '0.75rem', fontWeight: 'bold',
                            backgroundColor: row.is_active ? '#e0f2f1' : '#ffebee',
                            color: row.is_active ? '#00796b' : '#c62828'
                          }}>
                            {row.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" color="primary" onClick={() => handleOpen(row)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </DraggableTableContainer>
          )}
        </Box>
      </Paper>

      <Dialog open={open} onClose={() => !saving && setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit' : 'Add'} {TABS[tabIndex].label.slice(0, -1)}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {activeConfig.map((field) => {
              if (field.type === 'select' && field.key === 'company_id') {
                return (
                  <FormControl fullWidth key={field.key} required={field.required}>
                    <InputLabel>{field.label}</InputLabel>
                    <Select
                      label={field.label}
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    >
                      {companies.map(c => (
                        <MenuItem key={c.id} value={c.id}>{c.company_name} ({c.company_code})</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                );
              }
              
              return (
                <TextField
                  key={field.key}
                  label={field.label}
                  fullWidth
                  required={field.required}
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                />
              );
            })}
            <FormControlLabel
              control={
                <Switch 
                  checked={formData.is_active !== false} 
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              }
              label="Is Active"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Button onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={24} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
