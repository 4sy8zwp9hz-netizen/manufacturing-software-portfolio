import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8').split('MONTHS.forEach((m,i)=>')[0];
const context=vm.createContext({});
vm.runInContext(source+';globalThis.demo={WAFERS,CHIPS,state,counts,fit,LIMITS};',context);
const {WAFERS,CHIPS,state,counts,fit,LIMITS}=context.demo;
assert.equal(WAFERS.length,576);assert.equal(CHIPS.length,23040);
assert.equal(new Set(WAFERS.map(w=>w.id)).size,576);
for(const run of new Set(WAFERS.map(w=>w.run))){const rows=WAFERS.filter(w=>w.run===run);assert.equal(rows.length,8);for(let i=1;i<8;i++)assert(rows[i].wait<rows[i-1].wait);}
assert(CHIPS.some(c=>c.retention===0&&c.pass===false));
assert(CHIPS.some(c=>c.pass===null&&c.drive24===null));
for(const w of WAFERS){assert(w.growthWait>w.wait);assert.equal(w.tested,w.chips.filter(c=>c.pass!==null).length);assert.equal(w.passed,w.chips.filter(c=>c.drift!==null&&c.drift<LIMITS.drift&&c.retention>LIMITS.retention).length);}
const rows=WAFERS.filter(w=>w.product==='photon100');
assert.equal(counts(rows).tested,rows.filter(w=>w.status!=='Pending').length);
for(const metric of ['qualification','bi']){
 state.metric=metric;const fitted=fit(rows);assert(fitted&&fitted.se>0&&fitted.lo<fitted.or&&fitted.or<fitted.hi);assert(fitted.p>=0&&fitted.p<=1);
 let score0=0,score1=0;
 for(const w of rows){const n=metric==='bi'?w.tested:w.status==='Pending'?0:1,y=metric==='bi'?w.passed:w.status==='Pass'?1:0,x=Math.log2(1+w.wait),p=1/(1+Math.exp(-(fitted.a+fitted.b*x)));if(n){score0+=y-n*p;score1+=(y-n*p)*x;}}
 assert(Math.abs(score0)<1e-5&&Math.abs(score1)<1e-5,'Fit must satisfy score equations');
 if(metric==='bi')assert.equal(counts(rows).tested,rows.reduce((s,w)=>s+w.tested,0));
}
console.log('PASS: fictional identities, paired-device denominators, missing and zero handling, original run order, and fitted score equations.');
