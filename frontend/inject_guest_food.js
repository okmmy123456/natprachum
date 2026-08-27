const fs = require('fs');

const sourcePath = 'frontend/src/app/booking/page.tsx';
let content = fs.readFileSync(sourcePath, 'utf-8');

// 1. Add Icons and UI components to imports
if (!content.includes('Accordion')) {
  content = content.replace(
    /import \{([^\}]+)\} from '@mui\/material';/,
    `import {$1, Accordion, AccordionSummary, AccordionDetails, FormControlLabel, Collapse, IconButton } from '@mui/material';`
  );
}
if (!content.includes('ExpandMoreIcon')) {
  content = content.replace(
    /import LocationOnIcon from '@mui\/icons-material\/LocationOn';/,
    `import LocationOnIcon from '@mui/icons-material/LocationOn';\nimport ExpandMoreIcon from '@mui/icons-material/ExpandMore';\nimport AddIcon from '@mui/icons-material/Add';\nimport DeleteIcon from '@mui/icons-material/Delete';\nimport RestaurantIcon from '@mui/icons-material/Restaurant';`
  );
}

// 2. Add DinerRow interface
if (!content.includes('interface DinerRow')) {
  content = content.replace(
    /function BookingForm\(\) \{/,
    `interface DinerRow {\n  diner_name: string;\n  company?: string;\n  department?: string;\n  department_code?: string;\n}\nconst emptyDinerRow = (): DinerRow => ({ diner_name: '', company: '', department: '', department_code: '' });\n\nfunction BookingForm() {`
  );
}

// 3. Add state variables inside BookingForm
const stateInjection = `
  const [requestFood, setRequestFood] = useState(false);
  const [foodForm, setFoodForm] = useState({
    company_name: 'THONGCHAI INDUSTRIES CO., LTD.',
    customer_company: '',
    internal_companies: [] as string[],
    welcome_sign_needed: false,
    welcome_sign_text: '',
    snack_items: ['', '', '', '', '', ''],
    lunch_items: ['', '', '', '', '', '', '', '', ''],
    additional_notes: '',
  });
  const [guestDiners, setGuestDiners] = useState<DinerRow[]>([emptyDinerRow(), emptyDinerRow(), emptyDinerRow()]);
  const [internalDiners, setInternalDiners] = useState<DinerRow[]>([emptyDinerRow(), emptyDinerRow(), emptyDinerRow()]);
  const [dbCompanies, setDbCompanies] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  const updateSnackItem = (index: number, value: string) => {
    const newItems = [...foodForm.snack_items];
    newItems[index] = value;
    setFoodForm({ ...foodForm, snack_items: newItems });
  };

  const updateLunchItem = (index: number, value: string) => {
    const newItems = [...foodForm.lunch_items];
    newItems[index] = value;
    setFoodForm({ ...foodForm, lunch_items: newItems });
  };

  const updateGuestDiner = (index: number, field: keyof DinerRow, value: string) => {
    const newDiners = [...guestDiners];
    newDiners[index] = { ...newDiners[index], [field]: value };
    setGuestDiners(newDiners);
  };

  const updateInternalDiner = (index: number, field: keyof DinerRow, value: string) => {
    const newDiners = [...internalDiners];
    newDiners[index] = { ...newDiners[index], [field]: value };
    setInternalDiners(newDiners);
  };
`;
if (!content.includes('const [requestFood, setRequestFood] = useState(false);')) {
  content = content.replace(
    /const \[formData, setFormData\] = useState\(\{[\s\S]*?\}\);/,
    `$&${stateInjection}`
  );
}

// 4. Add company and department fetch to useEffect
const fetchInjection = `
    const fetchMasterData = async () => {
      try {
        const [compRes, depRes] = await Promise.all([
          api.get<any, any>('/master/companies'),
          api.get<any, any>('/master/departments')
        ]);
        if (compRes.success) setDbCompanies(compRes.data);
        if (depRes.success) setDepartments(depRes.data);
      } catch (err) {
        console.error('Failed to fetch master data', err);
      }
    };
    fetchMasterData();
`;
if (!content.includes('fetchMasterData')) {
  content = content.replace(
    /const fetchEquipments = async \(\) => \{/,
    `${fetchInjection}\n    const fetchEquipments = async () => {`
  );
}

// 5. Update handleSubmit to include food_order
const submitInjection = `
      const payload: any = { ...formData };
      if (requestFood) {
        payload.food_order = {
          has_food_order: true,
          company_name: foodForm.company_name,
          internal_companies: foodForm.internal_companies,
          welcome_sign_needed: foodForm.welcome_sign_needed,
          welcome_sign_text: foodForm.welcome_sign_text,
          snack_items: foodForm.snack_items.filter(i => i.trim()),
          lunch_items: foodForm.lunch_items.filter(i => i.trim()),
          additional_notes: foodForm.additional_notes,
          guest_diners: guestDiners.filter(d => d.diner_name.trim()),
          internal_diners: internalDiners.filter(d => d.diner_name.trim()),
        };
      }
`;
if (!content.includes('payload.food_order = {')) {
  content = content.replace(
    /const res = await api\.post<any, any>\('\/bookings\/guest', formData\);/,
    `${submitInjection}\n      const res = await api.post<any, any>('/bookings/guest', payload);`
  );
}

// 6. Inject the UI before the Submit button
const uiInjection = `
            {/* Food Order Section */}
            <Box sx={{ mt: 3, mb: 3 }}>
              <FormControlLabel
                control={<Checkbox checked={requestFood} onChange={(e) => setRequestFood(e.target.checked)} />}
                label={<Typography sx={{ fontWeight: 'bold' }}>ต้องการสั่งอาหาร / เครื่องดื่มเบรค</Typography>}
              />
              
              <Collapse in={requestFood}>
                <Paper variant="outlined" sx={{ p: 3, mt: 2, borderRadius: 2, borderColor: 'primary.light', bgcolor: '#fafafa' }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RestaurantIcon color="primary" /> แบบฟอร์มสั่งอาหารและเครื่องดื่ม
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Accordion defaultExpanded sx={{ '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: 'action.hover' }}>
                        <Typography sx={{ fontWeight: 600 }}>🏷️ ข้อมูลพื้นฐานการสั่งอาหาร</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <TextField
                          label="บริษัทผู้จัดทำ"
                          size="small"
                          fullWidth
                          sx={{ mb: 2 }}
                          value={foodForm.company_name}
                          onChange={(e) => setFoodForm({ ...foodForm, company_name: e.target.value })}
                        />
                        <FormControlLabel
                          control={<Checkbox checked={foodForm.welcome_sign_needed} onChange={(e) => setFoodForm({ ...foodForm, welcome_sign_needed: e.target.value === 'true' || e.target.checked })} />}
                          label="ต้องการให้ตั้งป้ายต้อนรับ"
                        />
                        <Collapse in={foodForm.welcome_sign_needed}>
                          <TextField
                            label="ข้อความบนป้ายต้อนรับ"
                            size="small"
                            fullWidth
                            sx={{ mt: 1 }}
                            value={foodForm.welcome_sign_text}
                            onChange={(e) => setFoodForm({ ...foodForm, welcome_sign_text: e.target.value })}
                            placeholder="เช่น ยินดีต้อนรับ บริษัท ABC..."
                          />
                        </Collapse>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion defaultExpanded sx={{ '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: 'action.hover' }}>
                        <Typography sx={{ fontWeight: 600 }}>🍪 รายการขนมและเครื่องดื่มเบรค</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={1.5}>
                          {foodForm.snack_items.map((item, idx) => (
                            <Grid item xs={12} sm={6} key={'snack-'+idx}>
                              <TextField
                                label={'รายการที่ ' + (idx + 1)}
                                size="small"
                                fullWidth
                                value={item}
                                onChange={(e) => updateSnackItem(idx, e.target.value)}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion defaultExpanded sx={{ '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: 'action.hover' }}>
                        <Typography sx={{ fontWeight: 600 }}>🍱 รายการอาหารมื้อเที่ยง</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={1.5}>
                          {foodForm.lunch_items.map((item, idx) => (
                            <Grid item xs={12} sm={4} key={'lunch-'+idx}>
                              <TextField
                                label={'รายการที่ ' + (idx + 1)}
                                size="small"
                                fullWidth
                                value={item}
                                onChange={(e) => updateLunchItem(idx, e.target.value)}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion defaultExpanded sx={{ '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: 'action.hover' }}>
                        <Typography sx={{ fontWeight: 600 }}>👤 ผู้รับประทานอาหาร - ลูกค้าบริษัท</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <TextField
                          label="ชื่อบริษัทลูกค้า"
                          size="small"
                          fullWidth
                          sx={{ mb: 2 }}
                          value={foodForm.customer_company}
                          onChange={(e) => setFoodForm({ ...foodForm, customer_company: e.target.value })}
                        />
                        {guestDiners.map((diner, idx) => (
                          <Box key={'guest-'+idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <Typography sx={{ minWidth: 30, fontWeight: 500, color: 'text.secondary' }}>{idx + 1}.</Typography>
                            <TextField
                              label="ชื่อ"
                              size="small"
                              sx={{ flex: 2 }}
                              value={diner.diner_name}
                              onChange={(e) => updateGuestDiner(idx, 'diner_name', e.target.value)}
                            />
                            <TextField
                              label="แผนก"
                              size="small"
                              sx={{ flex: 1 }}
                              value={diner.department}
                              onChange={(e) => updateGuestDiner(idx, 'department', e.target.value)}
                            />
                          </Box>
                        ))}
                      </AccordionDetails>
                    </Accordion>

                    <Accordion defaultExpanded sx={{ '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: 'action.hover' }}>
                        <Typography sx={{ fontWeight: 600 }}>🏢 ผู้รับประทานอาหาร - พนักงานภายใน</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                          <Typography sx={{ fontWeight: 600, mb: 1.5, color: 'primary.main' }}>บริษัทกลุ่ม ({dbCompanies.map(c => c.company_code).join('/')})</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            {dbCompanies.map(c => (
                              <FormControlLabel
                                key={c.company_code}
                                control={
                                  <Checkbox
                                    checked={foodForm.internal_companies.includes(c.company_code)}
                                    onChange={(e) => {
                                      const newComps = e.target.checked 
                                        ? [...foodForm.internal_companies, c.company_code]
                                        : foodForm.internal_companies.filter(code => code !== c.company_code);
                                      setFoodForm({ ...foodForm, internal_companies: newComps });
                                    }}
                                  />
                                }
                                label={c.company_code}
                              />
                            ))}
                          </Box>
                        </Box>
                        {internalDiners.map((diner, idx) => (
                          <Box key={'internal-'+idx} sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <Typography sx={{ minWidth: 30, fontWeight: 500, color: 'text.secondary' }}>{idx + 1}.</Typography>
                            <TextField
                              label="ชื่อพนักงาน"
                              size="small"
                              sx={{ flex: { xs: '1 1 100%', sm: 2 }, minWidth: 150 }}
                              value={diner.diner_name}
                              onChange={(e) => updateInternalDiner(idx, 'diner_name', e.target.value)}
                            />
                            <FormControl size="small" sx={{ flex: { xs: '1 1 100%', sm: 1 }, minWidth: 120 }}>
                              <InputLabel>แผนก</InputLabel>
                              <Select
                                value={diner.department_code}
                                label="แผนก"
                                onChange={(e) => {
                                  const dpt = departments.find(d => d.department_code === e.target.value);
                                  updateInternalDiner(idx, 'department_code', e.target.value as string);
                                  if (dpt) updateInternalDiner(idx, 'department', dpt.department_name);
                                }}
                              >
                                {departments.map(d => (
                                  <MenuItem key={d.department_code} value={d.department_code}>
                                    {d.department_name} ({d.department_code})
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Box>
                        ))}
                      </AccordionDetails>
                    </Accordion>

                    <TextField
                      label="หมายเหตุ / รายการเพิ่มเติม"
                      multiline
                      rows={2}
                      fullWidth
                      sx={{ mt: 1 }}
                      value={foodForm.additional_notes}
                      onChange={(e) => setFoodForm({ ...foodForm, additional_notes: e.target.value })}
                    />
                  </Box>
                </Paper>
              </Collapse>
            </Box>
`;

if (!content.includes('แบบฟอร์มสั่งอาหารและเครื่องดื่ม')) {
  content = content.replace(
    /(\s*)<Button\s+type="submit"/,
    `${uiInjection}\n$1<Button type="submit"`
  );
}

fs.writeFileSync(sourcePath, content);
console.log('Successfully injected guest food form!');
