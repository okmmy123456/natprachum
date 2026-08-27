const fs = require('fs');

let content = fs.readFileSync('frontend/src/app/booking/page.tsx', 'utf-8');

const target = `                <Grid size={{ xs: 12, md: 8 }}>
                  <TextField fullWidth label="Purpose" name="purpose" value={formData.purpose} onChange={handleChange} />
                </Grid>`;

const replaceWith = `                <Grid size={{ xs: 12, md: 8 }}>
                  <TextField fullWidth label="Purpose" name="purpose" value={formData.purpose} onChange={handleChange} />
                </Grid>
                
                <Grid size={{ xs: 12 }}>
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

if (content.includes(target)) {
  content = content.replace(target, replaceWith);
  fs.writeFileSync('frontend/src/app/booking/page.tsx', content);
  console.log('Fixed equipment block');
} else {
  console.log('Could not find target block');
}
