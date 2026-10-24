import * as THREE from 'three';
import {sample} from './engine.js';

const palette={orange:0xff6236,yellow:0xffd447,teal:0x32bdc0,green:0x54b871,blue:0x3087dc,white:0xfff6df,dark:0x192a3d};
const materials=new Map();
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
 return g;
}

export class ToyRenderer{
 constructor(canvas,preview=false){
  this.canvas=canvas;this.preview=preview;
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.25;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x9fd8e9);this.scene.fog=new THREE.Fog(0x9fd8e9,90,180);
  this.camera=new THREE.PerspectiveCamera(preview?43:53,1,.1,220);
  this.scene.add(new THREE.HemisphereLight(0xe9f9ff,0x729b58,2.3));
  this.sun=new THREE.DirectionalLight(0xfff0d2,3.3);this.sun.position.set(30,65,10);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-65,right:65,top:65,bottom:-65,near:1,far:150});this.sun.shadow.normalBias=.04;this.sun.target.position.set(45,0,25);this.scene.add(this.sun,this.sun.target);
  this.content=new THREE.Group();this.scene.add(this.content);this.cars=[];this.follow=new THREE.Vector3();this.look=new THREE.Vector3();this.initial=true;
 }
 resize(){const r=this.canvas.getBoundingClientRect();const w=Math.max(1,r.width),h=Math.max(1,r.height);this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
 setTrack(track,index){
  this.track=track;this.index=index;this.initial=true;
  this.content.traverse(o=>{if(o.userData.disposable){o.geometry?.dispose();o.material?.map?.dispose();o.material?.dispose();}});this.content.clear();this.cars=[];
  const colors=[0x77b85c,0xe8b978,0x66aab0],base=colors[index];
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
  const carColors=[palette.orange,palette.yellow,palette.white,palette.teal,0xb887de,palette.blue];for(const color of carColors){const car=makeCar(color);this.content.add(car);this.cars.push(car);}
  this.ghost=makeCar(palette.white);this.ghost.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.28;o.material.depthWrite=false;o.castShadow=false;}});this.ghost.visible=false;this.content.add(this.ghost);
  this.resize();
 }
 setGhost(frame){this.ghost.visible=!!frame;if(frame){const p=sample(this.track,frame[0],frame[1]);this.ghost.position.set(p.x/20,.04,p.y/20);this.ghost.rotation.y=-p.angle-Math.PI/2;}}
 render(race,dt=.016,time=0){
  const cars=race?.cars||this.cars.map((_,i)=>({s:i*55,lane:i%2?19:-19}));
  this.cars.forEach((g,i)=>{const car=cars[i];g.visible=!!car;if(!car)return;const p=sample(this.track,car.s,car.pit?-70:car.lane);g.position.set(p.x/20,.03,p.y/20);g.rotation.y=-p.angle-Math.PI/2;g.rotation.z=i===0&&race?Math.sin(time*30)*Math.min(car.speed/15000,.015):0;});
  if(this.preview){const angle=.65+Math.sin(time*.15)*.08;this.camera.position.set(45+Math.sin(angle)*68,67,27.5+Math.cos(angle)*68);this.camera.lookAt(45,0,27.5);}
  else if(race){const car=race.cars[0],p=sample(this.track,car.s,car.lane),ahead=sample(this.track,car.s+155,car.lane*.3),dx=Math.cos(p.angle),dz=Math.sin(p.angle);const portrait=this.camera.aspect<1;const desired=new THREE.Vector3(p.x/20-dx*(portrait?10:12),portrait?9:8,p.y/20-dz*(portrait?10:12));const target=new THREE.Vector3(ahead.x/20,.1,ahead.y/20);const smooth=1-Math.exp(-dt*5);if(this.initial){this.follow.copy(desired);this.look.copy(target);this.initial=false;}else{this.follow.lerp(desired,smooth);this.look.lerp(target,smooth);}this.camera.position.copy(this.follow);this.camera.lookAt(this.look);const fov=53+(car.speed/450)*7;if(Math.abs(this.camera.fov-fov)>.2){this.camera.fov=fov;this.camera.updateProjectionMatrix();}}
  this.renderer.render(this.scene,this.camera);
 }
}
