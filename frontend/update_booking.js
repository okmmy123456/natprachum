const fs = require('fs');

let content = fs.readFileSync('frontend/src/app/booking/page.tsx', 'utf-8');

// 1. Imports
content = content.replace(
  /import \{ \r?\n  Box, Button, Typography, Paper, TextField, CircularProgress, \r?\n  Alert, Grid, Card, CardContent, Divider \r?\n\} from '@mui\/material';/,
  `import { 
  Box, Button, Typography, Paper, TextField, CircularProgress, 
  Alert, Grid, Card, CardContent, Divider, Select, MenuItem, Checkbox, ListItemText, InputLabel, FormControl, Chip 
} from '@mui/material';`
);

// 2. State & formData
content = content.replace(
  /const \[formData, setFormData\] = useState\(\{/,
  `const [equipments, setEquipments] = useState<any[]>([]);\n  const [formData, setFormData] = useState({\n    additional_equipments: [] as string[],`
);

// 3. fetchEquipments
content = content.replace(
  /  useEffect\(\(\) => \{/,
  `  useEffect(() => {
    const fetchEquipments = async () => {
      try {
        const res = await api.get<any, any>('/master/equipments');
        if (res.success) {
          setEquipments(res.data?.data || res.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch equipments', err);
      }
    };
    fetchEquipments();
`
);

// 4. payload mapping
content = content.replace(
  /        room_id: parseInt\(roomId\),\r?\n        participant_count: parseInt\(formData\.participant_count\)\r?\n      \};/,
  `        room_id: parseInt(roomId),
        participant_count: parseInt(formData.participant_count),
        additional_equipments: formData.additional_equipments.map(Number)
      };`
);

// 5. form fields
content = content.replace(
  /                <Grid size=\{\{ xs: 12, md: 4 \}\}>\r?\n                  <TextField fullWidth label="Participants" type="number" name="participant_count" required value=\{formData\.participant_count\} onChange=\{handleChange\} \/>\r?\n                <\/Grid>\r?\n                <Grid size=\{\{ xs: 12 \}\}>\r?\n                  <TextField fullWidth multiline rows=\{3\} label="Purpose \/ Remarks" name="purpose" value=\{formData\.purpose\} onChange=\{handleChange\} \/>\r?\n                <\/Grid>/,
  `                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField fullWidth label="Participants" type="number" name="participant_count" required value={formData.participant_count} onChange={handleChange} />
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
                </Grid>
                
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth multiline rows={3} label="Purpose / Remarks" name="purpose" value={formData.purpose} onChange={handleChange} />
                </Grid>`
);

fs.writeFileSync('frontend/src/app/booking/page.tsx', content);
console.log('Update script executed');
