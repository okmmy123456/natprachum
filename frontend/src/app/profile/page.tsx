'use client';

import { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, Button, CircularProgress, Alert, Divider, MenuItem
} from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import api from '@/services/api';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import { useTranslation } from 'react-i18next';

export default function ProfilePage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  
  const [loading, setLoading] = useState(true);
  
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    company_id: '',
    department_name: '',
    department_code: '',
    office_phone: '',
    mobile_phone: ''
  });
  const [companies, setCompanies] = useState<any[]>([]);
  
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileRes, companiesRes] = await Promise.all([
        api.get<any, any>('/auth/profile'),
        api.get<any, any>('/master/companies')
      ]);

      if (companiesRes.success) {
        setCompanies(companiesRes.data);
      }

      if (profileRes.success && profileRes.data) {
        setProfileData({
          first_name: profileRes.data.first_name || '',
          last_name: profileRes.data.last_name || '',
          email: profileRes.data.email || '',
          company_id: profileRes.data.company_id || '',
          department_name: profileRes.data.department_name || '',
          department_code: profileRes.data.department_code || '',
          office_phone: profileRes.data.office_phone || '',
          mobile_phone: profileRes.data.mobile_phone || ''
        });
      }
    } catch (err: any) {
      setProfileError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      setProfileSuccess('');
      setProfileError('');
      
      const res = await api.put<any, any>('/auth/profile', profileData);
      if (res.success && res.data) {
        setProfileSuccess('Profile updated successfully!');
        // Update redux state with new user info
        dispatch(setCredentials({ user: res.data, access_token: localStorage.getItem('token') || '' }));
      }
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    try {
      setPasswordSaving(true);
      setPasswordSuccess('');
      setPasswordError('');
      
      const res = await api.put<any, any>('/auth/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      if (res.success) {
        setPasswordSuccess('Password changed successfully!');
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {t('profile.title', 'My Profile')}
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>{t('profile.personal_info', 'Personal Information')}</Typography>
            
            {profileSuccess && <Alert severity="success" sx={{ mb: 2 }}>{profileSuccess}</Alert>}
            {profileError && <Alert severity="error" sx={{ mb: 2 }}>{profileError}</Alert>}
            
            <form onSubmit={handleSaveProfile}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label={t('profile.first_name', 'First Name')} name="first_name" required value={profileData.first_name} onChange={handleProfileChange} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label={t('profile.last_name', 'Last Name')} name="last_name" required value={profileData.last_name} onChange={handleProfileChange} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth label={t('profile.email', 'Email')} name="email" type="email" required value={profileData.email} onChange={handleProfileChange} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField 
                    select
                    fullWidth 
                    label={t('profile.company', 'Company')} 
                    name="company_id" 
                    value={profileData.company_id} 
                    onChange={handleProfileChange}
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {companies.map((c) => (
                      <MenuItem key={c.id} value={c.id.toString()}>
                        {c.company_name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label={t('profile.department_name', 'Department Name')} name="department_name" value={profileData.department_name} onChange={handleProfileChange} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label={t('profile.department_code', 'Department Code')} name="department_code" value={profileData.department_code} onChange={handleProfileChange} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label={t('profile.mobile_phone', 'Mobile Phone')} name="mobile_phone" value={profileData.mobile_phone} onChange={handleProfileChange} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label={t('profile.office_phone', 'Office Phone')} name="office_phone" value={profileData.office_phone} onChange={handleProfileChange} />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="submit" variant="contained" disabled={profileSaving}>
                  {profileSaving ? <CircularProgress size={24} color="inherit" /> : t('profile.save_profile', 'Save Profile')}
                </Button>
              </Box>
            </form>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>{t('profile.change_password', 'Change Password')}</Typography>
            
            {passwordSuccess && <Alert severity="success" sx={{ mb: 2 }}>{passwordSuccess}</Alert>}
            {passwordError && <Alert severity="error" sx={{ mb: 2 }}>{passwordError}</Alert>}
            
            <form onSubmit={handleSavePassword}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField 
                  fullWidth 
                  label={t('profile.current_password', 'Current Password')} 
                  name="current_password" 
                  type="password" 
                  required 
                  value={passwordData.current_password} 
                  onChange={handlePasswordChange} 
                />
                <TextField 
                  fullWidth 
                  label={t('profile.new_password', 'New Password')} 
                  name="new_password" 
                  type="password" 
                  required 
                  value={passwordData.new_password} 
                  onChange={handlePasswordChange} 
                />
                <TextField 
                  fullWidth 
                  label={t('profile.confirm_password', 'Confirm New Password')} 
                  name="confirm_password" 
                  type="password" 
                  required 
                  value={passwordData.confirm_password} 
                  onChange={handlePasswordChange} 
                  error={Boolean(passwordData.confirm_password && passwordData.confirm_password !== passwordData.new_password)}
                  helperText={passwordData.confirm_password && passwordData.confirm_password !== passwordData.new_password ? 'Passwords do not match' : ''}
                />
              </Box>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="submit" variant="contained" color="secondary" disabled={passwordSaving}>
                  {passwordSaving ? <CircularProgress size={24} color="inherit" /> : t('profile.update_password', 'Update Password')}
                </Button>
              </Box>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </MainLayout>
  );
}
