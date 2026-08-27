const https = require('https');
const fs = require('fs');
fs.mkdirSync('fonts', { recursive: true });

const file = fs.createWriteStream('fonts/THSarabunNew.ttf');
https.get('https://cdn.jsdelivr.net/gh/lazywasabi/thai-web-fonts@master/fonts/THSarabunNew/THSarabunNew.ttf', (response) => {
  response.pipe(file);
});

const file2 = fs.createWriteStream('fonts/THSarabunNew-Bold.ttf');
https.get('https://cdn.jsdelivr.net/gh/lazywasabi/thai-web-fonts@master/fonts/THSarabunNew/THSarabunNew-Bold.ttf', (response) => {
  response.pipe(file2);
});
