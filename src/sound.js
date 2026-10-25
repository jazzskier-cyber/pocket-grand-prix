// Small Web Audio kit: a geared engine note, boost whoosh, brick-clack contact, countdown beeps and a finish fanfare.
// Nothing plays until the player turns sound on.
export class Sound{
 constructor(){this.ctx=null;this.muted=true;this.lastClack=0;this.lastBeep=null;}
 enable(){
  try{
   this.ctx ||= new (window.AudioContext||window.webkitAudioContext)();this.ctx.resume();
   if(this.master)return;
   const c=this.ctx;this.master=c.createGain();this.master.gain.value=.5;this.master.connect(c.destination);
   this.engine=c.createGain();this.engine.gain.value=0;this.filter=c.createBiquadFilter();this.filter.type='lowpass';this.filter.Q.value=4;this.filter.connect(this.engine).connect(this.master);
   this.low=c.createOscillator();this.low.type='sawtooth';this.high=c.createOscillator();this.high.type='square';
   const mix=c.createGain();mix.gain.value=.35;this.high.connect(mix).connect(this.filter);this.low.connect(this.filter);this.low.start();this.high.start();
   this.noise=c.createBuffer(1,c.sampleRate,c.sampleRate);const d=this.noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
   const whoosh=c.createBufferSource();whoosh.buffer=this.noise;whoosh.loop=true;this.whooshFilter=c.createBiquadFilter();this.whooshFilter.type='bandpass';this.whooshFilter.frequency.value=900;this.whooshGain=c.createGain();this.whooshGain.gain.value=0;whoosh.connect(this.whooshFilter).connect(this.whooshGain).connect(this.master);whoosh.start();
  }catch{this.muted=true;}
 }
 setMuted(muted){this.muted=muted;if(!muted)this.enable();if(muted)this.silence();}
 silence(){if(!this.master)return;const t=this.ctx.currentTime;this.engine.gain.setTargetAtTime(0,t,.03);this.whooshGain.gain.setTargetAtTime(0,t,.03);}
 tone(freq,start,length,type='square',volume=.12){
  const c=this.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(volume,start);g.gain.exponentialRampToValueAtTime(.001,start+length);o.connect(g).connect(this.master);o.start(start);o.stop(start+length+.02);
 }
 beep(go){if(this.muted||!this.master)return;this.tone(go?880:440,this.ctx.currentTime,go?.45:.18);}
 clack(strength){
  if(this.muted||!this.master||this.ctx.currentTime-this.lastClack<.12)return;this.lastClack=this.ctx.currentTime;
  const c=this.ctx,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain(),t=c.currentTime;s.buffer=this.noise;f.type='highpass';f.frequency.value=1800;g.gain.setValueAtTime(.35*strength,t);g.gain.exponentialRampToValueAtTime(.001,t+.07);s.connect(f).connect(g).connect(this.master);s.start(t,Math.random()*.5,.09);
 }
 fanfare(win){if(this.muted||!this.master)return;const t=this.ctx.currentTime;(win?[523,659,784,1047]:[392,523,659]).forEach((f,i)=>this.tone(f,t+i*.13,.32,'triangle',.16));}
 // Called every frame: engine pitch climbs through each "gear" and drops at the shift.
 update(race,state,countdown){
  if(!this.master)return;const t=this.ctx.currentTime;
  if(this.muted||!race||!['racing','countdown'].includes(state)){this.silence();if(state!=='paused')this.lastBeep=null;return;}
  if(state==='countdown'){const n=Math.ceil(countdown);if(n!==this.lastBeep){this.lastBeep=n;this.beep(false);}}
  else if(this.lastBeep!==0){this.lastBeep=0;this.beep(true);}
  const p=race.cars[0],gear=Math.min(5,Math.floor(p.speed/80)),within=(p.speed-gear*80)/80,freq=48+gear*6+within*58;
  this.low.frequency.setTargetAtTime(freq,t,.04);this.high.frequency.setTargetAtTime(freq*2.01,t,.04);this.filter.frequency.setTargetAtTime(500+p.speed*7,t,.05);
  this.engine.gain.setTargetAtTime(state==='racing'?.09+p.speed/4000:.05,t,.05);
  this.whooshGain.gain.setTargetAtTime(p.boosting?.12:race.slip?.05:0,t,.06);this.whooshFilter.frequency.setTargetAtTime(p.boosting?1400:700,t,.1);
  if(p.contact>.15)this.clack(p.contact);
 }
}
