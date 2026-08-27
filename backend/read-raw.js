const fs = require('fs');
const buffer = fs.readFileSync('D:/non/gravity/NatPrachum/1.แบบฟอร์มใบจองอาหาร.xlsx');
const str = buffer.toString('utf8');
const matches = str.match(/.{0,50}ลงชื่อ.{0,50}/g);
console.log(matches);
