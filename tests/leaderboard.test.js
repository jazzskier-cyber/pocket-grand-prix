import test from 'node:test';
import assert from 'node:assert/strict';
import {TrialLeaderboard,rankedScore} from '../src/leaderboard.js';
import {boardDefinitions,boardKey} from '../src/leaderboard-config.js';
import {TRACKS,createTrack,createRace,step} from '../src/engine.js';
const config={origin:'https://example.test',gameId:'test-game',gameSlug:'test-game',boards:{trial:'test-board'}};
const session=()=>({gameId:'test-game',token:'test-only',expiresAt:new Date(Date.now()+3600000).toISOString(),player:{id:'test-player',displayName:'Test',isGuest:false}});
test('six independent boards use lower-is-better millisecond bests',()=>{assert.equal(boardDefinitions.length,6);assert.equal(new Set(boardDefinitions.map(x=>x.key)).size,6);assert.notEqual(boardKey(0,true),boardKey(0,false));assert.ok(boardDefinitions.every(x=>x.sortDirection==='asc'&&x.unit==='ms'&&x.aggregation==='best'));});
test('only completed three-lap solo trials produce a valid score',()=>{const r=createRace(createTrack(TRACKS[0]),'trial');assert.throws(()=>rankedScore(r));for(let i=0;i<12000&&!r.done;i++)step(r,{},1/60);assert.equal(rankedScore(r),Math.round(r.time*1000));r.mode='race';assert.throws(()=>rankedScore(r));});
test('unconfigured boards never make a network call',()=>{const b=new TrialLeaderboard({boards:{}},{fetcher:()=>{throw Error('network called');}});assert.equal(b.begin('trial'),null);assert.equal(b.url('trial'),null);});
test('failed settlement retry preserves run, final score and idempotency key',async()=>{
 const calls=[];let failures=1;const b=new TrialLeaderboard(config,{sessionProvider:async()=>session(),fetcher:async(url,options)=>{calls.push({url,...options});if(url.endsWith('/runs'))return {ok:true,json:async()=>({runId:'run-1'})};if(failures--)throw Error('offline');return {ok:true,json:async()=>({accepted:true})};}});
 const r=b.begin('trial');await assert.rejects(b.submit(r,65000));assert.equal((await b.submit(r,65000)).accepted,true);await b.submit(r,65000);assert.equal(calls.length,3);assert.equal(calls[1].headers['Idempotency-Key'],calls[2].headers['Idempotency-Key']);assert.notEqual(calls[0].headers['Idempotency-Key'],calls[1].headers['Idempotency-Key']);assert.equal(calls[1].body,calls[2].body);await assert.rejects(b.submit(r,64000));
});
test('wrong-game sessions cannot submit',async()=>{const b=new TrialLeaderboard(config,{sessionProvider:async()=>({...session(),gameId:'other'}),fetcher:()=>{throw Error('must not send');}});await assert.rejects(b.submit(b.begin('trial'),65000),/another game/);});
