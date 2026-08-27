const fs = require('fs');
const path = require('path');

const replaceInFile = (filePath, replaces) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  for (const { from, to } of replaces) {
    content = content.replace(from, to);
  }
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
};

replaceInFile(path.join(__dirname, 'src/app/booking/page.tsx'), [
  { from: /direction=\{\{ xs: 'column-reverse', md: 'row' \}\}/g, to: `direction={{ xs: 'column-reverse' as any, md: 'row' as any }}` }
]);

replaceInFile(path.join(__dirname, 'src/app/bookings/page.tsx'), [
  { from: /direction=\{\{ xs: 'column-reverse', md: 'row' \}\}/g, to: `direction={{ xs: 'column-reverse' as any, md: 'row' as any }}` }
]);

replaceInFile(path.join(__dirname, 'src/app/guest-history/page.tsx'), [
  { from: /fontWeight="bold"/g, to: `sx={{ fontWeight: 'bold' }}` },
  { from: /<Grid xs=\{12\} key=\{b\.id\}>/g, to: `<Grid size={{ xs: 12 }} key={b.id}>` },
  { from: /<Grid xs=\{12\} sm=\{4\}/g, to: `<Grid size={{ xs: 12, sm: 4 }}` }
]);

replaceInFile(path.join(__dirname, 'src/app/guest-rooms/page.tsx'), [
  { from: /fontWeight="bold"/g, to: `sx={{ fontWeight: 'bold' }}` },
  { from: /<Grid xs=\{12\} sm=\{6\} md=\{4\} key=\{room\.id\}>/g, to: `<Grid size={{ xs: 12, sm: 6, md: 4 }} key={room.id}>` }
]);

replaceInFile(path.join(__dirname, 'src/app/page.tsx'), [
  { from: /fontWeight="bold"/g, to: `sx={{ fontWeight: 'bold' }}` },
  { from: /<Grid xs=\{12\} sm=\{6\} md=\{4\}/g, to: `<Grid size={{ xs: 12, sm: 6, md: 4 }}` },
  { from: /<Grid xs=\{12\} sm=\{4\}/g, to: `<Grid size={{ xs: 12, sm: 4 }}` }
]);

replaceInFile(path.join(__dirname, 'src/app/profile/page.tsx'), [
  { from: /token: data\.token,/g, to: `// token: data.token,` },
  { from: /const \{ user, access_token, refresh_token \} = action\.payload;/g, to: `const { user, access_token, refresh_token } = action.payload as any;` }
]);

replaceInFile(path.join(__dirname, 'src/components/layout/Sidebar.tsx'), [
  { from: /icon: JSX\.Element;/g, to: `icon: React.ReactNode;` }
]);

replaceInFile(path.join(__dirname, 'src/app/dashboard/page.tsx'), [
  { from: /percent\.toFixed\(0\)/g, to: `(percent || 0).toFixed(0)` }
]);
