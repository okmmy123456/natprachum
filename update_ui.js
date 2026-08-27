const fs = require('fs');
const file = 'frontend/src/app/bookings/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<FormControl fullWidth required>/g, '<FormControl fullWidth required disabled={editStatus === \'approved\'}>');
content = content.replace(/value={formData.booking_date}/g, 'disabled={editStatus === \'approved\'}\n                      value={formData.booking_date}');
content = content.replace(/value={formData.start_time}/g, 'disabled={editStatus === \'approved\'}\n                      value={formData.start_time}');
content = content.replace(/value={formData.end_time}/g, 'disabled={editStatus === \'approved\'}\n                      value={formData.end_time}');
content = content.replace(/value={formData.participant_count}/g, 'disabled={editStatus === \'approved\'}\n                value={formData.participant_count}');
content = content.replace(/value={formData.phone_number}/g, 'disabled={editStatus === \'approved\'}\n                value={formData.phone_number}');
content = content.replace(/value={formData.purpose}/g, 'disabled={editStatus === \'approved\'}\n                value={formData.purpose}');

fs.writeFileSync(file, content);
console.log('updated page.tsx');
