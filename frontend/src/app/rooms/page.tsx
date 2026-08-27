'use client';

import { useEffect, useState } from 'react';
import { 
  Box, Button, Typography, Grid, Card, CardMedia, CardContent, CardActions,
  Chip, CircularProgress, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Checkbox, ListItemText, FormControlLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Close';
import { FormControl, InputLabel, Select, MenuItem, IconButton } from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import { useAppSelector } from '@/store/hooks';
import api, { BASE_URL } from '@/services/api';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableImage({ img, selectedRoomForImages, handleDeleteImage }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: img.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    position: 'relative' as any,
  };

  return (
    <Grid size={{ xs: 12, sm: 4, md: 3 }} ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card variant="outlined" sx={{ cursor: 'grab', opacity: isDragging ? 0.5 : 1 }}>
        <CardMedia
          component="img"
          height="120"
          image={img.image_url.startsWith('http') ? img.image_url : `${BASE_URL}${img.image_url}`}
          alt="Room Image"
        />
        <CardActions sx={{ justifyContent: 'center', p: 0 }}>
          <Button 
            size="small" 
            color="error" 
            fullWidth 
            onPointerDown={(e) => e.stopPropagation()} 
            onClick={() => handleDeleteImage(selectedRoomForImages.id, img.id)}
          >
            Delete
          </Button>
        </CardActions>
      </Card>
    </Grid>
  );
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);
  const { user } = useAppSelector((state) => state.auth);
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  
  const isSuperAdmin = user?.role === 'SuperAdmin';
  const isAdmin = user?.role === 'Admin';
  const canManageRooms = isSuperAdmin || isAdmin;
  const canEditRooms = isSuperAdmin || isAdmin;

  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [selectedRoomForImages, setSelectedRoomForImages] = useState<any>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    room_name: '',
    location: '',
    capacity: '',
    description: '',
    owner_ids: [] as string[],
    owner_id: '',
    payment_creator_type: 'approver',
    equipment_ids: [] as string[],
    auto_approve: false,
    additional_location: ''
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        ...formData,
        capacity: Number(formData.capacity),
        owner_ids: formData.owner_ids.length > 0 ? formData.owner_ids.map(Number) : undefined,
        owner_id: formData.owner_id ? Number(formData.owner_id) : null,
        equipment_ids: formData.equipment_ids.length > 0 ? formData.equipment_ids.map(Number) : undefined,
        is_active: true
      };

      let res;
      if (editingId) {
        res = await api.put<any, any>(`/rooms/${editingId}`, payload);
      } else {
        res = await api.post<any, any>('/rooms', payload);
      }

      if (res.success) {
        const roomId = editingId || res.data?.id;
        if (selectedFiles.length > 0 && roomId) {
          const imageFormData = new FormData();
          selectedFiles.forEach(file => imageFormData.append('images', file));
          
          try {
            await api.post(`/rooms/${roomId}/images`, imageFormData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
          } catch (imgError: any) {
            console.error('Failed to upload images', imgError);
            alert('Room saved but failed to upload images');
          }
        }
        
        setOpenDialog(false);
        resetForm();
        fetchRooms();
      }
    } catch (error: any) {
      console.error('Failed to save room', error);
      alert(error.message || 'Failed to save room');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    try {
      const res = await api.delete<any, any>(`/rooms/${id}`);
      if (res.success) fetchRooms();
    } catch (error: any) {
      alert(error.message || 'Failed to delete room');
    }
  };

  const handleEdit = (room: any) => {
    setEditingId(room.id);
    setFormData({
      room_name: room.room_name,
      location: room.location,
      capacity: room.capacity.toString(),
      description: room.description || '',
      owner_ids: room.Owners ? room.Owners.map((o: any) => o.id.toString()) : [],
      owner_id: room.owner_id ? room.owner_id.toString() : '',
      payment_creator_type: room.payment_creator_type || 'approver',
      equipment_ids: room.RoomEquipments ? room.RoomEquipments.map((re: any) => re.equipment_id.toString()) : [],
      auto_approve: room.auto_approve || false,
      additional_location: room.additional_location || ''
    });
    setOpenDialog(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ room_name: '', location: '', capacity: '', description: '', owner_ids: [], owner_id: '', payment_creator_type: 'approver', equipment_ids: [], auto_approve: false, additional_location: '' });
    setSelectedFiles([]);
  };

  const fetchEquipments = async () => {
    try {
      const res = await api.get<any, any>('/master/equipments');
      if (res.success) {
        setEquipments(res.data?.data || res.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch equipments', error);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchEquipments();
    if (canManageRooms || canEditRooms) {
      fetchUsers();
    }
  }, [canManageRooms, canEditRooms]);

  const fetchUsers = async () => {
    try {
      const res = await api.get<any, any>('/users?limit=100');
      if (res.success) {
        setUsers(res.data?.data || res.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch users', error);
    }
  };

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await api.get<any, any>('/rooms');
      if (res.success) {
        setRooms(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch rooms', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenImageDialog = (room: any) => {
    setSelectedRoomForImages(room);
    setOpenImageDialog(true);
  };

  const handleCloseImageDialog = () => {
    setOpenImageDialog(false);
    setSelectedRoomForImages(null);
  };

  const handleDeleteImage = async (roomId: number, imageId: number) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    try {
      const res = await api.delete<any, any>(`/rooms/${roomId}/images/${imageId}`);
      if (res.success) {
        fetchRooms();
        const updatedRoomRes = await api.get<any, any>(`/rooms/${roomId}`);
        if (updatedRoomRes.success && updatedRoomRes.data) {
          setSelectedRoomForImages(updatedRoomRes.data);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete image');
    }
  };

  const handleUploadImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !selectedRoomForImages) return;

    const currentImagesCount = selectedRoomForImages.RoomImages?.length || 0;
    if (currentImagesCount + files.length > 10) {
      alert(`You can only upload up to 10 images in total. You currently have ${currentImagesCount} images.`);
      return;
    }

    setUploadingImages(true);
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    try {
      const res = await api.post<any, any>(`/rooms/${selectedRoomForImages.id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.success) {
        fetchRooms();
        const updatedRoomRes = await api.get<any, any>(`/rooms/${selectedRoomForImages.id}`);
        if (updatedRoomRes.success && updatedRoomRes.data) {
          setSelectedRoomForImages(updatedRoomRes.data);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to upload images');
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id && selectedRoomForImages) {
      // Create a sorted copy of images to ensure indexes match current view
      const currentImages = [...selectedRoomForImages.RoomImages].sort((a: any, b: any) => a.sort_order - b.sort_order);
      const oldIndex = currentImages.findIndex((img: any) => img.id === active.id);
      const newIndex = currentImages.findIndex((img: any) => img.id === over.id);
      
      const newImages = arrayMove(currentImages, oldIndex, newIndex);
      // Update sort_order locally so it re-renders correctly before refetching
      newImages.forEach((img: any, index: number) => { img.sort_order = index; });
      
      setSelectedRoomForImages({
        ...selectedRoomForImages,
        RoomImages: newImages
      });

      try {
        const imageIds = newImages.map((img: any) => img.id);
        await api.put(`/rooms/${selectedRoomForImages.id}/images/reorder`, { imageIds });
        fetchRooms();
      } catch (err: any) {
        console.error('Failed to reorder', err);
        fetchRooms(); // revert on error
      }
    }
  };

  const uniqueLocations = Array.from(new Set(rooms.map((r: any) => r.location).filter(Boolean)));
  const displayedRooms = selectedLocation === 'All' ? rooms : rooms.filter((r: any) => r.location === selectedLocation);

  return (
    <MainLayout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Meeting Rooms
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Location (สถานที่)</InputLabel>
            <Select
              value={selectedLocation}
              label="Location (สถานที่)"
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <MenuItem value="All">ทั้งหมด (All Locations)</MenuItem>
              {uniqueLocations.map((loc: any) => (
                <MenuItem key={loc} value={loc}>{loc}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {canManageRooms && (
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => { resetForm(); setOpenDialog(true); }}
            >
              Add Room
            </Button>
          )}
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : rooms.length === 0 ? (
        <Typography color="text.secondary" align="center" sx={{ py: 8 }}>
          No meeting rooms available. Click "Add Room" to create one.
        </Typography>
      ) : displayedRooms.length === 0 ? (
        <Typography color="text.secondary" align="center" sx={{ py: 8 }}>
          No meeting rooms available in this location.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {displayedRooms.map((room) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={room.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={
                    room.RoomImages?.length > 0 
                      ? `${BASE_URL}${[...room.RoomImages].sort((a: any, b: any) => a.sort_order - b.sort_order)[0].image_url}` 
                      : 'https://placehold.co/400x200/png?text=No+Image'
                  }
                  alt={room.room_name}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                      {room.room_name}
                    </Typography>
                    <Box>
                      {canEditRooms && (
                        <>
                          <IconButton size="small" onClick={() => handleEdit(room)} color="primary" title="Edit Room">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleOpenImageDialog(room)} color="secondary" title="Manage Images">
                            <ImageIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                      {canManageRooms && (
                        <IconButton size="small" onClick={() => handleDelete(room.id)} color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                      <Chip 
                        label={room.is_active ? 'Active' : 'Inactive'} 
                        size="small" 
                        color={room.is_active ? 'success' : 'default'} 
                        sx={{ ml: 1 }}
                      />
                      {room.auto_approve && (
                        <Chip 
                          label="Auto Approve" 
                          size="small" 
                          color="info" 
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mb: 1 }}>
                    <LocationOnIcon sx={{ fontSize: 18, mr: 0.5 }} />
                    <Typography variant="body2">{room.location}{room.additional_location ? ` - ${room.additional_location}` : ''}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mb: 2 }}>
                    <PeopleIcon sx={{ fontSize: 18, mr: 0.5 }} />
                    <Typography variant="body2">Capacity: {room.capacity} people</Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    mb: 2
                  }}>
                    {room.description || 'No description available.'}
                  </Typography>
                  {room.Owners && room.Owners.length > 0 && (
                    <Typography variant="caption" color="primary">
                      Persons in charge: {room.Owners.map((o: any) => `${o.first_name} ${o.last_name}`).join(', ')}
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button size="small" variant="contained" fullWidth href={`/rooms/${room.id}`}>View Details</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add/Edit Room Dialog */}
      <Dialog open={openDialog} onClose={() => !saving && setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Meeting Room' : 'Add New Meeting Room'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField 
              label="Room Name" 
              fullWidth 
              required 
              autoFocus 
              value={formData.room_name}
              onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
            />
              <FormControl fullWidth required>
                <InputLabel id="location-select-label">Location</InputLabel>
                <Select
                  labelId="location-select-label"
                  value={formData.location}
                  label="Location"
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                >
                  <MenuItem value="บ้านโพธิ์">บ้านโพธิ์</MenuItem>
                  <MenuItem value="บางพลี">บางพลี</MenuItem>
                  <MenuItem value="ประตูน้ำ">ประตูน้ำ</MenuItem>
                </Select>
              </FormControl>
            <TextField 
              label="Additional Location (Optional)" 
              fullWidth 
              multiline
              rows={2}
              value={formData.additional_location}
              onChange={(e) => setFormData({ ...formData, additional_location: e.target.value })}
            />
            <TextField 
              label="Capacity" 
              type="number" 
              fullWidth 
              required 
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Persons in charge</InputLabel>
              <Select
                multiple
                value={formData.owner_ids}
                label="Persons in charge"
                onChange={(e) => setFormData({ ...formData, owner_ids: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[] })}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const selectedUser = users.find(u => u.id.toString() === value);
                      return <Chip key={value} label={selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name}` : value} size="small" />;
                    })}
                  </Box>
                )}
              >
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id.toString()}>{u.first_name} {u.last_name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Equipment in Room</InputLabel>
              <Select
                multiple
                value={formData.equipment_ids}
                label="Equipment in Room"
                onChange={(e) => setFormData({ ...formData, equipment_ids: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[] })}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const eq = equipments.find(e => e.id.toString() === value);
                      return <Chip key={value} label={eq ? eq.equipment_name : value} size="small" />;
                    })}
                  </Box>
                )}
              >
                {equipments.map((eq) => (
                  <MenuItem key={eq.id} value={eq.id.toString()}>
                    <Checkbox checked={formData.equipment_ids.indexOf(eq.id.toString()) > -1} />
                    <ListItemText primary={eq.equipment_name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField 
              label="Remarks / Description" 
              multiline 
              rows={3} 
              fullWidth 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
              <FormControl fullWidth>
                <InputLabel id="payment-creator-type-label">ผู้สร้างใบเบิกจ่ายอาหาร (Payment Creator)</InputLabel>
                <Select
                  labelId="payment-creator-type-label"
                  value={formData.payment_creator_type}
                  label="ผู้สร้างใบเบิกจ่ายอาหาร (Payment Creator)"
                  onChange={(e) => setFormData({ ...formData, payment_creator_type: e.target.value as string })}
                >
                  <MenuItem value="approver">ผู้กดอนุมัติรายการ (Approver)</MenuItem>
                  <MenuItem value="owner">เจ้าของห้องประชุม (Room Owner)</MenuItem>
                </Select>
              </FormControl>

              {formData.payment_creator_type === 'owner' && (
                <FormControl fullWidth>
                  <InputLabel id="main-owner-label">เจ้าของห้องหลัก (Main Owner)</InputLabel>
                  <Select
                    labelId="main-owner-label"
                    value={formData.owner_id}
                    label="เจ้าของห้องหลัก (Main Owner)"
                    onChange={(e) => setFormData({ ...formData, owner_id: e.target.value as string })}
                  >
                    {users
                      .filter(u => formData.owner_ids.includes(u.id.toString()))
                      .map((u: any) => (
                      <MenuItem key={u.id} value={u.id.toString()}>
                        {u.first_name} {u.last_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <FormControlLabel
                control={
                  <Checkbox 
                    checked={formData.auto_approve} 
                    onChange={(e) => setFormData({ ...formData, auto_approve: e.target.checked })}
                    color="primary"
                  />
                }
                label="Auto Approve Bookings"
              />
            <Box>
              <InputLabel shrink>Upload Images (Max 10)</InputLabel>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                style={{ marginTop: '8px' }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={saving}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSave} 
            disabled={saving || !formData.room_name || !formData.location || !formData.capacity}
          >
            {saving ? <CircularProgress size={24} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Images Dialog */}
      <Dialog open={openImageDialog} onClose={handleCloseImageDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Manage Images: {selectedRoomForImages?.room_name}
          <IconButton onClick={handleCloseImageDialog} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Existing Images ({(selectedRoomForImages?.RoomImages || []).length}/10)
            </Typography>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Grid container spacing={2}>
                <SortableContext
                  items={selectedRoomForImages?.RoomImages?.map((img: any) => img.id) || []}
                  strategy={rectSortingStrategy}
                >
                  {selectedRoomForImages?.RoomImages && selectedRoomForImages.RoomImages.length > 0 ? (
                    [...selectedRoomForImages.RoomImages]
                      .sort((a: any, b: any) => a.sort_order - b.sort_order)
                      .map((img: any) => (
                        <SortableImage 
                          key={img.id} 
                          img={img} 
                          selectedRoomForImages={selectedRoomForImages} 
                          handleDeleteImage={handleDeleteImage} 
                        />
                      ))
                  ) : (
                    <Grid size={{ xs: 12 }}>
                      <Typography color="text.secondary">No images uploaded yet.</Typography>
                    </Grid>
                  )}
                </SortableContext>
              </Grid>
            </DndContext>
          </Box>
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Upload New Images
            </Typography>
            <Button variant="outlined" component="label" disabled={uploadingImages || (selectedRoomForImages?.RoomImages?.length || 0) >= 10}>
              {uploadingImages ? <CircularProgress size={24} /> : 'Select Images'}
              <input type="file" hidden multiple accept="image/*" onChange={handleUploadImages} />
            </Button>
            <Typography variant="caption" sx={{ mt: 1, display: 'block' }} color="text.secondary">
              You can select multiple files. Max 10 images per room.
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
