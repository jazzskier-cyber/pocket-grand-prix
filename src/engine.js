export const TRACKS = [
 {name:'Clover Coast',location:'ROUND 01 · THE SEASIDE',tag:'FLOWING',color:'#a8c58b',water:'#74b9be',points:[[360,850],[220,650],[230,300],[470,180],[850,180],[1030,340],[1390,240],[1590,440],[1470,780],[1200,880],[880,700],[650,900]]},
 {name:'Copper Canyon',location:'ROUND 02 · THE HIGH DESERT',tag:'TECHNICAL',color:'#d4b17c',water:'#b78259',points:[[350,850],[190,610],[270,240],[620,200],[800,410],[1030,210],[1490,230],[1580,490],[1300,530],[1450,850],[1050,920],[790,700],[600,910]]},
 {name:'Moonlight Marina',location:'ROUND 03 · AFTER HOURS',tag:'FAST',color:'#355e60',water:'#224a5b',points:[[300,800],[210,470],[420,220],[850,180],[1450,210],[1610,460],[1370,650],[1100,470],[900,620],[1090,880],[650,940]]}
];
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mod=(a,b)=>((a%b)+b)%b;
export function createTrack(def){
 const points=[],n=def.points.length;
 for(let i=0;i<n;i++)for(let j=0;j<32;j++){
  const t=j/32,a=def.points[(i+n-1)%n],b=def.points[i],c=def.points[(i+1)%n],d=def.points[(i+2)%n];
  const xy=[0,1].map(k=>.5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t*t+(-a[k]+3*b[k]-3*c[k]+d[k])*t*t*t));
  points.push({x:xy[0],y:xy[1],s:0});
 }
 let length=0;points.forEach((p,i)=>{p.s=length;const q=points[(i+1)%points.length];p.angle=Math.atan2(q.y-p.y,q.x-p.x);p.segment=Math.hypot(q.x-p.x,q.y-p.y);length+=p.segment;});
 return {...def,points,length};
}
export function sample(track,s,lane=0){
 s=mod(s,track.length);let lo=0,hi=track.points.length-1;
 while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(track.points[mid].s<=s)lo=mid;else hi=mid-1;}
 const p=track.points[lo],q=track.points[(lo+1)%track.points.length],t=(s-p.s)/p.segment;
 return {x:p.x+(q.x-p.x)*t-Math.sin(p.angle)*lane,y:p.y+(q.y-p.y)*t+Math.cos(p.angle)*lane,angle:p.angle};
}
export function bend(track,s){const a=sample(track,s).angle,b=sample(track,s+65).angle;return Math.atan2(Math.sin(b-a),Math.cos(b-a))/65;}
export function createRace(track,mode='race',assist=true){
 const colors=['#ff653e','#f8ce63','#e7ede0','#65cbcc','#d28ec8','#8cb4ee'];
 const names=['YOU','SOL','KIT','RIO','LUX','ACE'];
 const cars=Array.from({length:mode==='trial'?1:6},(_,i)=>({name:names[i],color:colors[i],s:i===0?0:115+i*40,lane:i===0?0:(i%2?22:-22),speed:0,tires:1,boost:1,lap:1,finished:false,finishTime:null,pit:0,pitQueued:false,bestLap:Infinity,lastLap:0}));
 return {track,mode,assist,cars,time:0,laps:mode==='trial'?3:5,done:false,events:[],slip:false};
}
export function step(r,input,dt){
 if(r.done)return;dt=clamp(dt,0,.05);r.time+=dt;r.events=[];r.slip=false;
 for(let i=0;i<r.cars.length;i++){
  const c=r.cars[i];if(c.finished)continue;
  if(c.pit>0){c.pit-=dt;c.speed=0;if(c.pit<=0){c.tires=1;c.boost=1;r.events.push('Fresh tires. Go!');}continue;}
  const curve=bend(r.track,c.s),corner=Math.abs(curve);
  const safe=clamp(355-corner*19000,135,355)*(0.78+c.tires*.22);
  let target=355,boosting=false;
  if(i===0){
   const steer=(input.right?1:0)-(input.left?1:0);
   c.lane+=steer*(90+c.speed*.19)*dt;
   c.lane-=curve*c.speed*c.speed*.12*dt;
   if(r.assist && !steer)c.lane*=1-dt*.3;
   if(r.assist)target=Math.min(target,safe+12);
   if(input.brake)target=95;
   boosting=input.boost&&c.boost>0&&!input.brake;
   if(boosting){target+=95;c.boost=Math.max(0,c.boost-dt*.24);}else c.boost=Math.min(1,c.boost+dt*.065);
   const slip=r.cars.some((a,j)=>j>0&&a.s>c.s&&a.s-c.s<150&&Math.abs(a.lane-c.lane)<18);
   if(slip){target+=28;r.slip=true;}
  }else{
   target=Math.min(320+i*3,safe*(.87+i*.015));
   const desired=Math.sin(c.s/330+i*2)*25;
   c.lane+=(desired-c.lane)*dt*1.5;
  }
  if(Math.abs(c.lane)>48)target=Math.min(target,125);
  if(Math.abs(c.lane)>78){c.lane=clamp(c.lane,-78,78);c.speed*=.97;}
  if(c.speed>safe+30)c.lane-=curve*c.speed*dt*22;
  const acceleration=target<c.speed?170:boosting?140:85;
  c.speed+=clamp(target-c.speed,-acceleration*dt,acceleration*dt);
  c.tires=Math.max(.15,c.tires-dt*(.0025+corner*c.speed*.002));
  const prev=c.s;c.s+=c.speed*dt;
  const lap=Math.floor(c.s/r.track.length)+1;
  if(lap>c.lap){c.bestLap=Math.min(c.bestLap,r.time-c.lastLap);c.lastLap=r.time;c.lap=lap;if(i===0)r.events.push('Lap '+Math.min(lap,r.laps)+' · keep pushing');}
  if(c.s>=r.track.length*r.laps){c.finished=true;c.finishTime=r.time;if(i===0){r.done=true;r.events.push('Checkered flag');}}
  if(!c.finished&&c.pitQueued&&Math.floor(prev/r.track.length)!==Math.floor(c.s/r.track.length)){c.pitQueued=false;c.pit=3.5;if(i===0)r.events.push('Box, box · 3.5 seconds');}
 }
 // Side-by-side contact costs speed and separates cars without reversing progress.
 for(let i=0;i<r.cars.length;i++)for(let j=i+1;j<r.cars.length;j++){
  const a=r.cars[i],b=r.cars[j];if(a.finished||b.finished||a.pit||b.pit)continue;
  const gap=Math.abs(mod(a.s-b.s+r.track.length/2,r.track.length)-r.track.length/2);
  if(gap<27&&Math.abs(a.lane-b.lane)<15){const sign=a.lane>=b.lane?1:-1;a.lane+=sign*30*dt;b.lane-=sign*30*dt;a.speed=Math.max(65,a.speed-100*dt);b.speed=Math.max(65,b.speed-100*dt);}
 }
}
export function ranking(r){return [...r.cars].sort((a,b)=>a.finished&&b.finished?a.finishTime-b.finishTime:b.s-a.s);}
export function formatTime(t){if(!Number.isFinite(t))return '—';return `${Math.floor(t/60)}:${(t%60).toFixed(2).padStart(5,'0')}`;}
