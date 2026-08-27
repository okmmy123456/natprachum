const fs = require('fs');

let content = fs.readFileSync('frontend/src/app/booking/page.tsx', 'utf-8');

const target = `                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <InputLabel>Additional Equipment Requested (Optional)</InputLabel>
                    <Select
                      multiple
                      value={formData.additional_equipments || []}
                      label="Additional Equipment Requested (Optional)"
                      onChange={(e) => setFormData({ ...formData, additional_equipments: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[] })}
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
                          <Checkbox checked={(formData.additional_equipments || []).indexOf(eq.id.toString()) > -1} />
                          <ListItemText primary={eq.equipment_name} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>`;

const replaceWith = `                <Grid size={{ xs: 12 }}>
                  {room && (() => {
                    const roomEquipmentIds = room?.RoomEquipments?.map((re: any) => re.equipment_id.toString()) || [];
                    
                    return (
                      <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle2" gutterBottom color="text.secondary">Equipment in Room:</Typography>
                        {roomEquipmentIds.length > 0 ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                            {roomEquipmentIds.map((eqId: string) => {
                              const eq = equipments.find(e => e.id.toString() === eqId);
                              return <Chip key={eqId} label={eq ? eq.equipment_name : eqId} size="small" color="success" variant="outlined" />;
                            })}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>No equipment built-in.</Typography>
                        )}
      
                        <FormControl fullWidth>
                          <InputLabel>Request Additional Equipment (Optional)</InputLabel>
                          <Select
                            multiple
                            value={formData.additional_equipments || []}
                            label="Request Additional Equipment (Optional)"
                            onChange={(e) => setFormData({ ...formData, additional_equipments: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[] })}
                            renderValue={(selected) => (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((value) => {
                                  const eq = equipments.find(e => e.id.toString() === value);
                                  return <Chip key={value} label={eq ? eq.equipment_name : value} size="small" color="primary" />;
                                })}
                              </Box>
                            )}
                          >
                            {equipments.map((eq) => {
                              const isInRoom = roomEquipmentIds.includes(eq.id.toString());
                              return (
                                <MenuItem key={eq.id} value={eq.id.toString()} disabled={isInRoom}>
                                  <Checkbox checked={isInRoom || (formData.additional_equipments || []).indexOf(eq.id.toString()) > -1} />
                                  <ListItemText primary={eq.equipment_name} secondary={isInRoom ? 'Already in room' : ''} />
                                </MenuItem>
                              );
                            })}
                          </Select>
                        </FormControl>
                      </Box>
                    );
                  })()}
                </Grid>`;

if (content.includes(target)) {
  content = content.replace(target, replaceWith);
  fs.writeFileSync('frontend/src/app/booking/page.tsx', content);
  console.log('Fixed equipment block with room equipments');
} else {
  console.log('Could not find target block');
}
