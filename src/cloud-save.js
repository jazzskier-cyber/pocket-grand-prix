// AIWANNA cloud saves: personal bests (and time-trial ghosts while they fit) for each circuit, mode and assist setting,
// plus the best flying lap per circuit (lap-0..2) that feeds the Triple Crown board.
export const cloudConfig={platformOrigin:'https://www.aiwanna.games',gameId:'82851460-cb8e-4a38-bb19-284e81fb5e66',schemaVersion:1,gameVersion:'1.0.0'};
const KEY=/^([0-2]-(race|trial)-(on|off)|lap-[0-2])$/,BUDGET=200000;
const validGhost=g=>Array.isArray(g)&&g.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isSafeInteger));
// Keep only well-formed records so an imported snapshot can never break the menu or a race.
export function cleanRecords(data){
 const out={};if(!data||typeof data!=='object')return out;
 for(const [key,r] of Object.entries(data))if(KEY.test(key)&&r&&Number.isFinite(r.time)&&r.time>0)out[key]={time:r.time,ghost:validGhost(r.ghost)?r.ghost:[]};
 return out;
}
// Times always sync; the longest ghosts are dropped first if the snapshot would exceed the cloud size limit.
export function exportRecords(records){
 const out=structuredClone(cleanRecords(records)),bySize=Object.keys(out).sort((a,b)=>out[b].ghost.length-out[a].ghost.length);
 while(JSON.stringify(out).length>BUDGET&&bySize.length)out[bySize.shift()].ghost=[];
 return {records:out};
}
export function summarize(data){
 const n=Object.keys(cleanRecords(data?.records)).filter(k=>!k.startsWith('lap-')).length;
 return n?`${n} personal best${n===1?'':'s'}`:'No personal bests yet';
}
