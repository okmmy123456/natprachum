const fontkit = require('fontkit');
const font = fontkit.openSync('backend/fonts/angsana.ttc');
console.log('Fonts in collection:');
font.fonts.forEach(f => console.log(f.postscriptName));
