// Fill with real IDs returned by AIWANNA after the game and six boards exist.
// Empty IDs deliberately disable network score submissions in local previews.
export const leaderboardConfig = {
 origin: 'https://www.aiwanna.games', gameId: '', gameSlug: '',
 boards: {},
};
export const boardKey=(trackIndex,assist)=>`trial-v1-${['clover','copper','marina'][trackIndex]}-${assist?'assist':'manual'}`;
export const boardDefinitions = ['Clover Coast','Copper Canyon','Moonlight Marina'].flatMap((name,i)=>[true,false].map(assist=>({
 key:boardKey(i,assist),name:`${name} · ${assist?'Assisted':'Unassisted'}`,
 description:'Three-lap time trial. Lower elapsed time wins. Personal best only. Pauses excluded. No rivals or slipstream. Standard car and boost. Ties share rank.',
 sortDirection:'asc',aggregation:'best',scoreType:'time',unit:'ms',minScore:30000,maxScore:600000,minPlayTimeSeconds:30,
})));
