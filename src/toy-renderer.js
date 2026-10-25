import * as THREE from 'three';
import {sample} from './engine.js';

const palette={orange:0xff6236,yellow:0xffd447,teal:0x32bdc0,green:0x54b871,blue:0x3087dc,white:0xfff6df,dark:0x192a3d};
const materials=new Map();
const glows=new Map();
function glow(color,strength=2.2){const k=color+'/'+strength;if(!glows.has(k))glows.set(k,new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:strength,roughness:.5}));return glows.get(k);}
function canvasTexture(w,h,draw,repeat){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;if(repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);}return t;}
function material(color){if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.38,metalness:.02}));return materials.get(color);}
const boxGeometry=new THREE.BoxGeometry(1,1,1),studGeometry=new THREE.CylinderGeometry(.19,.19,.13,12),wheelGeometry=new THREE.CylinderGeometry(.36,.36,.27,16);
function box(parent,x,y,z,w,h,d,color,shadow=true){const m=new THREE.Mesh(boxGeometry,material(color));m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m;}
function stud(parent,x,y,z,color){const m=new THREE.Mesh(studGeometry,material(color));m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
function brick(parent,x,y,z,w,h,d,color,studs=true){box(parent,x,y+h/2,z,w,h,d,color);if(studs)for(let a=-w/2+.32;a<w/2;a+=.64)for(let b=-d/2+.32;b<d/2;b+=.64)stud(parent,x+a,y+h+.055,z+b,color);}
function makeCar(color){
 const g=new THREE.Group();
 box(g,0,.35,0,1.15,.25,2.35,palette.dark);
 brick(g,0,.46,.18,.88,.36,1.55,color,false);
 brick(g,0,.55,-.77,.48,.23,1.07,color,false);
 box(g,0,.57,-1.28,1.75,.13,.32,color);
 box(g,0,.84,1.04,1.65,.16,.38,color);
 for(const x of [-.55,.55])box(g,x,.57,1.04,.12,.5,.25,palette.dark);
 box(g,0,.83,.33,.58,.2,.7,palette.dark);
 box(g,0,.98,.55,.65,.16,.16,color);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.25,16,12),material(palette.yellow));head.position.set(0,1.03,.1);head.castShadow=true;g.add(head);
 box(g,0,1.06,-.095,.36,.12,.14,palette.dark);
 for(const x of [-.79,.79])for(const z of [-.76,.76]){const tire=new THREE.Mesh(wheelGeometry,material(0x202934));tire.rotation.z=Math.PI/2;tire.position.set(x,.36,z);tire.castShadow=true;g.add(tire);const hub=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.285,12),material(0xced8df));hub.rotation.z=Math.PI/2;hub.position.copy(tire.position);g.add(hub);}
 for(const x of [-.29,.29])stud(g,x,.87,.69,color);
 stud(g,0,.85,-.57,color);box(g,0,.8,-.95,.17,.02,.5,palette.white);
 // Head and tail lights, switched on for the night circuit.
 const lights=new THREE.Group();lights.visible=false;g.add(lights);g.userData.lights=lights;
 const flames=new THREE.Group();flames.visible=false;g.add(flames);g.userData.flames=flames;
 for(const x of [-.22,.22]){const f=new THREE.Mesh(new THREE.ConeGeometry(.16,.9,8),glow(0xff7a1a,1.1));f.rotation.x=Math.PI/2;f.position.set(x,.48,1.65);flames.add(f);const core=new THREE.Mesh(new THREE.ConeGeometry(.08,.5,8),glow(0xffd25a,1.6));core.rotation.x=Math.PI/2;core.position.set(x,.48,1.45);flames.add(core);}
 for(const x of [-.3,.3]){box(lights,x,.5,-1.2,.2,.12,.08,0xfff4c8,false).material=glow(0xfff4c8);box(lights,x,.86,1.24,.22,.1,.06,0xff3b30,false).material=glow(0xff3b30);}
 return g;
}

// The living room around the baseplate: wooden floor, rug, sofa, shelf, lamp, window and spare bricks.
function buildRoom(){
 const group=new THREE.Group(),cx=45,cz=27.5,floorY=-1.25;
 const wood=canvasTexture(512,512,(c,w,h)=>{const tones=['#b98552','#a8743f','#c79563','#9e6b3a'];for(let i=0;i<8;i++){c.fillStyle=tones[i%4];c.fillRect(0,i*h/8,w,h/8);c.fillStyle='rgba(60,35,15,.35)';c.fillRect(0,i*h/8,w,2);c.fillRect(((i*173)%w),i*h/8,2,h/8);for(let k=0;k<14;k++){c.fillStyle='rgba(90,55,25,.12)';c.fillRect(0,i*h/8+((k*37+i*11)%(h/8)),w,1);}}},[12,12]);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(700,700),new THREE.MeshStandardMaterial({map:wood,color:0xb8a898,roughness:.7}));floor.rotation.x=-Math.PI/2;floor.position.set(cx,floorY-.02,cz);floor.receiveShadow=true;group.add(floor);
 const rug=canvasTexture(1024,740,(c,w,h)=>{c.fillStyle='#b4553f';c.fillRect(0,0,w,h);c.strokeStyle='#e9cfa3';c.lineWidth=18;c.strokeRect(30,30,w-60,h-60);c.strokeStyle='#2f5d73';c.lineWidth=8;c.strokeRect(62,62,w-124,h-124);});
 const rugMesh=new THREE.Mesh(new THREE.PlaneGeometry(150,108),new THREE.MeshStandardMaterial({map:rug,color:0xd8d0c8,roughness:1}));rugMesh.rotation.x=-Math.PI/2;rugMesh.position.set(cx,floorY,cz);rugMesh.receiveShadow=true;group.add(rugMesh);
 const walls=new THREE.MeshStandardMaterial({color:0xeedcc2,roughness:.95,side:THREE.BackSide});
 const room=new THREE.Mesh(new THREE.BoxGeometry(420,190,340),walls);room.position.set(cx,floorY+95,cz);group.add(room);
 const trim=(x,z,w,d)=>{const m=box(group,x,floorY+3,z,w,6,d,0xfaf3e6,false);m.receiveShadow=false;};trim(cx,cz-169,420,1.5);trim(cx,cz+169,420,1.5);trim(cx-209,cz,1.5,340);trim(cx+209,cz,1.5,340);
 // Sofa along the back wall, under the window.
 const sofa=new THREE.Group();sofa.position.set(cx,floorY,cz-150);group.add(sofa);
 box(sofa,0,9,0,150,18,46,0x5f82a8);box(sofa,0,30,-19,150,30,12,0x5f82a8);for(const x of [-70,70])box(sofa,x,20,0,12,22,46,0x45648a);for(const x of [-34,34])box(sofa,x,21,3,64,7,38,0x6a8fb5);box(sofa,-48,30,-9,22,20,8,0xf2b94b);box(sofa,52,29,-9,20,18,8,0xe9ecef);
 const pane=box(group,cx,floorY+105,cz-169,96,62,1,0xffffff,false);const frameColor=0xfaf3e6;box(group,cx,floorY+105,cz-168.4,100,4,1.5,frameColor,false);box(group,cx,floorY+137,cz-168.4,100,4,1.5,frameColor,false);box(group,cx,floorY+73,cz-168.4,100,4,1.5,frameColor,false);box(group,cx,floorY+105,cz-168.4,4,66,1.5,frameColor,false);for(const x of [-50,50])box(group,cx+x,floorY+105,cz-168.4,4,66,1.5,frameColor,false);
 const dayPane=new THREE.MeshBasicMaterial({map:canvasTexture(256,170,(c,w,h)=>{const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#bfe6f7');g.addColorStop(1,'#eaf7fb');c.fillStyle=g;c.fillRect(0,0,w,h);c.fillStyle='#8fbf7a';c.fillRect(0,h*.78,w,h*.22);})});
 const nightPane=new THREE.MeshBasicMaterial({map:canvasTexture(256,170,(c,w,h)=>{const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#0c1430');g.addColorStop(1,'#25335e');c.fillStyle=g;c.fillRect(0,0,w,h);c.fillStyle='#fff';for(let i=0;i<40;i++)c.fillRect((i*53)%w,(i*29)%(h*.7),1.5,1.5);c.fillStyle='#fff6d8';c.beginPath();c.arc(w*.72,h*.3,18,0,7);c.fill();c.fillStyle='#0c1430';c.beginPath();c.arc(w*.72+8,h*.27,15,0,7);c.fill();c.fillStyle='#16203f';c.fillRect(0,h*.8,w,h*.2);})});
 // Bookshelf with colorful spines on the left wall.
 const shelf=new THREE.Group();shelf.position.set(cx-195,floorY,cz-40);group.add(shelf);box(shelf,0,55,0,26,110,80,0x8a5a36);const spines=[0xd9534f,0x3e7cb1,0xf0ad4e,0x5cb85c,0xe9ecef,0x7a5ea8,0x2f5d73];for(let row=0;row<4;row++){box(shelf,6,12+row*26,0,16,2,76,0x6f4627);for(let b=0;b<9;b++)box(shelf,6,20+row*26,-34+b*8.4,12,14+(b*7%5),6,spines[(b+row*3)%spines.length]);}
 // Floor lamp in the corner; it lights the room after hours.
 const lampG=new THREE.Group();lampG.position.set(cx-150,floorY,cz-130);group.add(lampG);box(lampG,0,1,0,18,2,18,0x2b2b2b);const pole=new THREE.Mesh(new THREE.CylinderGeometry(1,1,92,10),material(0x2b2b2b));pole.position.y=47;lampG.add(pole);const shade=new THREE.Mesh(new THREE.CylinderGeometry(9,15,18,24,1,true),material(0xf2e6cf));shade.position.y=96;lampG.add(shade);
 const lamp=new THREE.PointLight(0xffc98a,9000,420,1.7);lamp.position.set(cx-150,floorY+88,cz-130);group.add(lamp);
 // A few oversized spare bricks and a toy box on the rug edge.
 brick(group,cx-58,floorY,cz-38,8,4.8,4,palette.blue);brick(group,cx-50,floorY,cz-44,4,4.8,4,palette.yellow);brick(group,cx+60,floorY,cz+40,8,4.8,4,palette.orange);brick(group,cx+66,floorY,cz-30,4,9.6,4,palette.teal);brick(group,cx-62,floorY,cz+42,4,4.8,8,palette.white);
 box(group,cx+118,floorY+16,cz+70,40,32,32,0xf2b94b);box(group,cx+118,floorY+33,cz+70,42,3,34,0xe39d2b);
 return {group,walls,lamp,shade,pane,dayPane,nightPane};
}

const STREAK=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.55});

export class ToyRenderer{
 constructor(canvas,preview=false){
  this.canvas=canvas;this.preview=preview;
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.25;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x9fd8e9);this.scene.fog=new THREE.Fog(0x9fd8e9,90,180);
  this.camera=new THREE.PerspectiveCamera(preview?43:53,1,.1,600);
  this.hemi=new THREE.HemisphereLight(0xfff4e2,0x8a6a4a,2.3);this.scene.add(this.hemi);
  this.sun=new THREE.DirectionalLight(0xfff0d2,3.3);this.sun.position.set(30,65,10);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-65,right:65,top:65,bottom:-65,near:1,far:150});this.sun.shadow.normalBias=.04;this.sun.target.position.set(45,0,25);this.scene.add(this.sun,this.sun.target);
  this.room=buildRoom();this.scene.add(this.room.group);
  this.content=new THREE.Group();this.scene.add(this.content);this.cars=[];this.shake=0;
  // Pooled particles for sparks, grass/sand spray and slipstream streaks.
  this.particles=Array.from({length:140},()=>{const m=new THREE.Mesh(boxGeometry,glow(0xffb347));m.visible=false;m.userData={life:0,v:new THREE.Vector3()};this.scene.add(m);return m;});this.nextParticle=0;
  this.follow=new THREE.Vector3();this.look=new THREE.Vector3();this.initial=true;
 }
 resize(){const r=this.canvas.getBoundingClientRect();const w=Math.max(1,r.width),h=Math.max(1,r.height);this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
 setTrack(track,index){
  this.track=track;this.index=index;this.initial=true;this.shake=0;this.particles?.forEach(m=>m.visible=false);
  this.content.traverse(o=>{if(o.userData.disposable){o.geometry?.dispose();o.material?.map?.dispose();o.material?.dispose();}});this.content.clear();this.cars=[];
  const colors=[0x77b85c,0xe8b978,0x5c97a3],base=colors[index],night=index===2;this.setMood(night);
  brick(this.content,45,-1.2,27.5,94,1.1,59,base,false);
  // A painted road on a brick base, surrounded by physical toy scenery.
  const tex=document.createElement('canvas');tex.width=2048;tex.height=1280;const c=tex.getContext('2d');c.scale(2048/1800,1280/1100);c.fillStyle='#'+base.toString(16);c.fillRect(0,0,1800,1100);
  const path=()=>{c.beginPath();track.points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();};
  path();c.strokeStyle='#3c874d';c.lineWidth=143;c.lineJoin='round';c.stroke();path();c.strokeStyle='#fff7df';c.lineWidth=126;c.stroke();
  for(let s=0;s<track.length;s+=24){const a=sample(track,s),b=sample(track,s+12);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.lineWidth=126;c.strokeStyle='#f35a45';c.stroke();}
  path();c.strokeStyle='#3f4c5a';c.lineWidth=108;c.stroke();path();c.strokeStyle='#8796a2';c.lineWidth=1.5;c.setLineDash([16,25]);c.stroke();c.setLineDash([]);
  const p=sample(track,0);c.save();c.translate(p.x,p.y);c.rotate(p.angle);for(let a=0;a<4;a++)for(let b=0;b<12;b++){c.fillStyle=(a+b)%2?'#fff8e4':'#263241';c.fillRect(a*9-18,b*9-54,9,9);}c.restore();
  const texture=new THREE.CanvasTexture(tex);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=this.renderer.capabilities.getMaxAnisotropy();const road=new THREE.Mesh(new THREE.PlaneGeometry(90,55),new THREE.MeshStandardMaterial({map:texture,roughness:.9}));road.rotation.x=-Math.PI/2;road.position.set(45,0,27.5);road.receiveShadow=true;road.userData.disposable=true;this.content.add(road);
  const clear=(x,z,dist)=>!track.points.some(p=>Math.hypot(p.x/20-x,p.y/20-z)<dist);
  // Visible studs make the entire island read as a construction-toy baseplate.
  const positions=[];for(let x=1;x<90;x+=1.3)for(let z=1;z<55;z+=1.3)if(clear(x,z,4.1))positions.push([x,z]);
  const studs=new THREE.InstancedMesh(studGeometry,material(base),positions.length),matrix=new THREE.Matrix4();positions.forEach(([x,z],i)=>{matrix.makeTranslation(x,.035,z);studs.setMatrixAt(i,matrix);});studs.receiveShadow=true;this.content.add(studs);
  for(let i=0;i<65;i++){const x=3+(i*17.31)%84,z=3+(i*11.73)%49;if(!clear(x,z,6))continue;
   if(index===1&&i%3===0){brick(this.content,x,0,z,1.9,1.2,1.6,0xc8915d);brick(this.content,x+.2,1.2,z,1.2,.7,1.1,0xe8c396);}
   else{brick(this.content,x,0,z,.5,1,.5,0x926645,false);brick(this.content,x,.8,z,1.65,.8,1.65,index===2?0x38a79d:0x39a760);brick(this.content,x,1.6,z,1.15,.7,1.15,index===2?0x65c6af:0x7acc55);}}
  // Low, colorful safety walls trace the outside of selected corners.
  for(let s=0;s<track.length;s+=54){if(Math.floor(s/280)%3!==0)continue;const p=sample(track,s,-72);const g=new THREE.Group();g.position.set(p.x/20,0,p.y/20);g.rotation.y=-p.angle;brick(g,0,0,0,2.4,.55,.55,Math.floor(s/54)%2?palette.white:palette.orange);this.content.add(g);}
  // Grandstands with little seated spectators and chunky pit garages.
  for(let k=0;k<3;k++){const x=27+k*8,z=17;brick(this.content,x,0,z,6.7,1,3.2,[palette.teal,palette.orange,palette.yellow][k]);for(let row=0;row<3;row++){box(this.content,x,1+row*.35,z+.6-row*.75,6.6,.35,.8,0xc8d7e0);for(let j=0;j<8;j++){const px=x-2.8+j*.8,pz=z+.6-row*.75;box(this.content,px,1.4+row*.35,pz,.4,.5,.4,[palette.blue,palette.orange,palette.white,palette.teal][(j+row+k)%4]);stud(this.content,px,1.76+row*.35,pz,palette.yellow);}}box(this.content,x,3.3,z-.2,7,.3,4,palette.white);for(const dx of [-3.1,3.1])box(this.content,x+dx,1.8,z-1.3,.2,3.3,.2,palette.dark);}
  // Start gantry.
  const start=sample(track,0);const gantry=new THREE.Group();gantry.position.set(start.x/20,0,start.y/20);gantry.rotation.y=-start.angle;for(const z of [-3.5,3.5])brick(gantry,0,0,z,.55,3.6,.55,palette.white,false);box(gantry,0,3.8,0,.65,.85,7.6,palette.dark);for(let z=-1.6;z<=1.6;z+=.8)box(gantry,-.36,3.8,z,.1,.35,.35,palette.orange);this.content.add(gantry);
  // Brick street lamps that really light the road after hours.
  if(night)for(let s=0;s<track.length;s+=track.length/9){const p=sample(track,s,84),q=sample(track,s,0);const lamp=new THREE.Group();lamp.position.set(p.x/20,0,p.y/20);brick(lamp,0,0,0,.6,.35,.6,palette.dark,false);box(lamp,0,2.1,0,.22,3.5,.22,palette.dark);const head=box(lamp,0,3.95,0,.75,.3,.75,0xffd58a,false);head.material=glow(0xffd58a,3);const light=new THREE.PointLight(0xffc979,55,15,1.6);light.position.set((q.x-p.x)/40,3.5,(q.y-p.y)/40);lamp.add(light);this.content.add(lamp);}
  const carColors=[palette.orange,palette.yellow,palette.white,palette.teal,0xb887de,palette.blue];for(const color of carColors){const car=makeCar(color);car.userData.lights.visible=night;this.content.add(car);this.cars.push(car);}
  this.ghost=makeCar(palette.white);this.ghost.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.28;o.material.depthWrite=false;o.castShadow=false;}});this.ghost.visible=false;this.content.add(this.ghost);
  this.resize();
 }
 // Daylight living room, or the same room after hours with the lamp on and the moon in the window.
 setMood(night){
  const r=this.room,wall=night?0x1b2338:0xeedcc2;
  this.scene.background=new THREE.Color(wall);this.scene.fog=new THREE.Fog(wall,night?45:55,night?230:250);
  this.hemi.color.set(night?0x5a6fa8:0xfff4e2);this.hemi.groundColor.set(night?0x141a2a:0x8a6a4a);this.hemi.intensity=night?.55:2.3;
  this.sun.color.set(night?0x9fb8ff:0xfff0d2);this.sun.intensity=night?1.1:3.3;this.renderer.toneMappingExposure=night?1.05:1.25;
  r.walls.color.set(wall);r.lamp.visible=night;r.shade.material=night?glow(0xffd9a0,1.6):material(0xf2e6cf);
  r.pane.material=night?r.nightPane:r.dayPane;
 }
 emit(pos,vel,size,mat,life){const m=this.particles[this.nextParticle++%this.particles.length];m.material=mat;m.position.copy(pos);m.scale.set(...size);m.userData.v.copy(vel);m.userData.life=m.userData.max=life;m.visible=true;}
 effects(race,dt){
  const spray=material([0x9fd36b,0xe8c38a,0x4f8f86][this.index]),spark=glow(0xff8a1f,1.3),streak=STREAK;
  race.cars.forEach((car,i)=>{const g=this.cars[i];if(!g)return;g.userData.flames.visible=!!car.boosting;if(car.boosting){const k=.75+Math.random()*.5;g.userData.flames.scale.set(1,1,k);}
   const p=g.position,heading=-g.rotation.y-Math.PI/2,fx=Math.cos(heading),fz=Math.sin(heading);
   if(car.contact>.15&&Math.random()<car.contact){for(let n=0;n<2;n++)this.emit(new THREE.Vector3(p.x+(Math.random()-.5)*1.4,.6,p.z+(Math.random()-.5)*1.4),new THREE.Vector3((Math.random()-.5)*9,3+Math.random()*4,(Math.random()-.5)*9),[.12,.12,.12],spark,.35);if(i===0&&car.contact>.3)this.shake=Math.max(this.shake,car.contact*.35);}
   if(Math.abs(car.lane)>48&&car.speed>60&&Math.random()<.7)this.emit(new THREE.Vector3(p.x-fx*1.2+(Math.random()-.5),.3,p.z-fz*1.2+(Math.random()-.5)),new THREE.Vector3(-fx*3+(Math.random()-.5)*3,2.5+Math.random()*2,-fz*3+(Math.random()-.5)*3),[.22,.22,.22],spray,.5);
   if(i===0&&(race.slip||car.boosting||car.speed>300)&&Math.random()<.8){const side=Math.random()<.5?-1:1,off=1.2+Math.random()*1.6;this.emit(new THREE.Vector3(p.x+fx*(2+Math.random()*4)-fz*side*off,.5+Math.random()*1.4,p.z+fz*(2+Math.random()*4)+fx*side*off),new THREE.Vector3(-fx*30,0,-fz*30),[.04,.04,1.6],streak,.22);}
  });
  for(const m of this.particles){if(!m.visible)continue;const u=m.userData;u.life-=dt;if(u.life<=0){m.visible=false;continue;}m.position.addScaledVector(u.v,dt);if(m.scale.z<1)u.v.y-=18*dt;if(m.position.y<.05){m.position.y=.05;u.v.multiplyScalar(.5);}
   if(m.scale.z>1){m.rotation.set(0,Math.atan2(u.v.x,u.v.z),0);}else m.rotation.x+=dt*8;}
  this.shake*=Math.exp(-dt*9);
 }
 setGhost(frame){this.ghost.visible=!!frame;if(frame){const p=sample(this.track,frame[0],frame[1]);this.ghost.position.set(p.x/20,.04,p.y/20);this.ghost.rotation.y=-p.angle-Math.PI/2;}}
 render(race,dt=.016,time=0){
  const cars=race?.cars||this.cars.map((_,i)=>({s:i*55,lane:i%2?19:-19}));
  this.cars.forEach((g,i)=>{const car=cars[i];g.visible=!!car;if(!car)return;const p=sample(this.track,car.s,car.pit?-70:car.lane);g.position.set(p.x/20,.03,p.y/20);g.rotation.y=-p.angle-Math.PI/2;g.rotation.z=i===0&&race?Math.sin(time*30)*Math.min(car.speed/15000,.015):0;});
  if(race&&!this.preview)this.effects(race,dt);
  if(this.preview){const angle=.65+Math.sin(time*.15)*.08;this.camera.position.set(45+Math.sin(angle)*68,67,27.5+Math.cos(angle)*68);this.camera.lookAt(45,0,27.5);}
  else if(race){const car=race.cars[0],p=sample(this.track,car.s,car.lane),ahead=sample(this.track,car.s+155,car.lane*.3),dx=Math.cos(p.angle),dz=Math.sin(p.angle);const portrait=this.camera.aspect<1;const desired=new THREE.Vector3(p.x/20-dx*(portrait?10:12),portrait?9:8,p.y/20-dz*(portrait?10:12));const target=new THREE.Vector3(ahead.x/20,.1,ahead.y/20);const smooth=1-Math.exp(-dt*5);if(this.initial){this.follow.copy(desired);this.look.copy(target);this.initial=false;}else{this.follow.lerp(desired,smooth);this.look.lerp(target,smooth);}this.camera.position.copy(this.follow);if(this.shake>.01)this.camera.position.add(new THREE.Vector3((Math.random()-.5)*this.shake,(Math.random()-.5)*this.shake,(Math.random()-.5)*this.shake));this.camera.lookAt(this.look);const fov=53+(car.speed/450)*7;if(Math.abs(this.camera.fov-fov)>.2){this.camera.fov=fov;this.camera.updateProjectionMatrix();}}
  this.renderer.render(this.scene,this.camera);
 }
}
