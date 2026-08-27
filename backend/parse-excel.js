const xlsx = require('xlsx');
const workbook = xlsx.readFile('D:/non/gravity/NatPrachum/1.แบบฟอร์มใบจองอาหาร.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const range = xlsx.utils.decode_range(sheet['!ref']);
for(let R = 0; R <= range.e.r; ++R) {
  let row = [];
  for(let C = 0; C <= range.e.c; ++C) {
    let cell = sheet[xlsx.utils.encode_cell({c:C, r:R})];
    row.push(cell ? cell.v : '');
  }
  let str = row.join('|');
  if(str.replace(/\|/g, '').trim() !== '') {
    console.log(`Row ${R+1}: ${str}`);
  }
}
