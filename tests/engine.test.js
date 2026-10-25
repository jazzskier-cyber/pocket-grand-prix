import test from 'node:test';
import assert from 'node:assert/strict';
import {TRACKS,createTrack,sample,createRace,step,ranking,CAR_L,CAR_W} from '../src/engine.js';
const track=createTrack(TRACKS[0]);
test('all circuits close continuously and finish a five-lap race',()=>{
 for(const def of TRACKS){const t=createTrack(def),a=sample(t,0),b=sample(t,t.length);assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<.001);const r=createRace(t);for(let n=0;n<18000&&!r.done;n++)step(r,{},1/60);assert.ok(r.done);assert.equal(r.cars[0].lap,6);assert.ok(r.time<180);assert.equal(new Set(ranking(r).map(c=>c.name)).size,6);}
});
test('steering, braking and boost change driving behavior',()=>{
 const straight={...track};const normal=createRace(straight,'trial'),boosted=createRace(straight,'trial');for(let n=0;n<120;n++){step(normal,{},1/60);step(boosted,{boost:true,right:true},1/60);}assert.ok(boosted.cars[0].boost<normal.cars[0].boost);assert.notEqual(boosted.cars[0].lane,normal.cars[0].lane);const before=normal.cars[0].speed;for(let n=0;n<60;n++)step(normal,{brake:true},1/60);assert.ok(normal.cars[0].speed<before);
});
test('queued pit activates at line, waits, and restores tires',()=>{
 const r=createRace(track,'trial'),p=r.cars[0];p.s=track.length-1;p.speed=220;p.tires=.3;p.pitQueued=true;step(r,{},.05);assert.ok(p.pit>3);const s=p.s;step(r,{},.05);assert.equal(p.s,s);for(let i=0;i<72;i++)step(r,{},.05);assert.ok(p.tires>.99);assert.equal(p.pitQueued,false);
});
test('race finish freezes time and trial uses three laps',()=>{
 const r=createRace(track,'trial');assert.equal(r.cars.length,1);r.cars[0].s=track.length*3-1;r.cars[0].speed=200;step(r,{},.05);assert.ok(r.done);const time=r.time;step(r,{},.05);assert.equal(r.time,time);
});
test('off-track loses speed; boost and tire values stay bounded',()=>{
 const r=createRace(track,'trial',false);for(let i=0;i<3000;i++)step(r,{left:true,boost:true},1/60);const p=r.cars[0];assert.ok(p.speed<=126);assert.ok(p.boost>=0&&p.boost<=1);assert.ok(p.tires>=.15&&p.tires<=1);assert.ok(Number.isFinite(p.s));
});
test('a faster car cannot drive through a slower one in the same lane',()=>{
 const r=createRace(track);r.cars=r.cars.slice(0,2);const [p,ai]=r.cars;p.s=100;p.lane=0;p.speed=350;ai.s=170;ai.lane=0;ai.speed=150;
 for(let n=0;n<30;n++){step(r,{},1/60);const gap=ai.s-p.s,side=Math.abs(ai.lane-p.lane);assert.ok(gap>=CAR_L-.5||side>=CAR_W-.5,`overlap gap ${gap} side ${side}`);}
 assert.ok(p.speed<300);
});
test('no two cars overlap at any point of a full race',()=>{
 for(const def of TRACKS){const t=createTrack(def),r=createRace(t);let worst=0;
  for(let n=0;n<18000&&!r.done;n++){step(r,{},1/60);for(let i=0;i<6;i++)for(let j=i+1;j<6;j++){const a=r.cars[i],b=r.cars[j];if(a.finished||b.finished||a.pit>0||b.pit>0)continue;let ds=((a.s-b.s)%t.length+t.length*1.5)%t.length-t.length/2;const ox=CAR_L-Math.abs(ds),oy=CAR_W-Math.abs(a.lane-b.lane);if(ox>0&&oy>0)worst=Math.max(worst,Math.min(ox,oy));}}
  assert.ok(r.done);assert.ok(worst<4,`${def.name} overlap ${worst}`);}
});
