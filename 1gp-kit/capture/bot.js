// Capture-only autopilot: presses the same left/right/boost inputs a player would. Not shipped with the game.
import {bend,CAR_W} from '../../src/engine.js';
export function botInput(r){
 const p=r.cars[0],len=r.track.length,input={left:false,right:false,boost:false,brake:false};
 let ahead=null;
 for(const c of r.cars.slice(1)){if(c.finished||c.pit>0)continue;const gap=((c.s-p.s)%len+len)%len;if(gap<170&&Math.abs(c.lane-p.lane)<CAR_W+6&&(!ahead||gap<ahead.gap))ahead={c,gap};}
 // Dive to whichever side of the car ahead has more road, otherwise drift back to the racing line.
 let want=0;
 if(ahead){const left=ahead.c.lane-(CAR_W+8),right=ahead.c.lane+(CAR_W+8);want=Math.abs(left)<Math.abs(right)?left:right;want=Math.max(-44,Math.min(44,want));}
 if(want<p.lane-3)input.left=true;else if(want>p.lane+3)input.right=true;
 const straight=Math.abs(bend(r.track,p.s+40))<.0012;
 input.boost=p.boost>.12&&(straight||(ahead&&ahead.gap<120));
 return input;
}
