/* Original scientific illustration. Fictional data; no internal UI or records. */
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const out = path.resolve(__dirname, '../assets');
const c = {ink:'#283831', muted:'#63766d', teal:'#147b68', light:'#e5ede6', paper:'#fbfcf8', orange:'#bd7b43'};
const text=(x,y,s,size=20,color=c.ink,weight=400)=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-weight="${weight}">${s}</text>`;
const rect=(x,y,w,h,fill,rx=0)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" rx="${rx}"/>`;
const line=(x,y,xx,yy,color=c.light,width=2)=>`<line x1="${x}" y1="${y}" x2="${xx}" y2="${yy}" stroke="${color}" stroke-width="${width}"/>`;
const centered=(x,y,s,size=20,color=c.ink,weight=400)=>`<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" fill="${color}" font-weight="${weight}">${s}</text>`;
// Every value below is invented solely to explain comparison design.
const periods=[{label:'Earlier cohort',completed:96,pending:4},{label:'Middle cohort',completed:70,pending:30},{label:'Recent cohort',completed:30,pending:70}];
const quarters=[{label:'First',passed:24,tested:80},{label:'Second',passed:29,tested:80},{label:'Third',passed:31,tested:80},{label:'Last',passed:36,tested:80}];
let body=rect(0,0,1600,900,c.paper);
body+=centered(800,48,'QUALITY ENGINEERING  /  FICTIONAL EXAMPLE',17,c.teal,700);
body+=centered(800,104,'Make the comparison reviewable',42,c.ink,700);
body+=centered(800,142,'Link the records. Show what is complete. Compare wafers sharing a run.',23,c.muted);
const steps=[['01','Define the population','Physical identity and compatible tests'],['02','Choose the endpoint','Wafer outcome or evaluable device yield'],['03','Inspect the evidence','Observed counts before model output']];
steps.forEach((s,i)=>{
  const x=64+i*500;
  body+=line(x,188,x+460,188,c.teal,3)+text(x,223,s[0],18,c.teal,700)+text(x+42,223,s[1],24,c.ink,700)+text(x,258,s[2],18,c.muted);
});
body+=rect(64,300,716,440,'white',8)+rect(812,300,724,440,'white',8);
body+=text(90,343,'How much of each cohort is complete?',25,c.ink,700)+text(90,376,'Each invented cohort contains 100 wafers.',18,c.muted);
body+=rect(92,402,14,14,c.teal)+text(116,415,'Completed',16,c.muted)+rect(262,402,14,14,c.light)+text(286,415,'Pending',16,c.muted);
periods.forEach((r,i)=>{
  const y=468+i*82,x=266,w=450;
  body+=text(90,y+20,r.label,18,c.ink,600)+rect(x,y,w,28,c.light,3)+rect(x,y,w*r.completed/100,28,c.teal,3);
  body+=text(x,y+53,`${r.completed} completed / ${r.pending} pending`,17,c.muted);
});
body+=text(840,343,'Compare positions within shared runs',25,c.ink,700)+text(840,376,'Illustrative aggregate; each bar shows passed / tested.',18,c.muted);
const bottom=653,top=439;
for(let v=0;v<=60;v+=20){const y=bottom-(bottom-top)*v/60;body+=line(894,y,1492,y)+text(842,y+6,`${v}%`,17,c.muted);}
quarters.forEach((r,i)=>{
  const x=928+i*145,pct=100*r.passed/r.tested,h=(bottom-top)*pct/60;
  body+=rect(x,bottom-h,64,h,c.teal,3)+centered(x+32,bottom-h-12,`${pct.toFixed(1)}%`,19,c.ink,600);
  body+=centered(x+32,682,r.label,18,c.ink,600)+centered(x+32,708,`${r.passed} / ${r.tested}`,17,c.muted);
});
body+=rect(64,765,1472,63,'#edf3ec',5)+text(87,793,'Interpretation',18,c.teal,700)+text(87,817,'Recent completion and shared-run context can change how engineers interpret an apparent trend.',20,c.ink);
body+=line(64,849,1536,849)+text(64,879,'Illustration only · invented values · no model fit, production result, or private application screenshot',17,c.muted)+text(1370,879,'Matthew Chung',17,c.muted);
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><g font-family="Arial, sans-serif">${body}</g></svg>`;
async function main(){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'qualification-investigation.svg'),svg);await sharp(Buffer.from(svg)).png().toFile(path.join(out,'qualification-investigation.png'));}
main().catch(e=>{console.error(e);process.exitCode=1;});
