export const TRACKS = [
 {name:'Clover Coast',location:'ROUND 01 · THE SEASIDE',tag:'FLOWING',color:'#a8c58b',water:'#74b9be',points:[[360,850],[220,650],[230,300],[470,180],[850,180],[1030,340],[1390,240],[1590,440],[1470,780],[1200,880],[880,700],[650,900]]},
 {name:'Copper Canyon',location:'ROUND 02 · THE HIGH DESERT',tag:'TECHNICAL',color:'#d4b17c',water:'#b78259',points:[[350,850],[190,610],[270,240],[620,200],[800,410],[1030,210],[1490,230],[1580,490],[1300,530],[1450,850],[1050,920],[790,700],[600,910]]},
 {name:'Moonlight Marina',location:'ROUND 03 · AFTER HOURS',tag:'FAST',color:'#355e60',water:'#224a5b',points:[[300,800],[210,470],[420,220],[850,180],[1450,210],[1610,460],[1370,650],[1100,470],[900,620],[1090,880],[650,940]]}
];
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mod=(a,b)=>((a%b)+b)%b;
const wrap=(d,len)=>mod(d+len/2,len)-len/2;
// Collision footprint in track units, matching the rendered car (about 1.75 × 2.9 scene units, ×20).
export const CAR_L=56,CAR_W=32;
function carAhead(r,c){let best=null;for(const o of r.cars){if(o===c||o.finished||o.pit>0)continue;const gap=wrap(o.s-c.s,r.track.length);if(gap>0&&gap<150&&Math.abs(o.lane-c.lane)<CAR_W+4&&(!best||gap<best.gap))best={car:o,gap};}return best;}
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
 const cars=Array.from({length:mode==='trial'?1:6},(_,i)=>({name:names[i],color:colors[i],s:i===0?0:115+i*40,lane:i===0?0:(i%2?22:-22),speed:0,tires:1,boost:1,lap:1,finished:false,finishTime:null,pit:0,pitQueued:false,bestLap:Infinity,bestFlyingLap:Infinity,lastLap:0}));
 return {track,mode,assist,cars,time:0,laps:mode==='trial'?3:5,done:false,events:[],slip:false};
}
export function step(r,input,dt){
 if(r.done)return;dt=clamp(dt,0,.05);r.time+=dt;r.events=[];r.slip=false;for(const c of r.cars){c.contact=0;c.boosting=false;}
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
   c.boosting=boosting;
   if(boosting){target+=95;c.boost=Math.max(0,c.boost-dt*.24);}else c.boost=Math.min(1,c.boost+dt*.065);
   const slip=r.cars.some((a,j)=>j>0&&a.s>c.s&&a.s-c.s<150&&Math.abs(a.lane-c.lane)<18);
   if(slip){target+=28;r.slip=true;}
  }else{
   target=Math.min(320+i*3,safe*(.87+i*.015));
   let desired=Math.sin(c.s/330+i*2)*25,rate=1.5;
   // Pull out to overtake a car ahead in this lane; lift if there is no room yet.
   const ahead=carAhead(r,c);
   if(ahead){const {car:a,gap}=ahead;desired=clamp(a.lane+(a.lane>0?-1:1)*(CAR_W+6),-44,44);rate=2.6;if(gap<CAR_L+25&&Math.abs(a.lane-c.lane)<CAR_W)target=Math.min(target,a.speed);}
   c.lane+=(desired-c.lane)*dt*rate;
  }
  if(Math.abs(c.lane)>48)target=Math.min(target,125);
  if(Math.abs(c.lane)>78){c.lane=clamp(c.lane,-78,78);c.speed*=.97;}
  if(c.speed>safe+30)c.lane-=curve*c.speed*dt*22;
  const acceleration=target<c.speed?170:boosting?140:85;
  c.speed+=clamp(target-c.speed,-acceleration*dt,acceleration*dt);
  c.tires=Math.max(.15,c.tires-dt*(.0025+corner*c.speed*.002));
  const prev=c.s;c.s+=c.speed*dt;
  const lap=Math.floor(c.s/r.track.length)+1;
  if(lap>c.lap){const lapTime=r.time-c.lastLap;c.bestLap=Math.min(c.bestLap,lapTime);if(c.lap>=2)c.bestFlyingLap=Math.min(c.bestFlyingLap,lapTime);c.lastLap=r.time;c.lap=lap;if(i===0)r.events.push('Lap '+Math.min(lap,r.laps)+' · keep pushing');}
  if(c.s>=r.track.length*r.laps){c.finished=true;c.finishTime=r.time;if(i===0){r.done=true;r.events.push('Checkered flag');}}
  if(!c.finished&&c.pitQueued&&Math.floor(prev/r.track.length)!==Math.floor(c.s/r.track.length)){c.pitQueued=false;c.pit=3.5;if(i===0)r.events.push('Box, box · 3.5 seconds');}
 }
 // Cars are solid: side-by-side contact pushes them apart, nose-to-tail contact stops the rear car driving through.
 for(let pass=0;pass<2;pass++)for(let i=0;i<r.cars.length;i++)for(let j=i+1;j<r.cars.length;j++){
  const a=r.cars[i],b=r.cars[j];if(a.finished||b.finished||a.pit>0||b.pit>0)continue;
  const ds=wrap(a.s-b.s,r.track.length),dl=a.lane-b.lane,ox=CAR_L-Math.abs(ds),oy=CAR_W-Math.abs(dl);
  if(ox<=0||oy<=0)continue;
  const hit=Math.min(1,.05+Math.abs(a.speed-b.speed)/90);a.contact=Math.max(a.contact,hit);b.contact=Math.max(b.contact,hit);
  if(oy<ox){const sign=dl>0||(dl===0&&i===0)?1:-1;a.lane=clamp(a.lane+sign*oy/2,-78,78);b.lane=clamp(b.lane-sign*oy/2,-78,78);a.speed=Math.max(65,a.speed-60*dt);b.speed=Math.max(65,b.speed-60*dt);}
  else{const [front,back]=ds>=0?[a,b]:[b,a];back.s-=ox;back.speed=Math.min(back.speed,front.speed*.92);front.speed=Math.min(front.speed+8,380);}
 }
}
export function ranking(r){return [...r.cars].sort((a,b)=>a.finished&&b.finished?a.finishTime-b.finishTime:b.s-a.s);}
export function formatTime(t){if(!Number.isFinite(t))return '—';return `${Math.floor(t/60)}:${(t%60).toFixed(2).padStart(5,'0')}`;}
