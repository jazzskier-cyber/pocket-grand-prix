// Triple Crown score: best flying lap (laps 2+, so no standing start) on every circuit, summed in integer milliseconds.
// Returns null until all three circuits have a lap.
export const LAP_MIN=5,LAP_MAX=120;
export function recordLap(records,trackIndex,lap){
 if(!Number.isFinite(lap)||lap<LAP_MIN||lap>LAP_MAX)return false;
 const key=`lap-${trackIndex}`,old=records[key]?.time;if(old&&old<=lap)return false;
 records[key]={time:lap,ghost:[]};return true;
}
export function tripleCrownScore(records){
 const laps=[0,1,2].map(i=>records[`lap-${i}`]?.time);
 if(!laps.every(t=>Number.isFinite(t)&&t>=LAP_MIN&&t<=LAP_MAX))return null;
 return laps.reduce((sum,t)=>sum+Math.round(t*1000),0);
}
export function requestPlayerSession(config,win=window){
 if(win.parent===win)return Promise.reject(Error('Play on AIWANNA to submit an online time.'));
 return new Promise((resolve,reject)=>{
  const requestId=crypto.randomUUID();
  const finish=(error,session)=>{win.clearTimeout(timer);win.removeEventListener('message',receive);error?reject(error):resolve(session);};
  const receive=event=>{const d=event.data;if(event.source!==win.parent||!config.origins.includes(event.origin)||d?.source!=='aimadegames-platform'||d.type!=='leaderboard-session'||d.requestId!==requestId)return;
   if(d.error)return finish(Error(String(d.error)));
   if(d.apiOrigin!==event.origin||!d.session?.token||d.session.gameId!==config.gameId||!d.session.player?.displayName)return finish(Error('Invalid player session.'));
   finish(null,{...d.session,apiOrigin:event.origin});
  };
  const timer=win.setTimeout(()=>finish(Error('AIWANNA connection timed out.')),15000);win.addEventListener('message',receive);
  // The game can be embedded on any official AIWANNA domain; the browser only delivers to the real parent.
  for(const origin of config.origins)win.parent.postMessage({source:'aimadegames',type:'leaderboard-session',requestId},origin);
 });
}
export class TrialLeaderboard{
 constructor(config,{fetcher=globalThis.fetch.bind(globalThis),sessionProvider=()=>requestPlayerSession(config)}={}){this.config=config;this.fetcher=fetcher;this.sessionProvider=sessionProvider;this.session=null;}
 available(key){return !!(this.config.gameId&&this.config.gameSlug&&this.config.boards[key]);}
 url(key){return this.available(key)?`${this.session?.apiOrigin||this.config.origin}/games/${encodeURIComponent(this.config.gameSlug)}/leaderboard?board=${encodeURIComponent(this.config.boards[key])}`:null;}
 begin(key){
  if(!this.available(key))return null;
  const run={boardId:this.config.boards[key],startKey:crypto.randomUUID(),scoreKey:crypto.randomUUID(),runId:null,score:null,owner:null};
  run.startPromise=this.start(run);run.startPromise.catch(()=>{});return run;
 }
 async sessionFor(run,refresh=false){
  let s=this.session;if(refresh||!s||Date.parse(s.expiresAt)<=Date.now()+60000)s=await this.sessionProvider();
  if(s.gameId!==this.config.gameId)throw Error('Player session belongs to another game.');
  const owner=`${s.player.id||s.player.displayName}\0${s.player.isGuest}`;
  if(run.owner&&run.owner!==owner)throw Error('Player changed. Start a new race.');run.owner=owner;this.session=s;return s;
 }
 async request(run,path,key,body){
  for(let attempt=0;attempt<2;attempt++){
   const s=await this.sessionFor(run,attempt>0),response=await this.fetcher(`${s.apiOrigin||this.config.origin}/api/v1/${path}`,{method:'POST',credentials:'omit',headers:{Authorization:`Bearer ${s.token}`,'Idempotency-Key':key,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});
   const data=await response.json().catch(()=>({}));if(response.ok)return data;if(response.status===401&&!attempt)continue;throw Error(data.error?.message||`AIWANNA unavailable (${response.status}).`);
  }
 }
 async start(run){if(run.runId)return run.runId;const data=await this.request(run,`leaderboards/${run.boardId}/runs`,run.startKey);if(typeof data.runId!=='string')throw Error('Could not register this race.');run.runId=data.runId;return run.runId;}
 async submit(run,score){
  if(!run)throw Error('Online leaderboard is not connected yet.');
  if(!Number.isSafeInteger(score)||score<20000||score>300000)throw Error('Invalid time.');
  if(run.score!==null&&run.score!==score)throw Error('Final time cannot change on retry.');run.score=score;
  if(run.receipt)return run.receipt;if(run.submission)return run.submission;
  run.submission=(async()=>{let id;try{id=await run.startPromise;}catch{run.startPromise=this.start(run);id=await run.startPromise;}const receipt=await this.request(run,`runs/${encodeURIComponent(id)}/score`,run.scoreKey,{score});if(receipt.accepted!==true)throw Error('Time was not accepted.');run.receipt=receipt;return receipt;})();
  try{return await run.submission;}finally{run.submission=null;}
 }
}
