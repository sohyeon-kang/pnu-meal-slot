// Original pixel artwork for the Food Planet interface. Integer coordinates keep every edge crisp.
import { writeFileSync } from 'node:fs';
const ink = '#342e45';
const rect = (x,y,w,h,fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
const path = (points,fill) => `<path d="${points}" fill="${fill}"/>`;
const svg = (body, size=40) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">${body}</svg>\n`;
function monkey(accent,light,food='') {
  const color='#b47b50',skin='#ffdbb0';
  let s = rect(11,38,18,1,'#d8cbb8');
  // A curled tail sits behind the body and remains visible beside the food.
  const tail='M26 34h7v-2h3v-7h-4v3h2';
  s += `<path d="${tail}" fill="none" stroke="${ink}" stroke-width="4"/><path d="${tail}" fill="none" stroke="${color}" stroke-width="2"/>`;
  s += path('M14 25h12v4h3v6h-3v3h-6v-2h-2v2h-6v-3h-1v-6h3Z',ink);
  s += rect(14,28,12,7,accent)+rect(14,35,4,1,skin)+rect(22,35,4,1,skin);
  // Large round ears, a soft two-lobed face and a little curl of hair.
  s += path('M4 10h6v2h2v8h-2v2H4v-2H2v-8h2Zm26 0h6v2h2v8h-2v2h-6v-2h-2v-8h2Z',ink);
  s += rect(4,12,6,8,color)+rect(5,14,4,4,'#efad91')+rect(30,12,6,8,color)+rect(31,14,4,4,'#efad91');
  s += path('M17 2h7v2h3v3h3v4h2v12h-3v3h-4v2H15v-2h-4v-3H8V11h2V7h4V4h3Z',ink);
  s += path('M17 4h5v2h4v3h3v4h1v9h-3v3H13v-3h-3v-9h2V9h4V6h1Z',color);
  s += rect(17,6,5,2,'#d99c65')+rect(14,8,3,2,'#d99c65');
  s += path('M13 11h5v2h4v-2h5v2h2v8h-3v4H14v-4h-3v-8h2Z',skin);
  s += rect(14,14,3,4,ink)+rect(23,14,3,4,ink)+rect(14,14,1,1,'#fffaf0')+rect(23,14,1,1,'#fffaf0');
  s += rect(11,19,3,2,'#ef9b91')+rect(26,19,3,2,'#ef9b91');
  s += rect(19,19,2,1,'#8e533d')+rect(17,21,1,1,ink)+rect(18,22,4,1,ink)+rect(22,21,1,1,ink);
  s += '<g transform="translate(0 1)">';
  if(food==='rice') {
    s += path('M15 26h3v-2h6v2h3v3h3v3h-3v3H14v-3h-3v-3h4Z',ink);
    s += path('M16 27h3v-2h4v2h3v3H15v-2h1Z','#fffaf0');
    s += rect(14,30,14,2,'#ff835b')+rect(16,32,10,2,'#f16d56')+rect(17,26,1,2,'#e9ddba')+rect(22,28,2,1,'#e9ddba');
    s += rect(10,28,4,3,color)+rect(28,28,4,3,color);
  } else if(food==='noodles') {
    s += path('M11 27h18v3h-2v3h-3v2h-9v-2h-2v-3h-2Z',ink);
    s += rect(13,27,14,3,'#ffdb63')+rect(14,30,12,2,'#ff8db7')+rect(16,32,8,1,'#e05b95');
    s += rect(25,22,1,7,'#fff0a8')+rect(27,21,1,8,'#fff0a8');
    s += path('M25 20h3v-1h4v-1h4v2h-5v1h-6Zm1 3h5v-1h5v1h-5v1h-5Z',ink);
    s += rect(10,29,4,3,color)+rect(27,29,4,3,color);
  } else if(food==='burger') {
    s += path('M16 24h8v2h3v2h2v7H12v-7h2v-2h2Z',ink);
    s += rect(16,26,8,1,'#ffe78a')+rect(14,27,13,2,'#ffc956')+rect(14,30,13,1,'#a9db78')+rect(14,31,13,1,'#b56d49')+rect(14,33,13,1,'#ffc956');
    s += rect(18,27,1,1,'#fffaf0')+rect(23,27,1,1,'#fffaf0')+rect(10,29,4,3,color)+rect(27,29,4,3,color);
  } else {
    s += rect(15,29,10,3,light)+rect(18,29,4,2,'#ffcf5a')+rect(17,29,1,1,'#8e533d');
    s += rect(9,28,4,4,ink)+rect(10,28,3,2,color)+rect(27,28,4,4,ink)+rect(27,28,3,2,color);
  }
  return s+'</g>';
}
const characters = [
  ['rice','#b9e875','#dcf6aa','rice'],
  ['noodles','#b4a0ee','#d8ccff','noodles'],
  ['burger','#fa89bc','#ffbad6','burger'],
  ['monkey','#b9e875','#dcf6aa',''],
];
for(const [name,color,light,food] of characters)writeFileSync(new URL(`../docs/assets/${name}.svg`,import.meta.url),svg(monkey(color,light,food)));
writeFileSync(new URL('../docs/assets/icon.svg',import.meta.url),svg(rect(0,0,40,40,'#fff4dc')+monkey('#b9e875','#dcf6aa')));
const ufo = path('M15 4h10v2h5v4h2v12H8V10h2V6h5Z',ink)+path('M15 6h10v2h3v4h2v10H10V12h2V8h3Z','#def4ef')+rect(15,8,8,1,'#fffaf0')+'<g transform="translate(8 5) scale(.6)">'+monkey('#b9e875','#dcf6aa')+'</g>'+path('M9 21h22v3h4v3h3v3H2v-3h3v-3h4Z',ink)+rect(9,24,22,3,'#b9a3ef')+rect(5,27,30,2,'#9985cf')+rect(10,30,20,3,ink)+rect(12,33,16,2,'#d8cef3')+rect(11,26,3,2,'#fff3a8')+rect(19,26,3,2,'#ff94c1')+rect(27,26,3,2,'#fff3a8');
writeFileSync(new URL('../docs/assets/ufo.svg',import.meta.url),svg(ufo));
console.log('Created six original pixel SVG assets.');
