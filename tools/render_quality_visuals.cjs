/* Reproducible scientific illustrations. No private data or application UI. */
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const out = path.resolve(__dirname, '../assets');
const colors = {ink:'#142b3b', muted:'#506777', teal:'#147d87', orange:'#d8693e', light:'#edf3f5'};
function text(x,y,value,size=22,color=colors.ink,weight=400) {
  return `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-weight="${weight}">${value}</text>`;
}
function rect(x,y,w,h,fill,rx=0) { return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`; }
function line(x1,y1,x2,y2,color=colors.light,width=2) { return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"/>`; }
function frame(title,subtitle,body,footer) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><g font-family="Arial, sans-serif">${rect(0,0,1600,900,'#f5f8fa')}${rect(0,0,1600,172,colors.ink)}${text(60,48,'QUALITY INVESTIGATION  /  SYNTHETIC EXAMPLE',18,'#91d7dc',700)}${text(60,105,title,42,'white',700)}${text(60,145,subtitle,23,'#d0dee5')}${body}${line(60,833,1540,833,'#cbd9df')}${text(60,868,footer,19,colors.muted)}${text(1300,868,'Matthew Chung',19,colors.muted)}</g></svg>`;
}
async function save(name,svg) {
  fs.writeFileSync(path.join(out,`${name}.svg`),svg);
  await sharp(Buffer.from(svg)).png().toFile(path.join(out,`${name}.png`));
}
function maps() {
  let body = text(60,219,'Follow the same chip across inspection, electrical test, and reliability evidence.',25,colors.ink,700);
  const titles=['01  Inspection failures','02  Electrical response','03  Reliability response'];
  const notes=['Fictional failure categories','Fictional measurement, arbitrary units','Fictional change ratio, arbitrary units'];
  for(let p=0;p<3;p++) {
    const x=60+p*503, cx=x+237, cy=485;
    body+=rect(x,250,474,460,'white',16)+text(x+24,294,titles[p],25,colors.ink,700)+text(x+24,326,notes[p],17,colors.muted);
    body+=`<circle cx="${cx}" cy="${cy}" r="147" fill="#f0f5f7" stroke="#c8d8df" stroke-width="2"/>`;
    for(let i=-10;i<=10;i++) for(let j=-10;j<=10;j++) {
      if(i*i+j*j>100) continue;
      const selected=i>=3&&i<=6&&j>=-4&&j<=1;
      const noise=(Math.sin(i*13+j*7)+1)/2;
      const fill=p===0?(selected?colors.orange:noise>.91?'#7896ac':'#d0dde3'):
        (selected?'#dc7546':noise>.66?'#78b9c0':noise>.33?'#3d99a4':'#186d82');
      body+=rect(cx+i*13-5,cy+j*13-5,10,10,fill,1);
    }
    body+=`<rect x="${cx+33}" y="${cy-59}" width="60" height="86" fill="none" stroke="${colors.ink}" stroke-width="3" rx="5"/>`;
    body+=line(cx,cy+149,cx,cy+158,colors.ink,3)+text(x+24,684,'Outlined chips: same fictional selection',17,colors.muted);
  }
  body+=rect(60,736,1480,71,'#e4f0f2',12)+text(84,766,'Engineering safeguard',19,colors.teal,700)+text(84,795,'Link maps only after chip identity and coordinate alignment are verified.',24,colors.ink);
  return frame('One wafer. Multiple sources. A connected investigation.','Spatial context helps engineers decide which evidence to investigate next.',body,'Illustration only • fictional geometry and values • no production results or application screenshot');
}
function comparison() {
  // Deterministic wafer-level rates; this figure makes no inferential claim.
  const selected=Array.from({length:8},(_,i)=>5.7+1.1*Math.sin(i*2.2));
  const peers=Array.from({length:40},(_,i)=>3.2+1.2*Math.sin(i*1.7)+.5*Math.cos(i*.8));
  const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
  let body=text(60,219,'Compare a selected wafer group with a defined peer population.',25,colors.ink,700);
  body+=rect(60,250,590,465,'white',16)+rect(680,250,860,465,'white',16);
  body+=text(88,294,'Wafer-level failure rates',25,colors.ink,700)+text(88,327,'Each point represents one fictional wafer.',18,colors.muted);
  const y=v=>640-v*35;
  for(let v=0;v<=8;v+=2){body+=line(142,y(v),614,y(v))+text(90,y(v)+7,`${v}%`,18,colors.muted);}
  for(const [a,x,c,label] of [[selected,280,colors.orange,'Selected'],[peers,494,colors.teal,'Peers']]){
    a.forEach((v,i)=>{body+=`<circle cx="${x+Math.sin(i*2.3)*35}" cy="${y(v)}" r="6" fill="${c}" fill-opacity=".8"/>`;});
    body+=line(x-46,y(mean(a)),x+46,y(mean(a)),colors.ink,4)+text(x-52,683,`${label} (n=${a.length})`,20,colors.ink,700);
  }
  body+=text(710,294,'Date context and cohort selection',25,colors.ink,700)+text(710,327,'Fictional process family • selected wafers excluded from peers',18,colors.muted);
  const xx=i=>766+i*17.8;
  for(let v=0;v<=8;v+=2){body+=line(754,y(v),1500,y(v))+text(710,y(v)+7,`${v}%`,18,colors.muted);}
  body+=rect(xx(15),355,190,286,'#fcf0e8',5);
  peers.forEach((v,i)=>{body+=`<circle cx="${xx(i)}" cy="${y(v)}" r="5" fill="${colors.teal}" fill-opacity=".75"/>`;});
  selected.forEach((v,i)=>{body+=`<circle cx="${xx(16+i)}" cy="${y(v)}" r="7" fill="${colors.orange}"/>`;});
  body+=text(758,683,'Earlier',18,colors.muted)+text(1260,683,'Process date → later',18,colors.muted);
  body+=rect(60,736,1480,71,'#e4f0f2',12)+text(84,766,`Observed mean gap: ${(mean(selected)-mean(peers)).toFixed(1)} percentage points`,22,colors.teal,700)+text(84,795,'Descriptive example. Statistical conclusions require sample checks, intervals, and engineering context.',22,colors.ink);
  return frame('Is this wafer group different from its peers?','Show the population, individual wafer rates, and timing before interpreting a difference.',body,'Illustration only • deterministic fictional data • observed difference does not establish causation');
}
async function main(){await save('linked-wafer-maps',maps());await save('wafer-comparison',comparison());}
main().catch(error=>{console.error(error);process.exitCode=1;});
