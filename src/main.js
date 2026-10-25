import {leaderboardConfig,TRIPLE_CROWN} from './leaderboard-config.js';
import {TrialLeaderboard,recordLap,tripleCrownScore} from './leaderboard.js';
import {ToyRenderer} from './toy-renderer.js';
import {Sound} from './sound.js';
import {cloudConfig,cleanRecords,exportRecords,summarize} from './cloud-save.js';
import {TRACKS,createTrack,createRace,step,ranking,formatTime} from './engine.js';
const $=id=>document.getElementById(id),tracks=TRACKS.map(createTrack);
let selected=0,race=null,state='menu',countdown=0,last=0,notice='',noticeUntil=0,ghost=[],oldGhost=[],ghostClock=0;
const board=new TrialLeaderboard(leaderboardConfig);let rankedRun=null,rankedAttempt=0,finalScore=null;
const input={left:false,right:false,brake:false,boost:false};
const canvas=$('game'),preview=$('preview');
const gameRenderer=new ToyRenderer(canvas),previewRenderer=new ToyRenderer(preview,true);
let records={};try{records=cleanRecords(JSON.parse(localStorage.getItem('pocket-gp-records')||'{}'));}catch{}
const storeLocal=()=>{try{localStorage.setItem('pocket-gp-records',JSON.stringify(records));}catch{}};
// Cloud saves load before the first race; standalone or failed starts keep local-only bests and never upload.
const saves=window.AIWanna?.saves;let cloudReady=false;
if(saves){$('start').disabled=true;saves.initialize({...cloudConfig,exportState:()=>exportRecords(records),importState:data=>{records=cleanRecords(data?.records);storeLocal();if(state==='menu')selectTrack(selected);},summary:summarize}).then(()=>{cloudReady=true;},e=>console.warn('Cloud saves unavailable:',e.code||e.message)).finally(()=>{$('start').disabled=false;});}
const readRecord=()=>records[`${selected}-${$('mode').value}-${$('assist').value}`];
function selectTrack(i){selected=i;document.querySelectorAll('#tracks button').forEach((b,j)=>b.classList.toggle('selected',i===j));$('round').textContent=`0${i+1} / 03`;$('location').textContent=tracks[i].location;$('track-name').textContent=tracks[i].name;$('difficulty').textContent=tracks[i].tag;const best=readRecord(),lap=records[`lap-${i}`];$('record').textContent=best||lap?[best&&`PERSONAL BEST ${formatTime(best.time)}`,lap&&`BEST LAP ${formatTime(lap.time)}`].filter(Boolean).join('  ·  '):'A fresh circuit. Make your mark.';drawPreview();}
tracks.forEach((t,i)=>{const b=document.createElement('button');b.textContent=`0${i+1} ${t.name.split(' ')[0]}`;b.onclick=()=>selectTrack(i);$('tracks').append(b);});
$('mode').onchange=$('assist').onchange=()=>selectTrack(selected);
function drawPreview(){previewRenderer.setTrack(tracks[selected],selected);gameRenderer.setTrack(tracks[selected],selected);previewRenderer.render(null,0,0);}
function resize(){gameRenderer.resize();previewRenderer.resize();}
window.addEventListener('resize',resize);
function announce(text,seconds=2){notice=text;noticeUntil=(race?.time||0)+seconds;}
const sound=new Sound();
$('sound').onclick=()=>{sound.setMuted(!sound.muted);$('sound').textContent=sound.muted?'SOUND OFF':'SOUND ON';$('sound').setAttribute('aria-label',sound.muted?'Enable sound':'Mute sound');};
function resetInput(){Object.keys(input).forEach(k=>input[k]=false);}
function start(){rankedAttempt++;rankedRun=null;finalScore=null;$('score-status').textContent='';$('retry-score').hidden=true;race=createRace(tracks[selected],$('mode').value,$('assist').value==='on');ghost=[];ghostClock=0;oldGhost=readRecord()?.ghost||[];rankedRun=window.parent!==window?board.begin(TRIPLE_CROWN):null;state='countdown';countdown=3;notice='';$('menu').hidden=true;$('play').hidden=false;gameRenderer.initial=true;$('overlay').hidden=true;$('pause').hidden=false;$('hud-name').textContent=tracks[selected].name;resetInput();resize();window.scrollTo(0,0);if(!sound.muted)sound.enable();}
$('start').onclick=start;
function showPause(){if(!['racing','countdown'].includes(state))return;pausedState=state;state='paused';resetInput();$('modal-kicker').textContent='TAKE A BREATHER';$('modal-title').textContent='In the garage.';$('modal-copy').textContent='Your race is paused. The grid will wait.';$('results').replaceChildren();$('resume').hidden=false;$('podium').hidden=true;$('overlay').hidden=false;}
let pausedState='racing';$('pause').onclick=showPause;$('resume').onclick=()=>{state=pausedState;$('overlay').hidden=true;};$('restart').onclick=start;$('home').onclick=()=>{state='menu';race=null;resetInput();$('overlay').hidden=true;$('play').hidden=true;$('pause').hidden=true;$('menu').hidden=false;selectTrack(selected);};
function pit(){if(state!=='racing'||race.cars[0].pit>0)return;race.cars[0].pitQueued=!race.cars[0].pitQueued;announce(race.cars[0].pitQueued?'Pit stop queued · next finish line':'Pit stop canceled');}
$('pit').onclick=pit;
const keys={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowDown:'brake',s:'brake',' ':'boost'};
window.addEventListener('keydown',e=>{if(state==='menu')return;const k=keys[e.key]||keys[e.key.toLowerCase()];if(k){e.preventDefault();input[k]=true;}if(!e.repeat&&e.key.toLowerCase()==='p')pit();if(!e.repeat&&e.key==='Escape'){if(state==='paused')$('resume').click();else showPause();}});
window.addEventListener('keyup',e=>{const k=keys[e.key]||keys[e.key.toLowerCase()];if(k){input[k]=false;e.preventDefault();}});
window.addEventListener('blur',()=>{resetInput();showPause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){resetInput();showPause();}});
document.querySelectorAll('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);input[b.dataset.key]=true;});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>input[b.dataset.key]=false);});
function finish(){state='finished';const rank=ranking(race),pos=rank.findIndex(c=>c.name==='YOU')+1,player=race.cars[0];const key=`${selected}-${race.mode}-${$('assist').value}`,best=records[key],newBest=!best||race.time<best.time;if(newBest)records[key]={time:race.time,ghost:race.mode==='trial'?ghost:[]};const lapBest=recordLap(records,selected,player.bestFlyingLap);if(newBest||lapBest){storeLocal();if(cloudReady)saves.save().catch(e=>console.warn('Cloud save needs attention:',e.code||e.message));}
 $('modal-kicker').textContent=newBest?'PERSONAL BEST · BEAUTIFULLY DRIVEN':'THE CHECKERED FLAG';$('modal-title').textContent=race.mode==='trial'?'Lap it up.':pos===1?'Sunday belongs to you.':`P${pos}. Nice drive.`;$('modal-copy').textContent=`${tracks[selected].name} · ${formatTime(race.time)} · Best lap ${formatTime(player.bestLap)}`;podium(rank);sound.fanfare(pos===1);$('results').replaceChildren();for(const [i,c] of rank.entries()){const row=document.createElement('div');if(c.name==='YOU')row.className='you';const name=document.createElement('span'),time=document.createElement('span');name.textContent=`${String(i+1).padStart(2,'0')}  ${c.name}`;time.textContent=c.finished?formatTime(c.finishTime):`Lap ${Math.min(c.lap,race.laps)}`;row.append(name,time);$('results').append(row);}$('resume').hidden=true;$('overlay').hidden=false;crownResult(lapBest);}
// Triple Crown: submit only when every circuit has a flying lap and this race improved one of them.
function crownResult(lapBest){const total=tripleCrownScore(records),missing=tracks.filter((_,i)=>!records[`lap-${i}`]).map(t=>t.name.split(' ')[0]);
 if(total===null){$('score-status').textContent=`Triple Crown · set a flying lap on ${missing.join(' and ')} to enter the board.`;return;}
 if(!lapBest){$('score-status').textContent=`Triple Crown ${formatTime(total/1000)} · beat a best lap to improve it.`;return;}
 finalScore=total;sendScore();}
async function sendScore(){const attempt=rankedAttempt,run=rankedRun,score=finalScore;$('retry-score').hidden=true;if(!run){$('score-status').textContent=`Triple Crown ${formatTime(score/1000)} · saved on this device. Play on AIWANNA to rank online.`;return;}$('score-status').textContent=`Submitting Triple Crown ${formatTime(score/1000)}…`;try{const receipt=await board.submit(run,score);if(attempt!==rankedAttempt)return;$('score-status').textContent=`Triple Crown ${formatTime(score/1000)} accepted${receipt.rank?` · rank #${receipt.rank} of ${receipt.participants}`:''}.`;}catch(e){if(attempt!==rankedAttempt)return;$('score-status').textContent=e.message+' Your local time is saved.';$('retry-score').hidden=false;}}
$('retry-score').onclick=sendScore;
$('rankings').onclick=()=>{showPause();$('ranking-dialog').hidden=false;$('ranking-list').replaceChildren();
 for(let i=0;i<3;i++){const card=document.createElement('div'),name=document.createElement('span'),time=document.createElement('b'),lap=records[`lap-${i}`];card.className='crown-card'+(lap?'':' empty');name.textContent=tracks[i].name;time.textContent=lap?formatTime(lap.time):'—';card.append(name,time);$('ranking-list').append(card);}
 const total=tripleCrownScore(records),url=board.url(TRIPLE_CROWN);$('crown-total').textContent=total===null?'—':formatTime(total/1000);
 $('online-board').hidden=!url;if(url)$('online-board').href=url;
 $('ranking-status').textContent=total===null?`Set a flying lap on ${3-[0,1,2].filter(i=>records[`lap-${i}`]).length} more circuit(s) to enter.`:'Beat any best lap to improve your total.';};
$('close-rankings').onclick=()=>{$('ranking-dialog').hidden=true;};
// Eight-brick gauges: only touch the DOM when the lit count or tone changes.
function setBar(el,value,tone){const lit=Math.ceil(value*8-.001),key=lit+tone;if(el.dataset.key===key)return;el.dataset.key=key;el.dataset.tone=tone;el.setAttribute('aria-valuenow',Math.round(value*100));[...el.children].forEach((b,i)=>b.classList.toggle('on',i<lit));}
function podium(rank){const box=$('podium');box.replaceChildren();box.hidden=race.mode!=='race';if(box.hidden)return;for(const place of [2,1,3]){const c=rank[place-1],step=document.createElement('div'),car=document.createElement('span'),name=document.createElement('b'),block=document.createElement('div');step.className=`step p${place}${c.name==='YOU'?' you':''}`;car.className='podium-car';car.style.background=c.color;name.textContent=c.name;block.textContent=place;step.append(car,name,block);box.append(step);}}
function draw(dt){if(!race)return;const p=race.cars[0];gameRenderer.setGhost(race.mode==='trial'?oldGhost[Math.floor(race.time*10)]:null);gameRenderer.render(race,dt,race.time);
 $('position').innerHTML=`${ranking(race).findIndex(c=>c.name==='YOU')+1} <i>/ ${race.cars.length}</i>`;$('lap').innerHTML=`${Math.min(p.lap,race.laps)} <i>/ ${race.laps}</i>`;$('time').textContent=formatTime(race.time);$('speed').textContent=Math.round(p.speed*.8);setBar($('tires'),p.tires,p.tires>.6?'good':p.tires>.35?'worn':'low');setBar($('boost-meter'),p.boost,p.boosting?'firing':'boost');$('pit').textContent=p.pit>0?`BOX ${p.pit.toFixed(1)}`:p.pitQueued?'PIT QUEUED':'PIT · P';
 $('callout').textContent=state==='countdown'?Math.ceil(countdown)||'GO!':race.time<noticeUntil?notice:race.slip?'SLIPSTREAM':Math.abs(p.lane)>48?'OFF TRACK':p.pit>0?'BOX, BOX':'';
 $('callout').style.fontSize=state==='countdown'?'72px':'22px';
}
function loop(now){const dt=Math.min((now-last)/1000,.05)||0;last=now;if(state==='countdown'){countdown-=dt;if(countdown<=0){state='racing';announce('GO! GO! GO!',1);}}else if(state==='racing'){step(race,input,dt);if(race.time>=ghostClock){ghost.push([Math.round(race.cars[0].s),Math.round(race.cars[0].lane)]);ghostClock+=.1;}for(const e of race.events)announce(e);if(race.done)finish();}if(race)draw(dt);else if(state==='menu')previewRenderer.render(null,dt,now/1000);sound.update(race,state,countdown);requestAnimationFrame(loop);}
selectTrack(0);requestAnimationFrame(loop);
